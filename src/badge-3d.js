import {
 AnimationMixer, Box3, Color, DoubleSide, FrontSide, Group, Matrix4, Mesh,
 MeshBasicMaterial, NoToneMapping, PerspectiveCamera, PlaneGeometry,
 PMREMGenerator, Scene, SRGBColorSpace, Vector3, WebGLRenderer
} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';

const host=document.querySelector('.hero-art.badge-3d');

class BadgeScene {
 constructor(host){
  this.host=host;this.poster=host.querySelector('img');this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
  this.abort=new AbortController();this.visible=true;this.target={x:0,y:0};this.drawnAt=0;this.ready=false;
 }
 async load(){
  try{
   this.renderer=new WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
   this.renderer.outputColorSpace=SRGBColorSpace;this.renderer.toneMapping=NoToneMapping;
   this.renderer.setClearColor(0x1e1e24,0);this.renderer.transmissionResolutionScale=.65;
   this.canvas=this.renderer.domElement;this.canvas.className='badge-canvas';this.canvas.setAttribute('aria-hidden','true');
   this.host.append(this.canvas);this.resize();
   this.decoder=new DRACOLoader();this.decoder.setDecoderPath(new URL('vendor/draco/',document.baseURI).href);
   this.decoder.setWorkerLimit(2);
   const loader=new GLTFLoader().setDRACOLoader(this.decoder);
   const [gltf,metadata]=await Promise.all([
    loader.loadAsync(new URL('assets/badge-3d/badge.glb',document.baseURI).href),
    fetch(new URL('assets/badge-3d/scene.json',document.baseURI),{signal:this.abort.signal}).then(r=>{if(!r.ok)throw Error('Scene metadata unavailable');return r.json();})
   ]);
   this.scene=new Scene();this.model=gltf.scene;this.model.updateMatrixWorld(true);
   this.camera=gltf.cameras[0];if(!(this.camera instanceof PerspectiveCamera))throw Error('Missing source camera');
   const position=this.camera.getWorldPosition(new Vector3()),rotation=this.camera.getWorldQuaternion(this.camera.quaternion.clone());
   this.camera.removeFromParent();this.camera.position.copy(position);this.camera.quaternion.copy(rotation);this.scene.add(this.camera);
   // Use Blender's exact off-axis projection, including its lens shift.
   this.camera.projectionMatrix.fromArray(metadata.projection);this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
   this.pivot=new Group();this.scene.add(this.pivot);this.pivot.add(this.model);
   const centre=new Box3().setFromObject(this.model).getCenter(new Vector3());
   this.pivot.position.copy(centre);this.model.position.sub(centre);
   this.model.traverse(object=>{
    if(!object.isMesh)return;
    const adapt=material=>{
     if(material.name==='Сатинированное серебро • единый физический масштаб зерна.001'){
      object.geometry.computeVertexNormals();material.anisotropy=0;material.roughness=.4;
     }
     if(material.name.includes('Вкладыш')&&material.name.includes('сатиновая')){
      const map=material.map||material.emissiveMap;if(map)map.anisotropy=this.renderer.capabilities.getMaxAnisotropy();
      return new MeshBasicMaterial({name:material.name,map,side:material.side});
     }
     material.envMapIntensity=.08;material.side=FrontSide;
     if(material.name==='Сатинированное серебро • единый физический масштаб зерна.001')material.envMapIntensity=.35;
     if(material.isMeshPhysicalMaterial&&(material.name.includes('Шнур')||material.name.includes('Ремешок')))material.sheen=.1;
     if(material.name.startsWith('Голубой акрил')){
      material.color.setRGB(.015,.215,.25);material.transmission=.2;material.roughness=.13;
     }
     if(material.name==='Engraving - darkened silver recess'){
      material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-2;
     }
     if(material.name.includes('серебро'))material.roughness=Math.max(material.roughness,.26);
     if(material.name.includes('Держатель')&&material.isMeshPhysicalMaterial){
      material.transmission=0;material.transparent=true;material.depthWrite=false;material.forceSinglePass=true;
      material.envMapIntensity=.22;material.roughness=.09;
      // Blender's window mixes transparent and physical shaders. Recreate the
      // clear camera-facing sheet without a refraction pass blurring the print.
      material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
       'float edgeFresnel=pow(1.0-abs(dot(normalize(vViewPosition),normal)),3.0);diffuseColor.a*=mix(0.012,0.7,edgeFresnel);\n#include <opaque_fragment>');};
      material.customProgramCacheKey=()=> 'badge-clear-PET-v1';
     }
     return material;
    };
    object.material=Array.isArray(object.material)?object.material.map(adapt):adapt(object.material);
   });
   this.environment=this.createEnvironment(metadata,centre);this.scene.environment=this.environment.texture;
   this.mixer=new AnimationMixer(this.model);
   for(const clip of gltf.animations)this.mixer.clipAction(clip).play();
   this.mixer.setTime(0);this.resize();
   await this.renderer.compileAsync(this.scene,this.camera);
   this.render();this.ready=true;this.host.dataset.badgeState='ready';
   this.host.classList.add('is-3d-ready');this.poster.remove();
   this.bind();this.start();
  }catch(error){this.fallback();throw error;}
 }
 createEnvironment(metadata,centre){
  const environment=new Scene();environment.background=new Color(.07,.075,.09);
  const axis=new Matrix4().makeRotationX(-Math.PI/2);
  const geometry=new PlaneGeometry(1,1),materials=[];
  for(const panel of metadata.areaLights){
   const radiance=panel.power/(Math.PI*panel.width*panel.height);
   const material=new MeshBasicMaterial({color:new Color(...panel.color).multiplyScalar(radiance),side:DoubleSide,toneMapped:false});
   materials.push(material);
   const mesh=new Mesh(geometry,material);mesh.applyMatrix4(new Matrix4().multiplyMatrices(axis,new Matrix4().fromArray(panel.matrix)));
   mesh.scale.multiply(new Vector3(panel.width,panel.height,1));environment.add(mesh);
  }
  const generator=new PMREMGenerator(this.renderer);
  const target=generator.fromScene(environment,.02,.1,100,{size:256,position:centre});
  generator.dispose();geometry.dispose();for(const material of materials)material.dispose();
  return target;
 }
 resize(){
  if(!this.canvas)return;
  const width=this.canvas.getBoundingClientRect().width;
  if(width<1)return;
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5,1400/width));
  this.renderer.setSize(width,width,false);
  if(this.scene)this.render();
 }
 bind(){
  const signal=this.abort.signal;
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.host);
  this.intersection=new IntersectionObserver(([entry])=>{this.visible=entry.isIntersecting;this.start();},{rootMargin:'80px'});
  this.intersection.observe(this.host);
  document.addEventListener('visibilitychange',()=>this.start(),{signal});
  this.reduced.addEventListener('change',()=>this.start(),{signal});
  this.host.addEventListener('pointermove',event=>{
   if(event.pointerType!=='mouse'||this.reduced.matches)return;
   const rect=this.host.getBoundingClientRect();
   this.target.y=((event.clientX-rect.left)/rect.width-.5)*.065;
   this.target.x=((event.clientY-rect.top)/rect.height-.5)*.035;this.start();
  },{passive:true,signal});
  this.host.addEventListener('pointerleave',()=>{this.target.x=0;this.target.y=0;this.start();},{signal});
  this.dialogObserver=new MutationObserver(()=>this.start());
  this.dialogObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
  this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.fallback();},{signal});
  window.addEventListener('pagehide',event=>{if(event.persisted){cancelAnimationFrame(this.frame);this.frame=undefined;}else this.dispose();},{signal});
  window.addEventListener('pageshow',event=>{if(event.persisted)this.start();},{signal});
 }
 start(){
  if(!this.ready||!this.visible||document.hidden||document.querySelector('dialog[open]')||this.reduced.matches){
   this.host.dataset.badgeMotion='paused';
   cancelAnimationFrame(this.frame);this.frame=undefined;
   if(this.ready&&this.reduced.matches){this.mixer.setTime(0);this.pivot.rotation.set(0,0,0);this.render();}
   return;
  }
  if(this.frame)return;this.host.dataset.badgeMotion='playing';this.lastTime=undefined;
  const tick=now=>{
   if(!this.ready)return;
   this.frame=requestAnimationFrame(tick);
   if(now-this.drawnAt<1000/30)return;
   const delta=this.lastTime===undefined?0:Math.min((now-this.lastTime)/1000,.05);
   this.lastTime=now;this.drawnAt=now;
   this.mixer.update(delta);
   const smoothing=1-Math.exp(-delta*7);
   this.pivot.rotation.x+=(this.target.x-this.pivot.rotation.x)*smoothing;
   this.pivot.rotation.y+=(this.target.y-this.pivot.rotation.y)*smoothing;
   this.render();
  };
  this.frame=requestAnimationFrame(tick);
 }
 render(){this.renderer.render(this.scene,this.camera);}
 fallback(){
  this.ready=false;cancelAnimationFrame(this.frame);this.host.classList.remove('is-3d-ready');this.host.dataset.badgeState='fallback';
  if(!this.poster.isConnected)this.host.prepend(this.poster);this.canvas?.remove();this.dispose();
 }
 dispose(){
  this.ready=false;cancelAnimationFrame(this.frame);this.abort.abort();this.resizeObserver?.disconnect();this.intersection?.disconnect();this.dialogObserver?.disconnect();
  this.decoder?.dispose();this.environment?.dispose();this.renderer?.dispose();
  const disposed=new Set();const release=item=>{if(item&&!disposed.has(item)){disposed.add(item);item.dispose();}};
  this.model?.traverse(object=>{
   release(object.geometry);
   for(const material of Array.isArray(object.material)?object.material:[object.material]){
    if(!material)continue;for(const value of Object.values(material))if(value?.isTexture)release(value);release(material);
   }
  });
 }
}
if(host)new BadgeScene(host).load().catch(error=>console.warn('3D badge: original poster retained.',error));
