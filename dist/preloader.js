(() => {
  const loader = document.querySelector('.site-preloader');
  if (!loader) return;
  const label = loader.querySelector('.site-preloader__text');
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
  };
  if (document.readyState === 'complete') hide();
  else window.addEventListener('load', hide, { once: true });
})();
