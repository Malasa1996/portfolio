const deskResearchDialog = document.querySelector('.desk-research-dialog');
const deskResearchOpener = document.querySelector('[data-desk-research-open]');
const pageRoot = document.documentElement;
let previousOverflow;
let previousScrollbarGutter;

deskResearchOpener.addEventListener('click', event => {
  event.preventDefault();
  previousOverflow = pageRoot.style.overflow;
  previousScrollbarGutter = pageRoot.style.scrollbarGutter;
  pageRoot.style.scrollbarGutter = 'stable';
  pageRoot.style.overflow = 'hidden';
  deskResearchDialog.showModal();
});

deskResearchDialog.querySelector('.desk-research-close').addEventListener('click', () => {
  deskResearchDialog.close();
});

deskResearchDialog.addEventListener('click', event => {
  if (event.target === deskResearchDialog) deskResearchDialog.close();
});

deskResearchDialog.addEventListener('close', () => {
  pageRoot.style.overflow = previousOverflow;
  pageRoot.style.scrollbarGutter = previousScrollbarGutter;
  deskResearchOpener.focus({ preventScroll: true });
});
