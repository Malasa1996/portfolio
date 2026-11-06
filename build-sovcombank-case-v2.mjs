import fs from 'node:fs';
import { copy } from './case-figma-copy.mjs';
import { updateSharedHeader } from './shared-header.mjs';

const oldBuilder = fs.readFileSync('build-sovcombank-case.mjs','utf8');
const sharedHeader = updateSharedHeader(oldBuilder.match(/<header class="portfolio-header">[\s\S]*?<\/dialog>/)?.[0] || '');
if (!sharedHeader) throw new Error('Shared portfolio header was not found');

const images = [
  [220,649,1000,546,'hero.png','Сервис международных платежей'],
  [220,2136,1000,546,'docs.png','Мобильные состояния фильтров'],
  [220,3414,1000,529,'user-flow.png','Карта пользовательских сценариев'],
  [220,5631,1000,546,'tariff-figma.png','Расчёт тарифа'],
  [220,7345,1000,546,'application-flow.png','Создание заявки на платёж'],
  [220,7931,1000,546,'application-result.png','Состояния заявки'],
  [220,10875,1000,643,'status.png','Просмотр заявки'],
  [240,11748,960,524,'final.png','Финальный интерфейс'],
];

const media = [
  ...images.map(([x,y,w,h]) => [y,w,h]),
  [4196,1000,694],
  [9051,1000,639],
  [9984,1000,642],
].sort((a,b) => a[0] - b[0]);
const mediaWidth = 900;
const mediaLeft = (1440 - mediaWidth) / 2;
const mediaReduction = (width,height) => height - height * mediaWidth / width;
const verticalShiftAt = y => media.reduce((shift,[mediaY,width,height]) => mediaY < y ? shift + mediaReduction(width,height) : shift,0);
const layoutY = y => Math.round((y - verticalShiftAt(y)) * 100) / 100;
const mediaStyle = (y,width,height) => 'style="left:'+mediaLeft+'px;top:'+layoutY(y)+'px;width:'+mediaWidth+'px;aspect-ratio:'+width+'/'+height+'"';

const escape = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const pos = (x,y,w,h) => 'style="left:'+x+'px;top:'+y+'px;width:'+w+'px'+(h?';height:'+h+'px':'')+'"';
const elements = copy.map(([x,y,w,kind,value]) => {
  const tag = kind === 'hero-title' ? 'h1' : kind === 'heading' ? 'h2' : kind === 'subheading' || kind === 'card-heading' ? 'h3' : 'p';
  const isCardText = kind === 'card-heading' || kind === 'card-body';
  const textX = isCardText ? x : 360;
  const textWidth = isCardText ? w : 720;
  return { y, html:'<'+tag+' class="case-text '+kind+'" '+pos(textX,layoutY(y),textWidth)+'>'+escape(value).replaceAll('\n','<br>')+'</'+tag+'>' };
});
elements.push(...images.map(([x,y,w,h,file,alt]) => ({
  y, html:'<figure class="case-image" '+mediaStyle(y,w,h)+'><img src="/assets/sovcombank-case/'+file+'" alt="'+escape(alt)+'" width="'+mediaWidth+'" height="'+Math.round(h * mediaWidth / w)+'" '+(file === 'hero.png' ? 'fetchpriority="high"' : 'loading="lazy"')+' decoding="async"></figure>'
})));
elements.push(
  {y:442,html:'<ul class="case-tags" aria-label="Теги проекта"><li>B2B</li><li>Fintech</li><li>Redesignl</li></ul>'},
  {y:544.67,html:'<dl class="case-meta"><div><dt>Таймлайн</dt><dd>4 месяца (2026)</dd></div><div><dt>Роль</dt><dd>Продуктовый дизайнер</dd></div><div><dt>Объём</dt><dd>Исследования и анализ, концепты, дизайн-система</dd></div></dl>'},
  {y:1470,html:'<div class="case-card case-card-left" style="top:'+layoutY(1470.21)+'px" aria-hidden="true"></div><div class="case-card case-card-right" style="top:'+layoutY(1470.21)+'px" aria-hidden="true"></div>'},
  {y:4196,html:'<figure class="case-image before-after" '+mediaStyle(4196,1000,694)+' aria-label="Сравнение главной страницы до и после редизайна"><img class="before-after__before" src="/assets/sovcombank-case/main-before.png" alt="Было: прежняя страница международных платежей" width="2080" height="1444" loading="lazy" decoding="async" draggable="false"><img class="before-after__after" src="/assets/sovcombank-case/main-after.png" alt="Стало: обновлённая страница международных платежей" width="2080" height="1444" loading="lazy" decoding="async" draggable="false"><span class="before-after__divider"><span class="before-after__handle" role="slider" tabindex="0" aria-label="Доля прежнего дизайна" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="50% прежнего дизайна">↔</span></span></figure>'},
  {y:9051,html:'<figure class="case-image comparison-media" '+mediaStyle(9051,1000,639)+'><video class="comparison-video is-active" data-comparison-video="before" src="/assets/sovcombank-case/before.mp4" poster="/assets/sovcombank-case/view-current.png" controls muted loop playsinline preload="metadata" aria-label="Было — прежняя версия работы с инвойсами"></video><video class="comparison-video" data-comparison-video="after" data-src="/assets/sovcombank-case/after.mp4" poster="/assets/sovcombank-case/view-target.png" controls muted loop playsinline preload="none" aria-label="Стало — обновлённая работа с инвойсами"></video></figure>'},
  {y:9984,html:'<figure class="case-image case-application-video" '+mediaStyle(9984,1000,642)+'><video data-case-application-video data-src="/assets/sovcombank-case/application-test-5.mp4" poster="/assets/sovcombank-case/application-test-5-poster.jpg" controls muted loop playsinline preload="none" aria-label="Обновлённая форма заявки на международный платёж"></video></figure>'},
  {y:9714,html:'<div class="comparison-labels" style="top:'+layoutY(9714)+'px" role="group" aria-label="Сравнение видео" data-active="before"><button type="button" class="is-active" data-comparison-choice="before" aria-pressed="true">Было</button><button type="button" data-comparison-choice="after" aria-pressed="false">Стало</button></div>'},
);
elements.sort((a,b)=>a.y-b.y);
const content = elements.map(e=>e.html).join('');
const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#1e1e24"><meta name="description" content="Редизайн сервиса международных платежей — кейс Максима Толстикова."><title>Международные платежи · Максим Толстиков</title><link rel="icon" href="/assets/4a1d5.svg"><link rel="stylesheet" href="/sovcombank-case-v2.css?v=medeo-2"><link rel="stylesheet" href="/portfolio-nav.css?v=medeo-2"><link rel="stylesheet" href="/desktop.css"><script src="/desktop.js" defer></script><script src="/portfolio-nav.js" defer></script><script src="/sovcombank-comparison.js" defer></script></head><body id="top"><a class="skip-link" href="#case-content">К содержанию</a>'+sharedHeader+'<main id="case-content"><article class="case-artboard"><div class="case-dots" aria-hidden="true"></div><div class="case-glow" aria-hidden="true"></div>'+content+'</article></main><a class="next-case" href="/cases/designers.html"><span>Следующий кейс</span><img src="/assets/sovcombank-case/next-arrow.svg" alt="" width="20" height="20"></a></body></html>';
fs.mkdirSync('dist/cases',{recursive:true});
fs.writeFileSync('dist/cases/sovcombank.html',html);
console.log('Generated /cases/sovcombank.html from Figma 1:2540');
