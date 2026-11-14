// Painter: molefrog/spoiled (Unlicense). This adapter keeps the existing button and canvas.
(()=>{
 const button=document.querySelector('#sovcombank .nda-spoiler');
 if(!button)return;
 const canvas=button.querySelector('canvas');
 const ctx=canvas.getContext('2d');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let painter=null,visible=false,raf=0,last=0;
 let hiddenAt=performance.now()-600,revealAt=Infinity;
 const fade=2,fps=1000/24;
 const scriptUrl=document.currentScript.src;
 const isRevealed=()=>button.classList.contains('is-revealed');
 const properties=(t)=>({
  get(name){
   if(name==='--t')return String(t);
   if(name==='--t-stop')return Number.isFinite(revealAt)?String((revealAt-hiddenAt)/1000):undefined;
   if(name==='--fade')return String(fade);
   if(name==='--gap')return '1px 1px';
   if(name==='--accent')return '0 0% 80%';
   if(name==='--words')return 'false';
   if(name==='--density')return '0.12';
  }
 });
 function paint(now){
  if(!painter||!ctx)return;
  painter.paint(ctx,{width:canvas.width,height:canvas.height},properties((now-hiddenAt)/1000));
  button.classList.add('is-ready');
 }
 function tick(now){
  raf=0;
  if(!visible||document.hidden||!painter)return;
  if(isRevealed()&&now-revealAt>=fade*1000){ctx.clearRect(0,0,canvas.width,canvas.height);return;}
  if(now-last>=fps){paint(now);last=now;}
  if(!reduced.matches)raf=requestAnimationFrame(tick);
 }
 function sync(){
  cancelAnimationFrame(raf);raf=0;
  if(!visible||document.hidden||!painter)return;
  const now=performance.now();
  if(reduced.matches){
   if(isRevealed())ctx.clearRect(0,0,canvas.width,canvas.height);
   else paint(hiddenAt+600);
  }else raf=requestAnimationFrame(tick);
 }
 function resize(){
  if(!ctx)return;
  const dpr=Math.max(1,devicePixelRatio);
  canvas.width=Math.round(button.clientWidth*dpr);
  canvas.height=Math.round(button.clientHeight*dpr);
  sync();
 }
 button.addEventListener('click',event=>{
  event.stopPropagation();
  const revealed=button.classList.toggle('is-revealed');
  button.setAttribute('aria-pressed',String(revealed));
  button.setAttribute('aria-label',revealed?'Скрыть название банка':'Раскрыть название банка');
  const now=performance.now();
  if(revealed)revealAt=now;
  else{hiddenAt=now;revealAt=Infinity;}
  sync();
 });
 if(!ctx)return;
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(button);
 new ResizeObserver(resize).observe(button);
 document.addEventListener('visibilitychange',sync);
 reduced.addEventListener('change',sync);
 import(new URL('./vendor/spoiled-worklet.js',scriptUrl)).then(module=>{
  painter=new module.SpoilerPainterWorklet();
  resize();
 }).catch(()=>{canvas.style.display='none';});
})();
