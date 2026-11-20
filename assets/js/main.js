/* Prabhu Natarajan — portfolio interactions. No dependencies. */
(() => {
  'use strict';
  const doc = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ---------- Year + Chennai clock ---------- */
  const yearEl = $('.year'); if (yearEl) yearEl.textContent = new Date().getFullYear();
  const clock = $('.clock');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    const tick = () => {
      const now = new Date();
      clock.textContent = fmt.format(now).toLowerCase();
      clock.setAttribute('datetime', now.toISOString());
    };
    tick(); setInterval(tick, 30000);
  }

  /* ---------- Header: theme follows the section underneath, hides on scroll down ---------- */
  const header = $('.site-header');
  const darkSections = $$('main [data-theme="dark"], .site-footer');
  let lastY = scrollY;
  const updateHeader = () => {
    const y = scrollY;
    const probe = (header.offsetHeight || 76) / 2;
    const overDark = darkSections.some(s => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom >= probe; });
    header.classList.toggle('is-light', !overDark);
    header.classList.toggle('is-solid', overDark && y > 40);
    if (!doc.classList.contains('menu-open')) header.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
  };

  /* ---------- Mobile menu ---------- */
  const toggle = $('.menu-toggle'), nav = $('#site-nav');
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.menu-toggle__label').textContent = open ? 'Close' : 'Menu';
    nav.classList.toggle('is-open', open);
    doc.classList.toggle('menu-open', open);
    if (open) { header.classList.remove('is-hidden'); nav.querySelector('a').focus(); }
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a') && nav.classList.contains('is-open')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  // Keep focus inside the open mobile menu
  nav.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !nav.classList.contains('is-open')) return;
    const items = [...$$('a', nav), toggle];
    const i = items.indexOf(document.activeElement);
    if (e.shiftKey && i === 0) { e.preventDefault(); toggle.focus(); }
  });
  toggle.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !e.shiftKey && nav.classList.contains('is-open')) { e.preventDefault(); nav.querySelector('a').focus(); }
  });
  matchMedia('(min-width: 861px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ---------- Current section in nav ---------- */
  const navLinks = $$('.site-nav ul a');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        navLinks.forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id));
        navLinks.forEach(a => { if (a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'true'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- Section-title reveal + in-view animations ---------- */
  // Titles are clipped while hidden, so observe their (unclipped) parent instead.
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target._reveal.classList.add('is-in');
      revealIO.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('.section-title, .contact__title').forEach(el => {
    el.classList.add('reveal'); el.parentElement._reveal = el; revealIO.observe(el.parentElement);
  });
  const inView = new IntersectionObserver(entries => {
    entries.forEach(en => {
      en.target.classList.toggle('is-playing', en.isIntersecting);
      en.target.classList.toggle('is-in', en.isIntersecting);
    });
  }, { threshold: .35 });
  $$('.flow, .kiosk, .skyline').forEach(el => inView.observe(el));

  /* ---------- Kiosk: receipt counter runs in time with the printing animation ---------- */
  const kiosk = $('.kiosk'), kioskN = $('.kiosk__n');
  if (kiosk && kioskN) {
    let n = 1;
    kiosk.addEventListener('animationiteration', () => { n = n % 3 + 1; kioskN.textContent = n; });
    kiosk.addEventListener('animationstart', () => { n = 1; kioskN.textContent = n; });
  }

  /* ---------- Custom cursor ---------- */
  const cursor = $('.cursor');
  const enableCursor = () => finePointer.matches && !reduceMotion.matches;
  if (cursor && enableCursor()) {
    doc.classList.add('has-cursor');
    const dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor), label = $('.cursor__label', cursor);
    let mx = -100, my = -100, rx = -100, ry = -100, raf = 0;
    const loop = () => {
      rx = lerp(rx, mx, .18); ry = lerp(ry, my, .18);
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      raf = (Math.abs(rx - mx) + Math.abs(ry - my) > .1) ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      cursor.classList.remove('is-hidden');
      if (!raf) raf = requestAnimationFrame(loop);
      const under = document.elementFromPoint(mx, my);
      const dark = under && under.closest('[data-theme="dark"]');
      cursor.classList.toggle('on-dark', !!dark);
      cursor.classList.toggle('on-red', !!(under && under.closest('.contact')));
      const tgt = under && under.closest('[data-cursor], a, button, .chips li, .step');
      const text = tgt && tgt.getAttribute('data-cursor');
      cursor.classList.toggle('has-label', !!text);
      cursor.classList.toggle('is-link', !!tgt && !text);
      if (text) label.textContent = text;
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
    addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .25, y = (e.clientY - r.top - r.height / 2) * .35;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Copy email ---------- */
  const copyBtn = $('.copy');
  if (copyBtn) {
    const lbl = $('.copy__label', copyBtn), status = $('.copy__status');
    copyBtn.addEventListener('click', async () => {
      const text = copyBtn.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; }
      catch {
        const ta = Object.assign(document.createElement('textarea'), { value: text });
        ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.append(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        ta.remove();
      }
      lbl.textContent = ok ? 'Copied' : 'Press Ctrl+C to copy';
      status.textContent = ok ? 'Email address copied to clipboard' : 'Copy failed. Select the email address to copy it.';
      copyBtn.classList.toggle('is-done', ok);
      clearTimeout(copyBtn._t);
      copyBtn._t = setTimeout(() => { lbl.textContent = 'Copy email'; copyBtn.classList.remove('is-done'); status.textContent = ''; }, 2400);
    });
  }

  /* ---------- Project galleries (native <dialog>: focus trap + Esc built in) ---------- */
  const G = {
    nebuloan: { title: 'Nebuloan — mortgage loan review', imgs: [
      ['nebuloan-list-1600.webp', 1600, 948, 'Loan list: status, progress, current stage and exceptions for every file'],
      ['nebuloan-loan-1600.webp', 1600, 1148, 'Loan view: property photos, map, address and details'],
      ['nebuloan-detail-1600.webp', 1600, 1148, 'Property location and details panel'],
      ['nebuloan-exception-1440.webp', 1440, 1029, 'Exception view, with the loan assembly line alongside'] ] },
    sba: { title: 'SBA disaster loan application', imgs: [
      ['sba-01-1440.webp', 1440, 761, 'Sign-in and registration for the COVID-19 EIDL portal'],
      ['sba-02-1440.webp', 1440, 978, 'Business information, with the step tracker and application status'],
      ['sba-03-1440.webp', 1440, 1083, 'Eligibility disclosures as simple yes/no questions'],
      ['sba-04-1440.webp', 1440, 788, 'Where to send funds: automated or manual bank entry'],
      ['sba-06-1440.webp', 1440, 788, 'Linking a bank account through Plaid'],
      ['sba-05-1440.webp', 1440, 1288, 'Account verified: choose where the funds go'] ] },
    emirates: { title: 'Emirates Raffle', imgs: [
      ['emirates-light-full-1200.webp', 1200, 3772, 'Home page, light theme'],
      ['emirates-dark-full-1200.webp', 1200, 3772, 'Home page, dark theme'],
      ['emirates-mobile-390.webp', 390, 844, 'Mobile home screen', true] ] },
    lykas: { title: 'Lykas — personal finance', imgs: [
      ['lykas-full-1200.webp', 1200, 3325, 'Full landing page, desktop'],
      ['lykas-mobile-full-390.webp', 390, 6556, 'Full landing page, mobile', true] ] }
  };
  const dlg = $('.gallery');
  let opener = null;
  const openGallery = (key, from) => {
    const g = G[key]; if (!g || !dlg) return;
    opener = from;
    $('.gallery__title', dlg).textContent = g.title;
    const body = $('.gallery__body', dlg);
    body.innerHTML = '';
    g.imgs.forEach(([src, w, h, cap, phone]) => {
      const fig = document.createElement('figure');
      const img = new Image(w, h);
      img.src = 'assets/img/' + src; img.alt = cap; img.loading = 'lazy'; img.decoding = 'async';
      if (phone) img.className = 'is-phone';
      const fc = document.createElement('figcaption'); fc.textContent = cap;
      fig.append(img, fc); body.append(fig);
    });
    body.scrollTop = 0;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    doc.classList.add('gallery-open');
    $('.gallery__close', dlg).focus();
  };
  $$('[data-gallery]').forEach(b => b.addEventListener('click', () => openGallery(b.dataset.gallery, b)));
  if (dlg) {
    $('.gallery__close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { doc.classList.remove('gallery-open'); if (opener) opener.focus(); });
  }

  /* ---------- Where: Kunnathur → Gobichettipalayam → Chennai scroll story ----------
     Opens on Tamil Nadu, zooms into Erode district (village + college), then pans to
     Chennai while the route line draws itself. Place labels are HTML pills that follow
     their pins, so they stay crisp and readable at any zoom. */
  const where = $('.where'), map = $('.map'), steps = $$('.where__step');
  const VIEWS = [
    [-24, -48, 660, 776],   // India
    [146, 538, 124, 135],   // Tamil Nadu
    [175, 584, 34, 33],     // Kunnathur
    [178, 578, 34, 33],     // Gobichettipalayam
    [232, 543, 38, 36]      // Chennai
  ];
  const TN_VIEW = VIEWS[1];
  const PLACES = { kunnathur: [192.2, 599.8], gobi: [193.6, 595.3], chennai: [251, 561] };
  const route = map && $('.map__route', map);
  const tags = $$('.map__tag');
  const pins = map ? $$('.map__pin', map) : [];
  let routeLen = 0, seg1 = 0;
  if (route) {
    routeLen = route.getTotalLength();
    // length of the first leg (village → college): sample until we reach the college point
    for (let d = 0; d <= routeLen; d += 0.25) {
      const pt = route.getPointAtLength(d);
      if (Math.hypot(pt.x - PLACES.gobi[0], pt.y - PLACES.gobi[1]) < 0.3) { seg1 = d; break; }
    }
    route.style.strokeDasharray = routeLen;
  }
  const story = () => window.matchMedia('(min-width: 861px)').matches && !reduceMotion.matches;
  const placeTags = (vb) => {
    if (!map) return;
    const ctm = map.getScreenCTM(); const box = map.parentElement.getBoundingClientRect();
    if (!ctm) return;
    const pt = map.createSVGPoint();
    tags.forEach(t => {
      const [x, y] = PLACES[t.dataset.place];
      pt.x = x; pt.y = y; const s = pt.matrixTransform(ctm);
      t.style.left = (s.x - box.left).toFixed(1) + 'px';
      t.style.top = (s.y - box.top).toFixed(1) + 'px';
    });
    // keep pins and the route a constant on-screen size whatever the zoom
    const k = vb[2] / 124;
    pins.forEach(g => { g.querySelector('.map__dot').setAttribute('r', (1.5 * k).toFixed(3)); g.querySelector('.map__pulse').setAttribute('r', (3 * k).toFixed(3)); });
    if (route) route.style.strokeWidth = (0.9 * k).toFixed(3);
    map.style.setProperty('--k', k.toFixed(3));
  };
  // one-time ripple: the rings spread outward from Chennai the first time the map comes into view
  const ripple = map && map.querySelector('.map__ripple');
  if (ripple && 'IntersectionObserver' in window && !reduceMotion.matches) {
    ripple.setAttribute('r', 0);
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now(), D = 2600, R = 700;
      const tick = now => {
        const t = Math.min((now - t0) / D, 1), e = 1 - Math.pow(1 - t, 3);
        ripple.setAttribute('r', (R * e).toFixed(2));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.35 });
    io.observe(map);
  }
  const setStage = s => {
    if (where.dataset.stage === String(s)) return;
    where.dataset.stage = s;
    const idx = typeof s === 'number' ? Math.min(s, 2) : -1;
    steps.forEach((el, i) => el.classList.toggle('is-active', i === idx));
  };
  const updateWhere = () => {
    if (!where || !map) return;
    if (!story()) {
      map.setAttribute('viewBox', TN_VIEW.join(' '));
      where.dataset.stage = 'static';
      steps.forEach(el => el.classList.add('is-active'));
      if (route) route.style.strokeDashoffset = 0;
      placeTags(TN_VIEW);
      return;
    }
    const r = where.getBoundingClientRect();
    const total = where.offsetHeight - innerHeight;
    const p = clamp(-r.top / total, 0, 1);
    // India → Tamil Nadu → Kunnathur → Gobichettipalayam → Chennai, then the skyline
    const K = [[0, .06], [.18, .24], [.38, .44], [.52, .58], [.76, .88]]; // [arrive, leave] for each view
    let v = VIEWS[4];
    for (let i = 0; i < K.length; i++) {
      if (p < K[i][1]) { v = VIEWS[i]; break; }
      if (i + 1 < K.length && p < K[i + 1][0]) {
        const t = ease((p - K[i][1]) / (K[i + 1][0] - K[i][1]));
        v = VIEWS[i].map((a, j) => lerp(a, VIEWS[i + 1][j], t)); break;
      }
    }
    map.setAttribute('viewBox', v.map(n => n.toFixed(2)).join(' '));
    if (route) {
      let drawn = 0;
      if (p >= .44 && p < .52) drawn = seg1 * ease((p - .44) / .08);
      else if (p >= .52 && p < .58) drawn = seg1;
      else if (p >= .58) drawn = seg1 + (routeLen - seg1) * ease(clamp((p - .58) / .18, 0, 1));
      route.style.strokeDashoffset = (routeLen - drawn).toFixed(2);
    }
    placeTags(v);
    setStage(p < .12 ? 'india' : p < .31 ? 'tn' : p < .48 ? 0 : p < .67 ? 1 : p < .88 ? 2 : 3);
  };


  /* ---------- Career timeline ----------
     A ball hops dot to dot along the rail (one dot per year at each company),
     with a big jump between companies (the ball keeps its round shape), a dotted trail, a filling rail,
     a ripple on each landing, and the company card revealed when reached. */
  const career = $('.career');
  const cv = career && $('.career__viewport', career);
  const ctrack = career && $('.career__track', career);
  const ball = career && $('.career__ball', career);
  const shadow = career && $('.career__shadow', career);
  const tag = career && $('.career__tag', career);
  const trail = career && $('.career__trail', career);
  const cDots = career ? $$('.co__dots i', career) : [];
  const cCos = career ? $$('.co', career) : [];
  let pts = [], pinned = false, dist = 0, lastIdx = -1, trackW = 1, railY = 0;
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const small = () => matchMedia('(max-width: 860px)').matches;
  let HOP = 30, JUMP = 96;
  const measure = () => {
    if (!career) return;
    const useBall = !reduceMotion.matches;
    pinned = useBall && matchMedia('(min-width: 861px) and (min-height: 620px)').matches;
    career.classList.toggle('has-ball', useBall);
    career.classList.toggle('is-pinned', pinned);
    ctrack.style.transform = '';
    if (pinned) cv.removeAttribute('tabindex'); else cv.setAttribute('tabindex', '0');
    career.style.height = '';
    if (pinned) {
      dist = Math.max(0, ctrack.scrollWidth - cv.clientWidth);
      career.style.height = (innerHeight + dist * 1.6) + 'px';
    }
    HOP = small() ? 24 : 28; JUMP = small() ? 60 : (innerHeight < 820 ? 70 : 86);
    const tr = ctrack.getBoundingClientRect();
    trackW = ctrack.scrollWidth; railY = tr.height / 2;
    pts = cDots.map(d => {
      const r = d.getBoundingClientRect();
      return { x: r.left - tr.left + r.width / 2, y: r.top - tr.top + r.height / 2, co: +d.closest('.co').dataset.co, year: d.dataset.year };
    });
    // Dotted trail: one parabola per hop; the control point sits 2h above, so the curve matches the ball's path.
    if (trail) {
      trail.setAttribute('viewBox', `0 0 ${trackW} ${tr.height}`);
      trail.style.width = trackW + 'px';
      trail.innerHTML = pts.slice(0, -1).map((a, k) => {
        const b = pts[k + 1], big = a.co !== b.co, h = big ? JUMP : HOP;
        return `<path class="${big ? 'big' : ''}" d="M${a.x} ${a.y}Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 2 * h} ${b.x} ${b.y}"/>`;
      }).join('');
    }
    lastIdx = -1;
    updateCareer();
  };
  const updateCareer = () => {
    if (!career || pts.length < 2) return;
    let p;
    if (pinned) {
      const total = career.offsetHeight - innerHeight;
      // Small hold at both ends so the first and last stops can be read.
      p = clamp((-career.getBoundingClientRect().top / (total || 1) - .04) / .92, 0, 1);
      ctrack.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
    } else {
      const max = cv.scrollWidth - cv.clientWidth;
      p = max > 0 ? clamp(cv.scrollLeft / max, 0, 1) : 0;
    }
    if (!career.classList.contains('has-ball')) return;
    const N = pts.length, f = p * (N - 1);
    const i = Math.min(Math.floor(f), N - 2), t = f - i, te = easeIO(t);
    const a = pts[i], b = pts[i + 1], big = a.co !== b.co, h = big ? JUMP : HOP;
    const x = lerp(a.x, b.x, te);
    const lift = h * 4 * te * (1 - te);
    const y = lerp(a.y, b.y, te) - lift;
    ball.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    const sh = 1 - Math.min(lift / JUMP, 1) * .7;
    shadow.style.transform = `translate3d(${x.toFixed(1)}px,0,0) scale(${sh.toFixed(3)})`;
    shadow.style.opacity = (0.25 + sh * .75).toFixed(2);
    tag.style.transform = `translate3d(calc(${x.toFixed(1)}px - 50%),0,0)`;
    career.style.setProperty('--ballx', x.toFixed(1) + 'px');
    career.style.setProperty('--fill', (x / trackW).toFixed(4));
    const idx = Math.round(f);
    if (idx !== lastIdx) {
      const prev = lastIdx; lastIdx = idx;
      const reachedCo = pts[idx].co;
      cDots.forEach((d, k) => { d.classList.toggle('is-on', k <= idx); d.classList.toggle('is-here', k === idx); });
      if (prev !== -1) { const d = cDots[idx]; d.classList.remove('is-land'); void d.offsetWidth; d.classList.add('is-land'); }
      cCos.forEach((c, k) => { c.classList.toggle('is-reached', k <= reachedCo); c.classList.toggle('is-active', k === reachedCo); });
      const span = tag.firstElementChild;
      if (span.textContent !== pts[idx].year) { span.textContent = pts[idx].year; tag.classList.remove('tick'); void tag.offsetWidth; tag.classList.add('tick'); }
    }
  };
  if (career) {
    cv.addEventListener('scroll', () => requestAnimationFrame(updateCareer), { passive: true });
    let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(measure, 150); });
    reduceMotion.addEventListener?.('change', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    addEventListener('load', measure);
    measure();
  }


  /* ---------- Abstract shapes: gentle scroll parallax ---------- */
  const abs = $$('.abstract');
  if (abs.length && !reduceMotion.matches) {
    const para = () => abs.forEach(a => {
      const r = a.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const c = (r.top + r.height / 2 - innerHeight / 2);
      a.querySelectorAll('.ab').forEach((s, k) => s.style.setProperty('--py', clamp(c * (k % 2 ? -0.06 : 0.08), -36, 36).toFixed(1) + 'px'));
    });
    addEventListener('scroll', () => requestAnimationFrame(para), { passive: true });
    para();
  }

  /* ---------- Experience timeline on phones: swipe hint, position, previous/next ---------- */
  const cnav = career && $('.career__nav', career);
  if (cnav && cv && cCos.length) {
    const nameEl = $('.career__name', cnav), numEl = $('.career__num', cnav);
    const prev = $('[data-dir="-1"]', cnav), next = $('[data-dir="1"]', cnav);
    let cur = -1, peeking = false, touched = false;
    const current = () => {
      const x = cv.scrollLeft + cv.clientWidth * .5; let i = 0;
      cCos.forEach((el, k) => { if (el.offsetLeft <= x) i = k; });
      return i;
    };
    const syncNav = () => {
      const max = cv.scrollWidth - cv.clientWidth, p = max > 0 ? cv.scrollLeft / max : 1, end = p > .985;
      career.style.setProperty('--cp', Math.max(.04, p).toFixed(3));
      career.classList.toggle('is-end', end);
      if (!peeking && cv.scrollLeft > 24) career.classList.add('is-swiped');
      const i = current();
      if (i !== cur) {
        cur = i;
        nameEl.textContent = cCos[i].querySelector('.co__name').textContent;
        numEl.textContent = (i + 1) + ' of ' + cCos.length;
      }
      prev.setAttribute('aria-disabled', String(cv.scrollLeft < 4));
      next.setAttribute('aria-disabled', String(end));
    };
    const go = d => {
      let left;
      if (d > 0 && cv.scrollLeft < 4) left = cCos[0].offsetLeft - 20;
      else if (d < 0 && cur === 0) left = 0;
      else left = cCos[clamp(cur + d, 0, cCos.length - 1)].offsetLeft - 20;
      touched = true; career.classList.add('is-swiped');
      cv.scrollTo({ left: Math.max(0, left), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    cv.addEventListener('scroll', () => requestAnimationFrame(syncNav), { passive: true });
    cv.addEventListener('pointerdown', () => { touched = true; peeking = false; }, { passive: true });
    addEventListener('resize', syncNav, { passive: true });
    syncNav();
    // one-time peek so it is obvious the line continues sideways
    if (!reduceMotion.matches && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        if (!es.some(e => e.isIntersecting)) return;
        io.disconnect();
        if (!matchMedia('(max-width: 860px)').matches || cv.scrollLeft > 0) return;
        setTimeout(() => {
          if (touched) return;
          peeking = true; cv.scrollTo({ left: 120, behavior: 'smooth' });
          setTimeout(() => { if (!touched) cv.scrollTo({ left: 0, behavior: 'smooth' }); setTimeout(() => { peeking = false; }, 700); }, 750);
        }, 500);
      }, { threshold: .5 });
      io.observe(cv);
    }
  }

  /* ---------- Scroll loop ---------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { updateHeader(); updateWhere(); if (pinned) updateCareer(); ticking = false; });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  reduceMotion.addEventListener?.('change', onScroll);
  updateHeader(); updateWhere();
})();
