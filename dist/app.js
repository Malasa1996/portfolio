const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const SLIDE_DURATION=15000;
const galleries=[...document.querySelectorAll('.gallery')];
const mobileCopy=matchMedia('(max-width: 760px)');
const mobileParagraphs=[...document.querySelectorAll('main .project-heading .description, main .section-intro p, main .archive p')];
const desktopParagraphs=mobileParagraphs.map(node=>node.textContent);
const danglingWord=/(^|[\s(«„])(в|во|на|с|со|к|ко|у|о|об|от|до|за|из|по|для|при|и|а|но)( +)(?=\S)/giu;
const syncMobileLineBreaks=()=>mobileParagraphs.forEach((node,index)=>{
 node.textContent=desktopParagraphs[index];
 if(!mobileCopy.matches)return;
 for(let pass=0;pass<12;pass++){
  let changed=false;
  const value=node.textContent;
  const matches=[...value.matchAll(danglingWord)];
  for(const match of matches.reverse()){
   const start=match.index+match[1].length;
   const end=start+match[2].length;
   const next=end+match[3].length;
   const text=node.firstChild;
   const before=document.createRange();before.setStart(text,start);before.setEnd(text,end);
   const after=document.createRange();after.setStart(text,next);after.setEnd(text,next+1);
   if(after.getBoundingClientRect().top-before.getBoundingClientRect().top>1){
    node.textContent=node.textContent.slice(0,end)+'\u00a0'+node.textContent.slice(next);
    changed=true;
   }
  }
  if(!changed)break;
 }
});
mobileCopy.addEventListener('change',syncMobileLineBreaks);
let mobileCopyFrame;
window.addEventListener('resize',()=>{
 cancelAnimationFrame(mobileCopyFrame);
 mobileCopyFrame=requestAnimationFrame(syncMobileLineBreaks);
});
document.fonts.ready.then(syncMobileLineBreaks);
syncMobileLineBreaks();
const mobileArchiveArt=document.querySelector('.archive-art');
if(mobileArchiveArt){
 const mobileHome=matchMedia('(max-width: 760px)');
 const syncArchiveArt=()=>{
  if(mobileHome.matches){mobileArchiveArt.tabIndex=-1;mobileArchiveArt.setAttribute('aria-hidden','true');}
  else{mobileArchiveArt.removeAttribute('tabindex');mobileArchiveArt.removeAttribute('aria-hidden');}
 };
 mobileHome.addEventListener('change',syncArchiveArt);
 syncArchiveArt();
 mobileArchiveArt.addEventListener('click',event=>{
  if(!mobileHome.matches)return;
  event.preventDefault();event.stopImmediatePropagation();
 },true);
}

class Gallery {
 constructor(element){
  this.element=element;
  this.track=element.querySelector('.gallery-track');
  this.originals=[...this.track.children];
  this.controls=element.nextElementSibling;
  this.dots=[...this.controls.querySelectorAll('.dot')];
  this.index=1;this.elapsed=0;this.visible=false;this.paused=reduced.matches;this.dragging=false;this.focused=false;this.navigating=false;
  // A full copy on either side keeps the neighbouring artwork visible at the
  // seam. Only the middle copy is exposed to assistive technology and dialogs.
  const copy=slide=>{const node=slide.cloneNode(true);node.dataset.clone='true';node.setAttribute('aria-hidden','true');node.inert=true;return node;};
  this.track.prepend(...this.originals.map(copy));
  this.track.append(...this.originals.map(copy));
  this.slides=[...this.track.children];
  const slideObserver=new IntersectionObserver(entries=>{
   entries.forEach(entry=>entry.target.classList.toggle('is-in-view',entry.isIntersecting));
  },{root:element,rootMargin:'0px 64px',threshold:0});
  this.slides.forEach(slide=>slideObserver.observe(slide));
  this.dots.forEach((dot,i)=>dot.addEventListener('click',()=>this.go(i)));
  element.addEventListener('keydown',event=>{
   if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();this.go(this.index+(event.key==='ArrowRight'?1:-1));}
  });
  element.addEventListener('pointerdown',event=>this.beginDrag(event));
  element.addEventListener('pointermove',event=>this.moveDrag(event));
  window.addEventListener('pointerup',event=>this.endDrag(event));
  window.addEventListener('pointercancel',event=>this.endDrag(event));
  element.addEventListener('lostpointercapture',event=>this.endDrag(event));
  element.addEventListener('dragstart',event=>event.preventDefault());
  element.addEventListener('focusin',event=>{this.focused=event.target.matches(':focus-visible');});
  element.addEventListener('focusout',()=>{this.focused=false;});
  element.addEventListener('scroll',()=>{clearTimeout(this.settleTimer);this.settleTimer=setTimeout(()=>this.settle(),160);},{passive:true});
  element.addEventListener('scrollend',()=>this.settle());
  new ResizeObserver(()=>{this.align();scheduleActiveGallery();}).observe(element);
  this.align();this.update();
 }
 closestSlide(projection=0){
  const bounds=this.element.getBoundingClientRect();
  const center=bounds.left+bounds.width/2+projection;
  let closest=this.slides[0],distance=Infinity;
  for(const node of this.slides){const rect=node.getBoundingClientRect();const next=Math.abs(rect.left+rect.width/2-center);if(next<distance){closest=node;distance=next;}}
  return closest;
 }
 beginDrag(event){
  if(!event.isPrimary||event.button!==0)return;
  cancelAnimationFrame(this.scrollAnimation);this.scrollAnimation=undefined;
  clearTimeout(this.settleTimer);
  this.pointer={id:event.pointerId,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastTime:event.timeStamp,velocity:0,scroll:this.element.scrollLeft,startSlide:this.closestSlide(),moved:false};
  this.dragging=true;this.navigating=false;
  if(event.pointerType==='mouse'){
   event.preventDefault();
   this.element.classList.add('is-dragging');
   this.element.setPointerCapture(event.pointerId);
   this.element.scrollTo({left:this.element.scrollLeft,behavior:'instant'});
  }
 }
 moveDrag(event){
  const pointer=this.pointer;
  if(!pointer||pointer.id!==event.pointerId)return;
  const distance=event.clientX-pointer.startX;
  const vertical=event.clientY-pointer.startY;
  if(!pointer.moved){
   if(Math.abs(distance)<4||Math.abs(distance)<Math.abs(vertical)*1.15)return;
   pointer.moved=true;
   this.element.classList.add('is-dragging');
   this.element.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
  const elapsed=event.timeStamp-pointer.lastTime;
  if(elapsed>0)pointer.velocity=pointer.velocity*.6+(event.clientX-pointer.lastX)/elapsed*.4;
  pointer.lastX=event.clientX;pointer.lastTime=event.timeStamp;
  const scale=this.element.getBoundingClientRect().width/this.element.offsetWidth;
  this.element.scrollLeft=pointer.scroll-distance/scale;
 }
 endDrag(event){
  const pointer=this.pointer;
  if(!pointer||pointer.id!==event.pointerId)return;
  this.pointer=null;this.dragging=false;
  let target=this.closestSlide();
  const speed=event.type==='pointercancel'||event.timeStamp-pointer.lastTime>=120?0:pointer.velocity;
  if(pointer.moved){
   const distance=pointer.lastX-pointer.startX;
   const limit=pointer.startSlide.getBoundingClientRect().width*.22;
   const projection=event.type==='pointercancel'?0:Math.max(-limit,Math.min(limit,-speed*120));
   target=this.closestSlide(projection);
   // A modest gesture is enough, without pulling halfway across a wide card.
   // Tiny accidental movements still return to the current slide.
   const threshold=Math.max(32,Math.min(64,pointer.startSlide.getBoundingClientRect().width*.08));
   const intentional=event.type!=='pointercancel'&&(Math.abs(distance)>=threshold||(Math.abs(distance)>=14&&Math.abs(speed)>.35));
   if(target===pointer.startSlide&&intentional){
    const direction=Math.sign(distance);
    target=this.slides[Math.max(0,Math.min(this.slides.length-1,this.slides.indexOf(pointer.startSlide)-direction))];
   }
   this.elapsed=0;
  }
  this.element.classList.remove('is-dragging');
  if(this.element.hasPointerCapture(pointer.id))this.element.releasePointerCapture(pointer.id);
  this.index=Number(target.dataset.slideIndex);this.navigating=true;this.update();
  this.center(target,'smooth',speed);
 }
 center(slide,behavior='instant',releaseSpeed=0){
  const bounds=this.element.getBoundingClientRect();
  const scale=bounds.width/this.element.offsetWidth;
  const target=this.element.scrollLeft+(slide.getBoundingClientRect().left+slide.getBoundingClientRect().width/2-(bounds.left+bounds.width/2))/scale;
  cancelAnimationFrame(this.scrollAnimation);this.scrollAnimation=undefined;
  const start=this.element.scrollLeft;
  const distance=target-start;
  if(reduced.matches||behavior==='instant'||Math.abs(distance)<.5){
   this.element.scrollTo({left:target,behavior:'instant'});
   if(this.navigating)requestAnimationFrame(()=>this.settle());
   return;
  }
  // One animator owns the release. Native mandatory snapping and smooth
  // scrolling used to fight each other as pointer capture was released.
  this.navigating=true;
  const duration=Math.min(950,Math.max(580,620+Math.abs(distance)*.3));
  // Match the release velocity, then ease to rest. A slow release accelerates
  // gently instead of starting with the old cubic-out tug.
  const slope=Math.max(0,Math.min(2,(-releaseSpeed/scale)*duration/distance));
  const began=performance.now();
  const step=now=>{
   const progress=Math.min(1,(now-began)/duration);
   const eased=progress*progress*(3-2*progress)+slope*progress*Math.pow(1-progress,2);
   this.element.scrollLeft=start+distance*eased;
   if(progress<1)this.scrollAnimation=requestAnimationFrame(step);
   else{this.scrollAnimation=undefined;this.settle();}
  };
  this.scrollAnimation=requestAnimationFrame(step);
 }
 align(){this.navigating=false;this.center(this.originals[this.index]);}
 go(requested){
  if(this.navigating)return;
  const count=this.originals.length;
  const next=(requested+count)%count;
  let target=this.originals[next];
  if(requested===count)target=this.slides[count*2];
  if(requested<0)target=this.slides[count-1];
  this.index=next;this.elapsed=0;this.navigating=true;this.update();this.center(target,'smooth');
  // Instant navigation (reduced motion) may not dispatch a scroll event.
  if(reduced.matches)requestAnimationFrame(()=>this.settle());
 }
 settle(){
  if(this.dragging||this.scrollAnimation)return;
  clearTimeout(this.settleTimer);
  const closest=this.closestSlide();
  const bounds=this.element.getBoundingClientRect();
  const offset=closest.getBoundingClientRect().left+closest.getBoundingClientRect().width/2-bounds.left-bounds.width/2;
  if(Math.abs(offset)>1){this.center(closest,'smooth');return;}
  const index=Number(closest.dataset.slideIndex);
  if(this.index!==index){this.index=index;this.elapsed=0;}
  this.navigating=false;
  if(closest.dataset.clone)this.center(this.originals[this.index]);
  this.update();
 }
 update(){
  this.dots.forEach((dot,i)=>{dot.classList.toggle('active',i===this.index);dot.classList.toggle('nearby',i===(this.index+1)%this.dots.length);dot.setAttribute('aria-pressed',String(i===this.index));});
  this.controls.style.setProperty('--progress',this.elapsed/SLIDE_DURATION);
  this.element.dataset.currentSlide=String(this.index+1);
 }
 tick(delta){
  if(!this.paused&&!this.focused&&!this.dragging&&!this.navigating&&this.visible&&!document.hidden&&!document.querySelector('dialog[open]')){
   this.elapsed+=delta;
   if(this.elapsed>=SLIDE_DURATION)this.go(this.index+1);
   else this.controls.style.setProperty('--progress',this.elapsed/SLIDE_DURATION);
  }
 }
}
const carousels=galleries.map(element=>new Gallery(element));
// Only the largest exposed gallery owns the clock. Sticky case cards overlap,
// so viewport intersection alone also counted the gallery hidden underneath.
let activeGalleryFrame;
function updateActiveGallery(){
 activeGalleryFrame=undefined;
 let active=null,bestHeight=0;
 carousels.forEach((carousel,index)=>{
  const bounds=carousel.element.getBoundingClientRect();
  const panel=carousel.element.closest('.project').getBoundingClientRect();
  const nextPanel=carousels[index+1]?.element.closest('.project').getBoundingClientRect();
  const top=Math.max(0,bounds.top,panel.top);
  const bottom=Math.min(innerHeight,bounds.bottom,panel.bottom,nextPanel?.top??Infinity);
  const height=Math.max(0,bottom-top);
  if(height>=Math.min(bounds.height,innerHeight)*.25&&height>bestHeight){active=carousel;bestHeight=height;}
 });
 carousels.forEach(carousel=>{
  const visible=carousel===active;
  if(carousel.element.dataset.autoplayActive!==String(visible))carousel.element.dataset.autoplayActive=String(visible);
  carousel.visible=visible;
 });
}
function scheduleActiveGallery(){if(!activeGalleryFrame)activeGalleryFrame=requestAnimationFrame(updateActiveGallery);}
window.addEventListener('scroll',scheduleActiveGallery,{passive:true});
window.addEventListener('resize',scheduleActiveGallery);
window.addEventListener('load',scheduleActiveGallery,{once:true});
scheduleActiveGallery();
window.addEventListener('load',()=>carousels.forEach(carousel=>carousel.align()),{once:true});
reduced.addEventListener('change',()=>{carousels.forEach(carousel=>{carousel.paused=reduced.matches;});scheduleStack();});
let lastFrame=performance.now();
function animateGalleries(now){const delta=Math.min(now-lastFrame,100);lastFrame=now;carousels.forEach(carousel=>carousel.tick(delta));requestAnimationFrame(animateGalleries);}
requestAnimationFrame(animateGalleries);

const firstCase=document.querySelector('.project:first-child');
const nextCase=document.querySelector('.bank-project');
let stackFrame;
function updateStack(){
 stackFrame=undefined;
 if(reduced.matches){firstCase.style.removeProperty('--stack-scale');firstCase.style.removeProperty('--stack-shade');return;}
 const viewportHeight=window.innerHeight/pageScale();
 const top=Math.min(24,viewportHeight-firstCase.offsetHeight-24);
 const overlap=Math.max(0,Math.min(1,(viewportHeight-nextCase.getBoundingClientRect().top/pageScale())/(viewportHeight-Math.max(24,top))));
 firstCase.style.setProperty('--stack-top',top+'px');
 firstCase.style.setProperty('--stack-scale',String(1-overlap*.035));
 firstCase.style.setProperty('--stack-shade',String(overlap*.18));
}
function scheduleStack(){if(!stackFrame)stackFrame=requestAnimationFrame(updateStack);}
window.addEventListener('scroll',scheduleStack,{passive:true});
window.addEventListener('resize',scheduleStack);
new ResizeObserver(scheduleStack).observe(firstCase);
scheduleStack();

const aboutSection=document.querySelector('.about');
const aboutSticky=aboutSection?.querySelector('.about-sticky');
const aboutScenes=[...document.querySelectorAll('.about-scene')];
let aboutFrame;
let lastAboutScene=-1;
let aboutSizeDirty=true;
function updateAbout(){
 aboutFrame=undefined;
 if(!aboutSection)return;
 const viewportHeight=innerHeight/pageScale();
 const bounds=aboutSection.getBoundingClientRect();
 const pinTop=parseFloat(getComputedStyle(aboutSticky).top)*pageScale();
 const active=Math.min(aboutScenes.length-1,bounds.top<=pinTop-550?1:0);
 if(aboutSizeDirty){
  const canvasWidth=Math.min(aboutSection.clientWidth,Math.max(280,viewportHeight-64)*1440/760);
  const scale=canvasWidth/1440;
  aboutSection.style.setProperty('--about-width',`${canvasWidth}px`);
  aboutSection.style.setProperty('--about-scale',String(scale));
  aboutSection.style.setProperty('--about-static-height',`${(aboutScenes.length*760+124)*scale}px`);
  aboutSizeDirty=false;
 }
 if(active===lastAboutScene)return;
 lastAboutScene=active;
 aboutScenes.forEach((scene,index)=>{
  scene.classList.toggle('is-active',index===active);
  scene.classList.toggle('is-before',index<active);
  scene.setAttribute('aria-hidden',String(!reduced.matches&&index!==active));
 });
}
function scheduleAbout(){if(!aboutFrame)aboutFrame=requestAnimationFrame(updateAbout);}
window.addEventListener('scroll',scheduleAbout,{passive:true});
function resizeAbout(){aboutSizeDirty=true;scheduleAbout();}
window.addEventListener('resize',resizeAbout);
if(aboutSection)new ResizeObserver(resizeAbout).observe(aboutSection);
reduced.addEventListener('change',()=>{lastAboutScene=-1;resizeAbout();});
scheduleAbout();

const footerAvatar=document.querySelector('.footer-avatar');
let avatarHovered=false;
const wantsAvatarMotion=()=>!reduced.matches&&(avatarHovered||footerAvatar.matches(':focus-visible'));
function startAvatarMotion(){if(wantsAvatarMotion())footerAvatar.classList.add('is-grooving');}
footerAvatar.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;avatarHovered=true;startAvatarMotion();});
footerAvatar.addEventListener('pointerleave',()=>{avatarHovered=false;});
footerAvatar.addEventListener('pointercancel',()=>{avatarHovered=false;});
footerAvatar.addEventListener('focus',startAvatarMotion);
// Complete the current loop on exit, then stop at the identical neutral frame.
footerAvatar.querySelector('.footer-portrait').addEventListener('animationiteration',event=>{
 if(event.animationName==='footer-head-groove'&&!wantsAvatarMotion())footerAvatar.classList.remove('is-grooving');
});
reduced.addEventListener('change',()=>{
 if(reduced.matches)footerAvatar.classList.remove('is-grooving');
 else startAvatarMotion();
});

