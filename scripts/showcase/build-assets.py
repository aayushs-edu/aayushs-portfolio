#!/usr/bin/env python3
"""Builds the showcase's Paintwise media from images already in the repo.

  python3 scripts/showcase/build-assets.py      (npm run showcase:assets)

Writes hashed WebP files to public/showcase/paintwise/ and describes them in
src/components/showcase/stations/paintwise/paintwise.generated.json (never
edit it by hand; commit both). Sources:

- the jug still life's pipeline stages: lossless originals restored from git
  history into scripts/showcase/sources/paintwise/ (380 px);
- its depth map: Depth Anything V2, the model Paintwise uses (scripts/hero/depth.py);
- its objects: the SAM masks image, split by its flat tab20 colours;
- the other still lifes: cut from the pipeline grids public/images/paintwise-gallery-*.png;
- the figure: public/showcase/paintwise/pipeline.webp (scripts/showcase/paintwise-figure.py).

Images with flat colour (masks, block-in) are enlarged cleanly: upscaled,
then every pixel snapped back to the source's own colours.
"""

import hashlib
import io
import json
import shutil
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(ROOT / "scripts/hero"))
import depth as hero_depth  # noqa: E402
from grid import panels  # noqa: E402

SOURCES = HERE / "sources/paintwise"
PUBLIC = ROOT / "public"
OUT = PUBLIC / "showcase/paintwise"
GENERATED = ROOT / "src/components/showcase/stations/paintwise/paintwise.generated.json"
GALLERY = PUBLIC / "images"

# matplotlib's tab20, which the SAM masks image is drawn in; black is "no mask".
TAB20 = [
    (31, 119, 180), (174, 199, 232), (255, 127, 14), (255, 187, 120), (44, 160, 44),
    (152, 223, 138), (214, 39, 40), (255, 152, 150), (148, 103, 189), (197, 176, 213),
    (140, 86, 75), (196, 156, 148), (227, 119, 194), (247, 182, 210), (127, 127, 127),
    (199, 199, 199), (188, 189, 34), (219, 219, 141), (23, 190, 207), (158, 218, 229),
]
MIN_OBJECT_PX = 80
MAX_OBJECTS = 28
# Other still lifes run through the pipeline: (grid, panel index). Rows are
# original, SAM masks, block-in / PiDiNet edges, depth, sketch (gallery-2, -3),
# or original, masks, block-in, edges, sketch per row (gallery-5, -6).
STILL_LIFES = [(2, 0), (2, 1), (2, 3), (3, 0), (3, 1), (3, 4), (5, 0), (6, 1)]


def fail(message):
    print(f"build-assets: {message}", file=sys.stderr)
    sys.exit(1)


def write_webp(image, rel_dir, name, **options):
    """Saves `image` as public/showcase/paintwise/<rel_dir>/<name>.<hash>.webp and returns its URL."""
    buf = io.BytesIO()
    image.save(buf, "WEBP", **({"quality": 90, "method": 6} | options))
    data = buf.getvalue()
    digest = hashlib.sha256(data).hexdigest()[:8]
    path = OUT / rel_dir / f"{name}.{digest}.webp"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return "/" + path.relative_to(PUBLIC).as_posix()


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


def main():
    for stale in ("layers", "objects", "stills"):
        shutil.rmtree(OUT / stale, ignore_errors=True)
    for stale in [*OUT.glob("steps.*.webp"), *OUT.glob("figure.*.webp")]:
        stale.unlink()

    estimator = hero_depth.load_estimator()
    size, masks, depth, layers = build_layers(estimator)
    media = {
        "canvas": {"width": size[0], "height": size[1]},
        "layers": layers,
        "objects": build_objects(size, masks, depth),
        "stillLifes": build_still_lifes(),
        "figure": build_figure(),
    }
    GENERATED.parent.mkdir(parents=True, exist_ok=True)
    GENERATED.write_text(json.dumps(media, indent=2, ensure_ascii=False) + "\n")
    print(
        f"build-assets: {len(layers)} layers, {len(media['objects'])} objects, "
        f"{len(media['stillLifes'])} still lifes -> {GENERATED.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
