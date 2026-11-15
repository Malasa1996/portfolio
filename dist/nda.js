// Vanilla adapter for molefrog/spoiled (Unlicense): the original painter runs
// as a CSS Paint Worklet, with the same painter on Canvas where Houdini is absent.
(() => {
  const button = document.querySelector('#sovcombank .nda-spoiler');
  if (!button) return;

  const canvas = button.querySelector('canvas');
  const noise = button.querySelector('.nda-spoiler__noise');
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const source = new URL('./vendor/spoiled-worklet.js', document.currentScript.src);
  const fps = 24;
  const fade = 2; // The dark heading in spoiled's demo uses noiseFadeDuration={2}.
  let mode = 'loading';
  let painter;
  let visible = false;
  let frame = 0;
  let clock = 0;
  let previous = 0;
  let stop = Infinity;

  button.style.setProperty('--words', 'false'); // Original block-element behavior.
  button.style.setProperty('--density', '0.25');
  button.style.setProperty('--accent', '0deg 0% 100%'); // theme="dark", default accent.
  button.style.setProperty('--fade', `${fade}s`);
  button.style.setProperty('--t', '0.000');
  noise.style.setProperty('--words', 'true');
  noise.style.setProperty('--density', '0.25');
  noise.style.setProperty('--accent', '0deg 0% 100%');
  noise.style.setProperty('--fade', `${fade}s`);
  noise.style.setProperty('--t', '0.000');

  const revealed = () => button.classList.contains('is-revealed');
  const properties = {
    get(name) {
      return button.style.getPropertyValue(name) || undefined;
    },
  };

  function draw() {
    if (mode !== 'canvas' || !painter || !ctx) return;
    painter.paint(ctx, { width: canvas.width, height: canvas.height }, properties);
    button.classList.add('is-ready');
  }

  function render() {
    button.style.setProperty('--t', clock.toFixed(3));
    noise.style.setProperty('--t', clock.toFixed(3));
    if (mode === 'canvas') draw();
  }

  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches) return;
    if (revealed() && clock > stop + fade) {
      if (mode === 'canvas') ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    frame = requestAnimationFrame(tick);
    const dt = now - previous;
    if (dt > 0 && dt < 1000 / fps) return;
    clock += dt / 1000;
    previous = now;
    render();
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!visible || document.hidden || mode === 'loading') return;
    if (reduced.matches) {
      if (revealed()) {
        if (mode === 'canvas') ctx.clearRect(0, 0, canvas.width, canvas.height);
        else noise.style.background = 'none';
      } else {
        clock = fade;
        button.style.removeProperty('--t-stop');
        noise.style.removeProperty('--t-stop');
        if (mode === 'worklet') noise.style.background = `paint(spoiler) repeat left center / 333px ${Math.min(...[...noise.getClientRects()].map(rect => rect.height))}px`;
        render();
      }
      return;
    }
    if (mode === 'worklet' && noise.style.background === 'none') resize();
    previous = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function resize() {
    const gap = Math.floor(Math.min(6, button.clientWidth / 8, button.clientHeight / 8));
    button.style.setProperty('--gap', `${gap}px ${gap}px`);
    const lineHeight = Math.min(...[...noise.getClientRects()].map(rect => rect.height));
    noise.style.setProperty('--gap', `0px ${Math.floor(Math.min(lineHeight / 8, 6))}px`);
    if (mode === 'worklet' && Number.isFinite(lineHeight)) {
      noise.style.background = `paint(spoiler) repeat left center / 333px ${lineHeight}px`;
    }
    if (mode === 'canvas' && ctx) {
      const dpr = Math.max(1, devicePixelRatio);
      canvas.width = Math.round(button.clientWidth * dpr);
      canvas.height = Math.round(button.clientHeight * dpr);
      if (visible && !revealed()) draw();
    }
  }

  button.addEventListener('click', event => {
    event.stopPropagation();
    const isOpen = button.classList.toggle('is-revealed');
    button.setAttribute('aria-pressed', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Скрыть название банка' : 'Раскрыть название банка');
    if (isOpen) {
      stop = clock;
      button.style.setProperty('--t-stop', stop.toFixed(3));
      noise.style.setProperty('--t-stop', stop.toFixed(3));
    } else {
      clock = 0;
      stop = Infinity;
      button.style.removeProperty('--t-stop');
      noise.style.removeProperty('--t-stop');
      render();
    }
    sync();
  });

  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }, { threshold: 0.1 });
  observer.observe(button);
  const sizes = new ResizeObserver(resize);
  sizes.observe(button);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    sizes.disconnect();
  }, { once: true });

  const canvasFallback = () => import(source).then(module => {
    if (!ctx) return;
    painter = new module.SpoilerPainterWorklet();
    mode = 'canvas';
    resize();
    sync();
  }).catch(() => {
    canvas.style.display = 'none';
  });

  if (CSS.paintWorklet) {
    CSS.paintWorklet.addModule(source.href).then(() => {
      mode = 'worklet';
      canvas.style.display = 'none';
      button.classList.add('is-worklet');
      button.classList.add('is-ready');
      resize();
      sync();
    }).catch(canvasFallback);
  } else {
    canvasFallback();
  }
})();
