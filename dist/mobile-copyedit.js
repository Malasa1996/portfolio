(() => {
  const mobile = matchMedia('(max-width: 760px)');
  const isHome = !!document.querySelector('main .projects');
  const isDesigners = document.body.classList.contains('designers-case-page');
  const isPayments = !!document.querySelector('.case-artboard');
  if (!isHome && !isDesigners && !isPayments) return;
  if (isPayments) return;

  const selector = isHome
    ? 'main .project-heading .description, main .section-intro > p'
    : isDesigners
      ? 'p.ds-body:not(.ds-metrics-label), p.desk-research-intro, p.survey-intro, .survey-findings > p'
      : '.case-artboard > p.case-text.hero-intro, .case-artboard > p.case-text.body, .case-artboard > p.case-text.role-bullet';
  const paragraphs = [...document.querySelectorAll(selector)];
  const entries = paragraphs.map(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const text = [];
    while (walker.nextNode()) text.push([walker.currentNode, walker.currentNode.nodeValue]);
    return { element, text, period: null };
  });
  const shortWord = /(^|[\s(«„])(в|во|на|с|со|к|ко|у|о|об|от|до|за|из|по|для|при|и|а|но)( +)(?=\S)/giu;
  const commaEdits = isPayments ? [
    ['разобрался как банк', 'разобрался, как банк'],
    ['выяснил что законодательство', 'выяснил, что законодательство']
  ] : [];
  let applied = false;

  function restore() {
    if (!applied) return;
    for (const entry of entries) {
      if (entry.period?.isConnected) entry.period.remove();
      entry.period = null;
      if (!isHome) {
        for (const [node, value] of entry.text) {
          if (node.isConnected) node.nodeValue = value;
        }
      }
    }
    applied = false;
  }

  function protectLineEndings(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let count = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue === '.') continue;
      for (let pass = 0; pass < 12; pass++) {
        let changed = false;
        const matches = [...node.nodeValue.matchAll(shortWord)];
        for (const match of matches.reverse()) {
          const end = match.index + match[1].length + match[2].length;
          const next = end + match[3].length;
          const before = document.createRange();
          const after = document.createRange();
          before.setStart(node, end - 1);
          before.setEnd(node, end);
          after.setStart(node, next);
          after.setEnd(node, next + 1);
          const beforeTop = before.getClientRects()[0]?.top;
          const afterTop = after.getClientRects()[0]?.top;
          if (beforeTop == null || afterTop == null || afterTop - beforeTop <= 1) continue;
          node.nodeValue = node.nodeValue.slice(0, end) + '\u00a0' + node.nodeValue.slice(next);
          count++;
          changed = true;
        }
        if (!changed) break;
      }
    }
    return count;
  }

  function sync() {
    restore();
    if (!mobile.matches) return;
    const stats = { periods: 0, commas: 0, lineEndings: 0 };
    for (const entry of entries) {
      const { element } = entry;
      if (!element.getClientRects().length) continue;
      const value = element.textContent.trim();
      if (!value || /[:.!?…]$/.test(value) || value === 'Бенчмаркинг') continue;
      for (const [from, to] of commaEdits) {
        for (const [node] of entry.text) {
          if (!node.isConnected || !node.nodeValue.includes(from)) continue;
          node.nodeValue = node.nodeValue.replace(from, to);
          stats.commas++;
        }
      }
      entry.period = document.createTextNode('.');
      element.append(entry.period);
      stats.periods++;
      if (!isHome) stats.lineEndings += protectLineEndings(element);
    }
    window.__mobileCopyeditStats = stats;
    applied = true;
  }

  let frame;
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(sync);
  }
  mobile.addEventListener('change', schedule);
  addEventListener('resize', schedule);
  if (isDesigners) document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('toggle', schedule));
  document.fonts.ready.then(schedule);
  schedule();
})();
