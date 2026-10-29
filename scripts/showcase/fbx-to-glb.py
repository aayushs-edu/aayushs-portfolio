"""FBX → GLB with Blender, for the showcase's 3D models.

Keeps the meshes in the pose they're in (the rig's deformation applied, no
skin, no animation), so the GLB is a static model. Meshes whose names end
with an --exclude suffix are left out (e.g. a stray duplicate base mesh).

  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
    --python scripts/showcase/fbx-to-glb.py -- public/models/WildWestMC.fbx \
    scripts/showcase/sources/models/wildwest-mc.glb --exclude :bodyBase
"""

import sys

import bpy

args = sys.argv[sys.argv.index("--") + 1 :]
src, out = args[0], args[1]
exclude = [args[i + 1] for i, a in enumerate(args) if a == "--exclude"]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=src)
keep = [o for o in bpy.context.scene.objects if o.type == "MESH" and not any(o.name.endswith(s) for s in exclude)]
# Meshes riding on a bone (a hat or eyes on the head bone) would lose that
# bone's transform once the rig is left out: bake it into the mesh first.
for o in keep:
    if o.parent_type == "BONE":
        world = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = world
bpy.ops.object.select_all(action="DESELECT")
for o in keep:
    o.select_set(True)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in keep)
bpy.ops.export_scene.gltf(
    filepath=out,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_skins=False,
    export_animations=False,
)
print(f"fbx-to-glb: {len(keep)} meshes, {tris} triangles -> {out}")
