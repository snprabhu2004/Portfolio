/* Kiosk case study: replays the redesigned receipt screen while it is on screen. */
(() => {
  'use strict';
  const kx = document.querySelector('.kx');
  if (!kx) return;
  const rows = [...kx.querySelectorAll('.kx__list li')];
  const bars = [...kx.querySelectorAll('.kx__bars li')];
  const slips = [...kx.querySelectorAll('.kx__r')];
  const num = kx.querySelector('.kx__n');
  const replay = document.querySelector('.kx__replay');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const LABEL = { wait: 'Waiting', print: 'Printing', done: 'Printed' };
  const STEP = 1700, HOLD = 3600;
  let timers = [], visible = false;

  // done = receipts already out; printing = index of the receipt coming out now (-1 for none)
  const render = (done, printing) => {
    rows.forEach((r, i) => {
      const s = i < done ? 'done' : i === printing ? 'print' : 'wait';
      if (r.dataset.s !== s) { r.dataset.s = s; r.querySelector('.kx__st').textContent = LABEL[s]; }
    });
    bars.forEach((b, i) => b.classList.toggle('is-on', i < done));
    slips.forEach((s, i) => { s.classList.toggle('is-out', i < done); s.classList.toggle('is-printing', i === printing); });
    if (num.textContent !== String(done)) {
      num.textContent = done;
      num.classList.remove('bump'); void num.offsetWidth; num.classList.add('bump');
    }
    kx.classList.toggle('is-done', done === rows.length);
    kx.classList.toggle('is-printing', printing >= 0);
  };

  const stop = () => { timers.forEach(clearTimeout); timers = []; };
  const play = () => {
    stop();
    if (reduce.matches) { render(rows.length, -1); return; }
    render(0, 0);
    for (let i = 1; i <= rows.length; i++) {
      timers.push(setTimeout(() => render(i, i < rows.length ? i : -1), STEP * i));
    }
    timers.push(setTimeout(() => { if (visible) play(); }, STEP * rows.length + HOLD));
  };

  render(rows.length, -1); // finished state until it scrolls into view
  if (replay) {
    replay.hidden = reduce.matches;
    replay.addEventListener('click', play);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => {
      const was = visible; visible = e.isIntersecting;
      if (visible && !was) play();
      if (!visible) { stop(); render(rows.length, -1); }
    }), { threshold: .45 }).observe(kx);
  }
  reduce.addEventListener?.('change', () => { if (replay) replay.hidden = reduce.matches; play(); });
})();

/* Mobile: show where content scrolls sideways (diagrams, flow steps).
   A "Swipe to see more" label with a scroll bar under each scroller, and a one-time peek when it first comes into view. */
(() => {
  'use strict';
  const els = [...document.querySelectorAll('.cs-scroll, .cs-steps')];
  if (!els.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  els.forEach(el => {
    const hint = document.createElement('div');
    hint.className = 'cs-swipe';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '<span class="cs-swipe__label">Swipe to see more<svg viewBox="0 0 24 12"><path d="M1 6h20m-5-5 5 5-5 5"/></svg></span><span class="cs-swipe__track"><span class="cs-swipe__thumb"></span></span>';
    el.after(hint);
    const thumb = hint.querySelector('.cs-swipe__thumb');
    let peeked = false;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const can = max > 2;
      hint.hidden = !can;
      el.classList.toggle('is-scrollable', can);
      // Keyboard users can focus the scroller and use the arrow keys (the diagrams already have tabindex).
      if (el.classList.contains('cs-steps')) {
        if (can) { el.tabIndex = 0; el.setAttribute('aria-label', 'Ordering flow, five steps (scrolls sideways)'); }
        else { el.removeAttribute('tabindex'); el.removeAttribute('aria-label'); }
      }
      if (!can) return;
      const r = el.clientWidth / el.scrollWidth;
      thumb.style.width = (r * 100).toFixed(2) + '%';
      thumb.style.transform = `translateX(${((el.scrollLeft / max) * (1 / r - 1) * 100).toFixed(2)}%)`;
      if (el.scrollLeft > 8) hint.classList.add('is-used');
    };
    el.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    addEventListener('resize', update);
    update();
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting || peeked || reduce.matches || !el.classList.contains('is-scrollable') || el.scrollLeft > 8) return;
        peeked = true; io.disconnect();
        el.classList.add('cs-peek');
        setTimeout(() => el.classList.remove('cs-peek'), 1400);
      }), { threshold: .6 });
      io.observe(el);
    }
  });
})();
