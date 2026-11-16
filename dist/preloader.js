(() => {
  const loader = document.querySelector('.site-preloader');
  if (!loader) return;
  const label = loader.querySelector('.site-preloader__text');
  const content = loader.querySelector('.site-preloader__content');
  const dust = document.createElement('canvas');
  dust.className = 'site-preloader__dust';
  dust.setAttribute('aria-hidden', 'true');
  loader.prepend(dust);
  const context = dust.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const tau = Math.PI * 2;
  let width = 0, height = 0, particles = [], dustFrame = 0, elapsed = 0, lastTime = 0, lastPaint = 0;
  let safe = { left: 0, right: 0, top: 0, bottom: 0 };

  function visibility(x, y) {
    const distance = Math.max(safe.left - x, x - safe.right, safe.top - y, y - safe.bottom);
    return Math.max(0, Math.min(1, distance / 32));
  }
  function drawDust() {
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      const time = reducedMotion.matches ? 0 : elapsed * 1.44;
      const x = ((particle.x + particle.vx * time / 1000 + Math.sin(time * .00035 + particle.phase) * 3) % width + width) % width;
      const y = ((particle.y + particle.vy * time / 1000 + Math.cos(time * .00027 + particle.phase) * 2) % height + height) % height;
      const alpha = particle.alpha * visibility(x, y);
      if (!alpha) continue;
      context.fillStyle = `rgba(227, 237, 255, ${alpha})`;
      context.beginPath();
      context.arc(x, y, particle.radius, 0, tau);
      context.fill();
    }
  }
  function resizeDust() {
    width = loader.clientWidth;
    height = loader.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(2, devicePixelRatio);
    dust.width = Math.round(width * ratio);
    dust.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const box = content.getBoundingClientRect();
    const parent = loader.getBoundingClientRect();
    safe = { left: box.left - parent.left - 32, right: box.right - parent.left + 32,
      top: box.top - parent.top - 32, bottom: box.bottom - parent.top + 32 };
    const count = Math.max(34, Math.min(257, Math.round(229 * width * height / (1440 * 900))));
    particles = Array.from({ length: count }, () => {
      const angle = Math.random() * tau;
      const speed = .6 + Math.random() * 1.6;
      let x, y, attempts = 0;
      do { x = Math.random() * width; y = Math.random() * height; }
      while (visibility(x, y) < .5 && ++attempts < 40);
      return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        phase: Math.random() * tau, radius: .3 + Math.random() * .6,
        alpha: (.16 + Math.random() * .13) * 1.3225 };
    });
    drawDust();
  }
  function tickDust(now) {
    dustFrame = 0;
    if (document.hidden || reducedMotion.matches || loader.classList.contains('is-hidden')) return;
    if (lastTime) elapsed += Math.min(now - lastTime, 50);
    lastTime = now;
    if (now - lastPaint >= 32) { drawDust(); lastPaint = now; }
    dustFrame = requestAnimationFrame(tickDust);
  }
  function syncDust() {
    cancelAnimationFrame(dustFrame);
    dustFrame = 0;
    lastTime = 0;
    if (!document.hidden && !reducedMotion.matches && !loader.classList.contains('is-hidden')) dustFrame = requestAnimationFrame(tickDust);
    else drawDust();
  }
  addEventListener('resize', resizeDust);
  document.addEventListener('visibilitychange', syncDust);
  reducedMotion.addEventListener('change', syncDust);
  resizeDust();
  syncDust();
  const phrase = document.createElement('span');
  const dots = document.createElement('span');
  dots.className = 'site-preloader__dots';
  dots.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.textContent = '.';
    dots.append(dot);
  }
  label.replaceChildren(phrase, dots);
  const phrases = ['Открываю фигму', 'Собираю компоненты', 'Рисую макет'];
  phrase.textContent = phrases[0];
  let index = 0;
  const timer = setInterval(() => {
    index = (index + 1) % phrases.length;
    phrase.textContent = phrases[index];
  }, 3000);
  const localPreview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
    && new URLSearchParams(location.search).get('preview') === 'preloader';
  if (matchMedia('(max-width: 760px)').matches && document.querySelector('main .projects')) {
    const savedY = window.scrollY;
    const saved = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };
    Object.assign(document.body.style, {
      position: 'fixed', top: `-${savedY}px`, width: '100%', overflow: 'hidden'
    });
    if (localPreview) return;
    const reveal = () => {
      clearInterval(timer);
      loader.classList.add('is-hidden');
      loader.setAttribute('aria-hidden', 'true');
      syncDust();
      Object.assign(document.body.style, saved);
      window.scrollTo(0, savedY);
    };
    const ready = async () => {
      const hero = document.querySelector('.hero-art img');
      await Promise.all([
        document.fonts.ready,
        hero?.decode?.().catch(() => {})
      ]);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    };
    Promise.race([
      ready(),
      new Promise(resolve => setTimeout(resolve, 8000))
    ]).then(reveal, reveal);
    return;
  }
  if (localPreview) return;
  const hide = () => {
    clearInterval(timer);
    loader.classList.add('is-hidden');
    loader.setAttribute('aria-hidden', 'true');
    syncDust();
  };
  if (document.readyState === 'complete') hide();
  else window.addEventListener('load', hide, { once: true });
})();
