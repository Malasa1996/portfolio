"""Export a web copy; the supplied .blend is never saved or modified on disk."""
import bpy, json, os, math, time, sys
from mathutils import Vector

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST=os.path.join(ROOT,'dist','assets','badge-3d')
os.makedirs(DEST,exist_ok=True)
scene=bpy.context.scene
scene.frame_set(0)
camera=scene.camera
depsgraph=bpy.context.evaluated_depsgraph_get()
projection=camera.calc_matrix_camera(depsgraph,x=1250,y=1250,scale_x=1,scale_y=1)
def flatten(m):return [float(m[r][c]) for c in range(4) for r in range(4)]
def values(v):return [float(x) for x in v]
rig=[]
for o in scene.objects:
    if o.type=='LIGHT' and not o.hide_render and o.data.type=='AREA':
        rig.append({'name':o.name,'matrix':flatten(o.matrix_world),'power':o.data.energy,
                    'color':values(o.data.color),'width':o.data.size,
                    'height':o.data.size_y if o.data.shape in {'RECTANGLE','ELLIPSE'} else o.data.size})

geometry=[o for o in scene.objects if o.type in {'MESH','CURVE','FONT','SURFACE'} and not o.hide_render and o.visible_get()]
sys.path.insert(0,os.path.dirname(__file__))
from badge_morph import compress_morphs
morph_report=compress_morphs(geometry,scene)
from badge_bake import bake_pendant
bake_pendant(scene,DEST)
used_materials={m for o in geometry for m in o.data.materials if m}
used_images={n.image for m in used_materials if m.use_nodes for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image}
for image in used_images:
    limit=2048 if image.name in {'5.png','Material.001_baseColor.png','Material.001_normal.png'} else 1024
    w,h=image.size
    if max(w,h)>limit:
        ratio=limit/max(w,h)
        image.scale(max(1,round(w*ratio)),max(1,round(h*ratio)))

material_changes=[]
for m in used_materials:
    if not m.use_nodes:continue
    nodes=m.node_tree.nodes;links=m.node_tree.links
    bsdf=next((n for n in nodes if n.type=='BSDF_PRINCIPLED'),None)
    output=next((n for n in nodes if n.type=='OUTPUT_MATERIAL' and n.is_active_output),None)
    if not bsdf or not output:continue
    # glTF has no light-path Mix Shader. Keep the original print camera colour.
    if m.name=='Вкладыш • сатиновая цветная печать':
        image_node=next(n for n in nodes if n.type=='TEX_IMAGE' and n.image)
        emission=nodes.new('ShaderNodeEmission');emission.inputs['Strength'].default_value=1
        links.new(image_node.outputs['Color'],emission.inputs['Color'])
        links.new(emission.outputs[0],output.inputs['Surface'])
        material_changes.append({'material':m.name,'adaptation':'unlit print; original image and UVs'})
    elif any(n.type=='MIX_SHADER' for n in nodes):
        links.new(bsdf.outputs[0],output.inputs['Surface'])
        material_changes.append({'material':m.name,'adaptation':'physical transmission in glTF'})
    base=bsdf.inputs.get('Base Color')
    if base and base.is_linked and base.links[0].from_node.type=='VALTORGB':
        ramp=base.links[0].from_node.color_ramp
        # Preserve the procedural material's palette instead of its unused fallback.
        colors=[e.color for e in ramp.elements]
        color=[.8*colors[0][i]+.2*colors[-1][i] for i in range(4)]
        for link in list(base.links):links.remove(link)
        base.default_value=color
        material_changes.append({'material':m.name,'adaptation':'procedural palette sampled for web','color':color})

# Curves and text become actual geometry, keeping transforms, parents and UVs.
bpy.ops.object.select_all(action='DESELECT')
curves=[o for o in geometry if o.type in {'CURVE','FONT','SURFACE'}]
if curves:
    for o in curves:o.select_set(True)
    bpy.context.view_layer.objects.active=curves[0]
    bpy.ops.object.convert(target='MESH')
geometry=[o for o in scene.objects if o.type=='MESH' and not o.hide_render and o.visible_get()]
before=sum(len(o.data.polygons) for o in geometry)
reduced=[]
for o in geometry:
    faces=len(o.data.polygons)
    if faces>10000 and not o.name.startswith('Брелок • чистая серебряная пластина'):
        mod=o.modifiers.new('Web copy: subpixel detail reduction','DECIMATE')
        mod.ratio=max(.025,min(1,6000/faces))
        reduced.append({'object':o.name,'sourceFaces':faces,'ratio':mod.ratio})

bpy.ops.object.select_all(action='DESELECT')
selected=set(geometry+[camera])
for o in list(selected):
    p=o.parent
    while p:selected.add(p);p=p.parent
for o in selected:o.select_set(True)
bpy.context.view_layer.objects.active=geometry[0]
print('BADGE: exporting',len(geometry),'meshes;',before,'source polygons;',len(reduced),'reduced meshes',flush=True)
started=time.time()
bpy.ops.export_scene.gltf(filepath=os.path.join(DEST,'badge.glb'),export_format='GLB',
    use_selection=True,use_renderable=True,export_apply=True,
    export_cameras=True,export_lights=False,export_extras=False,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
    export_frame_step=2,export_force_sampling=True,export_current_frame=True,
    export_image_format='WEBP',export_image_quality=90,
    export_meshopt_compression_enable=False,export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,export_draco_position_quantization=18,
    export_draco_normal_quantization=12,export_draco_texcoord_quantization=12)
metadata={'source':'TestCodex.blend','camera':camera.name,'projection':flatten(projection),
          'appearanceBake':{'mesh':'silver pendant','method':'source-camera Cycles render projected on original geometry','viewDependent':True},
          'referenceImage':{'width':2500,'height':2500},'referenceFrame':0,
          'duration':(scene.frame_end-scene.frame_start)/scene.render.fps,
          'areaLights':rig,'materialAdaptations':material_changes,
          'optimization':{'sourcePolygons':before,'meshes':len(geometry),'reducedMeshes':reduced,'morphCompression':morph_report}}
with open(os.path.join(DEST,'scene.json'),'w',encoding='utf-8') as f:json.dump(metadata,f,ensure_ascii=False,separators=(',',':'))
print(json.dumps({'model':os.path.join(DEST,'badge.glb'),'bytes':os.path.getsize(os.path.join(DEST,'badge.glb')),
                  'seconds':round(time.time()-started,1),'selected':len(selected),'meshes':len(geometry)}),flush=True)