document.documentElement.classList.remove('light');
const dialog=document.querySelector('dialog');let opener,archiveViewer;
const closeDialog=()=>dialog.close();
dialog.addEventListener('close',()=>{archiveViewer?.destroy();archiveViewer=undefined;dialog.classList.remove('archive-dialog');document.body.style.overflow='';opener?.focus({preventScroll:true});});
document.querySelector('.close-button').addEventListener('click',closeDialog);dialog.addEventListener('cancel',()=>{document.body.style.overflow='';});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
document.querySelectorAll('[data-open-project]').forEach(button=>button.addEventListener('click',()=>{
 opener=button;const id=button.dataset.openProject;if(id==='sovcombank'){location.href='cases/sovcombank.html';return;}const body=document.querySelector('#dialog-body');body.replaceChildren();
 document.querySelector('#dialog-title').textContent=id==='archive'?'Концепты и старые проекты':id==='designers'?'Дизайнерс':'Совкомбанк';
 if(id==='archive'){
  dialog.classList.add('archive-dialog');archiveViewer=new ArchiveGallery(body);
 }else{
  const section=document.getElementById(id);const copy=section.querySelector('.description').cloneNode(true);copy.className='dialog-copy';body.append(copy);
  const list=document.createElement('div');list.className='dialog-gallery';section.querySelectorAll('.slide:not([data-clone])').forEach(slide=>list.append(slide.cloneNode(true)));body.append(list);
 }
 dialog.showModal();document.body.style.overflow='hidden';
 requestAnimationFrame(()=>{
  if(archiveViewer){archiveViewer.resize();archiveViewer.viewport.focus({preventScroll:true});return;}
  body.querySelectorAll('.slide').forEach(slide=>{const width=parseFloat(slide.style.getPropertyValue('--slide-width'));slide.style.setProperty('--art-scale',Math.min(1,(body.clientWidth-4)/width));});
 });
}));
