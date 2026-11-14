const stage = document.querySelector('.stage');
const reactions = [...stage.querySelectorAll('.reaction img')];
const pointer = stage.querySelector('.pointer');
const positions = [0, 57.915, 115.831, 173.746, 231.661];
const TIME_SCALE = 1.25;
let current = -1;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function animate(node, frames, duration, delay = 0, easing = 'ease-out') {
  const effect = node.animate(frames, { duration: duration * TIME_SCALE, delay: delay * TIME_SCALE, easing });
  return effect.finished.catch(() => {});
}
function schedule(callback, delay) {
  return setTimeout(callback, delay * TIME_SCALE);
}
function emit(kind, x, y, size, frames, duration, delay = 0, color = '') {
  const part = document.createElement(kind === 'heart' ? 'img' : 'span');
  part.className = 'fx ' + kind;
  if (kind === 'heart') { part.src = reactions[0].src; part.alt = ''; }
  part.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;${color ? 'background:'+color : ''}`;
  stage.append(part);
  animate(part, frames, duration, delay).then(() => part.remove());
}
function play(i) {
  if (reduced.matches) return;
  const img = reactions[i];
  img.getAnimations().forEach(a => a.cancel());
  const b = img.getBoundingClientRect(), s = stage.getBoundingClientRect();
  const scaleX = stage.offsetWidth / s.width, scaleY = stage.offsetHeight / s.height;
  const x = (b.left-s.left+b.width/2)*scaleX;
  const y = (b.top-s.top+b.height/2)*scaleY;
  const w = b.width*scaleX, k = w/24;
  const at = (dx,dy,extra='') => `translate(-50%,-50%) translate(${dx}px,${dy}px) ${extra}`;
  if (i === 0) {
    animate(img,[{transform:'scale(1)'},{transform:'scale(1.38)',offset:.16},{transform:'scale(.92)',offset:.34},{transform:'scale(1.26)',offset:.5},{transform:'scale(1)',offset:.78},{transform:'scale(1)'}],680);
    [[-10,-30,40],[10,-38,210],[-1,-46,340]].forEach(([dx,dy,delay]) => emit('heart',x,y-w*.1,9*k,[{transform:at(0,0,'scale(.3)'),opacity:0},{transform:at(dx*.3*k,dy*.3*k,'scale(1)'),opacity:1,offset:.25},{transform:at(dx*k,dy*k,'scale(.75)'),opacity:0}],800,delay));
  } else if (i === 1) {
    animate(img,[{transform:'rotate(0deg)'},{transform:`rotate(-16deg) translateY(${-2*k}px)`,offset:.14},{transform:'rotate(14deg)',offset:.3},{transform:`rotate(-12deg) translateY(${-2*k}px)`,offset:.46},{transform:'rotate(9deg)',offset:.62},{transform:'rotate(-4deg)',offset:.8},{transform:'rotate(0deg)'}],620,0,'ease-in-out');
    for (const side of [-1,1]) for(let n=0;n<3;n++) { const a=side*(55+n*35); emit('stroke',x,y,2*k,[{transform:at(0,0,`rotate(${a}deg) translateY(${-w*.62}px) scaleY(.2)`),opacity:0},{transform:at(0,0,`rotate(${a}deg) translateY(${-w*.74}px)`),opacity:1,offset:.4},{transform:at(0,0,`rotate(${a}deg) translateY(${-w*.86}px) scaleY(.3)`),opacity:0}],360,40+n*45+(side>0?150:0)); }
  } else if (i === 2) {
    animate(img,[{transform:`translateY(${-13*k}px) rotate(-10deg)`,opacity:0},{transform:`translateY(${-11.7*k}px) rotate(-9deg)`,opacity:1,offset:.08},{transform:'translateY(0) rotate(0deg)'}],250);
    animate(img,[{transform:'scale(1.16,.8)'},{transform:'scale(.95,1.05)',offset:.4},{transform:'scale(1,1)'}],300,250);
    for(const side of [-1,1]) for(let n=0;n<2;n++) emit('dust',x+side*w*.42,y+w*.4,(n?4.5:6.5)*k,[{transform:at(0,0,'scale(.3)'),opacity:0},{transform:at(side*2*k,0,'scale(.5)'),opacity:.9,offset:.06},{transform:at(side*(15+n*8)*k,-(3+n*4)*k,'scale(1.3)'),opacity:0}],520,250+n*50);
  } else if (i === 3) {
    img.style.transformOrigin='50% 88%';
    animate(img,[{transform:'scale(1,1) skewX(0deg)'},{transform:'scale(.9,1.34) skewX(-6deg)',offset:.18},{transform:'scale(1.07,1.12) skewX(5deg)',offset:.36},{transform:'scale(.96,1.26) skewX(-4deg)',offset:.54},{transform:'scale(1.03,1.05) skewX(2deg)',offset:.74},{transform:'scale(1,1) skewX(0deg)'}],720,0,'ease-in-out').then(()=>img.style.transformOrigin='');
    for(let n=0;n<5;n++) { const dx=(n-2)*5*k,dy=-(26+n*4)*k; emit('spark',x+(n-2)*w*.1,y-w*.25,3*k,[{transform:at(0,0,'scale(1)'),opacity:0},{transform:at(dx*.1,dy*.15,'scale(1)'),opacity:1,offset:.12},{transform:at(-dx*.35,dy*.55,'scale(.8)'),opacity:1,offset:.55},{transform:at(dx,dy,'scale(.2)'),opacity:0}],620+n*40,90+n*60); }
  } else {
    animate(img,[{transform:'scale(1) rotate(0deg)'},{transform:'scale(.8) rotate(-5deg)',offset:.1},{transform:'scale(.78) rotate(5deg)',offset:.2},{transform:'scale(.8) rotate(-4deg)',offset:.3},{transform:'scale(.8) rotate(3deg)',offset:.4},{transform:'scale(1.55) rotate(0deg)',offset:.5},{transform:'scale(.92) rotate(0deg)',offset:.68},{transform:'scale(1.04) rotate(0deg)',offset:.84},{transform:'scale(1) rotate(0deg)'}],720);
    emit('ring',x,y,w*1.1,[{transform:at(0,0,'scale(.4)'),opacity:0},{transform:at(0,0,'scale(.5)'),opacity:1,offset:.05},{transform:at(0,0,'scale(2.2)'),opacity:0}],480,330);
    const colors=['#D5F839','#FF72FF','#4772FF','#FFAA48'];
    for(let n=0;n<9;n++) { const a=n*40*Math.PI/180,r=(20+n%3*5)*k,dx=Math.sin(a)*r,dy=-Math.cos(a)*r; emit('fragment'+(n%3===0?' triangle':''),x,y,4*k,[{transform:at(0,0,'scale(.4)'),opacity:0},{transform:at(dx*.15,dy*.15,'scale(1)'),opacity:1,offset:.08},{transform:at(dx*.85,dy*.85,'scale(1) rotate(160deg)'),opacity:1,offset:.6},{transform:at(dx,dy,'scale(.6) rotate(210deg)'),opacity:0}],560,330,colors[n%4]); }
  }
}
function next() {
  current=(current+1)%reactions.length;
  pointer.style.transform=`translateX(${positions[current]}px)`;
  const index=current;
  schedule(()=>play(index),index===0?80:540);
  schedule(next,1850);
}
schedule(next,250);
