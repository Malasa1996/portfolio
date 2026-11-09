import fs from 'node:fs';
import { updateSharedHeader } from './shared-header.mjs';
const source=JSON.parse(fs.readFileSync('reference/designers-writing.json','utf8'));
const escape=text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const imageLabels={'hero.png':'Главная страница Дизайнерс','cover.png':'Дизайнерс — платформа для дизайнеров','competitors.png':'Конкурентный анализ','survey.png':'Опрос пользователей и его результаты','feed.png':'Лента публикаций','profiles.png':'Профили и подписки','personal-feed.png':'Моя лента','settings.png':'Настройки профиля','analytics.png':'Аналитика публикаций','architecture.png':'Архитектура сайта','prototypes.png':'Прототипы','results.png':'Результат обновления в цифрах'};
function figure(file,eager=false){
 const fd=fs.openSync(`dist/assets/designers-case/${file}`,'r');
 const metadata=Buffer.alloc(24);fs.readSync(fd,metadata,0,24,0);fs.closeSync(fd);
 const width=metadata.readUInt32BE(16),height=metadata.readUInt32BE(20);
 return `<figure class="wide case-figure"><button class="image-button" type="button" data-zoom aria-label="Увеличить: ${imageLabels[file]}"><img src="/assets/designers-case/${file}" alt="${imageLabels[file]}" width="${width}" height="${height}" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async"><span class="zoom-label" aria-hidden="true">↗</span></button><figcaption class="sr-only">${imageLabels[file]}</figcaption></figure>`;
}
function writing(block){
 if(!block.runs.length)return escape(block.text);
 return block.runs.map(run=>{
  let text=escape(run.text);
  if(run.bold)text=`<strong>${text}</strong>`;
  if(run.italic)text=`<em>${text}</em>`;
  if(run.href){if(!/^https:\/\//.test(run.href))throw Error('Unsupported source link');text=`<a href="${escape(run.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;}
  return text;
 }).join('');
}
const sectionIds={1:'context',4:'goal',8:'audience',13:'success',19:'discovery',34:'design',48:'results'};
const navigation=source.blocks.filter(block=>sectionIds[block.i]).map(block=>({id:sectionIds[block.i],label:block.text}));
let open=false;
let article='';
for(const block of source.blocks.slice(1)){
 if(sectionIds[block.i]){
  if(open)article+='</section>';
  const id=sectionIds[block.i];
  article+=`<section class="case-section" id="${id}" aria-labelledby="${id}-title"><h2 id="${id}-title" data-source-block="${block.i}">${writing(block)}</h2>`;
  open=true;
 }else if(block.text.trim()){
  const content=writing(block);
  if(block.marker)article+=`<div class="source-list-item${block.marker==='bullet'?' bullet':''}"><span class="list-marker" aria-hidden="true">${block.marker==='ordered'?escape(block.number)+'.':'•'}</span><div class="source-copy" data-source-block="${block.i}">${content}</div></div>`;
  else if(block.heading)article+=`<h3 class="source-links" data-source-block="${block.i}">${content}</h3>`;
  else article+=`<p class="source-copy" data-source-block="${block.i}">${content}</p>`;
 }
 for(const image of block.images){if(!image.file)throw Error('Unmapped source image');article+=figure(image.file);}
}
if(open)article+='</section>';
const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Дизайнерс · Максим Толстиков</title><meta name="description" content="Дизайнерс — кейс Максима Толстикова. Исходное описание проекта, исследования, дизайн и результат обновления."><meta name="theme-color" content="#1e1e24"><link rel="icon" href="/assets/4a1d5.svg"><link rel="stylesheet" href="/case.css?v=medeo-2"><link rel="stylesheet" href="/portfolio-nav.css?v=medeo-2"><link rel="stylesheet" href="/header-logo.css"><link rel="stylesheet" href="/desktop.css"><script src="/desktop.js" defer></script><script src="/case.js" defer></script><script src="/header-logo.js" defer></script></head><body id="top"><a class="skip" href="#context">К содержанию</a><div class="reading-progress" aria-hidden="true"></div>
<header class="portfolio-header"><a class="portfolio-brand" href="../index.html#top" aria-label="Максим Толстиков — главная"><img src="/assets/e18b8.svg" alt="" width="37" height="40"><span>Maxim Tolstickov</span></a><nav aria-label="Основная навигация"><a href="../index.html#works">Работы</a><a href="../index.html#background">Бэкграунд</a><a href="../index.html#about">Обо мне</a><button type="button" data-portfolio-cv>CV</button></nav><div class="portfolio-actions"><button class="portfolio-theme" type="button" data-portfolio-theme aria-label="Включить светлую тему" aria-pressed="false"><img src="/assets/85b72.svg" alt="" width="24" height="24"></button><button class="portfolio-button portfolio-button-muted" type="button" data-portfolio-cv>CV</button><a class="portfolio-button" href="https://t.me/malasa1308" target="_blank" rel="noopener noreferrer">Telegram</a></div></header>
<dialog class="portfolio-cv-dialog" aria-labelledby="portfolio-cv-title"><div class="portfolio-cv-head"><h2 id="portfolio-cv-title">Резюме</h2><button class="portfolio-cv-close" type="button" aria-label="Закрыть">×</button></div><p>Актуальное резюме можно запросить по почте или в Telegram.</p><a href="mailto:malasa1308@gmail.com?subject=Запрос%20резюме">malasa1308@gmail.com ↗</a><a href="https://t.me/malasa1308" target="_blank" rel="noopener noreferrer">Написать в Telegram ↗</a></dialog>
<a class="case-close" href="../index.html#designers" aria-label="Закрыть кейс и вернуться к работам">×</a>
<nav class="case-nav" aria-label="Разделы кейса">${navigation.map(({id,label})=>`<a href="#${id}" aria-label="${escape(label)}"><span class="toc-line" aria-hidden="true"></span><span class="toc-label">${escape(label)}</span></a>`).join('')}</nav>
<main><article class="case-article"><header class="case-intro"><h1>Дизайнерс</h1><p class="case-lead source-copy" data-source-block="0">${writing(source.blocks[0])}</p><ul class="case-tags" aria-label="Теги">${source.tags.map(tag=>`<li>${escape(tag)}</li>`).join('')}</ul><dl class="case-meta"><div><dt>Период работы</dt><dd>${escape(source.period)}</dd></div><div><dt>Проект</dt><dd><a href="https://dsgners.ru" target="_blank" rel="noopener noreferrer">https://dsgners.ru</a></dd></div></dl></header>
${figure('hero.png',true)}${article}
<a class="back-to-work" href="../index.html#designers"><span>←</span> Вернуться к работам</a></article></main>
<footer class="case-footer"><a class="footer-name" href="../index.html">Maxim Tolstickov</a><nav aria-label="Контакты"><a href="https://t.me/malasa1308" target="_blank" rel="noopener noreferrer">Telegram ↗</a><a href="mailto:malasa1308@gmail.com">Email ↗</a></nav><span>© 2026</span></footer>
<a class="to-top" href="#top" aria-label="Наверх">↑</a><dialog class="image-dialog" aria-label="Просмотр иллюстрации"><button class="dialog-close" type="button" aria-label="Закрыть изображение">×</button><img alt=""><p></p></dialog></body></html>`;
fs.mkdirSync('dist/cases',{recursive:true});
fs.writeFileSync('dist/cases/designers.html',updateSharedHeader(html));
console.log('Generated /cases/designers.html with verbatim source writing');
