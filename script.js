/* ============================================================
   SAVANNAH PIZZERIA — script.js
   Logo Intro Animation · Interactions · Menu Prices
   ============================================================ */

/* ══════════════════════════════════════════════════════════
   LOGO INTRO ANIMATION
══════════════════════════════════════════════════════════ */
function runIntro() {
  const overlay = document.getElementById('intro-overlay');
  const canvas  = document.getElementById('intro-canvas');
  const logoWrap = document.querySelector('.intro-logo-wrap');
  const skipBtn  = document.querySelector('.intro-skip');
  if (!overlay || !canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, done = false;
  const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
  window.addEventListener('resize', resize, { passive:true }); resize();

  // Ray objects
  const rays = [];
  const NUM_RAYS = 24;
  const CX = () => W / 2, CY = () => H / 2;

  function initRays() {
    rays.length = 0;
    for (let i = 0; i < NUM_RAYS; i++) {
      const angle = (i / NUM_RAYS) * Math.PI * 2;
      const dist  = Math.max(W, H) * 0.85;
      rays.push({
        // start far from center
        x:  CX() + Math.cos(angle) * dist,
        y:  CY() + Math.sin(angle) * dist,
        tx: CX(), ty: CY(),
        angle,
        speed:  0.025 + Math.random() * 0.025,
        t: 0,
        width:  1 + Math.random() * 2.5,
        hue:    Math.random() < 0.7 ? 3 : 0,  // red or white
        alpha:  0,
        delay:  Math.random() * 0.3,
      });
    }
  }
  initRays();

  let phase = 'rays';   // rays → converge → flash → logo → exit
  let phaseT = 0;
  let flashAlpha = 0;
  let logoVisible = false;
  let exitT = 0;

  function easeInOut(t) { return t < .5 ? 2*t*t : -1+(4-2*t)*t; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function frame() {
    if (done) return;
    ctx.clearRect(0, 0, W, H);

    // Black background
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, W, H);

    phaseT += 0.016;

    if (phase === 'rays') {
      // Draw rays shooting inward
      rays.forEach(r => {
        if (phaseT < r.delay) return;
        r.t = Math.min(r.t + r.speed, 1);
        const p = easeInOut(r.t);
        const cx = CX(), cy = CY();

        // Current tip position
        const tx = lerp(r.x, cx, p);
        const ty = lerp(r.y, cy, p);

        ctx.save();
        ctx.globalAlpha = p * 0.7;
        const grad = ctx.createLinearGradient(r.x, r.y, tx, ty);
        if (r.hue === 3) {
          grad.addColorStop(0, 'rgba(227,30,36,0)');
          grad.addColorStop(0.6, 'rgba(255,60,60,0.6)');
          grad.addColorStop(1, 'rgba(255,120,120,0.9)');
        } else {
          grad.addColorStop(0, 'rgba(255,255,255,0)');
          grad.addColorStop(0.7, 'rgba(255,240,220,0.5)');
          grad.addColorStop(1, 'rgba(255,255,255,0.85)');
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = r.width;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.restore();

        // Glow at tip
        ctx.save();
        ctx.globalAlpha = p * 0.4;
        const g2 = ctx.createRadialGradient(tx, ty, 0, tx, ty, 30);
        g2.addColorStop(0, r.hue === 3 ? 'rgba(255,60,60,.8)' : 'rgba(255,255,255,.7)');
        g2.addColorStop(1, 'transparent');
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(tx, ty, 30, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      });

      // Add center convergence glow as rays arrive
      const avgT = rays.reduce((s,r) => s+r.t, 0) / rays.length;
      if (avgT > 0.3) {
        ctx.save();
        ctx.globalAlpha = (avgT - 0.3) * 0.6;
        const cg = ctx.createRadialGradient(CX(), CY(), 0, CX(), CY(), 120);
        cg.addColorStop(0, 'rgba(255,80,80,.9)');
        cg.addColorStop(0.4, 'rgba(227,30,36,.4)');
        cg.addColorStop(1, 'transparent');
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(CX(), CY(), 120, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }

      // All rays done → flash
      if (rays.every(r => r.t >= 1) && phaseT > 1.2) {
        phase = 'flash'; phaseT = 0;
      }
    }

    if (phase === 'flash') {
      // Redraw rays at full convergence
      rays.forEach(r => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 0.7 - phaseT * 1.5);
        const cx = CX(), cy = CY();
        const grad = ctx.createLinearGradient(r.x, r.y, cx, cy);
        grad.addColorStop(0, 'rgba(227,30,36,0)');
        grad.addColorStop(1, r.hue === 3 ? 'rgba(255,80,80,.6)' : 'rgba(255,255,255,.5)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = r.width;
        ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(cx, cy); ctx.stroke();
        ctx.restore();
      });

      // Flash
      flashAlpha = Math.max(0, Math.sin(phaseT * Math.PI * 2.5) * 0.85);
      ctx.save();
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      if (phaseT > 0.6) { phase = 'logo'; phaseT = 0; }
    }

    if (phase === 'logo') {
      // Fade overlay from white to dark
      const fade = Math.min(phaseT / 0.5, 1);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - fade);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Residual glow
      ctx.save();
      ctx.globalAlpha = Math.max(0, 0.4 - phaseT * 0.4);
      const cg = ctx.createRadialGradient(CX(), CY(), 0, CX(), CY(), 200);
      cg.addColorStop(0, 'rgba(255,80,80,.5)');
      cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(CX(), CY(), 200, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      if (!logoVisible && phaseT > 0.3) {
        logoVisible = true;
        if (logoWrap) logoWrap.classList.add('visible');
      }

      if (phaseT > 1.8) { phase = 'exit'; phaseT = 0; }
    }

    if (phase === 'exit') {
      exitT = Math.min(exitT + 0.02, 1);
      ctx.save();
      ctx.globalAlpha = exitT;
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      if (exitT >= 1) {
        overlay.classList.add('hidden');
        done = true;
        return;
      }
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  // Skip
  const skip = () => {
    done = true;
    if (logoWrap) logoWrap.classList.add('visible');
    overlay.classList.add('hidden');
  };
  if (skipBtn) skipBtn.addEventListener('click', skip);
  // Also skip on any key
  window.addEventListener('keydown', skip, { once:true });
}

/* ══════════════════════════════════════════════════════════
   HERO PARTICLES
══════════════════════════════════════════════════════════ */
function initParticles(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
  window.addEventListener('resize', resize, { passive:true }); resize();

  // Red + white particles mix
  const cols = ['rgba(227,30,36,','rgba(255,80,80,','rgba(180,20,20,','rgba(255,255,255,','rgba(255,220,220,'];
  const mk = () => ({
    x:Math.random()*W, y:Math.random()*H,
    r:Math.random()*1.4+.2,
    vy:-(Math.random()*.25+.07), vx:(Math.random()-.5)*.1,
    a:Math.random()*Math.PI*2, s:Math.random()*.018,
    o:Math.random()*.4+.04, c:cols[Math.floor(Math.random()*cols.length)],
  });
  const pts = Array.from({length:90}, mk);
  const draw = () => {
    ctx.clearRect(0,0,W,H);
    pts.forEach(p => {
      p.a+=p.s; p.x+=p.vx+Math.sin(p.a)*.12; p.y+=p.vy;
      if(p.y<-4) Object.assign(p,mk(),{y:H+4});
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.c+p.o+')'; ctx.fill();
    });
    requestAnimationFrame(draw);
  };
  draw();
}

/* ══════════════════════════════════════════════════════════
   NAV INTERACTIONS
══════════════════════════════════════════════════════════ */
function initNav() {
  const nav = document.querySelector('nav');
  if (nav) window.addEventListener('scroll', () =>
    nav.classList.toggle('scrolled', window.scrollY > 40), { passive:true });

  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mob-nav a').forEach(a => {
    if ((a.getAttribute('href')||'').includes(page)) a.classList.add('active');
  });

  const burger = document.getElementById('burger');
  const mobNav = document.getElementById('mobNav');
  if (burger && mobNav) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      mobNav.classList.toggle('open');
      document.body.style.overflow = mobNav.classList.contains('open') ? 'hidden' : '';
    });
    mobNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('open');
      mobNav.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }
}

