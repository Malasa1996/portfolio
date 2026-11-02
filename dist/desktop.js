const desktopLayout=matchMedia('(min-width:1101px)');
function pageScale(){return desktopLayout.matches?document.documentElement.clientWidth/1440:1;}
function updateDesktopScale(){
 document.documentElement.style.setProperty('--desktop-scale',String(pageScale()));
}
updateDesktopScale();
window.addEventListener('resize',updateDesktopScale);
