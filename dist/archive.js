class ArchiveGallery {
 constructor(container){
  this.abort=new AbortController();const signal=this.abort.signal;
  this.index=0;this.windowStart=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
  this.viewport=document.createElement('div');this.viewport.className='archive-viewport';this.viewport.tabIndex=0;
  this.viewport.setAttribute('role','region');this.viewport.setAttribute('aria-label','Старые проекты. Листайте влево и вправо или используйте стрелки клавиатуры');
  this.track=document.createElement('div');this.track.className='archive-track';
  this.track.append(document.getElementById('archive-projects').content.cloneNode(true));
  this.viewport.append(this.track);container.append(this.viewport);this.items=[...this.track.children];
  this.items[0].querySelector('img').loading='eager';
  this.status=document.createElement('p');this.status.className='visually-hidden';this.status.setAttribute('role','status');this.status.setAttribute('aria-live','polite');
  this.pagination=document.createElement('nav');this.pagination.className='archive-pagination';this.pagination.setAttribute('aria-label','Переключение архивных проектов');
  this.dotWindow=document.createElement('div');this.dotWindow.className='archive-dots-window';
  this.dotTrack=document.createElement('div');this.dotTrack.className='archive-dots-track';
  this.visibleDots=Math.min(5,this.items.length);this.dotWindow.style.width=(this.visibleDots*18)+'px';
  this.dots=this.items.map((item,index)=>{
   const button=document.createElement('button');button.type='button';button.className='archive-dot';
   button.setAttribute('aria-label','Показать проект '+(index+1)+' из '+this.items.length+': '+item.querySelector('img').alt);
   button.append(document.createElement('span'));button.addEventListener('click',()=>this.navigate(index),{signal});
   this.dotTrack.append(button);return button;
  });
  this.dotWindow.append(this.dotTrack);this.pagination.append(this.dotWindow);container.append(this.pagination,this.status);
  this.closeButton=container.closest('dialog').querySelector('.close-button');this.closeContent=[...this.closeButton.childNodes];
  const closeIcon=document.createElement('img');closeIcon.src='assets/archive-popup/close.svg';closeIcon.alt='';closeIcon.width=24;closeIcon.height=24;
  this.closeButton.replaceChildren(closeIcon);
  const keydown=event=>{
   if(event.altKey||event.ctrlKey||event.metaKey||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();this.viewport.focus({preventScroll:true});
   if(event.key==='Home'||event.key==='End')this.navigate(event.key==='Home'?0:this.items.length-1);
   else this.go(event.key==='ArrowRight'?1:-1);
  };
  this.viewport.addEventListener('keydown',keydown,{signal});this.pagination.addEventListener('keydown',keydown,{signal});
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
  if(!this.viewport.clientWidth)return;
  const anchor=this.index;this.stop();
  const max=this.viewport.scrollWidth-this.viewport.clientWidth;
  this.positions=this.items.map(item=>Math.max(0,Math.min(max,item.offsetLeft+item.offsetWidth/2-this.viewport.clientWidth/2)));
  if(this.measured)this.viewport.scrollLeft=this.positions[anchor];
  this.measured=true;this.scheduleUpdate();
 }
 closest(){
  if(!this.positions)return 0;
  const scroll=this.viewport.scrollLeft;let best=0,distance=Infinity;
  this.positions.forEach((position,index)=>{const gap=Math.abs(position-scroll);if(gap<distance){distance=gap;best=index;}});
  return best;
 }
 scheduleUpdate(){if(!this.updateFrame)this.updateFrame=requestAnimationFrame(()=>{this.updateFrame=undefined;this.update();});}
 update(){
  this.index=this.closest();if(this.lastIndex===this.index)return;this.lastIndex=this.index;
  this.status.textContent='Проект '+(this.index+1)+' из '+this.items.length+'. '+this.items[this.index].querySelector('img').alt;
  this.windowStart=Math.max(0,Math.min(this.items.length-this.visibleDots,this.index-2));
  this.dotTrack.style.transform='translate3d('+(-this.windowStart*18)+'px,0,0)';
  this.dots.forEach((button,index)=>{
   const visible=index>=this.windowStart&&index<this.windowStart+this.visibleDots;
   const distance=Math.abs(index-this.index);let size=6;
   if(index===this.index)size=8;
   else if(distance>=3)size=3;
   else if(distance===2&&((index===this.windowStart&&this.windowStart>0)||(index===this.windowStart+this.visibleDots-1&&index<this.items.length-1)))size=4;
   button.style.setProperty('--dot-size',size+'px');button.classList.toggle('is-active',index===this.index);
   button.tabIndex=visible?0:-1;button.setAttribute('aria-hidden',String(!visible));
   if(index===this.index)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
  });
 }
 stop(){cancelAnimationFrame(this.motion);this.motion=undefined;this.targetIndex=undefined;}
 to(requested){
  this.target=Math.max(0,Math.min(this.viewport.scrollWidth-this.viewport.clientWidth,requested));
  if(this.reduced.matches){this.stop();this.viewport.scrollLeft=this.target;this.scheduleUpdate();return;}
  if(this.motion)return;
  let previous=performance.now();
  const step=now=>{
   const delta=Math.min(48,now-previous);previous=now;const gap=this.target-this.viewport.scrollLeft;
   if(Math.abs(gap)<2){this.viewport.scrollLeft=this.target;this.motion=undefined;this.targetIndex=undefined;this.scheduleUpdate();return;}
   this.viewport.scrollLeft+=gap*(1-Math.exp(-delta/100));this.motion=requestAnimationFrame(step);
  };
  this.motion=requestAnimationFrame(step);
 }
 navigate(index){
  if(!this.positions)this.resize();
  this.targetIndex=Math.max(0,Math.min(this.items.length-1,index));this.to(this.positions[this.targetIndex]);
 }
 go(direction){this.navigate((this.targetIndex??this.closest())+direction);}
 wheel(event){
  if(event.ctrlKey)return;
  if(Math.abs(event.deltaX)>Math.abs(event.deltaY)){this.stop();return;}
  event.preventDefault();this.targetIndex=undefined;
  const unit=event.deltaMode===1?16:event.deltaMode===2?this.viewport.clientWidth:1;
  this.to((this.motion?this.target:this.viewport.scrollLeft)+event.deltaY*unit);
 }
 begin(event){
  if(event.pointerType!=='mouse'||event.button!==0||!event.isPrimary)return;
  this.stop();event.preventDefault();this.viewport.focus({preventScroll:true});
  const scale=this.viewport.getBoundingClientRect().width/this.viewport.offsetWidth;
  this.pointer={id:event.pointerId,x:event.clientX,scroll:this.viewport.scrollLeft,lastX:event.clientX,time:event.timeStamp,velocity:0,scale};
  this.viewport.setPointerCapture(event.pointerId);this.viewport.classList.add('is-dragging');
 }
 move(event){
  const pointer=this.pointer;if(pointer?.id!==event.pointerId)return;
  const elapsed=Math.max(1,event.timeStamp-pointer.time);
  pointer.velocity=.45*pointer.velocity+.55*(pointer.lastX-event.clientX)/pointer.scale/elapsed;
  pointer.lastX=event.clientX;pointer.time=event.timeStamp;
  this.viewport.scrollLeft=pointer.scroll-(event.clientX-pointer.x)/pointer.scale;
 }
 end(event){
  const pointer=this.pointer;if(pointer?.id!==event.pointerId)return;
  this.pointer=undefined;this.viewport.classList.remove('is-dragging');
  if(this.viewport.hasPointerCapture(event.pointerId))this.viewport.releasePointerCapture(event.pointerId);
  // Free inertia, without a snap point pulling the image back after release.
  if(event.type==='pointerup'&&event.timeStamp-pointer.time<80&&Math.abs(pointer.velocity)>.12){
   this.to(this.viewport.scrollLeft+Math.max(-4,Math.min(4,pointer.velocity))*150);
  }
  this.scheduleUpdate();
 }
 destroy(){this.stop();cancelAnimationFrame(this.updateFrame);this.resizeObserver.disconnect();this.abort.abort();this.closeButton.replaceChildren(...this.closeContent);}
}