/* ══════════════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════════════ */
function initReveal() {
  const io = new IntersectionObserver(entries =>
    entries.forEach((e,i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('in'), i * 60);
        io.unobserve(e.target);
      }
    }), { threshold:.08, rootMargin:'0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ══════════════════════════════════════════════════════════
   COUNTER ANIMATION
══════════════════════════════════════════════════════════ */
function initCounters() {
  const cio = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el=e.target, target=+el.dataset.count, dur=1800, s=performance.now();
    const tick=n=>{el.textContent=Math.floor(Math.min((n-s)/dur,1)*target); if(n-s<dur)requestAnimationFrame(tick);};
    requestAnimationFrame(tick); cio.unobserve(el);
  }), { threshold:.6 });
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));
}

/* ══════════════════════════════════════════════════════════
   "VOIR MON PLAT" — 3D LOADER
══════════════════════════════════════════════════════════ */
window.loadDishViewer = function(btn) {
  const d3 = btn.closest('.dish-3d');
  if (!d3) return;
  const glb = d3.dataset.glb || '';
  d3.classList.add('loaded');
  const mv = d3.querySelector('model-viewer');
  if (mv && glb) mv.setAttribute('src', glb);
  if (mv) mv.style.opacity = '1';
};

/* ══════════════════════════════════════════════════════════
   PRICE TAB SWITCHER (menu section pages)
══════════════════════════════════════════════════════════ */
function initPriceTabs() {
  const tabs = document.querySelectorAll('.p-tab');
  if (!tabs.length) return;

  // Read from URL param ?menu=1
  const urlMenu = new URLSearchParams(window.location.search).get('menu') || '1';
  let activeMenu = urlMenu;

  function activate(menu) {
    activeMenu = menu;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.menu === menu));
    // Show/hide prices
    document.querySelectorAll('.price-set').forEach(ps => {
      ps.style.display = ps.dataset.menu === menu ? 'flex' : 'none';
    });
  }

  tabs.forEach(t => t.addEventListener('click', () => activate(t.dataset.menu)));
  activate(activeMenu);
}

