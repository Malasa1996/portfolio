const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const items=[...document.querySelectorAll('.reveal')];
if(reduced){items.forEach(item=>item.classList.add('visible'));}
else{const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}},{rootMargin:'0px 0px -10% 0px',threshold:.08});items.forEach(item=>observer.observe(item));}
