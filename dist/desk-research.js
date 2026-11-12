const deskResearchDialog = document.querySelector('.desk-research-dialog');
const deskResearchOpener = document.querySelector('[data-desk-research-open]');

deskResearchOpener.addEventListener('click', event => {
  event.preventDefault();
  deskResearchDialog.showModal();
});

deskResearchDialog.querySelector('.desk-research-close').addEventListener('click', () => {
  deskResearchDialog.close();
});

deskResearchDialog.addEventListener('click', event => {
  if (event.target === deskResearchDialog) deskResearchDialog.close();
});

deskResearchDialog.addEventListener('close', () => {
  deskResearchOpener.focus({ preventScroll: true });
});
