const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const SLIDE_DURATION=15000;
const galleries=[...document.querySelectorAll('.gallery')];

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
  new IntersectionObserver(entries=>{this.visible=entries[0].intersectionRatio>.2;},{threshold:[0,.2,.5]}).observe(element);
  new ResizeObserver(()=>this.align()).observe(element);
  this.align();this.update();
 }
 closestSlide(){
  const bounds=this.element.getBoundingClientRect();
  const center=bounds.left+bounds.width/2;
  return this.slides.reduce((best,node)=>Math.abs(node.getBoundingClientRect().left+node.getBoundingClientRect().width/2-center)<Math.abs(best.getBoundingClientRect().left+best.getBoundingClientRect().width/2-center)?node:best);
 }
 beginDrag(event){
  if(!event.isPrimary||event.button!==0)return;
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
   if(Math.abs(distance)<6||Math.abs(distance)<Math.abs(vertical)*1.15)return;
   pointer.moved=true;
   this.element.classList.add('is-dragging');
   this.element.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
  const elapsed=event.timeStamp-pointer.lastTime;
  if(elapsed>0)pointer.velocity=(event.clientX-pointer.lastX)/elapsed;
  pointer.lastX=event.clientX;pointer.lastTime=event.timeStamp;
  const scale=this.element.getBoundingClientRect().width/this.element.offsetWidth;
  this.element.scrollLeft=pointer.scroll-distance/scale;
 }
 endDrag(event){
  const pointer=this.pointer;
  if(!pointer||pointer.id!==event.pointerId)return;
  this.pointer=null;this.dragging=false;
  let target=this.closestSlide();
  if(pointer.moved){
   const distance=pointer.lastX-pointer.startX;
   const speed=event.timeStamp-pointer.lastTime<120?pointer.velocity:0;
   const threshold=Math.min(70,pointer.startSlide.getBoundingClientRect().width*.14);
   if(target===pointer.startSlide&&(Math.abs(distance)>threshold||Math.abs(speed)>.5)){
    const direction=Math.sign(distance||speed);
    target=this.slides[Math.max(0,Math.min(this.slides.length-1,this.slides.indexOf(target)-direction))];
   }
   this.elapsed=0;
  }
  this.element.classList.remove('is-dragging');
  if(this.element.hasPointerCapture(pointer.id))this.element.releasePointerCapture(pointer.id);
  this.index=Number(target.dataset.slideIndex);this.navigating=true;this.update();
  this.center(target,'smooth');
  this.settleTimer=setTimeout(()=>this.settle(),650);
 }
 center(slide,behavior='instant'){
  const bounds=this.element.getBoundingClientRect();
  const scale=bounds.width/this.element.offsetWidth;
  const target=this.element.scrollLeft+(slide.getBoundingClientRect().left+slide.getBoundingClientRect().width/2-(bounds.left+bounds.width/2))/scale;
  this.element.scrollTo({left:target,behavior:reduced.matches?'instant':behavior});
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
  if(this.dragging)return;
  clearTimeout(this.settleTimer);
  const closest=this.closestSlide();
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
 const top=Math.min(24,window.innerHeight-firstCase.offsetHeight-24);
 firstCase.style.setProperty('--stack-top',top+'px');
 const overlap=Math.max(0,Math.min(1,(window.innerHeight-nextCase.getBoundingClientRect().top)/(window.innerHeight-Math.max(24,top))));
 firstCase.style.setProperty('--stack-scale',String(1-overlap*.035));
 firstCase.style.setProperty('--stack-shade',String(overlap*.18));
}
function scheduleStack(){if(!stackFrame)stackFrame=requestAnimationFrame(updateStack);}
window.addEventListener('scroll',scheduleStack,{passive:true});
window.addEventListener('resize',scheduleStack);
new ResizeObserver(scheduleStack).observe(firstCase);
scheduleStack();

