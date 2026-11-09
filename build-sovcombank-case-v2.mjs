import fs from 'node:fs';
import { copy } from './case-figma-copy.mjs';
import { updateSharedHeader } from './shared-header.mjs';

const oldBuilder = fs.readFileSync('build-sovcombank-case.mjs','utf8');
const sharedHeader = updateSharedHeader(oldBuilder.match(/<header class="portfolio-header">[\s\S]*?<\/dialog>/)?.[0] || '');
if (!sharedHeader) throw new Error('Shared portfolio header was not found');

const images = [
  [220,607,1000,546,'hero.png','Сервис международных платежей'],
  [220,2182,1000,546,'docs.png','Мобильные состояния фильтров'],
  [220,3414,1000,529,'user-flow.png','Карта пользовательских сценариев'],
  [220,5631,1000,546.41,'tariff-figma.png','Расчёт тарифа'],
  [220,7345,1000,546,'application-flow.png','Создание заявки на платёж',1040],
  [220,7931,1000,546,'application-result.png','Состояния заявки',1040],
  [220,10875,1000,643,'status.png','Просмотр заявки',1040],
  [240,11748,960,524,'final.png','Финальный интерфейс',1040],
];

const media = [
  ...images.map(([x,y,w,h,,,displayWidth = 900]) => [y,w,h,displayWidth]),
  [4196,1000,694.23],
  [9051,1000,639,1040],
  [9984,1000,642,1040],
].sort((a,b) => a[0] - b[0]);
const mediaWidth = 900;
const mediaReduction = (width,height,displayWidth = mediaWidth) => height - height * displayWidth / width;
const verticalShiftAt = y => media.reduce((shift,[mediaY,width,height,displayWidth]) => mediaY < y ? shift + mediaReduction(width,height,displayWidth) : shift,0);
const layoutY = y => Math.round((y - verticalShiftAt(y) - (y >= 1295 ? 14 : 0) + (y >= 2782 ? 66 : 0) + (y >= 3269 ? 20 : 0) + (y >= 3322 ? 4 : 0) + (y >= 3414 ? 176 : 0) + (y >= 4021 ? 42 : 0) + (y >= 4196 ? 64 : 0) - (y >= 5168 ? 64 : 0) + (y >= 5456 ? 46 : 0) + (y >= 5631 ? 38 : 0) + (y >= 6894 ? 46 : 0) + (y >= 7061 ? 26 : 0) + (y >= 7099 ? 26 : 0) + (y >= 8985 ? 26 : 0) + (y >= 9984 ? 90 : 0) + (y >= 12372 ? 20 : 0)) * 100) / 100;
const mediaStyle = (y,width,height,displayWidth = mediaWidth) => 'style="left:'+(1440-displayWidth)/2+'px;top:'+layoutY(y)+'px;width:'+displayWidth+'px;aspect-ratio:'+width+'/'+height+'"';

