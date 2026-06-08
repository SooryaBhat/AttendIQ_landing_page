'use strict';

/* ── Custom Cursor ─────────────────────────────────── */
function initCursor() {
  const cursor = document.getElementById('cursor');
  const trail  = document.getElementById('cursorTrail');
  if (!cursor || !trail) return;
  if (window.matchMedia('(hover: none)').matches) return;

  let mx = 0, my = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  // Trail follows with lerp
  function lerp(a, b, t) { return a + (b - a) * t; }
  function animTrail() {
    tx = lerp(tx, mx, 0.14);
    ty = lerp(ty, my, 0.14);
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    requestAnimationFrame(animTrail);
  }
  animTrail();

  // Grow on interactive elements
  document.querySelectorAll('a, button, .gal-slide, .bento-card, .how-card, .rnav').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(2.2)';
      cursor.style.opacity   = '0.5';
      trail.style.transform  = 'translate(-50%,-50%) scale(1.5)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      cursor.style.opacity   = '1';
      trail.style.transform  = 'translate(-50%,-50%) scale(1)';
    });
  });
}

/* ── Navbar ────────────────────────────────────────── */
function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  const ham   = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (ham && links) {
    ham.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      ham.querySelector('span:nth-child(1)').style.transform = open ? 'rotate(45deg) translate(5px,5px)' : '';
      ham.querySelector('span:nth-child(2)').style.opacity   = open ? '0' : '';
      ham.querySelector('span:nth-child(3)').style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : '';
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        ham.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }
}

/* ── Counter animation ─────────────────────────────── */
function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.done) return;
      entry.target.dataset.done = '1';
      const target = parseInt(entry.target.dataset.target, 10);
      const start  = performance.now();
      const dur    = 1600;
      const update = now => {
        const p = Math.min((now - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        entry.target.textContent = Math.round(e * target);
        if (p < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

/* ── Scroll reveal ─────────────────────────────────── */
function initScrollReveal() {
  const selectors = [
    '.how-card', '.bento-card', '.ai-block',
    '.stack-col', '.about-left', '.about-right',
    '.rdisplay-info', '.swagger-showcase', '.apl',
  ];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      const d = i % 3;
      if (d === 1) el.classList.add('reveal-d1');
      if (d === 2) el.classList.add('reveal-d2');
    });
  });

  const rv = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        rv.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => rv.observe(el));
}

/* ── Role tabs + carousel ──────────────────────────── */
function initRoles() {
  const navBtns = document.querySelectorAll('.rnav');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.rdisplay').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('rdisplay-' + btn.dataset.role);
      if (panel) panel.classList.add('active');
    });
  });

  // Per-role image carousels — auto-advance + dot control
  document.querySelectorAll('.rscreen-carousel').forEach(carousel => {
    const role   = carousel.dataset.role;
    const slides = carousel.querySelectorAll('.rsc');
    const dots   = document.querySelectorAll(`.rsc-dots[data-role="${role}"] .rsc-dot`);
    let current  = 0;
    let timer;

    function goTo(idx) {
      slides[current].classList.remove('active');
      dots[current]?.classList.remove('active');
      current = (idx + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current]?.classList.add('active');
    }

    function startAuto() {
      timer = setInterval(() => goTo(current + 1), 3200);
    }

    function stopAuto() { clearInterval(timer); }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); });
    });

    // Pause on hover
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    startAuto();
  });
}

/* ── Gallery horizontal scroll + filter ───────────── */
function initGallery() {
  const track   = document.getElementById('galTrack');
  const fill    = document.getElementById('galFill');
  const prevBtn = document.getElementById('galPrev');
  const nextBtn = document.getElementById('galNext');

  if (!track) return;

  // Progress bar
  const updateProgress = () => {
    const { scrollLeft, scrollWidth, clientWidth } = track;
    const pct = scrollWidth <= clientWidth ? 100 : (scrollLeft / (scrollWidth - clientWidth)) * 100;
    if (fill) fill.style.width = pct + '%';
  };
  track.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Arrow buttons
  const SCROLL_AMOUNT = 640;
  prevBtn?.addEventListener('click', () => track.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' }));
  nextBtn?.addEventListener('click', () => track.scrollBy({ left:  SCROLL_AMOUNT, behavior: 'smooth' }));

  // Filter tabs
  const tabs  = document.querySelectorAll('.gtab');
  const slides = document.querySelectorAll('.gal-slide');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.g;
      slides.forEach(sl => {
        sl.classList.toggle('hidden', cat !== 'all' && sl.dataset.cat !== cat);
      });
      track.scrollTo({ left: 0, behavior: 'smooth' });
      setTimeout(updateProgress, 400);
    });
  });

  // Drag-to-scroll on desktop
  let isDown = false, startX, startScroll;
  track.addEventListener('mousedown', e => {
    isDown = true;
    startX = e.pageX - track.offsetLeft;
    startScroll = track.scrollLeft;
    track.style.cursor = 'grabbing';
  });
  document.addEventListener('mouseup', () => { isDown = false; track.style.cursor = ''; });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = startScroll - (x - startX);
  });
}

/* ── Lightbox ──────────────────────────────────────── */
function initLightbox() {
  const lb      = document.getElementById('lightbox');
  const lbImg   = document.getElementById('lbImg');
  const lbCap   = document.getElementById('lbCap');
  const lbClose = document.getElementById('lbClose');
  const lbPrev  = document.getElementById('lbPrev');
  const lbNext  = document.getElementById('lbNext');
  if (!lb) return;

  let images = [], idx = 0;

  // Collect all gallery slides
  document.querySelectorAll('.gal-slide').forEach((slide, i) => {
    const img = slide.querySelector('img');
    const cap = slide.querySelector('span');
    if (!img) return;
    images.push({ src: img.src, caption: cap?.textContent || '' });
    slide.addEventListener('click', () => { if (!slide.classList.contains('hidden')) open(i); });
  });

  function open(i) {
    idx = (i + images.length) % images.length;
    lbImg.src = images[idx].src;
    lbCap.textContent = images[idx].caption;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  lbClose.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  lbPrev.addEventListener('click', () => open(idx - 1));
  lbNext.addEventListener('click', () => open(idx + 1));

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowLeft')   open(idx - 1);
    if (e.key === 'ArrowRight')  open(idx + 1);
  });

  // Touch swipe
  let touchStartX = 0;
  lb.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? open(idx + 1) : open(idx - 1);
  });
}

/* ── Lazy image fade-in ────────────────────────────── */
function initImageFade() {
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    const done = () => img.classList.add('loaded');
    if (img.complete) done();
    else img.addEventListener('load', done);
  });
}

/* ── Active nav highlight on scroll ───────────────── */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => {
        a.style.color = '';
        if (a.getAttribute('href') === '#' + e.target.id) {
          a.style.color = '#a5f3fc';
        }
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => obs.observe(s));
}

/* ── Smooth hero parallax ──────────────────────────── */
function initParallax() {
  const orbs = document.querySelectorAll('.orb');
  if (!orbs.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    orbs.forEach((orb, i) => {
      const speed = [0.08, 0.12, 0.06][i] || 0.08;
      orb.style.transform = `translateY(${y * speed}px)`;
    });
  }, { passive: true });
}

/* ── Boot ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNavbar();
  initCounters();
  initScrollReveal();
  initRoles();
  initGallery();
  initLightbox();
  initImageFade();
  initActiveNav();
  initParallax();
});
