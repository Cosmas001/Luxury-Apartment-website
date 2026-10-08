/* The Aurelian — Penthouse 58 */
(() => {
  // ---------- Header: solid on scroll ----------
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- Mobile menu ----------
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };

  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  // ---------- Reveal on scroll ----------
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  // ---------- Gallery lightbox ----------
  const items = [...document.querySelectorAll('.g-item')];
  let openLightbox = () => {};
  const lb = document.querySelector('.lightbox');
  if (lb && items.length) {
    const lbImg = lb.querySelector('img');
    const lbCaption = lb.querySelector('.lb-caption');
    const lbCount = lb.querySelector('.lb-count');
    let current = 0;

    items.forEach((item) => {
      const alt = item.querySelector('img').alt;
      item.dataset.caption = alt;
      item.setAttribute('aria-label', `View larger: ${alt}`);
    });

    const show = (i) => {
      current = (i + items.length) % items.length;
      const item = items[current];
      lbImg.src = item.dataset.full;
      lbImg.alt = item.dataset.caption;
      lbCaption.textContent = item.dataset.caption;
      lbCount.textContent = `${String(current + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    };

    openLightbox = (i) => { show(i); lb.showModal(); document.body.classList.add('menu-open'); };
    lb.addEventListener('close', () => { document.body.classList.remove('menu-open'); items[current].focus(); });
    lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
    lb.querySelector('.lb-prev').addEventListener('click', () => show(current - 1));
    lb.querySelector('.lb-next').addEventListener('click', () => show(current + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });

    // Swipe on touch devices
    let startX = 0;
    lb.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    });
  }

  // ---------- Gallery: polaroid line carousel ----------
  // Prints pegged to a sagging string. Drag the line (or use the arrows / ←→) and
  // they slide along it, swinging with the speed you give them. Selecting the
  // centre print opens the lightbox; selecting another brings it to the centre.
  const pl = document.querySelector('.pl-root');
  if (pl && items.length) {
    const n = items.length;
    const path = pl.querySelector('.pl-string path');
    const titleEl = pl.querySelector('.pl-title');
    const subEl = pl.querySelector('.pl-sub');
    const capEl = pl.querySelector('.pl-cap');
    const countEl = pl.querySelector('.pl-count');
    const srEl = pl.querySelector('.pl-sr');
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const pad2 = (x) => String(x).padStart(2, '0');
    const SAG = 46, AUTOPLAY = 4500;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const swingGain = reduce ? 0 : 1;

    // Wrap each image in a print with a handwritten label and a peg
    items.forEach((item, i) => {
      const img = item.querySelector('img');
      img.draggable = false;
      const print = document.createElement('div');
      print.className = 'pl-print';
      print.innerHTML = '<div class="pl-shot"></div><div class="pl-note"></div>';
      print.firstChild.append(img);
      print.lastChild.textContent = item.dataset.title;
      const peg = document.createElement('div');
      peg.className = 'pl-peg';
      item.append(print, peg);
      item.dataset.i = i;
    });

    let size = { w: 1200, h: 700, cw: 300 };
    let spacing = size.cw * 1.08;
    let active = -1;
    let dragging = false;
    let lastTouch = 0;
    let suppressClick = false;
    const S = { off: 0, vel: 0, target: 0, a: new Array(n).fill(0), w: new Array(n).fill(0) };
    let drag = null;

    const goTo = (i) => { S.target = clamp(i, 0, n - 1) * spacing; };
    const step = (dir) => { lastTouch = performance.now(); goTo(clamp(active + dir, 0, n - 1)); };

    const setActive = (i) => {
      active = i;
      items.forEach((el, j) => { el.dataset.on = j === i ? '1' : '0'; el.tabIndex = j === i ? 0 : -1; });
      const item = items[i];
      titleEl.textContent = item.dataset.title;
      subEl.textContent = item.querySelector('img').alt;
      capEl.querySelectorAll('span').forEach((s) => { s.style.animation = 'none'; void s.offsetWidth; s.style.animation = ''; });
      countEl.innerHTML = `<b>${pad2(i + 1)}</b> / ${pad2(n)}`;
      srEl.textContent = `Image ${i + 1} of ${n}: ${item.dataset.title}`;
    };
    setActive(0);

    const measure = () => {
      const r = pl.getBoundingClientRect();
      const cw = Math.round(Math.max(150, Math.min(300, r.width * 0.42, r.height * 0.42)));
      size = { w: r.width, h: r.height, cw };
      spacing = cw * 1.08;
      pl.style.setProperty('--pl-cw', cw + 'px');
      S.target = S.off = active * spacing;
    };
    new ResizeObserver(measure).observe(pl);
    measure();

    let raf = 0, prev = performance.now(), visible = true;
    const frame = (now) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(0.033, (now - prev) / 1000);
      prev = now;
      const { w, h, cw } = size;
      const y0 = Math.max(40, h * 0.12);
      let lineVel;
      if (drag && drag.moved) {
        lineVel = drag.v * 1000;
      } else {
        // critically damped spring toward the target
        const before = S.off, k = 70, c = 2 * Math.sqrt(k);
        S.vel += (k * (S.target - S.off) - c * S.vel) * dt;
        S.off += S.vel * dt;
        lineVel = -(S.off - before) / Math.max(dt, 1e-3);
      }
      const near = clamp(Math.round(S.off / spacing), 0, n - 1);
      for (let i = 0; i < n; i++) {
        const el = items[i];
        const x = w / 2 + i * spacing - S.off;
        if (x < -cw * 1.5 || x > w + cw * 1.5) { el.style.visibility = 'hidden'; continue; }
        el.style.visibility = 'visible';
        // swing: lags behind the motion, pulled back by gravity, damped
        S.w[i] += (-38 * S.a[i] - 4.2 * S.w[i] + lineVel * 0.0034 * swingGain) * dt;
        S.a[i] = clamp(S.a[i] + S.w[i] * dt, -0.6, 0.6);
        if (swingGain) S.a[i] += Math.sin(now / 1300 + i * 1.7) * 0.0009;
        const t = clamp(x / w, 0, 1);
        const y = y0 + 4 * SAG * t * (1 - t) - 6;
        el.style.transform = `translate(${(x - cw / 2).toFixed(1)}px,${y.toFixed(1)}px) rotate(${S.a[i].toFixed(4)}rad)`;
        el.style.zIndex = String(i === near ? n + 1 : n - Math.abs(i - near));
      }
      path.setAttribute('d', `M0 ${y0} Q${w / 2} ${y0 + 2 * SAG} ${w} ${y0}`);
      if (near !== active) setActive(near);
      raf = requestAnimationFrame(frame);
    };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) { prev = performance.now(); raf = requestAnimationFrame(frame); }
    }).observe(pl);
    raf = requestAnimationFrame(frame);

    // Autoplay, back to the first print after the last; waits while someone interacts
    setInterval(() => {
      if (reduce || document.hidden || drag || lb.open || performance.now() - lastTouch < AUTOPLAY) return;
      goTo(active >= n - 1 ? 0 : active + 1);
    }, AUTOPLAY);

    pl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.pl-bar')) return;
      lastTouch = performance.now();
      drag = { x: e.clientX, off: S.off, lx: e.clientX, lt: e.timeStamp, v: 0, moved: false };
    });
    pl.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) {
        drag.moved = true;
        pl.dataset.drag = '1';
        pl.setPointerCapture(e.pointerId);
      }
      if (!drag.moved) return;
      const dtm = Math.max(1, e.timeStamp - drag.lt);
      drag.v = 0.7 * ((e.clientX - drag.lx) / dtm) + 0.3 * drag.v;
      drag.lx = e.clientX;
      drag.lt = e.timeStamp;
      const max = (n - 1) * spacing;
      let off = drag.off - dx;
      if (off < 0) off *= 0.35;
      if (off > max) off = max + (off - max) * 0.35;
      S.off = off;
    });
    const onUp = () => {
      const d = drag;
      drag = null;
      lastTouch = performance.now();
      if (!d || !d.moved) return;
      pl.dataset.drag = '0';
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      S.vel = -d.v * 1000;
      goTo(clamp(Math.round((S.off - d.v * 180) / spacing), 0, n - 1));
    };
    pl.addEventListener('pointerup', onUp);
    pl.addEventListener('pointercancel', onUp);

    items.forEach((item, i) => item.addEventListener('click', () => {
      if (suppressClick) return;
      lastTouch = performance.now();
      if (i === active) openLightbox(i); else goTo(i);
    }));
    pl.querySelector('.pl-prev').addEventListener('click', () => step(-1));
    pl.querySelector('.pl-next').addEventListener('click', () => step(1));
    pl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else return;
      e.preventDefault();
    });
  }

  // ---------- Floor plan tabs (arrow keys move between tabs) ----------
  const tabs = [...document.querySelectorAll('.plan-tabs [role="tab"]')];
  const selectTab = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  // ---------- Highlight the nav link for the section in view ----------
  const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]:not(.btn)')];
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
  }

  // ---------- Enquiry form: client-side validation + success state ----------
  // No backend yet: on success we just show a thank-you message.
  const form = document.querySelector('.enquire-form');
  if (form) {
    const messages = {
      name: 'Please enter your name.',
      email: 'Please enter a valid email address.',
      interest: 'Please choose an option.',
    };
    const setError = (input, msg) => {
      const field = input.closest('.field');
      field.classList.toggle('has-error', !!msg);
      field.querySelector('.field-error').textContent = msg;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };
    const check = (input) => {
      const ok = input.checkValidity();
      setError(input, ok ? '' : messages[input.name]);
      return ok;
    };
    const fields = [...form.querySelectorAll('.field [required]')];
    fields.forEach((input) => input.addEventListener('blur', () => { if (input.value) check(input); }));
    fields.forEach((input) => input.addEventListener('input', () => { if (input.closest('.has-error')) check(input); }));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      fields.forEach(check);
      const consent = form.elements.consent;
      form.querySelector('.consent-error').textContent = consent.checked ? '' : 'Please confirm you agree to be contacted.';

      const firstBad = fields.find((f) => f.getAttribute('aria-invalid') === 'true') || (!consent.checked && consent);
      if (firstBad) { firstBad.focus(); return; }

      form.querySelector('.form-success').hidden = false;
      form.reset();
    });
  }

  // ---------- Footer year ----------
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
