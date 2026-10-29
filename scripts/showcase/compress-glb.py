"""Compresses a GLB for the web with Blender: textures at most 2048 px as WebP,
geometry with Draco. Run by scripts/showcase/build-assets.py:

  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
    --python scripts/showcase/compress-glb.py -- in.glb out.glb
"""

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
bpy.ops.export_scene.gltf(
    filepath=out,
    export_format="GLB",
    export_image_format="WEBP",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)