const escape = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const pos = (x,y,w,h) => 'style="left:'+x+'px;top:'+y+'px;width:'+w+'px'+(h?';height:'+h+'px':'')+'"';
const elements = copy.map(([x,y,w,kind,value]) => {
  const tag = kind === 'hero-title' ? 'h1' : kind === 'heading' ? 'h2' : kind === 'subheading' || kind === 'card-heading' ? 'h3' : 'p';
  const isCardText = kind === 'card-heading' || kind === 'card-body';
  const textX = isCardText ? x : 360;
  const textWidth = isCardText ? w : 720;
  const sectionClass = value === 'Цели и задача редизайна' ? ' goals-heading' : value.startsWith('Задача появилась в рамках масштабного редизайна') ? ' goals-body' : value === 'Моя роль' ? ' role-heading' : value.startsWith('Работал продупродуктовымктовым дизайнером') ? ' role-intro' : y === 2782 ? ' discovery-heading' : y >= 2839 && y <= 3143 ? (y >= 2963 ? ' discovery-bullet' : ' discovery-intro') : y === 3269 ? ' flow-heading' : y === 3322 ? ' flow-intro' : y === 3413 ? ' flow-analysis' : y === 4021 ? ' main-heading' : y === 4078 ? ' main-problem-title' : y === 4116 ? ' main-problem-body' : y === 4930 ? ' hypotheses-heading' : y >= 4968 && y <= 5096 ? ' hypotheses-bullet' : y === 5168 ? ' hypotheses-interview' : y === 5266 ? ' hypotheses-result-title' : y === 5304 ? ' hypotheses-result-body' : y === 5456 ? ' tariff-heading' : y === 5513 ? ' tariff-problem-title' : y === 5551 ? ' tariff-intro' : y === 6218 || y === 6290 ? ' tariff-description' : y === 6414 ? ' tariff-hypotheses-heading' : y >= 6452 && y <= 6606 ? ' tariff-hypothesis' : y === 6678 ? ' tariff-result-title' : y === 6716 ? ' tariff-result-body' : y === 6894 ? ' application-heading' : y === 6951 ? ' application-problem-title' : y === 6989 ? ' application-problem-body' : y === 7061 ? ' application-insights' : y >= 7099 && y <= 7227 ? ' application-insight-bullet' : y === 8517 ? ' application-hypotheses-heading' : y >= 8555 && y <= 8747 ? ' application-hypothesis' : y === 8857 ? ' application-tests-heading' : y === 8895 || y === 8985 ? ' application-tests-body' : y === 9802 ? ' application-result-title' : y === 9840 || y === 9930 ? ' application-result-body' : y === 10726 ? ' view-heading' : y === 10783 ? ' view-intro' : y === 11558 || y === 11656 ? ' view-description' : y === 12372 ? ' next-heading' : y === 12429 ? ' next-body' : y === 12607 ? ' reflection-heading' : y === 12664 ? ' reflection-body' : '';
  const textY = y === 3413 ? layoutY(3322) + 98 : layoutY(y);
  const labelEnd = y >= 7099 && y <= 7227 ? value.indexOf('.') + 1 : 0;
  const textHtml = labelEnd ? '<strong>'+escape(value.slice(0,labelEnd))+'</strong>'+escape(value.slice(labelEnd)).replaceAll('\n','<br>') : escape(value).replaceAll('\n','<br>');
  return { y, html:'<'+tag+' class="case-text '+kind+sectionClass+'" '+pos(textX,textY,textWidth)+'>'+textHtml+'</'+tag+'>' };
});
elements.push(...images.map(([x,y,w,h,file,alt,displayWidth = mediaWidth]) => {
  const isTariff = file === 'tariff-figma.png';
  const mediaContent = isTariff
    ? '<video src="/assets/sovcombank-case/tariff-animation.mp4" poster="/assets/sovcombank-case/tariff-figma.png" autoplay muted loop playsinline preload="metadata" aria-label="Анимация расчёта тарифа"></video>'
    : '<img src="/assets/sovcombank-case/'+file+'" alt="'+escape(alt)+'" width="'+displayWidth+'" height="'+Math.round(h * displayWidth / w)+'" '+(file === 'hero.png' ? 'fetchpriority="high"' : 'loading="lazy"')+' decoding="async">';
  return { y, html:'<figure class="case-image'+(isTariff ? ' tariff-media' : '')+'" '+mediaStyle(y,w,h,displayWidth)+'>'+mediaContent+'</figure>' };
}));
elements.push(
  {y:395,html:'<ul class="case-tags" aria-label="Теги проекта"><li>B2B</li><li>Fintech</li><li>Redesign</li></ul>'},
  {y:498,html:'<dl class="case-meta"><div><dt>Таймлайн</dt><dd>4 месяца (2026)</dd></div><div><dt>Роль</dt><dd>Продуктовый дизайнер</dd></div><div><dt>Объём</dt><dd>Исследования и анализ, концепты, дизайн-система</dd></div></dl>'},
  {y:1470,html:'<div class="case-card case-card-left" style="top:'+layoutY(1470.21)+'px" aria-hidden="true"></div><div class="case-card case-card-right" style="top:'+layoutY(1470.21)+'px" aria-hidden="true"></div>'},
  {y:4196,html:'<figure class="case-image before-after" '+mediaStyle(4196,1000,694.23)+' aria-label="Сравнение главной страницы до и после редизайна"><img class="before-after__before" src="/assets/sovcombank-case/main-before.png" alt="Было: прежняя страница международных платежей" width="2080" height="1444" loading="lazy" decoding="async" draggable="false"><img class="before-after__after" src="/assets/sovcombank-case/main-after.png" alt="Стало: обновлённая страница международных платежей" width="2080" height="1444" loading="lazy" decoding="async" draggable="false"><span class="before-after__divider"><span class="before-after__handle" role="slider" tabindex="0" aria-label="Доля прежнего дизайна" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="50% прежнего дизайна">↔</span></span></figure>'},
  {y:9051,html:'<figure class="case-image comparison-media" '+mediaStyle(9051,1000,639,1040)+'><video class="comparison-video is-active" data-comparison-video="before" src="/assets/sovcombank-case/before.mp4" poster="/assets/sovcombank-case/view-current.png" controls muted loop playsinline preload="metadata" aria-label="Было — прежняя версия работы с инвойсами"></video><video class="comparison-video" data-comparison-video="after" data-src="/assets/sovcombank-case/after.mp4" poster="/assets/sovcombank-case/view-target.png" controls muted loop playsinline preload="none" aria-label="Стало — обновлённая работа с инвойсами"></video></figure>'},
  {y:9984,html:'<figure class="case-image case-application-video" '+mediaStyle(9984,1000,642,1040)+'><video data-case-application-video data-src="/assets/sovcombank-case/application-test-5.mp4" poster="/assets/sovcombank-case/application-test-5-poster.jpg" controls muted loop playsinline preload="none" aria-label="Обновлённая форма заявки на международный платёж"></video></figure>'},
  {y:9714,html:'<div class="comparison-labels" style="top:'+layoutY(9714)+'px" role="group" aria-label="Сравнение видео" data-active="before"><button type="button" class="is-active" data-comparison-choice="before" aria-pressed="true">Было</button><button type="button" data-comparison-choice="after" aria-pressed="false">Стало</button></div>'},
);
elements.sort((a,b)=>a.y-b.y);
const content = elements.map(e=>e.html).join('');
const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#1e1e24"><meta name="description" content="Редизайн сервиса международных платежей — кейс Максима Толстикова."><title>Международные платежи · Максим Толстиков</title><link rel="icon" href="/assets/4a1d5.svg"><link rel="stylesheet" href="/sovcombank-case-v2.css?v=hypothesis-2"><link rel="stylesheet" href="/portfolio-nav.css?v=medeo-2"><link rel="stylesheet" href="/desktop.css"><script src="/desktop.js" defer></script><script src="/portfolio-nav.js" defer></script><script src="/sovcombank-comparison.js?v=segment-2" defer></script></head><body id="top"><a class="skip-link" href="#case-content">К содержанию</a>'+sharedHeader+'<main id="case-content"><article class="case-artboard"><div class="case-dots" aria-hidden="true"></div><div class="case-glow" aria-hidden="true"></div>'+content+'</article></main><a class="next-case" href="designers.html"><span>Следующий кейс</span><img src="/assets/sovcombank-case/next-arrow.svg" alt="" width="20" height="20"></a></body></html>';
fs.mkdirSync('dist/cases',{recursive:true});
fs.writeFileSync('dist/cases/sovcombank.html',html
  .replace('<script src="/portfolio-nav.js" defer></script>','')
  .replace('</head>','<link rel="stylesheet" href="/header-logo.css"><script src="/header-logo.js" defer></script></head>'));
console.log('Generated /cases/sovcombank.html from Figma 1:2540');
