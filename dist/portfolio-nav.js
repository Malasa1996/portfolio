const portfolioTheme=document.querySelector('[data-portfolio-theme]');
let portfolioThemeSaved;
try{portfolioThemeSaved=localStorage.getItem('portfolio-theme');}catch{}
function applyPortfolioTheme(light){
 document.body.classList.toggle('light',light);
 if(portfolioTheme){portfolioTheme.setAttribute('aria-pressed',String(light));portfolioTheme.setAttribute('aria-label',light?'Включить тёмную тему':'Включить светлую тему');}
}
applyPortfolioTheme(portfolioThemeSaved==='light');
portfolioTheme?.addEventListener('click',()=>{
 const light=!document.body.classList.contains('light');applyPortfolioTheme(light);
 try{localStorage.setItem('portfolio-theme',light?'light':'dark');}catch{}
});
const portfolioCv=document.querySelector('.portfolio-cv-dialog');
let portfolioCvOpener;
document.querySelectorAll('[data-portfolio-cv]').forEach(button=>button.addEventListener('click',()=>{portfolioCvOpener=button;portfolioCv?.showModal();}));
portfolioCv?.querySelector('.portfolio-cv-close')?.addEventListener('click',()=>portfolioCv.close());
portfolioCv?.addEventListener('close',()=>portfolioCvOpener?.focus({preventScroll:true}));
portfolioCv?.addEventListener('click',event=>{if(event.target===portfolioCv)portfolioCv.close();});
