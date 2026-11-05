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

const beforeAfter = document.querySelector('.before-after');
if (beforeAfter) {
  const handle = beforeAfter.querySelector('[role="slider"]');
  let split = 50;
  let dragging = false;
  const setSplit = value => {
    split = Math.max(0, Math.min(100, Math.round(value)));
    beforeAfter.style.setProperty('--split', `${split}%`);
    handle.setAttribute('aria-valuenow', String(split));
    handle.setAttribute('aria-valuetext', `${split}% прежнего дизайна`);
  };
  const updateFromPointer = event => {
    const rect = beforeAfter.getBoundingClientRect();
    setSplit((event.clientX - rect.left) / rect.width * 100);
  };
  beforeAfter.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    dragging = true;
    beforeAfter.setPointerCapture(event.pointerId);
    updateFromPointer(event);
    event.preventDefault();
  });
  beforeAfter.addEventListener('pointermove', event => {
    if (dragging) updateFromPointer(event);
  });
  const stopDragging = () => { dragging = false; };
  beforeAfter.addEventListener('pointerup', stopDragging);
  beforeAfter.addEventListener('pointercancel', stopDragging);
  beforeAfter.addEventListener('lostpointercapture', stopDragging);
  handle.addEventListener('keydown', event => {
    const next = {
      ArrowLeft: split - 5,
      ArrowDown: split - 5,
      ArrowRight: split + 5,
      ArrowUp: split + 5,
      Home: 0,
      End: 100,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setSplit(next);
  });
}
