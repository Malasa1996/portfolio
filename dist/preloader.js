(() => {
  const loader = document.querySelector('.site-preloader');
  if (!loader) return;
  const label = loader.querySelector('.site-preloader__text');
  const phrases = ['Открываю фигму...', 'Собираю компоненты...', 'Рисую макет...', 'Пью пиво...'];
  let index = 0;
  const timer = setInterval(() => {
    index = (index + 1) % phrases.length;
    label.textContent = phrases[index];
  }, 3000);
  const localPreview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
    && new URLSearchParams(location.search).get('preview') === 'preloader';
  if (localPreview) return;
  const hide = () => {
    clearInterval(timer);
    loader.classList.add('is-hidden');
    loader.setAttribute('aria-hidden', 'true');
  };
  if (document.readyState === 'complete') hide();
  else window.addEventListener('load', hide, { once: true });
})();
