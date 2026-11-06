#!/usr/bin/env python3
"""Builds the showcase stations' media from what is already in the repo.

  python3 scripts/showcase/build-assets.py                 (npm run showcase:assets)
  python3 scripts/showcase/build-assets.py paintings       (one step: paintwise, paintings, animation)

Each step writes hashed files to public/showcase/<station>/ and describes them
in src/components/showcase/stations/<station>/<station>.generated.json (never
edit those by hand; commit both).

Paintwise:

- the jug still life's pipeline stages: lossless originals restored from git
  history into scripts/showcase/sources/paintwise/ (380 px);
- its depth map: Depth Anything V2, the model Paintwise uses (scripts/hero/depth.py);
- its objects: the SAM masks image, split by its flat tab20 colours;
- "what the models see": a picture (PIECES_FROM: the jug, or Childhood Toys)
  cut into pieces as Paintwise's "unrestricted" segmenter does (MasterStroke.ipynb
  on Lightning): SAM 2.1 large's automatic masks in two passes, duplicates and
  parts of objects dropped; each piece is the painting itself with a thin rim
  in its mask colour and Depth Anything V2's depth; what no piece takes is the back;
- the other still lifes: cut from the pipeline grids public/images/paintwise-gallery-*.png;
- the figure: public/showcase/paintwise/pipeline.webp (scripts/showcase/paintwise-figure.py).

Images with flat colour (masks, block-in) are enlarged cleanly: upscaled,
then every pixel snapped back to the source's own colours.

Paintings: the ten early works in public/paintings/manifest.json (image, and a
depth map for the relief), the three "held" photos and the origin photo.

Animation: a short muted loop and a poster per film (cut with ffmpeg from the
films on the videos-v1.0 release, downloaded once into scripts/showcase/.cache),
the Sketchfab thumbnails, the storyboard stills, and the 3D models compressed
by Blender (scripts/showcase/compress-glb.py) from the raw GLBs in
scripts/showcase/sources/models/ (git-ignored; without them the committed
models are kept).
"""

import hashlib
import io
import json
import re
import shutil
import subprocess
import sys
import tempfile
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(ROOT / "scripts/hero"))
import depth as hero_depth  # noqa: E402
from grid import panels  # noqa: E402

SOURCES = HERE / "sources/paintwise"
MODEL_SOURCES = HERE / "sources/models"
CACHE = HERE / ".cache"
PUBLIC = ROOT / "public"
OUT = PUBLIC / "showcase/paintwise"
STATIONS = ROOT / "src/components/showcase/stations"
GENERATED = STATIONS / "paintwise/paintwise.generated.json"
GALLERY = PUBLIC / "images"
BLENDER = "/Applications/Blender.app/Contents/MacOS/Blender"

# matplotlib's tab20, which the SAM masks image is drawn in; black is "no mask".
TAB20 = [
    (31, 119, 180), (174, 199, 232), (255, 127, 14), (255, 187, 120), (44, 160, 44),
    (152, 223, 138), (214, 39, 40), (255, 152, 150), (148, 103, 189), (197, 176, 213),
    (140, 86, 75), (196, 156, 148), (227, 119, 194), (247, 182, 210), (127, 127, 127),
    (199, 199, 199), (188, 189, 34), (219, 219, 141), (23, 190, 207), (158, 218, 229),
]
MIN_OBJECT_PX = 80
MAX_OBJECTS = 28
# "What the models see": a painting cut into pieces by SAM 2.1.
# The picture to cut: "jug" (the still life of the layers view, enlarged 2×) or "toys" (Childhood Toys).
PIECES_FROM = "jug"
PIECES_SOURCES = {"jug": (SOURCES / "jug-original.png", 2), "toys": (PUBLIC / "paintings/StillLifeToys.webp", 1280)}
SAM_MODEL = "facebook/sam2.1-hiera-large"
# Paintwise's passes (SAM21UnrestrictedSegmenter in MasterStroke.ipynb): one for whole objects,
# and a denser, more permissive one (64 points a side, and 32 in each of four crops) for the small
# ones. transformers' own crops are broken, so the four crops are cut here (SAM's boxes for one
# crop layer) and their masks pasted back.
DETAILED = {"pred_iou_thresh": 0.80, "stability_score_thresh": 0.85}
SAM_PASSES = [
    ({"points_per_crop": 48, "pred_iou_thresh": 0.88, "stability_score_thresh": 0.92}, False),
    ({"points_per_crop": 64, **DETAILED}, False),
    ({"points_per_crop": 32, **DETAILED}, True),
]
# Its cleanup: a duplicate overlaps a kept mask past this IoU; a part lies mostly inside one (past this
# share of itself), unless that one is wall- or table-sized (past this share of the painting).
DUPLICATE_IOU = 0.9
PART_INSIDE = 0.7
SCENE_SHARE = 0.3
# A piece must cover this share of the painting; at most this many pieces (the rest go to the back).
PIECE_MIN_SHARE = 0.002
MAX_PIECES = 32
# A piece this big is a surface (a wall, the table): it goes as far back as its far part, behind what stands on it.
SURFACE_SHARE = 0.08
# Other still lifes run through the pipeline: (grid, panel index). Rows are
# original, SAM masks, block-in / PiDiNet edges, depth, sketch (gallery-2, -3),
# or original, masks, block-in, edges, sketch per row (gallery-5, -6).
STILL_LIFES = [(2, 0), (2, 1), (2, 3), (3, 0), (3, 1), (3, 4), (5, 0), (6, 1)]


