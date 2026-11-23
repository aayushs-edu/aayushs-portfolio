import {
  Box3,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Wild West's models on their stumps, all drawn by one WebGL canvas laid over
 * the row: each frame, each model is drawn into its own stump's slot (a
 * scissored viewport). One canvas means one render a frame and no copying
 * between canvases, which is what made three <model-viewer>s slow.
 *
 * Loaded on demand (AnimationSection imports it as the section nears), so
 * three.js stays out of the page's main bundle. As soon as they've loaded,
 * before the row scrolls into view, each model is warmed up in turn (parsed,
 * its shaders compiled, drawn once so its textures are on the GPU), a step at
 * a time while the browser is idle: so neither the scroll on the way nor the
 * models' first sight stalls.
 */

/** How a model stands in its slot (see AnimationSection's PROPS). */
export type StumpFit = {
  feet: number;
  stumpTop: number;
  fill: number;
  aspect: number;
};
export type StumpModelSpec = { glb: string; fit: StumpFit; slot: HTMLElement };

/** The vertical field of view and the camera's angle down from straight above (deg). */
const FOV = 30;
const PITCH = 78;
/** Turning speed (deg a second), and how far a drag across a slot turns a model (radians). */
const TURN_DEG_S = 18;
const DRAG_TURNS = Math.PI * 1.5;
/** Lighting, as model-viewer's neutral environment at exposure 1.05 lit them. */
const EXPOSURE = 1.05;
/** The canvas's pixel density at most; antialiasing only below DENSE (past it, it barely shows and costs a lot). */
const MAX_DPR = 1.5;
const DENSE = 1.5;
/** The soft shadow on the stump's top: its strength and how far past the footprint it spreads. */
const SHADOW = 0.5;
const SHADOW_SPREAD = 1.25;

/**
 * The camera for a model on its stump: the distance is the largest that
 * footprint, height and turning room ask for. Aimed above the feet so they
 * land on the stump's top (`feet`, a share of the slot's height from the top).
 */
function fitCamera(size: Vector3, center: Vector3, { feet, stumpTop, fill, aspect }: StumpFit) {
  const t = Math.tan(((FOV / 2) * Math.PI) / 180);
  const r = Math.hypot(size.x, size.z) / 2;
  // At distance d a metre spans 1/(2·d·t) of the slot's height.
  const dFoot = r / (t * fill * stumpTop * aspect);
  const dTall = size.y / (2 * t * 0.92 * feet);
  const dTurn = r / (2 * t * 0.47 * aspect);
  const d = Math.max(dFoot, dTall, dTurn);
  const aimY = center.y - size.y / 2 + (feet - 0.5) * 2 * d * t;
  return { target: new Vector3(center.x, aimY, center.z), d };
}

