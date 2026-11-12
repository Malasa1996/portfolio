const headerMotionPreference=matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.brand,.portfolio-brand').forEach(brand=>{
  const portrait=brand.querySelector('.header-portrait');
  if(!portrait)return;
  let hovered=false;
  const wantsMotion=()=>!headerMotionPreference.matches&&(hovered||brand.matches(':focus-visible'));
  const start=()=>{if(wantsMotion())brand.classList.add('is-grooving')};
  brand.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;hovered=true;start()});
  brand.addEventListener('pointerleave',()=>{hovered=false});
  brand.addEventListener('pointercancel',()=>{hovered=false});
  brand.addEventListener('focus',start);
  portrait.addEventListener('animationiteration',event=>{
    if(event.animationName==='header-head-groove'&&!wantsMotion())brand.classList.remove('is-grooving');
  });
  headerMotionPreference.addEventListener('change',()=>{
    if(headerMotionPreference.matches)brand.classList.remove('is-grooving');
    else start();
  });
});

const scrollHeader=document.querySelector('.portfolio-header');
if(scrollHeader){
  const threshold=14;
  let lastY=Math.max(0,window.scrollY);
  let direction=0;
  let directionStart=lastY;
  let frame=0;
  const updateHeader=()=>{
    frame=0;
    const y=Math.max(0,window.scrollY);
    const delta=y-lastY;
    if(y<=8){
      scrollHeader.classList.remove('is-scroll-hidden');
      direction=0;
      directionStart=y;
    }else if(delta){
      const nextDirection=Math.sign(delta);
      if(nextDirection!==direction){
        direction=nextDirection;
        directionStart=lastY;
      }
      if(Math.abs(y-directionStart)>=threshold){
        if(direction<0||scrollHeader.contains(document.activeElement))scrollHeader.classList.remove('is-scroll-hidden');
        else scrollHeader.classList.add('is-scroll-hidden');
        directionStart=y;
      }
    }
    lastY=y;
  };
  window.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(updateHeader)},{passive:true});
  scrollHeader.addEventListener('focusin',()=>scrollHeader.classList.remove('is-scroll-hidden'));
}
