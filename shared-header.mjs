import fs from 'node:fs';

const portrait = fs.readFileSync('dist/assets/e18b8.svg', 'utf8')
  .replace('<svg ', '<svg class="header-portrait" aria-hidden="true" focusable="false" ')
  .replace(/id="([^"]+)"/g, (_, id) => `id="header-portrait-${id.replace(/\s+/g, '-')}"`)
  .replace(/id="header-portrait-Vector_(3|4)"/g, 'id="header-portrait-Vector_$1" class="header-eye"');

// Use the case navigation on the homepage and both case pages.
export const sharedHeader = `<header class="portfolio-header"><a class="portfolio-brand" href="/#top" aria-label="Максим Толстиков — главная">${portrait}<span>Maxim Tolstickov</span></a><nav aria-label="Основная навигация"><a href="/#works">Работы</a><a href="/#background">Бэкграунд</a><a href="/#about">Обо мне</a></nav><div class="portfolio-actions"><a class="portfolio-button portfolio-button-muted" href="/assets/maxim-tolstikov-cv.pdf" target="_blank" rel="noopener">CV</a><a class="portfolio-button" href="https://t.me/malasa1308" target="_blank" rel="noopener noreferrer">Telegram</a></div></header>`;

export function updateSharedHeader(html) {
  const headerPattern = /<header class="(?:header|portfolio-header)">[\s\S]*?<\/header>/;
  if (!headerPattern.test(html)) throw new Error('Shared portfolio header was not found');
  return html.replace(headerPattern, sharedHeader)
    .replace(/<dialog class="portfolio-cv-dialog"[\s\S]*?<\/dialog>/, '');
}