/** A soft round shadow, drawn once: dark in the middle, fading to nothing. */
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(0,0,0,1)");
  grad.addColorStop(0.45, "rgba(0,0,0,0.55)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

/** The next moment the browser is idle (or soon, where it can't say). */
const idle = () => new Promise<void>((done) => ("requestIdleCallback" in window ? requestIdleCallback(() => done(), { timeout: 1000 }) : setTimeout(done, 40)));

type Prop = {
  slot: HTMLElement;
  scene: Scene;
  camera: PerspectiveCamera;
  turn: Group;
  angle: number;
  dragging: boolean;
};

export interface StumpScene {
  /** Whether the models turn on their own (off in lite mode; a drag still turns them). */
  setTurning(on: boolean): void;
  dispose(): void;
}

export async function createStumpScene(
  canvas: HTMLCanvasElement,
  specs: StumpModelSpec[],
  { turning, onReady }: { turning: boolean; onReady: () => void },
): Promise<StumpScene> {
  const dpr = () => Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: dpr() < DENSE,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.autoClear = false;

  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const shadowMap = shadowTexture();

  const draco = new DRACOLoader().setDecoderPath("/draco/");
  const loader = new GLTFLoader().setDRACOLoader(draco);

  let disposed = false;
  let auto = turning;
  let visible = false;
  let raf = 0;
  let last = 0;
  let dirty = true;
  const cleanups: Array<() => void> = [];

  /** A model's own scene: the model on a turntable, its shadow, and a camera fitted to its slot. */
  const stage = (model: Object3D, fit: StumpFit, slot: HTMLElement): Prop => {
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    const scene = new Scene();
    scene.environment = environment;
    // The model turns about its own vertical axis, as model-viewer turned it about its centre.
    const turn = new Group();
    turn.position.set(center.x, 0, center.z);
    model.position.sub(new Vector3(center.x, 0, center.z));
    turn.add(model);
    scene.add(turn);

    const footprint = Math.hypot(size.x, size.z) * SHADOW_SPREAD;
    const material = new MeshBasicMaterial({ map: shadowMap, transparent: true, opacity: SHADOW, depthWrite: false, toneMapped: false });
    const shadow = new Mesh(new PlaneGeometry(footprint, footprint), material);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(center.x, box.min.y + size.y * 0.002, center.z);
    scene.add(shadow);

    const { target, d } = fitCamera(size, center, fit);
    const camera = new PerspectiveCamera(FOV, fit.aspect, d / 100, d * 10);
    const phi = (PITCH * Math.PI) / 180;
    camera.position.set(target.x, target.y + d * Math.cos(phi), target.z + d * Math.sin(phi));
    camera.lookAt(target);

    return { slot, scene, camera, turn, angle: 0, dragging: false };
  };

  // Fetched together; parsed one at a time, each when the browser is idle.
  const files = specs.map(({ glb }) => fetch(glb).then((r) => r.arrayBuffer()));
  const props: Prop[] = [];
  for (const [i, { fit, slot }] of specs.entries()) {
    const data = await files[i];
    await idle();
    props.push(stage((await loader.parseAsync(data, "")).scene, fit, slot));
  }
  draco.dispose();

  // ---- drawing ---------------------------------------------------------------------

  const resize = () => {
    const box = canvas.getBoundingClientRect();
    renderer.setPixelRatio(dpr());
    renderer.setSize(Math.max(1, Math.round(box.width)), Math.max(1, Math.round(box.height)), false);
    dirty = true;
    request();
  };

  const draw = () => {
    renderer.setScissorTest(false);
    renderer.clear();
    drawProps(props);
  };

  function drawProps(list: Prop[]) {
    const box = canvas.getBoundingClientRect();
    renderer.setScissorTest(true);
    for (const p of list) {
      const r = p.slot.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const x = r.left - box.left;
      const y = box.bottom - r.bottom;
      if (x > box.width || x + r.width < 0) continue;
      p.turn.rotation.y = p.angle;
      p.camera.aspect = r.width / r.height;
      p.camera.updateProjectionMatrix();
      renderer.setViewport(x, y, r.width, r.height);
      // The scissor stays on the canvas, for a slot half scrolled out of the row.
      const sx = Math.max(0, x);
      const sy = Math.max(0, y);
      renderer.setScissor(sx, sy, Math.min(box.width, x + r.width) - sx, Math.min(box.height, y + r.height) - sy);
      renderer.render(p.scene, p.camera);
    }
  }

  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    const moving = auto && props.some((p) => !p.dragging);
    if (moving) for (const p of props) if (!p.dragging) p.angle += ((TURN_DEG_S * Math.PI) / 180) * dt;
    if (moving || dirty) {
      dirty = false;
      draw();
    }
    if (moving || props.some((p) => p.dragging)) request();
    else last = 0;
  };

  function request() {
    if (!raf && !disposed && visible) raf = requestAnimationFrame(frame);
  }

  // ---- turning by hand -------------------------------------------------------------

  for (const p of props) {
    let startX = 0;
    let startAngle = 0;
    const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
      p.slot.addEventListener(type, fn);
      cleanups.push(() => p.slot.removeEventListener(type, fn));
    };
    on("pointerdown", (e) => {
      if (e.button !== 0) return;
      p.dragging = true;
      startX = e.clientX;
      startAngle = p.angle;
      p.slot.setPointerCapture(e.pointerId);
      request();
    });
    on("pointermove", (e) => {
      if (!p.dragging) return;
      p.angle = startAngle + ((e.clientX - startX) / p.slot.clientWidth) * DRAG_TURNS;
      dirty = true;
    });
    const release = () => {
      p.dragging = false;
      last = 0;
      dirty = true;
      request();
    };
    on("pointerup", release);
    on("pointercancel", release);
    on("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      p.angle += (e.key === "ArrowRight" ? 1 : -1) * (Math.PI / 12);
      dirty = true;
      request();
    });
  }

  // ---- when to draw ------------------------------------------------------------------

  const sizer = new ResizeObserver(resize);
  sizer.observe(canvas);
  // A slot can move without the canvas (the row scrolls sideways on narrow screens): draw again.
  const scrolled = () => {
    dirty = true;
    request();
  };
  document.addEventListener("scroll", scrolled, {
    capture: true,
    passive: true,
  });
  cleanups.push(() => document.removeEventListener("scroll", scrolled, { capture: true }));
  const seen = new IntersectionObserver((es) => {
    visible = es[es.length - 1].isIntersecting;
    if (visible) {
      last = 0;
      dirty = true;
      request();
    }
  });
  seen.observe(canvas);

  // Warm up before it's seen, a model at a time while idle: compile its shaders, then draw it once (its textures go up).
  resize();
  for (const p of props) {
    await idle();
    if (disposed) break;
    await renderer.compileAsync(p.scene, p.camera);
    await idle();
    if (disposed) break;
    drawProps([p]);
  }
  if (!disposed) {
    draw();
    onReady();
  }

  return {
    setTurning(on) {
      auto = on;
      last = 0;
      dirty = true;
      request();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      sizer.disconnect();
      seen.disconnect();
      cleanups.forEach((fn) => fn());
      for (const p of props)
        p.scene.traverse((o) => {
          const mesh = o as Mesh;
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
          for (const m of mats) {
            for (const v of Object.values(m)) if (v && typeof v === "object" && "isTexture" in v) (v as { dispose(): void }).dispose();
            m.dispose();
          }
        });
      environment.dispose();
      shadowMap.dispose();
      renderer.dispose();
    },
  };
}
