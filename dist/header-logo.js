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
