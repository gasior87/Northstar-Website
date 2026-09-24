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
          // Find absolute target position for this star
          let targetX = c.cx + s.tx;
          let targetY = c.cy + s.ty;

          // Strong spring force to maintain constellation shape
          s.vx += (targetX - s.x) * 0.08;
          s.vy += (targetY - s.y) * 0.08;

          // Mouse interaction (repel gently)
          const dx = s.x - mouse.x;
          const dy = s.y - mouse.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < MOUSE_R && dist > 0) {
            const f = (1 - dist / MOUSE_R) * 0.4; // Stronger local push
            s.vx += (dx / dist) * f;
            s.vy += (dy / dist) * f;
            hoverScore += (1 - dist / MOUSE_R); // Detect hover
          }

          s.vx *= 0.82; // High friction so it snaps back
          s.vy *= 0.82;

          s.x += s.vx;
          s.y += s.vy;

          if (s.y > maxY) maxY = s.y;

          s.phase += s.speed;
          let a = s.baseA + Math.sin(s.phase) * 0.15;
          if(a < 0.05) a = 0.05;
          s.currentA = a;
        });

        // Draw explicit constellation edges
        ctx.lineWidth = 1.0;
        c.edges.forEach(edge => {
          let s1 = c.stars[edge[0]];
          let s2 = c.stars[edge[1]];
          // Line brightness based on star brightness
          let a = Math.min(s1.currentA, s2.currentA) * 0.9;
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.strokeStyle = `rgba(212,175,55,${a})`;
          ctx.stroke();
        });

        // Draw the stars themselves
        c.stars.forEach(s => {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212,175,55,${s.currentA})`;
          ctx.fill();
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
