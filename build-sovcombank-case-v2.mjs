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
  [220,4196,1000,694,'main-table.png','Таблица международных платежей'],
  [220,5631,1000,546,'tariff-figma.png','Расчёт тарифа'],
  [220,7345,1000,546,'application-flow.png','Создание заявки на платёж'],
  [220,7931,1000,546,'application-result.png','Состояния заявки'],
  [220,9051,1000,639,'view-current.png','Предыдущая форма заявки'],
  [220,9984,1000,642,'view-target.png','Обновлённая форма заявки'],
  [220,10875,1000,643,'status.png','Просмотр заявки'],
  [240,11748,960,524,'final.png','Финальный интерфейс'],
];

const escape = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const pos = (x,y,w,h) => 'style="left:'+x+'px;top:'+y+'px;width:'+w+'px'+(h?';height:'+h+'px':'')+'"';
const elements = copy.map(([x,y,w,kind,value]) => {
  const tag = kind === 'hero-title' ? 'h1' : kind === 'heading' ? 'h2' : kind === 'subheading' || kind === 'card-heading' ? 'h3' : 'p';
  return { y, html:'<'+tag+' class="case-text '+kind+'" '+pos(x,y,w)+'>'+escape(value).replaceAll('\n','<br>')+'</'+tag+'>' };
});
elements.push(...images.map(([x,y,w,h,file,alt]) => ({
  y, html:'<figure class="case-image" '+pos(x,y,w,h)+'><img src="/assets/sovcombank-case/'+file+'" alt="'+escape(alt)+'" width="'+w+'" height="'+h+'" '+(file === 'hero.png' ? 'fetchpriority="high"' : 'loading="lazy"')+' decoding="async"></figure>'
})));
elements.push(
  {y:442,html:'<ul class="case-tags" aria-label="Теги проекта"><li>B2B</li><li>Fintech</li><li>Redesignl</li></ul>'},
  {y:544.67,html:'<dl class="case-meta"><div><dt>Таймлайн</dt><dd>4 месяца (2026)</dd></div><div><dt>Роль</dt><dd>Продуктовый дизайнер</dd></div><div><dt>Объём</dt><dd>Исследования и анализ, концепты, дизайн-система</dd></div></dl>'},
  {y:1470,html:'<div class="case-card case-card-left" aria-hidden="true"></div><div class="case-card case-card-right" aria-hidden="true"></div>'},
  {y:9714,html:'<div class="comparison-labels" aria-hidden="true"><span>Было</span><span>Стало</span></div>'},
);
elements.sort((a,b)=>a.y-b.y);
const content = elements.map(e=>e.html).join('');
const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#1e1e24"><meta name="description" content="Редизайн сервиса международных платежей — кейс Максима Толстикова."><title>Международные платежи · Максим Толстиков</title><link rel="icon" href="/assets/4a1d5.svg"><link rel="stylesheet" href="/sovcombank-case-v2.css"><link rel="stylesheet" href="/portfolio-nav.css"><link rel="stylesheet" href="/desktop.css"><script src="/desktop.js" defer></script><script src="/portfolio-nav.js" defer></script></head><body id="top"><a class="skip-link" href="#case-content">К содержанию</a>'+sharedHeader+'<main id="case-content"><article class="case-artboard"><div class="case-dots" aria-hidden="true"></div><div class="case-glow" aria-hidden="true"></div>'+content+'</article></main><a class="next-case" href="/cases/designers.html"><span>Следующий кейс</span><img src="/assets/sovcombank-case/next-arrow.svg" alt="" width="20" height="20"></a></body></html>';
fs.mkdirSync('dist/cases',{recursive:true});
fs.writeFileSync('dist/cases/sovcombank.html',html);
console.log('Generated /cases/sovcombank.html from Figma 1:2540');
