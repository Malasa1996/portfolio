/* Matter.js 0.20.0: local DOM labels rendered from rigid-body positions. */
(() => {
 const stage=document.querySelector('.stickers');
 if(!stage||!window.Matter)return;
 const {Engine,Bodies,Body,Composite,Sleeping}=Matter;
 const labels=[...stage.querySelectorAll('.sticker')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const engine=Engine.create({enableSleeping:true,positionIterations:10,velocityIterations:8});
 engine.gravity.y=1.7;
 let items=[],frame=0,lastTime=0,accumulator=0,width=0,height=0,visible=false;
 const STEP=1000/60;
 const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));

 function paint(){
  for(const item of items){
   const {body,node,w,h}=item;
   node.style.transform=`translate(${body.position.x-w/2}px,${body.position.y-h/2}px) rotate(${body.angle}rad)`;
   node.classList.toggle('is-moving',!body.isSleeping);
  }
 }

 function rebuild(){
  const nextWidth=stage.clientWidth,nextHeight=stage.clientHeight;
  if(nextWidth===width&&nextHeight===height&&items.length)return;
  cancelAnimationFrame(frame);frame=0;lastTime=0;accumulator=0;
  width=nextWidth;height=nextHeight;
  stage.classList.remove('is-physical');
  for(const node of labels){node.style.removeProperty('transform');node.classList.remove('is-moving');}
  Composite.clear(engine.world,false);Engine.clear(engine);
  const mobile=width<760;
  items=labels.map((node,i)=>{
   const w=node.offsetWidth,h=node.offsetHeight;
   const style=getComputedStyle(node);
   const matrix=new DOMMatrixReadOnly(style.transform==='none'?undefined:style.transform);
   const angle=Math.atan2(matrix.b,matrix.a);
   const rotatedWidth=Math.abs(Math.cos(angle))*w+Math.abs(Math.sin(angle))*h;
   let x=parseFloat(style.left)+w/2;
   let y=height-parseFloat(style.bottom)-h/2;
   if(mobile){
    const columns=width<480?3:5;
    x=(i%columns+.5)*width/columns+(i%2?6:-6);
    y=height-30-Math.floor(i/columns)*49;
   }
   x=clamp(x,rotatedWidth/2+4,width-rotatedWidth/2-4);
   y=clamp(y,h/2+4,height-h/2-3);
   const options={angle,restitution:.57,friction:.5,frictionStatic:.8,frictionAir:.014,density:.002,sleepThreshold:55,label:node.textContent};
   const body=node.classList.contains('yellow')&&Math.abs(w-h)<5
    ?Bodies.circle(x,y,h/2,options)
    :Bodies.rectangle(x,y,w,h,{...options,chamfer:{radius:Math.min(20,h*.25)}});
   return {body,node,w,h};
  });
  const wall={isStatic:true,restitution:.45,friction:.65};
  Composite.add(engine.world,[
   ...items.map(item=>item.body),
   Bodies.rectangle(width/2,height+40,width+160,80,wall),
   Bodies.rectangle(-40,height/2,80,height+160,wall),
   Bodies.rectangle(width+40,height/2,80,height+160,wall),
   Bodies.rectangle(width/2,-40,width+160,80,wall)
  ]);
  // Small screens get a settled pile rather than the clipped desktop artwork.
  if(mobile)for(let step=0;step<240;step++)Engine.update(engine,STEP);
  for(const item of items)Sleeping.set(item.body,true);
  stage.classList.add('is-physical');paint();
 }

 function tick(now){
  frame=0;
  if(!visible||document.hidden){lastTime=0;return;}
  accumulator+=lastTime?Math.min(now-lastTime,50):STEP;
  lastTime=now;
  while(accumulator>=STEP){Engine.update(engine,STEP);accumulator-=STEP;}
  paint();
  if(items.some(item=>!item.body.isSleeping))frame=requestAnimationFrame(tick);
  else lastTime=0;
 }

 function start(){if(!frame&&visible&&!document.hidden&&items.some(item=>!item.body.isSleeping))frame=requestAnimationFrame(tick);}

 function toss(item,event){
  if(!item)return;
  const {body,node,w}=item;
  const rect=node.getBoundingClientRect();
  const offset=event.detail?clamp((event.clientX-(rect.left+rect.width/2))/(w/2),-1,1):.25;
  Sleeping.set(body,false);
  Body.setVelocity(body,{
   x:clamp(body.velocity.x*.3-offset*4+(Math.random()-.5)*2,-6,6),
   y:reduced.matches?-3:-12-Math.random()*3
  });
  Body.setAngularVelocity(body,reduced.matches ? .008 : -offset*.11+(Math.random()-.5)*.055);
  start();
 }

 labels.forEach(node=>node.addEventListener('click',event=>toss(items.find(item=>item.node===node),event)));
 new ResizeObserver(rebuild).observe(stage);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();},{threshold:0}).observe(stage);
 document.addEventListener('visibilitychange',()=>{lastTime=0;if(!document.hidden)start();});
 document.fonts.ready.then(()=>{width=0;rebuild();});
 rebuild();
})();
