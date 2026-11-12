(() => {
  const video = document.querySelector('.hero-art video');
  if (!video) return;

  const art = video.parentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const chromium = /(?:Chrome|Chromium|Edg|OPR)\//.test(navigator.userAgent);
  const supported = chromium && video.canPlayType('video/webm; codecs="vp9"') !== '';
  video.playbackRate = 0.8;

  const syncPlayback = () => {
    if (!supported || reducedMotion.matches) {
      art.classList.remove('hero-art-playing');
      video.pause();
      return;
    }
    video.play().catch(() => art.classList.remove('hero-art-playing'));
  };

  video.addEventListener('playing', () => {
    if (supported && !reducedMotion.matches) art.classList.add('hero-art-playing');
  });
  video.addEventListener('error', () => art.classList.remove('hero-art-playing'));
  reducedMotion.addEventListener('change', syncPlayback);
  syncPlayback();
})();
