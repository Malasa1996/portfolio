(() => {
  const canvas = document.querySelector('.hero-dust');
  if (!canvas || canvas.dataset.ready) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  canvas.dataset.ready = 'true';

  const hero = canvas.parentElement;
  const art = hero.querySelector('.hero-art');
  const copy = hero.querySelector('.hero-copy');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const tau = Math.PI * 2;
  let width = 0;
  let height = 0;
  let particles = [];
  let frame = 0;
  let elapsed = 0;
  let lastTime = 0;
  let lastPaint = 0;
  let inView = true;
  let safe = { left: 0, right: 0, bottom: 0 };

  function visibility(x, y) {
    return Math.max(0, Math.min(1, Math.max(safe.left - x, x - safe.right, y - safe.bottom) / 32));
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      const time = reducedMotion.matches ? 0 : elapsed * 1.2;
      const driftX = particle.x + particle.vx * time / 1000 + Math.sin(time * .00035 + particle.phase) * 3;
      const driftY = particle.y + particle.vy * time / 1000 + Math.cos(time * .00027 + particle.phase) * 2;
      const x = (driftX % width + width) % width;
      const y = (driftY % height + height) % height;
      const alpha = particle.alpha * visibility(x, y);
      if (!alpha) continue;
      context.fillStyle = `rgba(227, 237, 255, ${alpha})`;
      context.beginPath();
      context.arc(x, y, particle.radius, 0, tau);
      context.fill();
    }
  }

  function resize() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    if (!width || !height) return;
    const pageScale = window.pageScale?.() || 1;
    const pixelRatio = Math.min(2, devicePixelRatio * pageScale);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const heroBox = hero.getBoundingClientRect();
    const artBox = art.getBoundingClientRect();
    const copyBox = copy.getBoundingClientRect();
    const scaleX = width / heroBox.width;
    const scaleY = height / heroBox.height;
    safe.left = Math.max(0, (Math.min(artBox.left, copyBox.left) - heroBox.left) * scaleX - 32);
    safe.right = Math.min(width, (Math.max(artBox.right, copyBox.right) - heroBox.left) * scaleX + 32);
    const maxSafeWidth = width * .84;
    if (safe.right - safe.left > maxSafeWidth) {
      safe.left = (width - maxSafeWidth) / 2;
      safe.right = (width + maxSafeWidth) / 2;
    }
    safe.bottom = Math.min(height * .9, (Math.max(artBox.bottom, copyBox.bottom) - heroBox.top) * scaleY + 32);
    const visibleHeight = Math.min(height, innerHeight / pageScale);
    const safeWidth = safe.right - safe.left;
    const visibleArea = (width - safeWidth) * visibleHeight + safeWidth * Math.max(0, visibleHeight - safe.bottom);
    const targetCount = Math.max(24, Math.min(320, Math.round(280 * width * visibleHeight / (1440 * 900))));
    const count = Math.min(targetCount, Math.max(12, Math.round(visibleArea / 1400)));
    particles = Array.from({ length: count }, () => {
      const angle = Math.random() * tau;
      const speed = .6 + Math.random() * 1.6;
      let x, y, attempts = 0;
      do {
        x = Math.random() * width;
        y = Math.random() * height;
      } while (visibility(x, y) < .5 && ++attempts < 40);
      if (visibility(x, y) < .5) y = height * (.94 + Math.random() * .06);
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        phase: Math.random() * tau,
        radius: .3 + Math.random() * .6,
        alpha: (.16 + Math.random() * .13) * 1.15
      };
    });
    draw();
  }

  function tick(now) {
    frame = 0;
    if (document.hidden || !inView || reducedMotion.matches) return;
    if (lastTime) elapsed += Math.min(now - lastTime, 50);
    lastTime = now;
    if (now - lastPaint >= 32) {
      draw();
      lastPaint = now;
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    if (!document.hidden && inView && !reducedMotion.matches) frame = requestAnimationFrame(tick);
    else draw();
  }

  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }).observe(hero);
  resize();
  sync();
})();
