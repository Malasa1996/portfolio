const scaleCase = () => {
  const scale = window.innerWidth > 1100 ? document.documentElement.clientWidth / 1440 : 1;
  document.documentElement.style.setProperty('--case-scale', String(scale));
};
scaleCase();
window.addEventListener('resize', scaleCase, {passive:true});
