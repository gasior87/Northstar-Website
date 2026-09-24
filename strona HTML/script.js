/* ============================================================
   Northstar — Interactions (Sparse Night-Sky Edition)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------------------------------------
     1. Sparse Star-field Constellation
     ------------------------------------------------------- */
  const canvas = document.getElementById('constellation-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, stars, mouse;

    mouse = { x: -9999, y: -9999 };

    const COUNT_FACTOR = 0.000018;     // very sparse
    const MAX = 90;
    const LINK_DIST = 180;
    const MOUSE_R = 220;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function spawn() {
      const n = Math.min(Math.floor(W * H * COUNT_FACTOR), MAX);
      stars = [];
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
          r: Math.random() * 1.1 + 0.3,
          a: Math.random() * 0.3 + 0.08,
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);

      // Lines
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * 0.06;
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.strokeStyle = `rgba(212,175,55,${alpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }

      // Stars
      for (const s of stars) {
        const mdx = s.x - mouse.x;
        const mdy = s.y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < MOUSE_R && md > 0) {
          const f = (1 - md / MOUSE_R) * 0.15;
          s.vx += (mdx / md) * f;
          s.vy += (mdy / md) * f;
        }
        s.vx *= 0.995;
        s.vy *= 0.995;
        const sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        if (sp > 0.8) { s.vx = (s.vx / sp) * 0.8; s.vy = (s.vy / sp) * 0.8; }
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < -20) s.x = W + 20;
        if (s.x > W + 20) s.x = -20;
        if (s.y < -20) s.y = H + 20;
        if (s.y > H + 20) s.y = -20;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${s.a})`;
        ctx.fill();
      }

      requestAnimationFrame(frame);
    }

    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('resize', () => { resize(); spawn(); });
    resize(); spawn(); frame();
  }


  /* -------------------------------------------------------
     2. Sticky Nav
     ------------------------------------------------------- */
  const nav = document.getElementById('navbar');
  if (nav) {
    const check = () => nav.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', check, { passive: true });
    check();
  }


  /* -------------------------------------------------------
     3. Mobile Menu
     ------------------------------------------------------- */
  const tog = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (tog && menu) {
    tog.addEventListener('click', () => {
      tog.classList.toggle('active');
      menu.classList.toggle('open');
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      tog.classList.remove('active');
      menu.classList.remove('open');
    }));
  }


  /* -------------------------------------------------------
     4. Scroll Reveal
     ------------------------------------------------------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    reveals.forEach(el => obs.observe(el));
  }


  /* -------------------------------------------------------
     5. Smooth Scroll
     ------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const t = document.querySelector(this.getAttribute('href'));
      if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 72, behavior: 'smooth' }); }
    });
  });


  /* -------------------------------------------------------
     6. Counter Animation
     ------------------------------------------------------- */
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (counters.length) {
    const cobs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = +el.dataset.target;
        const suffix = el.dataset.suffix || '';
        const start = performance.now();
        const dur = 2200;
        (function step(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(start);
        cobs.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => cobs.observe(el));
  }


  /* -------------------------------------------------------
     7. Contact Form Feedback
     ------------------------------------------------------- */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('.btn-submit');
      const orig = btn.textContent;
      btn.textContent = '✓  Entry Logged';
      btn.style.pointerEvents = 'none';
      btn.style.borderColor = 'rgba(212,175,55,0.4)';
      setTimeout(() => { btn.textContent = orig; btn.style.pointerEvents = ''; btn.style.borderColor = ''; form.reset(); }, 3000);
    });
  }

});