/* ══════════════════════════════════════════════════════════
   CARD TILT (desktop)
══════════════════════════════════════════════════════════ */
function initTilt() {
  if (window.matchMedia('(max-width:768px)').matches) return;
  document.querySelectorAll('.dish-card,.resto-card,.ms-card').forEach(c => {
    c.addEventListener('mousemove', e => {
      const r=c.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      c.style.transform=`perspective(700px) rotateY(${x*3}deg) rotateX(${-y*3}deg)`;
    });
    c.addEventListener('mouseleave', ()=>{ c.style.transform=''; });
  });
}

/* ══════════════════════════════════════════════════════════
   CURSOR TRAIL (desktop)
══════════════════════════════════════════════════════════ */
function initCursor() {
  if (window.matchMedia('(max-width:768px)').matches) return;
  const dots=[];
  for(let i=0;i<6;i++){
    const d=document.createElement('div'), sz=4-i*.5;
    d.style.cssText=`position:fixed;pointer-events:none;z-index:9998;
      width:${sz}px;height:${sz}px;border-radius:50%;
      background:rgba(227,30,36,${.5-i*.07});
      transform:translate(-50%,-50%);
      transition:left ${25+i*25}ms ease,top ${25+i*25}ms ease;`;
    document.body.appendChild(d); dots.push(d);
  }
  document.addEventListener('mousemove', e=>{
    dots[0].style.left=e.clientX+'px'; dots[0].style.top=e.clientY+'px';
  });
  (function loop(){
    for(let i=1;i<dots.length;i++){
      dots[i].style.left=(parseFloat(dots[i-1].style.left)||0)+'px';
      dots[i].style.top=(parseFloat(dots[i-1].style.top)||0)+'px';
    }
    requestAnimationFrame(loop);
  })();
}

/* ══════════════════════════════════════════════════════════
   VIDEO PLAY ON CLICK (gallery)
══════════════════════════════════════════════════════════ */
function initVideoSlots() {
  document.querySelectorAll('.media-slot video').forEach(v => {
    v.parentElement.addEventListener('click', () => {
      v.parentElement.classList.add('play-video');
      v.play();
    });
  });
}

/* ══════════════════════════════════════════════════════════
   INIT ALL
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Only run intro on homepage
  if (document.getElementById('intro-overlay')) runIntro();

  initNav();
  initReveal();
  initCounters();
  initPriceTabs();
  initTilt();
  initCursor();
  initVideoSlots();

  // Hero particles
  initParticles('particles');
  initParticles('rparticles');
});