def fail(message):
    print(f"build-assets: {message}", file=sys.stderr)
    sys.exit(1)


def write_bytes(data, out, rel_dir, name, ext):
    """Saves `data` as <out>/<rel_dir>/<name>.<hash>.<ext> and returns its URL."""
    digest = hashlib.sha256(data).hexdigest()[:8]
    path = out / rel_dir / f"{name}.{digest}.{ext}"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return "/" + path.relative_to(PUBLIC).as_posix()


def write_webp(image, rel_dir, name, out=OUT, **options):
    """Saves `image` as <out>/<rel_dir>/<name>.<hash>.webp (Paintwise's folder by default) and returns its URL."""
    buf = io.BytesIO()
    image.save(buf, "WEBP", **({"quality": 90, "method": 6} | options))
    return write_bytes(buf.getvalue(), out, rel_dir, name, "webp")


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def average_color(image):
    r, g, b = image.convert("RGB").resize((1, 1), Image.BOX).getpixel((0, 0))
    return "#%02x%02x%02x" % (r, g, b)


def fit(image, long_side):
    image = image.convert("RGB")
    image.thumbnail((long_side, long_side), Image.LANCZOS)
    return image


def palette_image(colors):
    pal = Image.new("P", (1, 1))
    flat = [c for rgb in colors for c in rgb]
    pal.putpalette(flat + flat[:3] * (256 - len(colors)))
    return pal


def flat_upscale(image, k, palette):
    """Upscale by k, then snap every pixel to `palette` (a P-mode image): crisp edges, no new colours."""
    big = image.convert("RGB").resize((image.width * k, image.height * k), Image.LANCZOS)
    return big.quantize(palette=palette, dither=Image.Dither.NONE).convert("RGB")


def own_palette(image, colors=48):
    return image.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT)


def snap(array, colors):
    """Index of the nearest colour in `colors` for every pixel of an H×W×3 array."""
    pal = np.array(colors, dtype=np.int32)
    d = ((array[:, :, None, :].astype(np.int32) - pal[None, None]) ** 2).sum(-1)
    return d.argmin(-1)


def components(labels, value):
    """4-connected components of `labels == value`, as lists of (y, x)."""
    h, w = labels.shape
    seen = np.zeros_like(labels, dtype=bool)
    found = []
    for y0, x0 in zip(*np.nonzero(labels == value)):
        if seen[y0, x0]:
            continue
        seen[y0, x0] = True
        queue, pixels = deque([(y0, x0)]), []
        while queue:
            y, x = queue.popleft()
            pixels.append((y, x))
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and labels[ny, nx] == value:
                    seen[ny, nx] = True
                    queue.append((ny, nx))
        found.append(pixels)
    return found


