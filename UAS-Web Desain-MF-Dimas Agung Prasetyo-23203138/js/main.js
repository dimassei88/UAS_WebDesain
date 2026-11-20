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

  // Autoplay carousel: dikendalikan sendiri agar tetap berjalan setelah tombol next/prev/indikator ditekan.
  const carouselEl = document.querySelector('#brandCarousel');
  if (carouselEl) {
    const nextButton = carouselEl.querySelector('[data-bs-slide="next"]');
    const controls = carouselEl.querySelectorAll('[data-bs-slide], [data-bs-slide-to]');
    // Durasi diambil dari variabel CSS --carousel-interval agar sinkron dengan animasi bar indikator.
    const cssValue = getComputedStyle(carouselEl).getPropertyValue('--carousel-interval').trim();
    const interval = cssValue.endsWith('ms') ? parseFloat(cssValue) : (parseFloat(cssValue) || 5) * 1000;

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
        // Klik programatis memicu handler 'click' di bawah, sehingga timer otomatis di-reset.
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
});
