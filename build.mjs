import fs from 'node:fs';
import path from 'node:path';
const ref=path.resolve('reference');
const read=id=>fs.readFileSync(path.join(ref,id.replace(':','-')+'.jsx'),'utf8');
const assets=JSON.parse(fs.readFileSync(path.join(ref,'assets.json'),'utf8'));
assets.push(...JSON.parse(fs.readFileSync(path.join(ref,'about-assets.json'),'utf8')));
const css=[], unknown=new Set(), rules=new Map();
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;');
const image=(file,alt='',cls='')=>`<img src="assets/${file}" alt="${alt}" class="${cls}">`;
const aboutSource=fs.readFileSync(path.join(ref,'about-scenes.svg'),'utf8');
fs.copyFileSync(path.join(ref,'about-scenes.svg'),'dist/assets/about-scenes.svg');
// The exported Figma frame contains all three 1440 × 760 states. CSS crops the
// single original asset so browsers decode and cache the artwork only once.
const educationSource=fs.readFileSync(path.join(ref,'education.svg'),'utf8');
const educationIcons=[...educationSource.matchAll(/<image id="image(\d+)[^>]+xlink:href="data:image\/png;base64,([^"]+)"\/>/g)];
if(educationIcons.length!==5)throw Error('Expected five education icons from the new Figma frame');
for(const [,index,data] of educationIcons)fs.writeFileSync(`dist/assets/education-icon-${index}.png`,Buffer.from(data,'base64'));
const map={absolute:'position:absolute',relative:'position:relative',contents:'display:contents',block:'display:block',flex:'display:flex','flex-col':'flex-direction:column','flex-row':'flex-direction:row','flex-none':'flex:none','shrink-0':'flex-shrink:0','items-center':'align-items:center','items-start':'align-items:flex-start','items-end':'align-items:flex-end','justify-center':'justify-content:center','justify-end':'justify-content:flex-end','content-stretch':'align-content:stretch','self-stretch':'align-self:stretch','overflow-clip':'overflow:hidden','overflow-hidden':'overflow:hidden','max-w-none':'max-width:none','w-full':'width:100%','h-full':'height:100%','size-full':'width:100%;height:100%','min-w-full':'min-width:100%','min-w-px':'min-width:1px','min-h-px':'min-height:1px','inset-0':'inset:0','left-0':'left:0','right-0':'right:0','top-0':'top:0','bottom-0':'bottom:0','text-white':'color:white','text-black':'color:black','bg-white':'background-color:white','bg-black':'background-color:black','text-center':'text-align:center','text-ellipsis':'text-overflow:ellipsis','font-medium':'font-weight:500','font-normal':'font-weight:400','font-semibold':'font-weight:600','font-bold':'font-weight:700','not-italic':'font-style:normal','whitespace-nowrap':'white-space:nowrap','whitespace-pre-wrap':'white-space:pre-wrap',uppercase:'text-transform:uppercase',border:'border-width:1px','border-solid':'border-style:solid','pointer-events-none':'pointer-events:none','object-cover':'object-fit:cover','object-contain':'object-fit:contain','object-bottom':'object-position:bottom','-translate-x-1/2':'--tx:-50%','-translate-y-1/2':'--ty:-50%','-scale-y-100':'--sy:-1','mask-alpha':'mask-mode:alpha','mask-intersect':'mask-composite:intersect','mask-no-clip':'mask-clip:no-clip','mask-no-repeat':'mask-repeat:no-repeat','bg-gradient-to-b':'background-image:linear-gradient(to bottom,var(--from),var(--to))'};
function styleFor(c){
 if(c.startsWith('rounded-br-['))return 'border-bottom-right-radius:'+c.slice(12,-1);
 if(c==='leading-none')return 'line-height:1';
 if(c==='content-end')return 'align-content:flex-end';
 if(c==='flex-wrap')return 'flex-wrap:wrap';
 if(c.startsWith('gap-y-['))return 'row-gap:'+c.slice(7,-1);
 if(c.startsWith('min-w-['))return 'min-width:'+c.slice(7,-1);
 if(map[c])return map[c];
 if(/^opacity-\d+$/.test(c))return 'opacity:'+Number(c.split('-')[1])/100;
 if(/^rotate-\d+$/.test(c))return '--rot:'+c.slice(7)+'deg';
 if(/^-(rotate)-\d+$/.test(c))return '--rot:-'+c.slice(8)+'deg';
 if(c.startsWith('font-['))return "font-family:Inter,Arial,sans-serif";
 if(c.startsWith('['))return c.slice(1,-1).replaceAll('_',' ');
 const m=c.match(/^([a-z-]+)-\[(.*)\]$/);if(!m){unknown.add(c);return '';}
 let [,k,v]=m;v=v.replaceAll('_',' ').replaceAll('\\/','/').replace(/var\(--[^,()]+,([^()]+)\)/g,'$1').replace(/calc\(([^)]*)\)/g,(_,expr)=>'calc('+expr.replace(/([\d%])([+-])(?=[\d.])/g,'$1 $2 ')+')');
 const props={w:'width',h:'height',left:'left',right:'right',top:'top',bottom:'bottom',inset:'inset',gap:'gap',p:'padding',pr:'padding-right',pl:'padding-left',pt:'padding-top',pb:'padding-bottom',leading:'line-height',tracking:'letter-spacing',rounded:'border-radius','rounded-tl':'border-top-left-radius','rounded-tr':'border-top-right-radius','max-w':'max-width',flex:'flex',shadow:'box-shadow','mask-size':'mask-size','mask-position':'mask-position'};
 if(props[k])return props[k]+':'+v;
 if(k==='size')return `width:${v};height:${v}`;
 if(k==='px')return `padding-left:${v};padding-right:${v}`;
 if(k==='py')return `padding-top:${v};padding-bottom:${v}`;
 if(k==='text')return (/^length:/.test(v)||/^-?[\d.]+(px|rem)/.test(v)?'font-size:'+v.replace(/^length:/,''):'color:'+v.replace(/^color:/,''));
 if(k==='bg')return 'background-color:'+v;
 if(k==='border')return (/^length:/.test(v)||/^[\d.]+px/.test(v)?'border-width:'+v.replace(/^length:/,''):'border-color:'+v);
 if(k==='rotate'||k==='-rotate')return '--rot:'+(k[0]==='-'?'-':'')+v;
 if(k==='blur')return 'filter:blur('+v+')';
 if(k==='backdrop-blur')return 'backdrop-filter:blur('+v+')';
 if(k==='from')return '--from:'+v;
 if(k==='to')return v.endsWith('%')?'':'--to:'+v;
 unknown.add(c);return '';
}
function classes(s){const declarations=s.split(/\s+/).map(styleFor).filter(Boolean);if(declarations.some(d=>/^--(rot|tx|ty|sy):/.test(d))){declarations.unshift('--tx:0;--ty:0;--rot:0deg;--sy:1');declarations.push('transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) scaleY(var(--sy))');}const st=declarations.join(';');if(!rules.has(st)){const name='f'+rules.size;rules.set(st,name);css.push(`.${name}{${st}}`);}return rules.get(st);}
function extract(code,id){const marker=`data-node-id="${id}"`;const at=code.indexOf(marker);if(at<0)throw Error('Node missing '+id);const start=code.lastIndexOf('<',at);const tags=/<\/?(?:motion\.)?div\b[^>]*>/g;tags.lastIndex=start;let depth=0,m;while((m=tags.exec(code))){if(m[0].startsWith('</'))depth--;else if(!m[0].endsWith('/>'))depth++;if(depth===0)return code.slice(start,tags.lastIndex);}throw Error('Unbalanced node '+id);}
function convert(id,node,omitNode){let code=read(id);const local=Object.fromEntries(assets.filter(a=>a.node===id).map(a=>[a.name,'assets/'+a.file]));let html=extract(code,node);
 if(omitNode)html=html.replace(extract(code,omitNode),'');
 // Figma represents flipped raster fills as signed dimensions. CSS needs positive
 // dimensions plus an origin-anchored reflection to preserve the same crop.
 if(omitNode)html=html.replace(/<img([^>]*?)className="([^"]*)"([^>]*?)\/>/g,(_,before,cls,after)=>{let sx=1,sy=1;cls=cls.replace(/\bw-\[-([\d.]+)%\]/g,(_,v)=>{sx=-1;return `w-[${v}%]`;}).replace(/\bh-\[-([\d.]+)%\]/g,(_,v)=>{sy=-1;return `h-[${v}%]`;});return `<img${before}className="${cls}"${sx<0||sy<0?` style="transform:scale(${sx},${sy});transform-origin:0 0"`:''}${after}/>`;});
 html=html.replace(/style=\{\{([\s\S]*?)\}\}/g,(_,s)=>{let pairs=[];for(const m of s.matchAll(/(\w+):\s*("(?:\\.|[^"\\])*"|`[^`]*`)/g)){let val=m[2][0]==='"'?JSON.parse(m[2]):m[2].slice(1,-1).replace(/\$\{(\w+)\}/g,(_,n)=>local[n]);pairs.push(m[1].replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+':'+val);}return `style="${esc(pairs.join(';'))}"`;});
 html=html.replace(/className="([^"]*)"/g,(_,s)=>`class="${classes(s)}"`).replace(/src=\{(\w+)\}/g,(_,n)=>`src="${local[n]}"`).replace(/\{`([^`]*)`\}/g,'$1').replaceAll('motion.div','div').replaceAll('aria-hidden ','aria-hidden="true" ').replace(/<div([^>]*)\/>/g,'<div$1></div>').replace(/[\t ]+\n/g,'\n');return html;
}
function gallery(source,ids,widths,label){return `<div class="gallery" role="region" aria-roledescription="карусель" aria-label="${label}" aria-keyshortcuts="ArrowLeft ArrowRight" tabindex="0"><div class="gallery-track">${ids.map((id,i)=>`<div class="slide" data-slide-index="${i}" style="--slide-width:${widths[i]}px"><div class="slide-art" style="width:${widths[i]}px;height:479px">${convert(source,id)}</div></div>`).join('')}</div></div><div class="gallery-controls" aria-label="Слайды ${label}">${ids.map((_,i)=>`<button class="dot${i===1?' active':''}" aria-label="Слайд ${i+1}" aria-pressed="${i===1}"><span class="dot-fill" aria-hidden="true"></span></button>`).join('')}</div>`;}
const designer=gallery('600:51996',['600:52010','600:52011','600:52053'],[711,851,426],'Дизайнерс');
const bank=gallery('600:52073',['600:52694','600:53169','600:53180','600:53185','600:57810'],[875,875,875,460,875],'Совкомбанк');
// Reuse the original vector silhouette; its SVG export includes noise but cannot
// capture a live backdrop. A derived alpha mask lets CSS blur the papers behind it.
const folderVector=fs.readFileSync('dist/assets/2abbd.svg','utf8');
const folderVectorBody=folderVector.slice(folderVector.indexOf('>')+1,folderVector.lastIndexOf('</svg>'));
// Keep the source geometry intact. Nested SVG images are not reliably resolved
// inside a CSS mask, so the mask uses the source SVG body with alpha amplified.
fs.writeFileSync('dist/assets/folder-silhouette.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="212.273" height="148.018" viewBox="0 0 212.273 148.018"><defs><filter id="alpha" x="0" y="0" width="100%" height="100%"><feComponentTransfer><feFuncA type="linear" slope="100"/></feComponentTransfer></filter></defs><g filter="url(#alpha)">${folderVectorBody}</g></svg>`);
const vectorLayer=convert('600:52073','600:52127');
// SVG images cannot apply Figma's foreignObject backdrop blur to their own
// painted layers. Keep the source artwork and blur its shading with an SVG
// filter instead; the base silhouette and the two stars remain crisp.
const orbSource=fs.readFileSync('dist/assets/c40ec.svg','utf8');
const orbBlur=orbSource.match(/backdrop-filter:blur\(([^)]+)px\)/)?.[1];
if(!orbBlur)throw Error('Folder orb blur missing from Figma export');
const browserOrb=orbSource.replace(/<foreignObject\b[\s\S]*?<\/foreignObject>/,'')
 .replace('<g id="6235933"','<g filter="url(#folder-orb-blur)"><g id="6235933"')
 .replace('<circle id="Ellipse 35"','</g><circle id="Ellipse 35"')
 .replace('<defs>',`<defs><filter id="folder-orb-blur" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${orbBlur}"/></filter>`);
fs.writeFileSync('dist/assets/folder-orb.svg',browserOrb);
const folderMarkup=convert('600:52073','600:52108').replace('data-node-id="600:52108"','data-node-id="600:52108" data-folder-scene').replace(vectorLayer,'').replace('assets/c40ec.svg','assets/folder-orb.svg');
const folderStart=folderMarkup.indexOf('>')+1;
const frostedSample=folderMarkup.replaceAll('data-node-id=','data-folder-ref=').replace(' data-folder-scene','');
const old=folderMarkup.slice(0,folderStart)+`<div class="folder-papers">${folderMarkup.slice(folderStart,-6)}</div><div class="folder-front"><div class="folder-glass"><div class="folder-frosted-sample" aria-hidden="true">${frostedSample}</div></div>${vectorLayer}<div class="folder-grain"></div><div class="folder-sheen" aria-hidden="true"></div></div></div>`;
const educationSlots=[
 ['3af28.png',619.21,0,0],['c29ef.png',620.09,1227.27,0],
 ['f76ba.png',1050.2325,180.6625,45],['78399.png',183.0525,1049.0925,45],
 ['f4f3e.png',1227.26,613.19,90],['82c7e.png',0,614.07,90],
 ['91e18.png',1055.1125,1044.2125,-45],['d6fa5.png',186.5425,175.9225,-60]
];
const education='<div class="education-wheel-position"><div class="education-wheel" data-node-id="3:7858">'+educationSlots.map(([file,x,y,tilt])=>`<div class="education-icon" style="left:${x/1354.262*100}%;top:${y/1354.266*100}%;--icon-tilt:${tilt}deg">${image(`edu-${file}`,'')}</div>`).join('')+'</div></div>';
const arrow=image('edu-8e5ff.svg','','edu-arrow');
const aboutScenes=[
 ['Путешествия с друзьями на север','3:8399','3:8400'],
 ['Игры, музыка, спорт и эстетика 2000-х','21:39113','21:39114']
];
const about=`<section class="about" id="about" aria-labelledby="about-title"><div class="about-sticky"><div class="about-stage"><div class="about-canvas"><h2 id="about-title">Обо мне</h2>${aboutScenes.map(([label,node,title],i)=>`<figure class="about-scene${i===0?' is-active':''}" data-about-scene="${i}" aria-label="${label}" aria-hidden="${i!==0}">${convert(node,node,title)}</figure>`).join('')}</div></div></div></section>`;
const contacts=`<a href="mailto:malasa1308@gmail.com">Email</a><button type="button" data-cv>CV</button><a href="https://t.me/malasa1308" target="_blank" rel="noopener noreferrer">Telegram</a>`;
// Reuse every original portrait path and its native dimensions. Inline only this
// instance so the two existing eye paths can blink independently of the head.
const footerPortrait=fs.readFileSync('dist/assets/ce4b1.svg','utf8')
 .replace('<svg ','<svg class="footer-portrait" aria-hidden="true" focusable="false" ')
 .replace(/id="([^"]+)"/g,(_,id)=>`id="footer-portrait-${id.replace(/\s+/g,'-')}"`)
 .replace(/id="footer-portrait-Vector_(3|4)"/g,'id="footer-portrait-Vector_$1" class="footer-eye"');
const courses=[['T-Bank','Июнь 2024 — август 2024'],['Helper','Сентябрь 2024 — декабрь 2024'],['UX BOOST','Декабрь 2025'],['UI BOOST','Июнь 2023']];
const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1e1e24"><meta name="description" content="Максим Толстиков — продуктовый дизайнер. Избранные проекты: Дизайнерс и Совкомбанк, опыт и образование."><title>Maxim Tolstickov — продуктовый дизайнер</title><link rel="icon" href="assets/e18b8.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="artwork.css"><script src="app.js" defer></script></head><body><a class="skip-link" href="#works">Перейти к проектам</a><header class="header"><a class="brand" href="#top">${image('e18b8.svg')}<span>Maxim Tolstickov</span></a><nav aria-label="Основная навигация"><a href="#works">Работы</a><a href="#background">Бэкграунд</a><a href="#about">Обо мне</a><button data-cv>CV</button></nav><div class="header-actions"><button class="theme-toggle" aria-label="Включить светлую тему" aria-pressed="false">${image('85b72.svg')}</button><button class="button button-muted" data-cv>CV</button><a class="button" href="https://t.me/malasa1308" target="_blank" rel="noopener noreferrer">Telegram</a></div></header><main id="top"><section class="hero" aria-label="О дизайнере"><div class="hero-art">${image('70240.png','Максим Толстиков — карточка продуктового дизайнера')}</div><h1>Работал <span class="only-symbol">${image('661f3.svg')}</span> в Only — топ-10 digital-студий РФ, перезапустил стартап «дизайнерс», сейчас делаю реддизайн <span class="bank-symbol">${Array(4).fill(image('b6a88.svg')).join('')}</span> B2B-банка</h1></section><div class="projects" id="works"><section class="project" id="designers"><div class="project-heading"><div><h2>${image('4a1d5.svg')}Дизайнерс</h2><p class="meta">UGC / AGC <span>·</span> 2023—2024</p><p class="description">Отвечал за весь редизайн продукта — от исследований и концепта до релиза на прод. В итоге за четыре квартала 2025 года проект заработал рекордную выручку, MAU вырос с ~80 000 до ~150 000, UGR поднялся со среднемесячных ~200 до ~600, а ER — с ~1,5 до ~5</p></div><button class="button" data-open-project="designers">Смотреть проект</button></div>${designer}</section><section class="project bank-project" id="sovcombank"><div class="project-heading"><div><h2>${image('c46c8.svg')}Совкомбанк</h2><p class="meta">B2B <span>·</span> 2025—2027</p><p class="description">В стриме ВЭД работал над редизайном продукта для малого и среднего бизнеса, а также корпоративных клиентов.</p></div><button class="button" data-open-project="sovcombank">Смотреть проект</button></div>${bank}<div class="archive"><div class="archive-art">${old}</div><p>Мои концепты и старые дизайн-проекты</p><button class="button" data-open-project="archive">Смотреть проект</button></div></section></div><section class="background" id="background"><div class="section-intro">${image('12195.svg','','star')}<h2>Бэкграунд</h2><p>За время работы успел позаниматься задачами с высокой степенью неопределённости, поработать в разных направлениях, а также поучаствовать в кросс-командных проектах с большим количеством согласующих.</p></div><div class="experience-list">${[['Совкомбанк','Финтех','Jun 2020 — Jul 2021','7b1cb.png'],['Дизайнерс','UGC/AGC','Jun 2020 — Jul 2021','69745.png'],['Only','Студия','May 2019 — May 2020','56fb6.png']].map(([title,area,date,icon])=>`<article class="experience"><div><h3>${title}</h3><p>${area}</p><p>${date}</p></div>${image(icon,title)}</article>`).join('')}</div></section>${about}<section class="education" id="education"><div class="education-art" aria-hidden="true">${education}</div><div class="education-content"><h2>Образование</h2><div class="courses">${courses.map(([name,date])=>`<div class="course">${arrow}<div><h3>${name}</h3><p>${date}</p></div>${image('12809.svg','','edu-arrow')}</div>`).join('')}</div></div></section></main><footer><a class="footer-avatar" href="#top" aria-label="Наверх">${image('ce4b1.svg')}</a><div class="copyright"><p>© 2026 Maxim Tolstickov</p><p>All rights belong to the mentioned companies.</p></div><nav class="footer-links" aria-label="Контакты">${contacts}</nav><div class="stickers" aria-hidden="true">${[['ER','yellow'],['Ui design','blue'],['Product design','pink'],['Art-direction','mint'],['Сoncept design','orange'],['Vibe coding','lime'],['Design system','coral'],['AI','yellow'],['Github','white'],['AI','yellow'],['Chat GTP','blue'],['Claud code','pink'],['Cursor','orange']].map(([t,c],i)=>`<span class="sticker ${c} sticker-${i}">${t}</span>`).join('')}</div></footer><dialog id="project-dialog"><div class="dialog-head"><h2 id="dialog-title"></h2><button class="close-button" aria-label="Закрыть">✕</button></div><div id="dialog-body"></div></dialog><div class="toast" role="status" hidden></div></body></html>`;
const dots='<div class="dotfield" aria-hidden="true">'+Array(345).fill('<img src="assets/d8251.svg" alt="">').join('')+'</div>';
const preparedHtml=html.replace(`<div class="archive-art">${old}</div>`,`<button class="archive-art" type="button" data-open-project="archive" aria-label="Открыть папку с архивными проектами">${old}</button>`)
 .replace(image('ce4b1.svg'),footerPortrait)
 .replace('<script src="app.js" defer></script>','<link rel="stylesheet" href="motion.css"><link rel="stylesheet" href="stickers.css"><link rel="stylesheet" href="education.css"><link rel="stylesheet" href="about.css"><script src="app.js" defer></script><script src="vendor/matter.min.js" defer></script><script src="stickers.js" defer></script>')
 .replace('<div class="stickers" aria-hidden="true">','<div class="stickers" role="group" aria-label="Интерактивные плашки">')
 .replace(/<span class="sticker ([^"]+)">([^<]+)<\/span>/g,(_,classes,label)=>`<button type="button" class="sticker ${classes}" aria-label="Подбросить ${label}">${label}</button>`);
fs.writeFileSync('dist/index.html',preparedHtml.replace('<div class="hero-art">',dots+'<div class="hero-art">').replace('<footer>','<footer id="footer">'+dots));
// Keep the supplied CSS keyframes and durations for the animated project artwork.
const motion=JSON.parse(fs.readFileSync(path.join(ref,'motion.json'),'utf8'));
for(const n of motion.nodes??[]){let snippet=n.codeSnippets?.css;if(!snippet)continue;const properties=snippet.match(/@property[^}]+}/g)||[];snippet=snippet.replace(/@property[^}]+}/g,'');const at=snippet.indexOf('@keyframes');if(at<0)continue;let declarations=snippet.slice(0,at);if(html.includes(`data-motion-wrapper-for="${n.nodeId}"`)){const base=declarations.match(/rotate\(var\(--rotate-transform, ([^)]+)\)\)/)?.[1];if(base)declarations=declarations.replace(/rotate\(var\(--rotate-transform, ([^)]+)\)\)/,'rotate(calc(var(--rotate-transform, $1) - $1))');css.push(`[data-motion-wrapper-for="${n.nodeId}"]>div>div{opacity:1}`);}css.push(...properties,`[data-node-id="${n.nodeId}"]{${declarations}}`,snippet.slice(at));}
css.push('@media(prefers-reduced-motion:reduce){[data-node-id]{animation:none!important}}');
fs.writeFileSync('dist/artwork.css',css.join('\n'));
console.log(JSON.stringify({generated:'dist/index.html',artworkRules:rules.size,unhandledClasses:[...unknown]}));
