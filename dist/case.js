const progress=document.querySelector('.reading-progress');
let progressFrame;
function updateReading(){
 progressFrame=undefined;
 const range=document.documentElement.scrollHeight-innerHeight;
 progress.style.setProperty('--reading',`${range>0?Math.min(100,Math.max(0,scrollY/range*100)):0}%`);
}
function scheduleReading(){if(!progressFrame)progressFrame=requestAnimationFrame(updateReading);}
addEventListener('scroll',scheduleReading,{passive:true});
addEventListener('resize',scheduleReading);updateReading();
const sections=[...document.querySelectorAll('.case-section')];
const links=[...document.querySelectorAll('.case-nav a')];
// Observe the same reading band for each section, including taller image sections.
const navObserver=new IntersectionObserver(()=>{
 const band=innerHeight*.35;
 const current=[...sections].reverse().find(section=>section.getBoundingClientRect().top<=band);
 if(!current)return;
 const index=sections.indexOf(current);
 const activeLink=[...links].reverse().find(link=>sections.findIndex(section=>`#${section.id}`===link.hash)<=index);
 links.forEach(link=>{const active=link===activeLink;link.classList.toggle('is-current',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
},{threshold:0,rootMargin:'-10% 0px -60% 0px'});
sections.forEach(section=>navObserver.observe(section));
const lightbox=document.querySelector('.image-dialog');
let imageOpener;
function closeImage(){lightbox.close();imageOpener?.focus({preventScroll:true});}
document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{
 const image=button.querySelector('img');imageOpener=button;
 lightbox.querySelector('img').src=image.currentSrc||image.src;
 lightbox.querySelector('img').alt=image.alt;
 lightbox.querySelector('p').textContent=button.parentElement.querySelector('figcaption').textContent;
 lightbox.showModal();
}));
lightbox.querySelector('button').addEventListener('click',closeImage);
lightbox.addEventListener('click',event=>{if(event.target!==lightbox)return;const r=lightbox.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeImage();});
