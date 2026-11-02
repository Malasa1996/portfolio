class ArchiveGallery {
 constructor(container){
  this.abort=new AbortController();const signal=this.abort.signal;
  this.viewport=document.createElement('div');this.viewport.className='archive-viewport';this.viewport.tabIndex=0;
  this.viewport.setAttribute('role','region');this.viewport.setAttribute('aria-label','Архив проектов — горизонтальная галерея');
  this.track=document.createElement('div');this.track.className='archive-track';
  this.track.append(document.getElementById('archive-projects').content.cloneNode(true));
  this.viewport.append(this.track);container.append(this.viewport);
  this.items=[...this.track.children];
  const toolbar=document.createElement('div');toolbar.className='archive-toolbar';
  toolbar.innerHTML='<p class="archive-counter" role="status" aria-live="polite"></p><div class="archive-arrows"><button type="button" aria-label="Предыдущий проект">←</button><button type="button" aria-label="Следующий проект">→</button></div>';
  container.append(toolbar);this.counter=toolbar.querySelector('.archive-counter');
  [this.prev,this.next]=toolbar.querySelectorAll('button');
  this.prev.addEventListener('click',()=>this.go(-1),{signal});this.next.addEventListener('click',()=>this.go(1),{signal});
  this.viewport.addEventListener('keydown',event=>{
   if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
    event.preventDefault();
    if(event.key==='Home'||event.key==='End')this.to(event.key==='Home'?0:this.viewport.scrollWidth);
    else this.go(event.key==='ArrowRight'?1:-1);
   }
  },{signal});
  this.viewport.addEventListener('scroll',()=>this.scheduleUpdate(),{passive:true,signal});
  this.viewport.addEventListener('wheel',event=>this.wheel(event),{passive:false,signal});
  this.viewport.addEventListener('pointerdown',event=>this.begin(event),{signal});
  this.viewport.addEventListener('pointermove',event=>this.move(event),{signal});
  this.viewport.addEventListener('pointerup',event=>this.end(event),{signal});
  this.viewport.addEventListener('pointercancel',event=>this.end(event),{signal});
  this.viewport.addEventListener('lostpointercapture',event=>this.end(event),{signal});
  this.viewport.addEventListener('dragstart',event=>event.preventDefault(),{signal});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.viewport);
 }
 resize(){
  this.viewport.style.setProperty('--archive-width',`${this.viewport.clientWidth}px`);
  this.viewport.style.setProperty('--archive-height',`${Math.max(80,this.viewport.clientHeight-24)}px`);
  this.scheduleUpdate();
 }
 closest(){
  if(this.viewport.scrollLeft>=this.viewport.scrollWidth-this.viewport.clientWidth-4)return this.items.length-1;
  const bounds=this.viewport.getBoundingClientRect(),center=bounds.left+bounds.width/2;
  let best=0,distance=Infinity;
  this.items.forEach((item,index)=>{const rect=item.getBoundingClientRect(),next=Math.abs(rect.left+rect.width/2-center);if(next<distance){distance=next;best=index;}});
  return best;
 }
 scheduleUpdate(){if(!this.updateFrame)this.updateFrame=requestAnimationFrame(()=>{this.updateFrame=undefined;this.update();});}
 update(){
  this.index=this.closest();
  if(this.lastIndex!==this.index){
   this.counter.innerHTML=`<strong>${String(this.index+1).padStart(2,'0')}</strong> / ${String(this.items.length).padStart(2,'0')}`;
   this.lastIndex=this.index;
  }
  this.prev.disabled=this.viewport.scrollLeft<=1;
  this.next.disabled=this.viewport.scrollLeft>=this.viewport.scrollWidth-this.viewport.clientWidth-4;
 }
 stop(){cancelAnimationFrame(this.motion);this.motion=undefined;}
 to(requested){
  this.target=Math.max(0,Math.min(this.viewport.scrollWidth-this.viewport.clientWidth,requested));
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){this.stop();this.viewport.scrollLeft=this.target;this.scheduleUpdate();return;}
  if(this.motion)return;
  let previous=performance.now();
  const step=now=>{
   const delta=Math.min(64,now-previous);previous=now;
   const gap=this.target-this.viewport.scrollLeft;
   // Fractional page zoom can round subpixel scroll writes. Finish the last
   // few pixels explicitly instead of leaving a frame loop waiting forever.
   if(Math.abs(gap)<4){this.viewport.scrollLeft=this.target;this.motion=undefined;this.scheduleUpdate();return;}
   this.viewport.scrollLeft+=gap*(1-Math.exp(-delta/85));
   this.motion=requestAnimationFrame(step);
  };
  this.motion=requestAnimationFrame(step);
 }
 go(direction){
  const index=Math.max(0,Math.min(this.items.length-1,this.closest()+direction));
  const bounds=this.viewport.getBoundingClientRect(),rect=this.items[index].getBoundingClientRect();
  const scale=bounds.width/this.viewport.offsetWidth;
  this.to(this.viewport.scrollLeft+(rect.left+rect.width/2-bounds.left-bounds.width/2)/scale);
 }
 wheel(event){
  if(event.ctrlKey)return;
  // Native horizontal trackpad scrolling stays native. A mouse wheel moves
  // this rail horizontally while the page behind the dialog remains locked.
  if(Math.abs(event.deltaX)>Math.abs(event.deltaY)){this.stop();return;}
  event.preventDefault();
  const unit=event.deltaMode===1?16:event.deltaMode===2?this.viewport.clientWidth:1;
  this.to((this.motion?this.target:this.viewport.scrollLeft)+event.deltaY*unit);
 }
 begin(event){
  if(event.pointerType!=='mouse'||event.button!==0||!event.isPrimary)return;
  this.stop();event.preventDefault();
  this.pointer={id:event.pointerId,x:event.clientX,scroll:this.viewport.scrollLeft};
  this.viewport.setPointerCapture(event.pointerId);this.viewport.classList.add('is-dragging');
 }
 move(event){
  if(this.pointer?.id!==event.pointerId)return;
  const scale=this.viewport.getBoundingClientRect().width/this.viewport.offsetWidth;
  this.viewport.scrollLeft=this.pointer.scroll-(event.clientX-this.pointer.x)/scale;
 }
 end(event){
  if(this.pointer?.id!==event.pointerId)return;
  this.pointer=undefined;this.viewport.classList.remove('is-dragging');
  if(this.viewport.hasPointerCapture(event.pointerId))this.viewport.releasePointerCapture(event.pointerId);
  this.scheduleUpdate();
 }
 destroy(){this.stop();cancelAnimationFrame(this.updateFrame);this.resizeObserver.disconnect();this.abort.abort();}
}
