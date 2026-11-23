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
