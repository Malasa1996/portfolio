const pageRoot = document.documentElement;
const surveyDialog = document.querySelector('.survey-dialog');
const surveySwitch = surveyDialog.querySelector('.survey-switch');
const surveyButtons = [...surveySwitch.querySelectorAll('[data-survey-choice]')];
const surveyImages = [...surveyDialog.querySelectorAll('[data-survey-panel]')];

function setSurveyChoice(choice) {
  surveySwitch.dataset.active = choice;
  for (const button of surveyButtons) {
    const active = button.dataset.surveyChoice === choice;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  for (const image of surveyImages) {
    const active = image.dataset.surveyPanel === choice;
    image.classList.toggle('is-active', active);
    image.setAttribute('aria-hidden', String(!active));
  }
}

for (const button of surveyButtons) {
  button.addEventListener('click', () => setSurveyChoice(button.dataset.surveyChoice));
  button.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = event.key === 'ArrowLeft' ? surveyButtons[0] : surveyButtons[1];
    next.focus();
    setSurveyChoice(next.dataset.surveyChoice);
  });
}

for (const opener of document.querySelectorAll('[data-case-dialog-open]')) {
  const dialog = document.querySelector(`.${opener.dataset.caseDialogOpen}`);
  let previousOverflow;
  let previousScrollbarGutter;

  opener.addEventListener('click', event => {
    event.preventDefault();
    if (dialog === surveyDialog) {
      setSurveyChoice('survey');
      dialog.querySelector('.desk-research-panel').scrollTop = 0;
    }
    previousOverflow = pageRoot.style.overflow;
    previousScrollbarGutter = pageRoot.style.scrollbarGutter;
    pageRoot.style.scrollbarGutter = 'stable';
    pageRoot.style.overflow = 'hidden';
    dialog.showModal();
  });

  dialog.querySelector('.desk-research-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    pageRoot.style.overflow = previousOverflow;
    pageRoot.style.scrollbarGutter = previousScrollbarGutter;
    opener.focus({ preventScroll: true });
  });
}