const footerAvatar=document.querySelector('.footer-avatar');
let avatarHovered=false;
const wantsAvatarMotion=()=>!reduced.matches&&(avatarHovered||footerAvatar.matches(':focus-visible'));
function startAvatarMotion(){if(wantsAvatarMotion())footerAvatar.classList.add('is-grooving');}
footerAvatar.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;avatarHovered=true;startAvatarMotion();});
footerAvatar.addEventListener('pointerleave',()=>{avatarHovered=false;});
footerAvatar.addEventListener('pointercancel',()=>{avatarHovered=false;});
footerAvatar.addEventListener('focus',startAvatarMotion);
// Complete the current loop on exit, then stop at the identical neutral frame.
footerAvatar.querySelector('img').addEventListener('animationiteration',event=>{
 if(event.animationName==='footer-head-groove'&&!wantsAvatarMotion())footerAvatar.classList.remove('is-grooving');
});
reduced.addEventListener('change',()=>{
 if(reduced.matches)footerAvatar.classList.remove('is-grooving');
 else startAvatarMotion();
});

const theme=document.querySelector('.theme-toggle');let saved;try{saved=localStorage.getItem('portfolio-theme');}catch{}
function setTheme(light){document.documentElement.classList.toggle('light',light);theme.setAttribute('aria-pressed',String(light));theme.setAttribute('aria-label',light?'Включить тёмную тему':'Включить светлую тему');}
setTheme(saved==='light');theme.addEventListener('click',()=>{const light=!document.documentElement.classList.contains('light');setTheme(light);try{localStorage.setItem('portfolio-theme',light?'light':'dark');}catch{}});
const dialog=document.querySelector('dialog');let opener;
const closeDialog=()=>{dialog.close();document.body.style.overflow='';opener?.focus();};
document.querySelector('.close-button').addEventListener('click',closeDialog);dialog.addEventListener('cancel',()=>{document.body.style.overflow='';});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
document.querySelectorAll('[data-open-project]').forEach(button=>button.addEventListener('click',()=>{opener=button;const id=button.dataset.openProject;const body=document.querySelector('#dialog-body');body.replaceChildren();document.querySelector('#dialog-title').textContent=id==='archive'?'Концепты и старые проекты':id==='designers'?'Дизайнерс':'Совкомбанк';if(id==='archive'){const p=document.createElement('p');p.className='dialog-copy';p.textContent='Больше проектов и подробности о работе — по запросу.';body.append(p);const a=document.createElement('a');a.className='dialog-contact';a.href='https://t.me/malasa1308';a.target='_blank';a.rel='noopener noreferrer';a.textContent='Написать в Telegram ↗';body.append(a);}else{const section=document.getElementById(id);const copy=section.querySelector('.description').cloneNode(true);copy.className='dialog-copy';body.append(copy);const list=document.createElement('div');list.className='dialog-gallery';section.querySelectorAll('.slide:not([data-clone])').forEach(slide=>list.append(slide.cloneNode(true)));body.append(list);}dialog.showModal();document.body.style.overflow='hidden';requestAnimationFrame(()=>{body.querySelectorAll('.slide').forEach(slide=>{const width=parseFloat(slide.style.getPropertyValue('--slide-width'));slide.style.setProperty('--art-scale',Math.min(1,(body.clientWidth-4)/width));});});}));
document.querySelectorAll('[data-cv]').forEach(button=>button.addEventListener('click',()=>{opener=button;document.querySelector('#dialog-title').textContent='Резюме';const body=document.querySelector('#dialog-body');body.innerHTML='<p class="dialog-copy">Актуальное резюме можно запросить по почте или в Telegram.</p><a class="dialog-contact" href="mailto:malasa1308@gmail.com?subject=Запрос%20резюме">malasa1308@gmail.com ↗</a><br><a class="dialog-contact" href="https://t.me/malasa1308" target="_blank" rel="noopener noreferrer">Написать в Telegram ↗</a>';dialog.showModal();document.body.style.overflow='hidden';}));
