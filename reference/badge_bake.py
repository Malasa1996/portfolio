"""Bake the source camera's procedural silver appearance onto real geometry."""
import bpy,math,os
from bpy_extras.object_utils import world_to_camera_view

def bake_pendant(scene,dest):
    obj=next(o for o in scene.objects if o.name.startswith('Брелок • чистая серебряная пластина'))
    camera=scene.camera;size=2500
    projected=[world_to_camera_view(scene,camera,obj.matrix_world@v.co) for v in obj.data.vertices]
    xmin=max(0,math.floor((min(p.x for p in projected)-.008)*size))/size
    xmax=min(size,math.ceil((max(p.x for p in projected)+.008)*size))/size
    ymin=max(0,math.floor((min(p.y for p in projected)-.008)*size))/size
    ymax=min(size,math.ceil((max(p.y for p in projected)+.008)*size))/size
    visibility=[]
    for other in scene.objects:
        if other!=obj and other.type in {'MESH','CURVE','FONT','SURFACE'}:
            visibility.append((other,other.visible_camera));other.visible_camera=False
    render=scene.render
    render.resolution_x=size;render.resolution_y=size;render.resolution_percentage=100
    render.use_border=True;render.use_crop_to_border=True
    render.border_min_x=xmin;render.border_max_x=xmax;render.border_min_y=ymin;render.border_max_y=ymax
    render.film_transparent=True;render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True
    path=os.path.join(dest,'pendant-lighting.png')
    render.filepath=path;render.image_settings.file_format='PNG';render.image_settings.color_mode='RGBA'
    print('BADGE: baking source-camera silver, keeping source shadows and reflections',flush=True)
    bpy.ops.render.render(write_still=True)
    for other,visible in visibility:other.visible_camera=visible
    render.use_border=False;render.use_crop_to_border=False
    image=bpy.data.images.load(path,check_existing=False)
    uv=obj.data.uv_layers.new(name='Web pendant source camera');uv.active_render=True
    uvname=uv.name
    for loop in obj.data.loops:
        p=projected[loop.vertex_index];uv.data[loop.index].uv=((p.x-xmin)/(xmax-xmin),(p.y-ymin)/(ymax-ymin))
    mat=bpy.data.materials.new('Web baked • source Cycles pendant');mat.use_nodes=True
    nodes=mat.node_tree.nodes;nodes.clear()
    output=nodes.new('ShaderNodeOutputMaterial');emission=nodes.new('ShaderNodeEmission')
    texture=nodes.new('ShaderNodeTexImage');texture.image=image
    uvnode=nodes.new('ShaderNodeUVMap');uvnode.uv_map=uvname
    mat.node_tree.links.new(uvnode.outputs['UV'],texture.inputs['Vector'])
    mat.node_tree.links.new(texture.outputs['Color'],emission.inputs['Color'])
    mat.node_tree.links.new(emission.outputs[0],output.inputs['Surface'])
    obj.data.materials.clear();obj.data.materials.append(mat)
    for polygon in obj.data.polygons:polygon.material_index=0
    print('BADGE: source-camera silver appearance ready',flush=True)
