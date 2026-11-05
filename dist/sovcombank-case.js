const scaleCase = () => {
  const scale = window.innerWidth > 900 ? Math.max(.75, Math.min(1.35, window.innerWidth / 1440)) : 1;
  document.documentElement.style.setProperty('--case-scale', String(scale));
};
scaleCase();
window.addEventListener('resize', scaleCase, {passive:true});