def build_layers(estimator):
    original = Image.open(SOURCES / "jug-original.png").convert("RGB")
    size = original.size
    load = lambda name, resample=Image.LANCZOS: Image.open(SOURCES / f"jug-{name}.png").convert("RGB").resize(size, resample)  # noqa: E731
    masks = load("masks", Image.NEAREST)
    blockin = load("blockin")
    depth = hero_depth.estimate(estimator, original)
    if depth.size != size:
        depth = depth.resize(size, Image.LANCZOS)

    twice = lambda im: im.resize((im.width * 2, im.height * 2), Image.LANCZOS)  # noqa: E731
    layers = [
        ("original", twice(original)),
        ("masks", flat_upscale(masks, 3, palette_image(TAB20 + [(0, 0, 0)]))),
        ("depth", twice(depth.convert("RGB"))),
        ("blockin", flat_upscale(blockin, 3, own_palette(blockin))),
        ("edges", twice(load("edges"))),
        ("sketch", twice(load("sketch"))),
    ]
    return size, masks, depth, [{"id": lid, "src": write_webp(im, "layers", lid)} for lid, im in layers]


def build_objects(size, masks, depth):
    width, height = size
    labels = snap(np.asarray(masks), TAB20 + [(0, 0, 0)])
    near = np.asarray(depth, dtype=np.float32) / 255.0
    found = []
    for index, color in enumerate(TAB20):
        for pixels in components(labels, index):
            if len(pixels) >= MIN_OBJECT_PX:
                found.append((color, pixels))
    found.sort(key=lambda item: -len(item[1]))
    found = found[:MAX_OBJECTS]

    objects = []
    for color, pixels in found:
        ys, xs = np.array([p[0] for p in pixels]), np.array([p[1] for p in pixels])
        x0, x1 = max(0, xs.min() - 2), min(width, xs.max() + 3)
        y0, y1 = max(0, ys.min() - 2), min(height, ys.max() + 3)
        mask = np.zeros((y1 - y0, x1 - x0), dtype=np.uint8)
        mask[ys - y0, xs - x0] = 255
        big = Image.fromarray(mask, "L").resize(((x1 - x0) * 3, (y1 - y0) * 3), Image.LANCZOS)
        alpha = np.clip((np.asarray(big, dtype=np.int32) - 96) * 2, 0, 255).astype(np.uint8)
        rgba = np.zeros((*alpha.shape, 4), dtype=np.uint8)
        rgba[..., :3] = color
        rgba[..., 3] = alpha
        objects.append(
            {
                "image": Image.fromarray(rgba, "RGBA"),
                "box": [x0 / width, y0 / height, (x1 - x0) / width, (y1 - y0) / height],
                "depth": float(near[ys, xs].mean()),
                "color": "#%02x%02x%02x" % color,
            }
        )
    objects.sort(key=lambda o: o["depth"])
    out = []
    for i, o in enumerate(objects):
        oid = f"o{i + 1:02d}"
        out.append(
            {
                "id": oid,
                "src": write_webp(o["image"], "objects", oid, lossless=True),
                "box": [round(v, 5) for v in o["box"]],
                "depth": round(o["depth"], 4),
                "color": o["color"],
            }
        )
    return out


