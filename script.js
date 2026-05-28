/* ═══════════════════════════════════
   BlueFluteX — script.js  (v2)
   ═══════════════════════════════════ */

/* ── STAR FIELD ── */
const canvas = document.getElementById('stars');
const ctx    = canvas.getContext('2d');
let W, H, stars = [];

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

class Star {
  constructor() { this.init(); }
  init() {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    this.r  = Math.random() * 1.2 + 0.2;
    this.vx = (Math.random() - 0.5) * 0.15;
    this.vy = (Math.random() - 0.5) * 0.15;
    this.a  = Math.random() * 0.6 + 0.1;
    this.flicker = Math.random() * Math.PI * 2;
    this.flickerSpeed = 0.01 + Math.random() * 0.015;
  }
  draw() {
    this.flicker += this.flickerSpeed;
    const alpha = this.a * (0.7 + 0.3 * Math.sin(this.flicker));
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0) this.x = W;
    if (this.x > W) this.x = 0;
    if (this.y < 0) this.y = H;
    if (this.y > H) this.y = 0;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = Math.random() > 0.9 ? '#00D4FF' : '#8CB8FF';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function initStars(n = 160) {
  stars = Array.from({ length: n }, () => new Star());
}

function drawLines() {
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const dx = stars[i].x - stars[j].x;
      const dy = stars[i].y - stars[j].y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < 80) {
        ctx.save();
        ctx.globalAlpha = (1 - d/80) * 0.04;
        ctx.strokeStyle = '#00D4FF';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(stars[i].x, stars[i].y);
        ctx.lineTo(stars[j].x, stars[j].y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

function loop() {
  ctx.clearRect(0, 0, W, H);
  stars.forEach(s => s.draw());
  drawLines();
  requestAnimationFrame(loop);
}

resize();
initStars();
loop();
window.addEventListener('resize', () => { resize(); initStars(); });

/* ── NAVBAR SCROLL ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
  updateActiveLink();
});

/* ── MOBILE MENU ── */
const burger = document.getElementById('burger');
const navMob = document.getElementById('nav-mob');
burger.addEventListener('click', () => {
  navMob.classList.toggle('open');
  const spans = burger.querySelectorAll('span');
  const open = navMob.classList.contains('open');
  spans[0].style.transform = open ? 'rotate(45deg) translate(5px,5px)' : '';
  spans[1].style.opacity   = open ? '0' : '';
  spans[2].style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : '';
});
navMob.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navMob.classList.remove('open');
    burger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

/* ── ACTIVE LINK ── */
const sections   = document.querySelectorAll('section[id]');
const navLinks   = document.querySelectorAll('.nav-links a');
function updateActiveLink() {
  const y = window.scrollY + 100;
  sections.forEach(sec => {
    if (y >= sec.offsetTop && y < sec.offsetTop + sec.offsetHeight) {
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${sec.id}`);
      });
    }
  });
}

/* ── SMOOTH SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); window.scrollTo({ top: t.offsetTop - 70, behavior: 'smooth' }); }
  });
});

/* ── REVEAL ON SCROLL ── */
const allReveal = document.querySelectorAll('.reveal, .reveal-r, .reveal-c');
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) en.target.classList.add('vis'); });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
allReveal.forEach(el => io.observe(el));

/* ── STAT COUNTERS ── */
const statEls = document.querySelectorAll('.stat b');
const sio = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting && !en.target.dataset.done) {
      en.target.dataset.done = '1';
      const raw  = en.target.textContent;
      const sfx  = raw.replace(/\d/g, '');
      const num  = parseInt(raw);
      const dur  = 1600;
      const t0   = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        en.target.textContent = Math.floor(num * e) + sfx;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  });
}, { threshold: 0.5 });
statEls.forEach(el => sio.observe(el));

/* ── CARD TILT ── */
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    const dx = (e.clientX - r.left - cx) / cx;
    const dy = (e.clientY - r.top  - cy) / cy;
    card.style.transform = `translateY(-6px) rotateX(${-dy*3}deg) rotateY(${dx*3}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* ── PARALLAX HERO RINGS ── */
window.addEventListener('mousemove', e => {
  const xr = (e.clientX / window.innerWidth  - 0.5) * 2;
  const yr = (e.clientY / window.innerHeight - 0.5) * 2;
  document.querySelectorAll('.hero-glow-ring').forEach((r, i) => {
    const f = (i + 1) * 8;
    r.style.transform = `rotate(${(i%2?1:-1)*360*(performance.now()/((i+1)*25000+15000))}deg) translate(${xr*f}px,${yr*f}px)`;
  });
});

/* ── CONTACT FORM ── */
const cf      = document.getElementById('cf');
const success = document.getElementById('success');
cf.addEventListener('submit', e => {
  e.preventDefault();
  const btn = cf.querySelector('button');
  btn.textContent = 'Sending…';
  btn.disabled = true;
  setTimeout(() => { cf.classList.add('hide'); success.classList.add('show'); }, 1200);
});

/* ── CURSOR GLOW (desktop only) ── */
if (window.matchMedia('(pointer:fine)').matches) {
  const cursor = document.createElement('div'); cursor.className='cursor-glow'; document.body.appendChild(cursor);
  document.addEventListener('mousemove', (e)=>{ cursor.style.transform = `translate3d(${e.clientX-18}px,${e.clientY-18}px,0)` });
  const css=`.cursor-glow{position:fixed;width:36px;height:36px;border-radius:50%;pointer-events:none;z-index:150;mix-blend-mode:screen;box-shadow:0 0 28px rgba(0,212,255,.32),0 0 60px rgba(124,58,237,.18);transform:translate3d(-999px,-999px,0);transition:transform .06s linear;border:1px solid rgba(255,255,255,.04);}`;
  const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
  window.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });
  // Futuristic interaction script: background particles, cursor glow, parallax, reveal, magnetic buttons
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const DPR = Math.max(1, devicePixelRatio || 1);
  canvas.width = w * DPR; canvas.height = h * DPR; canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; ctx.scale(DPR, DPR);

  // particle system
  const particles = [];
  const COUNT = Math.min(120, Math.floor((w*h)/70000));
  for(let i=0;i<COUNT;i++) particles.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.6+0.2, vx:(Math.random()-.5)/30, vy:(Math.random()-.5)/60, hue:200+Math.random()*120});

  function resize(){w=canvas.width=innerWidth;h=canvas.height=innerHeight;canvas.width = w*DPR;canvas.height = h*DPR;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}
  addEventListener('resize', () => { resize(); });

  let last=0;
  function tick(t){
    const dt = Math.min(40, t-last); last = t;
    ctx.clearRect(0,0,w,h);
    // subtle gradient
    const g = ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,'rgba(8,12,20,0.6)'); g.addColorStop(1,'rgba(2,6,12,0.6)'); ctx.fillStyle = g; ctx.fillRect(0,0,w,h);

    // stars/particles
    for(let p of particles){
      p.x += p.vx * dt; p.y += p.vy * dt;
      if(p.x < -10) p.x = w+10; if(p.x > w+10) p.x = -10; if(p.y < -10) p.y = h+10; if(p.y > h+10) p.y = -10;
      ctx.beginPath(); ctx.fillStyle = 'rgba(180,220,255,0.08)'; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }

    // soft larger glows
    ctx.beginPath(); ctx.fillStyle = 'rgba(0,212,255,0.03)'; ctx.ellipse(w*0.85,h*0.15,w*0.25*h/w*60, w*0.25,0,0,Math.PI*2); ctx.fill();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // reveal on scroll
  const io = new IntersectionObserver((entries)=>{
    for(const e of entries){ if(e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } }
  },{threshold:0.12});
  document.querySelectorAll('.section, .service, .project, .mcard, .hero-left').forEach(el=>io.observe(el));

  // magnetic buttons
  document.querySelectorAll('.btn-magnetic').forEach(btn=>{
    btn.addEventListener('pointermove', (ev)=>{
      const r = btn.getBoundingClientRect(); const dx = ev.clientX - (r.left + r.width/2); const dy = ev.clientY - (r.top + r.height/2); btn.style.transform = `translate(${dx*0.12}px, ${dy*0.08}px) scale(1.02)`;
    });
    btn.addEventListener('pointerleave', ()=>{ btn.style.transform = ''; });
  });

  // project hover parallax
  document.querySelectorAll('.project').forEach(p=>{
    p.addEventListener('mousemove', e=>{ const r=p.getBoundingClientRect(); const rx = (e.clientX - r.left)/r.width - .5; const ry = (e.clientY - r.top)/r.height - .5; p.style.transform = `translate(${rx*8}px, ${ry*8}px) scale(1.03)` });
    p.addEventListener('mouseleave', ()=>{ p.style.transform = ''; });
  });

  // simple contact handler (placeholder)
  const form = document.getElementById('contact-form'); if(form) form.addEventListener('submit', e=>{ e.preventDefault(); alert('Thanks — we\'ll get back to you.'); form.reset(); });

})();
  cur.style.cssText = `
    position:fixed;pointer-events:none;z-index:9999;
    width:280px;height:280px;border-radius:50%;
    background:radial-gradient(circle,rgba(0,212,255,.045),transparent 70%);
    transform:translate(-50%,-50%);top:0;left:0;
    transition:opacity .3s;
  `;
  document.body.appendChild(cur);
  window.addEventListener('mousemove', e => {
    cur.style.left = e.clientX + 'px';
    cur.style.top  = e.clientY + 'px';
  });
}

/* ── PAGE FADE IN ── */
document.body.style.opacity = '0';
document.body.style.transition = 'opacity .5s ease';
window.addEventListener('load', () => { document.body.style.opacity = '1'; });

/* ── VISITOR COUNTER (Supabase backend) ── */
(function () {

  /* ════════════════════════════════════════════════
     STEP 1 — Paste your Supabase credentials here
     Get them from: supabase.com → Project Settings → API
     ════════════════════════════════════════════════ */
  const SUPABASE_URL = 'https://lshgnnzvlilajdjiaadi.supabase.co';   // ← replace
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaGdubnp2bGlsYWpkamlhYWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MzQwNDgsImV4cCI6MjA5NTUxMDA0OH0.GyX1GpyKFwtvJuBTP0wUvlsl_m5vVamGtpRj-uVjn9M';                  // ← replace

  const el = document.getElementById('visit-count');
  if (!el) return;

  /* Format: 1234 → 1.2K, 1200000 → 1.2M */
  function fmt(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K';
    return n.toLocaleString('en-IN');
  }

  /* Animate the number rolling up */
  function animateTo(target) {
    el.classList.add('counting');
    setTimeout(() => el.classList.remove('counting'), 400);
    el.textContent = fmt(target);
  }

  const headers = {
    'Content-Type':  'application/json',
    'apikey':        SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  };

  /* Call Supabase RPC → increment count + return new value */
  fetch(SUPABASE_URL + '/rest/v1/rpc/increment_page_view', {
    method:  'POST',
    headers: headers,
    body:    JSON.stringify({ page_name: 'home' })
  })
    .then(r => {
      if (!r.ok) throw new Error('Supabase error: ' + r.status);
      return r.json();
    })
    .then(count => {
      if (typeof count === 'number') animateTo(count);
    })
    .catch(err => {
      console.warn('BFX counter:', err.message);
      /* Graceful fallback — show local count if backend unreachable */
      const local = parseInt(sessionStorage.getItem('bfx_v') || '0');
      if (!local) {
        /* First visit this session — read last known count from localStorage */
        const last = parseInt(localStorage.getItem('bfx_last') || '0');
        el.textContent = last ? fmt(last) : '—';
      }
    });

})();
