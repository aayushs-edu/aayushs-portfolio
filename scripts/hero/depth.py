#!/usr/bin/env python3
"""Estimate a depth map for every hero gallery item.

Reads src/components/hero/gallery.json and runs Depth Anything V2 Small on
each item's source image. Writes an intermediate 8-bit grayscale PNG (near =
white) to scripts/hero/.cache/depth/<mode>/<slug>.png, which
build-hero-assets.mjs turns into the published, hashed depth texture.

Usage:
  python3 scripts/hero/depth.py            # all items (unchanged ones are skipped)
  python3 scripts/hero/depth.py --slug lumina
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GALLERY = ROOT / "src/components/hero/gallery.json"
MANIFEST = ROOT / "public/paintings/manifest.json"
PUBLIC = ROOT / "public"
CACHE = ROOT / "scripts/hero/.cache/depth"
CACHE_INDEX = CACHE / "index.json"

MODEL = "depth-anything/Depth-Anything-V2-Small-hf"
LONG_SIDE = 1024
MEDIAN_SIZE = 5  # 2px radius
CODE_REQUIRED = ("slug", "title", "stack", "src", "href")


def fail(message: str) -> None:
    print(f"depth.py: {message}", file=sys.stderr)
    sys.exit(1)


def load_gallery() -> list[tuple[str, dict]]:
    """Validate gallery.json and return (mode, item) pairs."""
    try:
        gallery = json.loads(GALLERY.read_text())
    except (OSError, json.JSONDecodeError) as err:
        fail(f"cannot read {GALLERY.relative_to(ROOT)}: {err}")

    if gallery.get("initialMode") not in ("art", "code"):
        fail(f'initialMode must be "art" or "code", got {gallery.get("initialMode")!r}')

    manifest_srcs = {item["src"] for item in json.loads(MANIFEST.read_text())["items"]}
    pairs = []
    for mode in ("art", "code"):
        section = gallery.get(mode)
        if not isinstance(section, dict) or not isinstance(section.get("items"), list):
            fail(f'"{mode}" must be an object with an "items" array')
        items = section["items"]
        if not items:
            fail(f'"{mode}.items" is empty')
        slugs = [item.get("slug") for item in items]
        for slug in slugs:
            if not isinstance(slug, str) or not slug:
                fail(f'every "{mode}" item needs a "slug"')
            if slugs.count(slug) > 1:
                fail(f'duplicate slug "{slug}" in "{mode}.items"')
        if section.get("initial") not in slugs:
            fail(f'"{mode}.initial" is {section.get("initial")!r}, which is not a slug in "{mode}.items"')
        for item in items:
            if mode == "code":
                missing = [key for key in CODE_REQUIRED if not item.get(key)]
                if missing:
                    fail(f'code item "{item["slug"]}" is missing {", ".join(missing)}')
            src = item.get("src")
            if not isinstance(src, str) or not src.startswith("/"):
                fail(f'item "{item["slug"]}" needs a "src" path starting with "/"')
            if not (PUBLIC / src.lstrip("/")).is_file():
                fail(f'item "{item["slug"]}": file public{src} does not exist')
            if mode == "art" and src not in manifest_srcs:
                fail(f'art item "{item["slug"]}": {src} is not in public/paintings/manifest.json')
            pairs.append((mode, item))
    return pairs


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--slug", help="only process this slug")
    args = parser.parse_args()

    pairs = load_gallery()
    if args.slug:
        pairs = [(mode, item) for mode, item in pairs if item["slug"] == args.slug]
        if not pairs:
            fail(f'no gallery item has slug "{args.slug}"')

    CACHE.mkdir(parents=True, exist_ok=True)
    index = json.loads(CACHE_INDEX.read_text()) if CACHE_INDEX.is_file() else {}

    todo = []
    for mode, item in pairs:
        src = PUBLIC / item["src"].lstrip("/")
        key = f"{mode}/{item['slug']}"
        out = CACHE / mode / f"{item['slug']}.png"
        digest = file_hash(src)
        if index.get(key) == digest and out.is_file():
            print(f"depth  {key}: unchanged, skipped")
            continue
        todo.append((key, src, out, digest))

    if not todo:
        return

    # Imported late so validation and "nothing to do" runs stay fast.
    import numpy as np
    import torch
    from PIL import Image, ImageFilter
    from transformers import pipeline

    try:
        estimator = pipeline("depth-estimation", model=MODEL)
    except Exception as err:  # noqa: BLE001 - surface any download/load failure
        fail(
            f"could not load {MODEL} ({err}). The model downloads from Hugging Face on first run; "
            "check the network connection and retry. Depth is never faked."
        )

    for key, src, out, digest in todo:
        image = Image.open(src).convert("RGB")
        width, height = image.size
        scale = min(1.0, LONG_SIDE / max(width, height))
        target = (max(1, round(width * scale)), max(1, round(height * scale)))

        with torch.no_grad():
            result = estimator(image)
        depth = result["predicted_depth"]
        if depth.dim() == 2:
            depth = depth[None, None]
        elif depth.dim() == 3:
            depth = depth[None]
        depth = torch.nn.functional.interpolate(
            depth, size=(target[1], target[0]), mode="bicubic", align_corners=False
        )[0, 0].cpu().numpy()

        # Depth Anything predicts relative inverse depth: larger = nearer = white.
        lo, hi = float(np.percentile(depth, 0.5)), float(np.percentile(depth, 99.5))
        norm = np.clip((depth - lo) / max(hi - lo, 1e-6), 0.0, 1.0)
        gray = Image.fromarray((norm * 255.0 + 0.5).astype(np.uint8), mode="L")
        gray = gray.filter(ImageFilter.MedianFilter(size=MEDIAN_SIZE))

        out.parent.mkdir(parents=True, exist_ok=True)
        gray.save(out, optimize=True)
        index[key] = digest
        CACHE_INDEX.write_text(json.dumps(index, indent=2, sort_keys=True) + "\n")
        print(f"depth  {key}: {target[0]}x{target[1]}")


if __name__ == "__main__":
    main()