def build_pieces(estimator):
    """The picture as SAM 2.1 sees it: its pieces (the picture itself, rimmed in mask colour) with their depths, and the back."""
    from transformers import pipeline

    source, size = PIECES_SOURCES[PIECES_FROM]
    image = Image.open(source).convert("RGB")
    # A small picture is enlarged by a factor; a large one fits a long side.
    image = image.resize((image.width * size, image.height * size), Image.LANCZOS) if size < 10 else fit(image, size)
    w, h = image.size
    generate = pipeline("mask-generation", model=SAM_MODEL, device="cpu")
    # SAM's crop layer 1: two crops a side, overlapping by 512/1500 of the short side.
    overlap = int(512 / 1500 * min(w, h))
    cw, ch = -(-(w + overlap) // 2), -(-(h + overlap) // 2)
    crops = [(x, y, min(w, x + cw), min(h, y + ch)) for y in (0, ch - overlap) for x in (0, cw - overlap)]
    found = []
    for opts, cropped in SAM_PASSES:
        for x0, y0, x1, y1 in crops if cropped else [(0, 0, w, h)]:
            for m in generate(image.crop((x0, y0, x1, y1)), points_per_batch=64, crops_n_layers=0, **opts)["masks"]:
                m = np.asarray(m, dtype=bool)
                ys, xs = np.nonzero(m)
                if not len(xs):
                    continue
                # As SAM does: a crop's mask that reaches one of its inner edges is cut off there; drop it.
                if (x0 > 0 and xs.min() < 20) or (x1 < w and xs.max() > x1 - x0 - 20) or (y0 > 0 and ys.min() < 20) or (y1 < h and ys.max() > y1 - y0 - 20):
                    continue
                full = np.zeros((h, w), dtype=bool)
                full[y0:y1, x0:x1] = m
                found.append(full)
    found = sorted((m for m in found if m.sum() >= PIECE_MIN_SHARE * w * h), key=lambda m: -m.sum())
    # Largest first: drop duplicates of a kept mask, and parts of a kept object (compared at a quarter size).
    masks, small = [], []
    for m in found:
        q = m[::4, ::4]
        area = q.sum()
        clash = False
        for k in small:
            inter = (q & k).sum()
            if inter / (area + k.sum() - inter) > DUPLICATE_IOU or (inter / area > PART_INSIDE and k.sum() < SCENE_SHARE * q.size):
                clash = True
                break
        if not clash:
            masks.append(m)
            small.append(q)
    # Largest first, so each pixel ends up with the most specific mask left over it.
    label = np.full((h, w), -1, dtype=np.int32)
    for i, m in enumerate(masks):
        label[m] = i
    ids, counts = np.unique(label[label >= 0], return_counts=True)
    keep = [i for i, n in sorted(zip(ids, counts), key=lambda t: -t[1]) if n >= PIECE_MIN_SHARE * w * h][:MAX_PIECES]
    near = np.asarray(hero_depth.estimate(estimator, image).resize((w, h), Image.LANCZOS), dtype=np.float32) / 255.0
    rgb = np.asarray(image)

    def cut(mask, color=None):
        ys, xs = np.nonzero(mask)
        x0, x1, y0, y1 = max(0, xs.min() - 3), min(w, xs.max() + 4), max(0, ys.min() - 3), min(h, ys.max() + 4)
        inside = Image.fromarray((mask[y0:y1, x0:x1] * 255).astype(np.uint8), "L")
        rgba = np.dstack([rgb[y0:y1, x0:x1], np.asarray(inside.filter(ImageFilter.GaussianBlur(0.7)))])
        if color:
            # A thin rim in the mask's colour, just outside it.
            rim = np.asarray(inside.filter(ImageFilter.MaxFilter(5))) > 127
            rim &= ~mask[y0:y1, x0:x1]
            rgba[rim] = (*color, 255)
        return Image.fromarray(rgba.astype(np.uint8), "RGBA"), [x0 / w, y0 / h, (x1 - x0) / w, (y1 - y0) / h]

    pieces = []
    for k, i in enumerate(keep):
        mask = label == i
        color = TAB20[k % len(TAB20)]
        piece, box = cut(mask, color)
        under = near[mask]
        depth = np.percentile(under, 10) if mask.sum() >= SURFACE_SHARE * w * h else np.median(under)
        pieces.append({"image": piece, "box": box, "depth": float(depth), "color": "#%02x%02x%02x" % color})
    back = ~np.isin(label, keep)
    piece, box = cut(back)
    pieces.append({"image": piece, "box": box, "depth": float(min(p["depth"] for p in pieces) - 0.05), "color": "#000000", "back": True})
    pieces.sort(key=lambda p: p["depth"])
    objects = []
    for k, p in enumerate(pieces):
        oid = "back" if p.get("back") else f"p{k:02d}"
        objects.append(
            {
                "id": oid,
                "src": write_webp(p["image"], "pieces", oid, quality=88),
                "box": [round(v, 5) for v in p["box"]],
                "depth": round(p["depth"], 4),
                "color": p["color"],
            }
        )
    return {"from": PIECES_FROM, "canvas": {"width": w, "height": h}, "original": write_webp(image, "pieces", "original", quality=88), "objects": objects}


def build_still_lifes():
    grids = {n: panels(GALLERY / f"paintwise-gallery-{n}.png") for n in sorted({g for g, _ in STILL_LIFES})}
    out = []
    for k, (grid, index) in enumerate(STILL_LIFES):
        image = grids[grid][index]
        big = image.resize((image.width * 2, image.height * 2), Image.LANCZOS)
        out.append({"src": write_webp(big, "stills", f"s{k + 1}"), "aspect": round(image.width / image.height, 4)})
    return out


def build_figure():
    source = OUT / "pipeline.webp"
    if not source.is_file():
        fail("public/showcase/paintwise/pipeline.webp is missing: run scripts/showcase/paintwise-figure.py and render-figure.sh")
    data = source.read_bytes()
    path = OUT / f"figure.{hashlib.sha256(data).hexdigest()[:8]}.webp"
    path.write_bytes(data)
    with Image.open(source) as image:
        aspect = image.width / image.height
    return {"src": "/" + path.relative_to(PUBLIC).as_posix(), "aspect": round(aspect, 4)}


def paintwise_step(estimator):
    for stale in ("layers", "objects", "stills", "fruit", "toys", "pieces"):
        shutil.rmtree(OUT / stale, ignore_errors=True)
    for stale in [*OUT.glob("steps.*.webp"), *OUT.glob("figure.*.webp")]:
        stale.unlink()

    size, masks, depth, layers = build_layers(estimator)
    media = {
        "canvas": {"width": size[0], "height": size[1]},
        "layers": layers,
        "objects": build_objects(size, masks, depth),
        "pieces": build_pieces(estimator),
        "stillLifes": build_still_lifes(),
        "figure": build_figure(),
    }
    write_json(GENERATED, media)
    print(
        f"build-assets: paintwise: {len(layers)} layers, {len(media['objects'])} objects, "
        f"the {PIECES_FROM} in {len(media['pieces']['objects'])} pieces, "
        f"{len(media['stillLifes'])} still lifes -> {GENERATED.relative_to(ROOT)}"
    )


# ---- paintings -------------------------------------------------------------------

PAINTINGS_OUT = PUBLIC / "showcase/paintings"
PAINTINGS_JSON = STATIONS / "paintings/paintings.generated.json"
# The photo of each painting being held: painting slug → file in public/paintings.
HELD = {"red-dead-redemption": "RedDeadRedemption_2.webp", "asthma": "Inhaler_2.webp", "covid": "Covid_2.webp"}
ORIGIN = "/paintings/origin.webp"


def slugify(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def paintings_step(estimator):
    shutil.rmtree(PAINTINGS_OUT, ignore_errors=True)
    manifest = json.loads((PUBLIC / "paintings/manifest.json").read_text())
    early = []
    for item in manifest["items"]:
        if item.get("wallPosition") != "pre-portfolio":
            continue
        slug = slugify(item["title"])
        source = Image.open(PUBLIC / item["src"].lstrip("/")).convert("RGB")
        image = fit(source, 1600)
        depth = hero_depth.estimate(estimator, fit(source, 1024))
        early.append(
            {
                "slug": slug,
                "title": item["title"],
                "year": str(item.get("year", "")),
                "story": item.get("description", ""),
                "image": write_webp(image, "", slug, out=PAINTINGS_OUT, quality=88),
                "depth": write_webp(depth.convert("RGB"), "depth", slug, out=PAINTINGS_OUT),
                "aspect": round(source.width / source.height, 4),
                "avgColor": average_color(source),
            }
        )
    held = {}
    for slug, file in HELD.items():
        source = Image.open(PUBLIC / "paintings" / file)
        held[slug] = {"src": write_webp(fit(source, 1400), "held", slug, out=PAINTINGS_OUT, quality=88), "aspect": round(source.width / source.height, 4)}
    origin = Image.open(PUBLIC / ORIGIN.lstrip("/"))
    media = {
        "early": early,
        "held": held,
        "origin": {"image": ORIGIN, "aspect": round(origin.width / origin.height, 4), "avgColor": average_color(origin)},
    }
    write_json(PAINTINGS_JSON, media)
    print(f"build-assets: paintings: {len(early)} early works, {len(held)} held photos -> {PAINTINGS_JSON.relative_to(ROOT)}")


# ---- animation -------------------------------------------------------------------

ANIMATION_OUT = PUBLIC / "showcase/animation"
ANIMATION_JSON = STATIONS / "animation/animation.generated.json"
RELEASE = "https://github.com/aayushs-edu/aayushs-portfolio/releases/download/videos-v1.0/"
# slug, file on the release, where the loop starts (s)
FILMS = [("wild-west", "wild-west.mp4", 70.0), ("soccer-star", "messi.mp4", 8.5), ("sanctuary", "sanctuary.mp4", 2.0)]
LOOP_SECONDS = 6
# slug, raw GLB in scripts/showcase/sources/models, Sketchfab uid
MODELS = [
    ("main-character", "wildwest-mc.glb", "507a4bf2b127455f8c06175cd7b97b75"),
    ("banana-gun", "banana_gun.glb", "70655c32ae394827ae4c4a06bf492f63"),
    ("saloon", "saloon.glb", "2c19629e61354d138b447e0095232331"),
]
STILLS = [f"/images/view{i}.webp" for i in range(8)]


def fetch(url):
    """The body at `url` (curl: it follows redirects and uses the system's certificates)."""
    return subprocess.run(["curl", "-fsSL", url], check=True, capture_output=True).stdout


def download(url, path):
    if path.is_file() and path.stat().st_size > 0:
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".part")
    subprocess.run(["curl", "-fsSL", "-o", str(tmp), url], check=True)
    tmp.rename(path)
    return path


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def build_films():
    films = []
    with tempfile.TemporaryDirectory() as tmp:
        for slug, file, start in FILMS:
            source = download(RELEASE + file, CACHE / "films" / file)
            loop, poster = Path(tmp) / f"{slug}.mp4", Path(tmp) / f"{slug}.png"
            ffmpeg(
                "-ss", str(start), "-t", str(LOOP_SECONDS), "-i", str(source), "-vf", "scale=1280:-2,fps=24", "-an",
                "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-g", "48", "-movflags", "+faststart",
                "-threads", "1", str(loop),
            )
            ffmpeg("-ss", str(start), "-i", str(source), "-frames:v", "1", "-vf", "scale=1280:-2", str(poster))
            image = Image.open(poster).convert("RGB")
            films.append(
                {
                    "slug": slug,
                    "loop": write_bytes(loop.read_bytes(), ANIMATION_OUT, "films", slug, "mp4"),
                    "poster": write_webp(image, "films", slug, out=ANIMATION_OUT, quality=85),
                    "film": RELEASE + file,
                    "aspect": round(image.width / image.height, 4),
                }
            )
    return films


def build_models(previous):
    """Compressed GLBs and Sketchfab thumbnails; without the raw sources, the models already built are kept."""
    if not all((MODEL_SOURCES / file).is_file() for _, file, _ in MODELS):
        if not previous:
            fail(f"the raw models are missing from {MODEL_SOURCES.relative_to(ROOT)} and none were built before")
        print("build-assets: animation: raw models not found; keeping the models already built")
        return previous
    shutil.rmtree(ANIMATION_OUT / "models", ignore_errors=True)
    models = []
    with tempfile.TemporaryDirectory() as tmp:
        for slug, file, uid in MODELS:
            out = Path(tmp) / f"{slug}.glb"
            subprocess.run(
                [BLENDER, "-b", "--factory-startup", "--python", str(HERE / "compress-glb.py"), "--", str(MODEL_SOURCES / file), str(out)],
                check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            info = json.loads(fetch(f"https://api.sketchfab.com/v3/models/{uid}"))
            best = max(info["thumbnails"]["images"], key=lambda i: i["width"])
            thumb = Image.open(io.BytesIO(fetch(best["url"])))
            models.append(
                {
                    "slug": slug,
                    "glb": write_bytes(out.read_bytes(), ANIMATION_OUT, "models", slug, "glb"),
                    "thumb": write_webp(fit(thumb, 1280), "models", f"{slug}-thumb", out=ANIMATION_OUT, quality=85),
                    "uid": uid,
                }
            )
    return models


def animation_step():
    previous = json.loads(ANIMATION_JSON.read_text())["models"] if ANIMATION_JSON.is_file() else []
    shutil.rmtree(ANIMATION_OUT / "films", ignore_errors=True)
    media = {
        "films": build_films(),
        "stills": [{"src": src, "aspect": round((lambda im: im.width / im.height)(Image.open(PUBLIC / src.lstrip("/"))), 4)} for src in STILLS],
        "models": build_models(previous),
    }
    write_json(ANIMATION_JSON, media)
    print(f"build-assets: animation: {len(media['films'])} films, {len(media['stills'])} stills, {len(media['models'])} models -> {ANIMATION_JSON.relative_to(ROOT)}")


def main():
    steps = sys.argv[1:] or ["paintwise", "paintings", "animation"]
    unknown = set(steps) - {"paintwise", "paintings", "animation"}
    if unknown:
        fail(f"unknown step(s): {', '.join(sorted(unknown))}")
    estimator = hero_depth.load_estimator() if {"paintwise", "paintings"} & set(steps) else None
    if "paintwise" in steps:
        paintwise_step(estimator)
    if "paintings" in steps:
        paintings_step(estimator)
    if "animation" in steps:
        animation_step()


if __name__ == "__main__":
    main()
