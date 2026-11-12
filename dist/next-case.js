document.querySelectorAll('a.next-case').forEach(link=>{
  const label=document.createElement('span');
  label.textContent='Следующий кейс';
  const arrow=document.createElement('img');
  arrow.src='/assets/sovcombank-case/next-arrow.svg';
  arrow.alt='';
  arrow.width=20;
  arrow.height=20;
  link.replaceChildren(label,arrow);
});
