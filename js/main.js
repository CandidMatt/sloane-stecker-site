document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header.site');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mobile menu
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      toggle.textContent = open ? 'CLOSE' : 'MENU';
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      toggle.textContent = 'MENU';
      document.body.style.overflow = '';
    }));
  }

  // services dropdown (tap to toggle on touch)
  document.querySelectorAll('.nav-dropdown > button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = btn.closest('.nav-dropdown');
      document.querySelectorAll('.nav-dropdown.open').forEach(d => { if (d !== parent) d.classList.remove('open'); });
      parent.classList.toggle('open');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
  });

  // reveal on scroll
  const revealEls = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));

  // stagger children with data-reveal-group
  document.querySelectorAll('[data-reveal-group]').forEach(group => {
    [...group.children].forEach((child, i) => {
      child.setAttribute('data-reveal', '');
      child.style.transitionDelay = `${i * 80}ms`;
      io.observe(child);
    });
  });

  // subtle parallax drift on flanking/about photos only (service photos stay static)
  const isMobile = () => window.innerWidth < 980;
  const speeds = [0.06, -0.07, 0.05, -0.06, 0.07];
  const parallaxPhotos = [...document.querySelectorAll('.flank-photo, .about-media')].map((el, i) => ({
    el,
    img: el.querySelector('img'),
    speed: speeds[i % speeds.length]
  }));
  let ticking = false;
  const updateParallax = () => {
    ticking = false;
    if (!isMobile()) {
      const vh = window.innerHeight;
      parallaxPhotos.forEach(({ img, el, speed }) => {
        const rect = el.getBoundingClientRect();
        const dist = (vh / 2) - (rect.top + rect.height / 2);
        if (img) img.style.transform = `translateY(${dist * speed}px) scale(1.15)`;
      });
    }
  };
  updateParallax();
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateParallax);
    }
  }, { passive: true });
  window.addEventListener('resize', updateParallax);

  // text-scramble / "digitize" hover effect for CTA buttons
  class TextScramble {
    constructor(el) {
      this.el = el;
      this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890!<>-_/[]{}=+*^#';
      this.queue = [];
      this.frame = 0;
      this.frameRequest = null;
    }
    setText(newText) {
      const oldText = this.el.textContent;
      const length = Math.max(oldText.length, newText.length);
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * 16);
        const end = start + Math.floor(Math.random() * 16);
        this.queue.push({ from, to, start, end, char: null });
      }
      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.update();
    }
    update() {
      let output = '';
      let complete = 0;
      for (let i = 0; i < this.queue.length; i++) {
        const q = this.queue[i];
        if (this.frame >= q.end) {
          complete++;
          output += q.to;
        } else if (this.frame >= q.start) {
          if (!q.char || Math.random() < 0.3) {
            q.char = this.chars[Math.floor(Math.random() * this.chars.length)];
          }
          output += q.char;
        } else {
          output += q.from;
        }
      }
      this.el.textContent = output;
      if (complete === this.queue.length) return;
      this.frame++;
      this.frameRequest = requestAnimationFrame(() => this.update());
    }
  }

  const initScramble = (labelEl, triggerEl) => {
    const original = labelEl.textContent.trim();
    labelEl.textContent = original;
    labelEl.setAttribute('aria-label', original);
    const scrambler = new TextScramble(labelEl);
    triggerEl.addEventListener('mouseenter', () => scrambler.setText(original));
  };

  document.querySelectorAll('.btn, .btn-solid').forEach(btn => {
    const textNodes = [...btn.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    if (!textNodes.length) return;
    const span = document.createElement('span');
    span.className = 'btn-label';
    span.textContent = textNodes.map(n => n.textContent).join('').trim();
    textNodes.forEach(n => n.remove());
    btn.insertBefore(span, btn.firstChild);
    initScramble(span, btn);
  });
  document.querySelectorAll('.btn-split-label').forEach(span => {
    initScramble(span, span.closest('.btn-split'));
  });
});
