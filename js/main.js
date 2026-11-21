// Navigasi mobile dan interaksi formulir konsultasi Unipack.
document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.main-nav');

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Buka menu navigasi' : 'Tutup menu navigasi');
      navigation.classList.toggle('is-open', !isOpen);
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Buka menu navigasi');
        navigation.classList.remove('is-open');
      });
    });
  }

  const orderForm = document.querySelector('#orderForm');
  const resultBox = document.querySelector('#formResult');

  if (orderForm && resultBox) {
    orderForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!orderForm.reportValidity()) return;

      const formData = new FormData(orderForm);
      const customerName = String(formData.get('customerName') || '').trim();
      const businessName = String(formData.get('businessName') || '').trim();
      const productType = String(formData.get('productType') || '').trim();
      const phone = String(formData.get('phone') || '').trim();
      const quantity = String(formData.get('quantity') || 'Belum ditentukan').trim();

      resultBox.replaceChildren();
      const heading = document.createElement('strong');
      heading.textContent = `Terima kasih, ${customerName}!`;
      const message = document.createElement('p');
      message.textContent = 'Ringkasan permintaan konsultasimu berhasil dibuat pada demo ini:';
      const summary = document.createElement('p');
      summary.textContent = `${businessName} · ${productType} · ${quantity} · ${phone}`;
      const note = document.createElement('p');
      note.textContent = 'Pada website yang terhubung ke server, data ini dapat diteruskan ke admin untuk proses konsultasi.';
      resultBox.append(heading, message, summary, note);
      resultBox.hidden = false;
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // AP CAROUSEL
  const carouselEl = document.querySelector('#brandCarousel');
  if (carouselEl) {
    const nextButton = carouselEl.querySelector('[data-bs-slide="next"]');
    const controls = carouselEl.querySelectorAll('[data-bs-slide], [data-bs-slide-to]');
    // DURASI (carousel-interval)
    const cssValue = getComputedStyle(carouselEl).getPropertyValue('--carousel-interval').trim();
    const interval = cssValue.endsWith('ms') ? parseFloat(cssValue) : (parseFloat(cssValue) || 3) * 1000;

    let timerId = null;
    let startedAt = 0;
    let remaining = interval;

    const stop = () => {
      clearTimeout(timerId);
      timerId = null;
    };

    const schedule = (delay) => {
      stop();
      remaining = delay;
      startedAt = Date.now();
      timerId = setTimeout(() => {
        // CLICK
        if (nextButton) nextButton.click();
        else schedule(interval);
      }, delay);
    };

    const pause = () => {
      if (timerId === null) return;
      remaining = Math.max(0, remaining - (Date.now() - startedAt));
      stop();
    };

    const resume = () => {
      if (timerId === null) schedule(remaining || interval);
    };

    // Setiap interaksi (next, prev, indikator) memulai hitungan 3 detik dari awal.
    controls.forEach((control) => {
      control.addEventListener('click', () => schedule(interval));
    });

    // Jeda saat di-hover, lanjut saat kursor keluar (selaras dengan animasi bar yang ikut berhenti).
    carouselEl.addEventListener('mouseenter', pause);
    carouselEl.addEventListener('mouseleave', resume);

    // Jeda saat tab tidak terlihat.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause();
      else resume();
    });

    schedule(interval);
  }
  // Header sticky: menyusut dan menyisakan logogram saat halaman di-scroll.
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    const ENTER_AT = 40; // mulai menyusut setelah scroll melewati 40px
    const LEAVE_AT = 8;  // kembali normal hanya jika hampir di paling atas (hysteresis agar tidak berkedip)
    let ticking = false;

    const updateHeader = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      const scrolled = siteHeader.classList.contains('is-scrolled');
      if (!scrolled && y > ENTER_AT) siteHeader.classList.add('is-scrolled');
      else if (scrolled && y < LEAVE_AT) siteHeader.classList.remove('is-scrolled');
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateHeader);
      }
    }, { passive: true });

    updateHeader();
  }
  // ===== Animasi halaman =====
  // Heading naik per baris, reveal saat scroll, hitung naik, progress bar, dan transisi antar halaman.
  (() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      root.classList.remove('js'); // tampilkan semua konten apa adanya
      return;
    }

    // // Progress bar scroll di atas halaman
    // const bar = document.createElement('div');
    // bar.className = 'scroll-progress';
    // bar.setAttribute('aria-hidden', 'true');
    // document.body.appendChild(bar);
    // let barTick = false;
    // const updateBar = () => {
    //   const max = document.documentElement.scrollHeight - window.innerHeight;
    //   bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    //   barTick = false;
    // };
    // window.addEventListener('scroll', () => {
    //   if (!barTick) { barTick = true; requestAnimationFrame(updateBar); }
    // }, { passive: true });
    // window.addEventListener('resize', updateBar);
    // updateBar();

    // --- Penanda elemen yang dianimasikan ---
    const splits = [];
    const targets = [];
    let groupId = 0;

    const markSplit = (selector, base = 0) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.classList.contains('split')) return;
        el.classList.add('split');
        el.style.setProperty('--base', `${base}s`);
        splits.push(el);
      });
    };

    // effect: up | left | right | scale | fade | cup | stamp
    // d: jeda awal (detik); step: jeda antar elemen yang muncul bersamaan; group: kelompok stagger
    const mark = (selector, effect, { d = 0, step = 0, group = '' } = {}) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.classList.contains('reveal') || el.classList.contains('split')) return;
        el.classList.add('reveal', `reveal-${effect}`);
        el.style.setProperty('--d', `${d}s`);
        if (step) {
          const parent = el.parentElement;
          parent.__gid = parent.__gid || ++groupId;
          el.dataset.grp = group || `${parent.__gid}|${selector}`;
          el.dataset.step = step;
        }
        targets.push(el);
      });
    };

    // Heading & paragraf (per baris)
    markSplit('.hero-copy h1', 0.2);
    markSplit('.hero-description', 0.6);
    markSplit('.page-hero h1', 0.15);
    markSplit('.page-lead', 0.5);
    markSplit('.intro-statement');
    markSplit('.section-heading h2');
    markSplit('.process-intro h2');
    markSplit('.closing-panel h2');
    markSplit('.mini-cta h2');
    markSplit('.story-copy h2');
    markSplit('.values-grid h2');
    markSplit('.catalogue-detail h2');
    markSplit('.form-intro h2');

    // Hero beranda
    mark('.hero-copy .eyebrow', 'up', { d: 0.05 });
    mark('.hero-actions', 'up', { d: 0.9 });
    mark('.hero-note', 'up', { d: 1.05 });
    mark('.hero-art', 'cup', { d: 0.35 });
    mark('.hero-sticker', 'stamp', { d: 1.5 });

    // Hero halaman dalam
    mark('.page-hero .eyebrow', 'up', { d: 0.05 });
    mark('.page-hero-stamp, .form-hero-note', 'stamp', { d: 0.7 });
    mark('.page-hero-image', 'scale', { d: 0.3 });

    // Umum
    mark('main .eyebrow', 'up');
    mark('.section-heading > p, .section-heading > .text-link', 'up', { d: 0.15 });
    mark('.brand-carousel', 'scale', { d: 0.1 });
    mark('.product-card', 'up', { step: 0.14 });
    mark('.process-intro > p, .process-intro > .button', 'up', { step: 0.12 });
    mark('.process-item', 'right', { step: 0.13 });
    mark('.closing-panel', 'scale');
    mark('.closing-panel > .button', 'up', { d: 0.2 });
    mark('.mini-cta-inner > .button', 'up', { d: 0.2 });
    mark('.footer-main > *', 'up', { step: 0.1 });
    mark('.footer-bottom', 'fade');

    // Halaman produk
    mark('.catalogue-intro > p', 'up', { d: 0.1 });
    mark('.catalogue-item:not(.catalogue-reverse) .catalogue-visual', 'left');
    mark('.catalogue-reverse .catalogue-visual', 'right');
    mark('.catalogue-detail > :not(h2):not(.spec-list)', 'up', { step: 0.1 });
    mark('.spec-list > div', 'up', { step: 0.1 });

    // Halaman profil
    mark('.story-big-number', 'scale');
    mark('.story-aside-note', 'up', { d: 0.15 });
    mark('.story-copy p', 'up', { step: 0.14 });
    mark('.idea-card', 'up', { step: 0.15 });
    mark('.values-list > div', 'right', { step: 0.12 });

    // Halaman pemesanan
    mark('.form-intro > p, .form-help-card, .form-contact-note', 'up', { step: 0.1 });
    mark('.order-form', 'fade');
    mark('.order-form .form-topline, .order-form .field-group, .order-form .check-field, .order-form .form-submit, .order-form .form-disclaimer', 'up', { step: 0.07, group: 'form' });

    // --- Pemecah teks menjadi kata (untuk animasi per baris) ---
    const splitWords = (el) => {
      const words = [];
      const walk = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === 3) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              const outer = document.createElement('span');
              outer.className = 'w';
              const inner = document.createElement('span');
              inner.className = 'wi';
              inner.textContent = part;
              outer.appendChild(inner);
              frag.appendChild(outer);
              words.push(outer);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== 'BR') {
            walk(child);
          }
        });
      };
      walk(el);
      el.__words = words;
    };

    // Kata pada baris yang sama mendapat nomor baris yang sama
    const assignLines = (el) => {
      let line = -1;
      let lastTop = null;
      (el.__words || []).forEach((w) => {
        const top = w.offsetTop;
        if (lastTop === null || Math.abs(top - lastTop) > 4) { line += 1; lastTop = top; }
        w.style.setProperty('--l', line);
      });
    };

    const countUp = (el) => {
      const node = Array.from(el.childNodes).find((n) => n.nodeType === 3 && /\d/.test(n.textContent));
      if (!node) return;
      const end = parseInt(node.textContent, 10);
      const start = performance.now();
      const duration = 1700;
      node.textContent = '0';
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        node.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => {
          const ra = a.boundingClientRect;
          const rb = b.boundingClientRect;
          return ra.top - rb.top || ra.left - rb.left;
        });
      const counters = {};
      visible.forEach(({ target: el }) => {
        const step = parseFloat(el.dataset.step || '0');
        if (step) {
          const key = el.dataset.grp;
          const n = counters[key] || 0;
          counters[key] = n + 1;
          const base = parseFloat(el.style.getPropertyValue('--d')) || 0;
          el.style.setProperty('--d', `${(base + n * step).toFixed(2)}s`);
        }
        el.classList.add('in');
        observer.unobserve(el);
        if (el.classList.contains('story-big-number')) countUp(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    const start = () => {
      splits.forEach(splitWords);
      splits.forEach(assignLines);
      splits.forEach((el) => el.classList.add('split-ready'));
      splits.concat(targets).forEach((el) => observer.observe(el));
    };

    // Tunggu font siap agar pembagian baris akurat (maksimal 1,5 detik)
    void document.body.offsetHeight; // memicu pemuatan font
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 1500))]).then(start);

    // Hitung ulang baris saat ukuran layar berubah atau font selesai dimuat
    let resizeTimer;
    const relayout = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => splits.forEach(assignLines), 150);
    };
    window.addEventListener('resize', relayout);
    if (document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', relayout);
    }

    // Transisi halus saat berpindah halaman internal
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if ((link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      document.body.classList.add('is-leaving');
      setTimeout(() => { window.location.href = url.href; }, 220);
    });
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) document.body.classList.remove('is-leaving');
    });
  })();
});
