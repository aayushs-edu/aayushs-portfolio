"""Compresses a GLB for the web with Blender: textures at most 2048 px as WebP
(or as they came, if WebP would lose one), geometry with Draco. Run by scripts/showcase/build-assets.py:

  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
    --python scripts/showcase/compress-glb.py -- in.glb out.glb
"""

import json
import struct
import sys

import bpy

MAX_TEXTURE = 2048

src, out = sys.argv[sys.argv.index("--") + 1 :]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)

for image in bpy.data.images:
    width, height = image.size
    if max(width, height) > MAX_TEXTURE:
        scale = MAX_TEXTURE / max(width, height)
        image.scale(max(1, round(width * scale)), max(1, round(height * scale)))


def export(image_format):
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format="GLB",
        export_image_format=image_format,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )


def textures_without_images(path):
    """Textures in a GLB that point at no image (three.js can't load those)."""
    with open(path, "rb") as f:
        data = f.read()
    length = struct.unpack("<I", data[12:16])[0]
    gltf = json.loads(data[20 : 20 + length])
    return [
        i
        for i, t in enumerate(gltf.get("textures", []))
        if "source" not in t and "source" not in t.get("extensions", {}).get("EXT_texture_webp", {})
    ]


# Blender's WebP export can drop an image and leave its texture pointing at
# nothing; then keep the images as they came (JPEG/PNG).
export("WEBP")
if textures_without_images(out):
    export("AUTO")
    if textures_without_images(out):
        raise SystemExit(f"compress-glb: {out} has textures without images")
