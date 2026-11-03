"""Compress the lanyard's sampled shape keys without flattening its motion."""
import bpy
import numpy as np

def compress_morphs(objects, scene, tolerance=.0025):
    report=[]
    frames=sorted(set([0,scene.frame_start,scene.frame_end]+list(range(scene.frame_start,scene.frame_end+1,2))))
    for obj in objects:
        keys=getattr(obj.data,'shape_keys',None)
        if not keys or len(keys.key_blocks)<24:continue
        blocks=list(keys.key_blocks)
        if not keys.use_relative:continue
        size=len(obj.data.vertices)*3
        base=np.empty(size,dtype=np.float32)
        blocks[0].data.foreach_get('co',base)
        deltas=[]
        for key in blocks[1:]:
            coords=np.empty(size,dtype=np.float32);relative=np.empty(size,dtype=np.float32)
            key.data.foreach_get('co',coords);key.relative_key.data.foreach_get('co',relative)
            deltas.append(coords-relative)
        delta=np.array(deltas,dtype=np.float32)
        gram=delta.astype(np.float64)@delta.astype(np.float64).T
        values,vectors=np.linalg.eigh(gram)
        vectors=vectors[:,np.argsort(values)[::-1]].astype(np.float32)
        scale=max(abs(float(v)) for v in obj.matrix_world.to_scale())
        rank=4
        while True:
            basis=vectors[:,:rank].T@delta
            residual=delta-vectors[:,:rank]@basis
            error=float(np.sqrt((residual.reshape(len(deltas),-1,3)**2).sum(axis=2)).max())*scale
            if error<=tolerance or rank>=min(20,len(deltas)):break
            rank+=2
        samples=[]
        for frame in frames:
            scene.frame_set(frame)
            weights=np.array([key.value for key in blocks[1:]],dtype=np.float32)
            samples.append((frame,weights@vectors[:,:rank]))
        scene.frame_set(0)
        obj.shape_key_clear()
        obj.shape_key_add(name='Basis',from_mix=False)
        compressed=[]
        for i in range(rank):
            key=obj.shape_key_add(name='Web motion basis '+str(i+1),from_mix=False)
            key.slider_min=-10;key.slider_max=10
            key.data.foreach_set('co',base+basis[i]);compressed.append(key)
        for frame,weights in samples:
            for i,key in enumerate(compressed):
                key.value=float(weights[i]);key.keyframe_insert(data_path='value',frame=frame,group='Original rope motion')
        report.append({'object':obj.name,'originalTargets':len(deltas),'webTargets':rank,'maxWorldError':error})
        print('BADGE morph:',obj.name,len(deltas),'->',rank,'max error',round(error,6),flush=True)
    scene.frame_set(0)
    return report
