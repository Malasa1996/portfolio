document.body.classList.remove('light');
const portfolioCv=document.querySelector('.portfolio-cv-dialog');
let portfolioCvOpener;
document.querySelectorAll('[data-portfolio-cv]').forEach(button=>button.addEventListener('click',()=>{portfolioCvOpener=button;portfolioCv?.showModal();}));
portfolioCv?.querySelector('.portfolio-cv-close')?.addEventListener('click',()=>portfolioCv.close());
portfolioCv?.addEventListener('close',()=>portfolioCvOpener?.focus({preventScroll:true}));
portfolioCv?.addEventListener('click',event=>{if(event.target===portfolioCv)portfolioCv.close();});
