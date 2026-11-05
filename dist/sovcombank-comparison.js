const comparison = document.querySelector('.comparison-media');
const comparisonButtons = [...document.querySelectorAll('[data-comparison-choice]')];
const comparisonVideos = [...document.querySelectorAll('[data-comparison-video]')];

if (comparison && comparisonButtons.length === 2 && comparisonVideos.length === 2) {
  let visible = false;
  let active = 'before';
  const selectedVideo = () => comparisonVideos.find(video => video.dataset.comparisonVideo === active);
  const syncPlayback = () => {
    for (const video of comparisonVideos) {
      if (video === selectedVideo() && visible) video.play().catch(() => {});
      else video.pause();
    }
  };
  for (const button of comparisonButtons) {
    button.addEventListener('click', () => {
      active = button.dataset.comparisonChoice;
      for (const item of comparisonButtons) {
        const selected = item === button;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-pressed', String(selected));
      }
      for (const video of comparisonVideos) {
        const selected = video.dataset.comparisonVideo === active;
        if (selected && video.dataset.src && !video.src) {
          video.src = video.dataset.src;
          video.load();
        }
        video.classList.toggle('is-active', selected);
        video.setAttribute('aria-hidden', String(!selected));
        if (!selected && video.readyState > 0) video.currentTime = 0;
      }
      syncPlayback();
    });
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncPlayback();
  }, {threshold: .2});
  observer.observe(comparison);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) comparisonVideos.forEach(video => video.pause());
    else syncPlayback();
  });
}
