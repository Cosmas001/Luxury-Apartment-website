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

    items.forEach((item, i) => item.addEventListener('click', () => { show(i); lb.showModal(); document.body.classList.add('menu-open'); }));
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
