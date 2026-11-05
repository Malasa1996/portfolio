// Decorative spoiler. It never contains or toggles confidential text or logos.
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('.nda-spoiler').forEach(button=>{
  const canvas=button.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const pad=18, tau=Math.PI*2;
  let width=0,height=0,particles=[],frame=0,last=0,visible=false,color='',pointer=null;
  const impulses=[];
  // A deterministic distribution avoids a visual jump during layout scaling.
  let seed=3719;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function resize(){
   width=button.clientWidth;height=button.clientHeight;
   const scale=Math.min(2,devicePixelRatio*(window.pageScale?.()||1));
   canvas.width=Math.round((width+pad*2)*scale);
   canvas.height=Math.round((height+pad*2)*scale);
   ctx.setTransform(scale,0,0,scale,0,0);
   color=getComputedStyle(button).color;
   seed=3719;
   particles=Array.from({length:Math.round(width*height/11)},()=>({
    x:random()*width,y:3+random()*(height-6),r:.35+random()*.55,
    phase:random()*tau,speed:.45+random()*.8,alpha:.2+random()*.65
   }));
   draw(performance.now());
   button.classList.add('is-ready');
  }
  function draw(now){
   ctx.clearRect(0,0,width+pad*2,height+pad*2);
   ctx.fillStyle=color;
   const time=reduced.matches?0:now/1000;
   while(impulses.length&&now-impulses[0].time>1100)impulses.shift();
   for(const p of particles){
    let x=p.x+Math.sin(time*p.speed+p.phase)*1.6;
    let y=p.y+Math.cos(time*p.speed*.8+p.phase)*1.2;
    let dx=0,dy=0;
    if(!reduced.matches){
     for(const hit of impulses){
      const age=(now-hit.time)/1100;
      const vx=p.x-hit.x,vy=(p.y-hit.y)*1.5;
      const distance=Math.hypot(vx,vy)||1;
      const envelope=Math.sin(Math.PI*Math.min(1,age))*Math.exp(-age*2.4);
      const force=24*envelope*Math.exp(-distance/110);
      dx+=vx/distance*force;dy+=vy/distance*force;
     }
     if(pointer){
      const vx=x-pointer.x,vy=y-pointer.y,distance=Math.hypot(vx,vy)||1;
      const force=2.5*Math.max(0,1-distance/48);
      dx+=vx/distance*force;dy+=vy/distance*force;
     }
    }
    // Dispersal stays small, with no reveal state and no flash at the boundary.
    x+=Math.max(-13,Math.min(13,dx));y+=Math.max(-11,Math.min(11,dy));
    ctx.globalAlpha=p.alpha*(.76+.24*Math.sin(time*p.speed*1.6+p.phase));
    ctx.beginPath();ctx.arc(x+pad,y+pad,p.r,0,tau);ctx.fill();
   }
   ctx.globalAlpha=1;
  }
  function tick(now){
   frame=0;
   if(!visible||document.hidden)return;
   if(now-last>=(impulses.length?16:32)){draw(now);last=now;}
   if(!reduced.matches)frame=requestAnimationFrame(tick);
  }
  function sync(){
   cancelAnimationFrame(frame);frame=0;
   if(visible&&!document.hidden){draw(performance.now());if(!reduced.matches)frame=requestAnimationFrame(tick);}
  }
  function localPoint(event){
   const rect=button.getBoundingClientRect();
   return {x:(event.clientX-rect.left)*width/rect.width,y:(event.clientY-rect.top)*height/rect.height};
  }
  button.addEventListener('pointermove',event=>{if(event.pointerType==='mouse')pointer=localPoint(event);});
  button.addEventListener('pointerleave',()=>{pointer=null;});
  button.addEventListener('click',event=>{
   if(reduced.matches)return;
   const point=event.detail?localPoint(event):{x:width/2,y:height/2};
   impulses.push({...point,time:performance.now()});
   if(impulses.length>3)impulses.shift();
   sync();
  });
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(button);
  new ResizeObserver(resize).observe(button);
  window.addEventListener('resize',resize,{passive:true});
  new MutationObserver(()=>{color=getComputedStyle(button).color;sync();}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
  resize();
 });
})();
