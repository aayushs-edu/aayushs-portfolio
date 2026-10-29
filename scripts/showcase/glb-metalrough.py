"""Rewrites a GLB through Blender so three.js can read its materials.

Sketchfab's GLB export can use KHR_materials_pbrSpecularGlossiness, which
three.js no longer supports (the model then renders grey, untextured).
Blender imports that extension and exports standard metal/rough materials.

  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
    --python scripts/showcase/glb-metalrough.py -- ~/Downloads/saloon.glb \
    scripts/showcase/sources/models/saloon.glb
"""

import sys

import bpy

src, out = sys.argv[sys.argv.index("--") + 1 :]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB")
print(f"glb-metalrough: {len(meshes)} meshes, {len(bpy.data.images)} images -> {out}")
