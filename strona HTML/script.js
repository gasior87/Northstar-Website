/* ============================================================
   Northstar — Interactions (Sparse Twinkling Night-Sky Edition)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------------------------------------
     1. Sparse Twinkling Star-field Constellation
     ------------------------------------------------------- */
  const canvas = document.getElementById('constellation-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, mouse;
    mouse = { x: -9999, y: -9999 };
    const MOUSE_R = 180;

    // Real Constellations Map (Relative coordinates)
    const constelData = [
      {
        name: "Ursa Major",
        s: [ {x:-70, y:-30}, {x:-30, y:-20}, {x:10, y:-10}, {x:30, y:20}, {x:70, y:30}, {x:80, y:70}, {x:20, y:60} ],
        e: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,3]]
      },
      {
        name: "Orion",
        s: [ {x:-30,y:-60}, {x:30,y:-50}, {x:-15,y:0}, {x:0,y:0}, {x:15,y:0}, {x:-30,y:60}, {x:25,y:70} ],
        e: [[0,2], [1,4], [2,3], [3,4], [2,5], [4,6]]
      },
      {
        name: "Cassiopeia",
        s: [ {x:-60,y:-30}, {x:-20,y:10}, {x:0,y:-20}, {x:30,y:20}, {x:70,y:-10} ],
        e: [[0,1], [1,2], [2,3], [3,4]]
      },
      {
        name: "Cygnus",
        s: [ {x:0,y:-60}, {x:0,y:0}, {x:-60,y:10}, {x:60,y:-10}, {x:0,y:80} ],
        e: [[0,1], [1,4], [2,1], [1,3]]
      },
      {
        name: "Lyra",
        s: [ {x:0,y:-40}, {x:20,y:-10}, {x:-20,y:10}, {x:-10,y:40}, {x:30,y:30} ],
        e: [[0,1], [0,2], [1,2], [2,3], [3,4], [4,1]]
      },
      {
        name: "Scorpius",
        s: [ {x:-40,y:-40}, {x:-10,y:-30}, {x:10,y:-10}, {x:20,y:20}, {x:10,y:50}, {x:-10,y:70}, {x:-40,y:60}, {x:-50,y:40} ],
        e: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,7]]
      }
    ];

    let constellations = [];
    let bgStars = [];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function initStar() {
      return {
        vx: 0, vy: 0,
        r: Math.random() * 1.5 + 1.2,
        baseA: Math.random() * 0.4 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.03 + 0.01
      };
    }

    function spawn() {
      constellations = [];
      bgStars = [];

      // Spawn 3 to 6 constellations depending on screen size
      const numC = Math.min(Math.max(Math.floor((W * H) / 250000), 3), constelData.length);
      let picked = [...constelData].sort(() => 0.5 - Math.random()).slice(0, numC);
      
      let currentX = Math.random() * 200 + 100; // Start near the left edge
      picked.forEach(data => {
        let cx = currentX;
        currentX += 450 + Math.random() * 200; // Space them out by at least 450px to prevent overlap
        let cy = Math.random() * (H - 300) + 150;
        
        let c = {
          name: data.name,
          cx: cx, cy: cy,
          // All constellations move at the exact same speed so they don't crash into each other
          vx: -0.15,
          vy: 0.02,
          stars: data.s.map(st => {
            let sInfo = initStar();
            sInfo.tx = st.x * 1.3; // Scale up the shape
            sInfo.ty = st.y * 1.3;
            sInfo.x = cx + sInfo.tx;
            sInfo.y = cy + sInfo.ty;
            return sInfo;
          }),
          edges: data.e
        };
        constellations.push(c);
      });

      // Background dust stars
      const numBg = Math.floor((W * H) / 18000);
      for(let i=0; i<numBg; i++){
        let bs = initStar();
        bs.x = Math.random() * W;
        bs.y = Math.random() * H;
        bs.r *= 0.6;
        bs.baseA *= 0.5;
        // Background drifts independently for depth
        bs.vx = -0.08 - Math.random() * 0.05;
        bs.vy = (Math.random() - 0.5) * 0.02;
        bgStars.push(bs);
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);

      // Background Stars
      bgStars.forEach(s => {
        s.phase += s.speed;
        let a = s.baseA + Math.sin(s.phase) * 0.1;
        if(a < 0) a = 0;
        
        s.x += s.vx;
        s.y += s.vy;
        
        // Wrap around horizontally for passing night
        if(s.x < -50) {
          s.x = W + 50;
          s.y = Math.random() * H;
        }
        if(s.x > W + 50) s.x = -50;
        
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${a})`;
        ctx.fill();
      });

      // Constellations
      constellations.forEach(c => {
        // Drift uniformly
        c.cx += c.vx;
        c.cy += c.vy;
        
        // Wrap logically without overlapping
        if(c.cx < -300) { 
          // Find the rightmost constellation
          let maxX = -9999;
          constellations.forEach(otherC => { if(otherC.cx > maxX) maxX = otherC.cx; });
          
          // Place this constellation safely behind the last one
          c.cx = Math.max(W + 200, maxX + 450 + Math.random() * 150); 
          c.cy = Math.random() * (H - 300) + 150; 
          c.stars.forEach(s => { s.x = c.cx + s.tx; s.y = c.cy + s.ty; });
        }
        if(c.cy < -300) c.cy = H + 300;
        if(c.cy > H + 300) c.cy = -300;

        let hoverScore = 0;
        let maxY = -999;

        // Physics for each star in the constellation
        c.stars.forEach(s => {
          // Direct locked position (no violent displacement or bouncing)
          s.x = c.cx + s.tx;
          s.y = c.cy + s.ty;

          // Mouse interaction: calculate hover intensity (does NOT violently push stars)
          const dx = s.x - mouse.x;
          const dy = s.y - mouse.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          let proximity = 0;
          if (dist < MOUSE_R) {
            proximity = (1 - dist / MOUSE_R);
            hoverScore += proximity;
          }
          s.hoverProximity = proximity;

          if (s.y > maxY) maxY = s.y;

          s.phase += s.speed;
          let a = s.baseA + Math.sin(s.phase) * 0.15;
          if(a < 0.05) a = 0.05;
          // Subtly brighten on hover
          s.currentA = Math.min(1.0, a + proximity * 0.45);
        });

        // Calculate overall constellation hover factor
        const constelHover = Math.min(1.0, hoverScore * 0.35);

        // Draw constellation edges (lines grow wider & brighter on hover)
        ctx.lineWidth = 1.0 + constelHover * 1.5;
        c.edges.forEach(edge => {
          let s1 = c.stars[edge[0]];
          let s2 = c.stars[edge[1]];
          let avgProx = (s1.hoverProximity + s2.hoverProximity) * 0.5;
          let a = Math.min(s1.currentA, s2.currentA) * (0.8 + avgProx * 0.6);
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.strokeStyle = `rgba(212,175,55,${Math.min(1.0, a)})`;
          ctx.stroke();
        });

        // Draw the stars themselves (stars gently swell on hover)
        c.stars.forEach(s => {
          const renderRadius = s.r * (1.0 + s.hoverProximity * 0.65);
          ctx.beginPath();
          ctx.arc(s.x, s.y, renderRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212,175,55,${s.currentA})`;
          ctx.fill();

          // Subtle glowing halo when hovered
          if (s.hoverProximity > 0.1) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, renderRadius * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212,175,55,${s.hoverProximity * 0.15})`;
            ctx.fill();
          }
        });

        // Draw constellation name on hover
        if (hoverScore > 0.1) {
          let textAlpha = Math.min(hoverScore * 0.8, 0.7); // Fade in based on proximity
          ctx.font = "italic 300 16px 'Cormorant Garamond', serif";
          ctx.letterSpacing = "0.2em"; // HTML5 Canvas supported
          ctx.fillStyle = `rgba(212,175,55,${textAlpha})`;
          ctx.textAlign = "center";
          ctx.fillText(c.name, c.cx, maxY + 35);
        }
      });

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
     7. Contact Form (status message under the button)
     ------------------------------------------------------- */
  const form = document.getElementById('contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const setStatus = (msg, kind) => {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status' + (kind ? ' ' + kind : '');
    };
    const OK_MSG = "Message sent. We’ll reply within one business day.";
    const ERR_MSG = "Something went wrong. Please email us at contact@northstarllc.dev.";

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('.btn-submit');
      const orig = btn.textContent;

      // 1. Honeypot check: silently drop automated bots
      const honeypot = form.querySelector('#website_url')?.value;
      if (honeypot) {
        setStatus(OK_MSG, 'ok');
        form.reset();
        return;
      }

      // 2. Turnstile verification check
      const turnstileToken = form.querySelector('[name="cf-turnstile-response"]')?.value;
      if (!turnstileToken) {
        setStatus('Please complete the verification above, then send again.', 'err');
        return;
      }

      btn.textContent = 'Sending…';
      btn.style.pointerEvents = 'none';
      setStatus('', '');

      const serviceSelect = form.querySelector('#service');
      const payload = new FormData();
      payload.append('name', form.querySelector('#name').value);
      payload.append('email', form.querySelector('#email').value);
      payload.append('company', form.querySelector('#company').value);
      payload.append('service', serviceSelect.selectedIndex > 0 ? serviceSelect.options[serviceSelect.selectedIndex].text : '');
      payload.append('message', form.querySelector('#message').value);
      payload.append('cf-turnstile-response', turnstileToken);

      try {
        const res = await fetch('/submit', { method: 'POST', body: payload });
        if (!res.ok) throw new Error('Submission failed');
        setStatus(OK_MSG, 'ok');
        form.reset();
        if (window.turnstile) {
          try { window.turnstile.reset(); } catch (_) {}
        }
      } catch (err) {
        setStatus(ERR_MSG, 'err');
      } finally {
        btn.textContent = orig;
        btn.style.pointerEvents = '';
      }
    });
  }


  /* -------------------------------------------------------
     8. Privacy Policy pop-up (opens from any [data-privacy] link)
     ------------------------------------------------------- */
  const privacyLinks = document.querySelectorAll('[data-privacy]');
  if (privacyLinks.length && typeof HTMLDialogElement === 'function') {
    const dlg = document.createElement('dialog');
    dlg.className = 'privacy-dialog';
    dlg.setAttribute('aria-labelledby', 'privacy-title');
    dlg.innerHTML = `
      <div class="privacy-inner">
        <button type="button" class="privacy-close" aria-label="Close">&times;</button>
        <h2 id="privacy-title">Privacy Policy</h2>
        <p class="privacy-date">Last updated: October 28, 2026</p>

        <h3>Who we are</h3>
        <p>Northstar Analytics LLC (“Northstar”, “we”) provides data, analytics and AI consulting. You can reach us at contact@northstarllc.dev.</p>

        <h3>What we collect</h3>
        <p>When you use our contact form, we collect what you enter: your name, email address, company, area of interest and message. Our spam protection (Cloudflare Turnstile) also processes technical data, such as your IP address and browser details, to confirm that you are a person.</p>

        <h3>How we use it</h3>
        <p>Only to respond to your inquiry and to discuss possible work together. We do not sell your information or use it for advertising.</p>

        <h3>Where it is stored</h3>
        <p>Form submissions are stored in a private Google Forms and Google Sheets account controlled by Northstar. This website is hosted by Cloudflare.</p>

        <h3>Analytics and cookies</h3>
        <p>We use Cloudflare Web Analytics to see aggregate visit counts. It does not use cookies or follow individuals across sites. Our pages load fonts from Google Fonts, so your browser contacts Google’s servers to download them.</p>

        <h3>How long we keep it</h3>
        <p>We keep inquiries for as long as needed to respond to you and to maintain our business records.</p>

        <h3>Your choices</h3>
        <p>You can ask us to access, correct or delete your information at any time by emailing contact@northstarllc.dev.</p>

        <h3>Changes</h3>
        <p>We may update this policy. The date above shows the latest version.</p>
      </div>`;
    document.body.appendChild(dlg);

    privacyLinks.forEach(link => link.addEventListener('click', e => {
      e.preventDefault();
      dlg.showModal();
    }));
    dlg.querySelector('.privacy-close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }

});
