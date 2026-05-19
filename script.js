/* ============================================================
   SAVANNAH PIZZERIA — script.js v2
   Geolocation Menu · Logo Intro · Full Mobile
   ============================================================ */

/* ── Geolocation region detection ───────────────────── */
function distKm(la1,lo1,la2,lo2){
  const R=6371,dL=(la2-la1)*Math.PI/180,dO=(lo2-lo1)*Math.PI/180;
  const a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dO/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function getMenuForCoords(lat,lon){
  if(distKm(lat,lon,35.697,-0.633)<130)return'2';// Oran
  if(distKm(lat,lon,35.931,0.089)<90)return'2';  // Mostaganem
  if(distKm(lat,lon,36.365,6.615)<110)return'2'; // Constantine
  if(lon>6.8&&lat>35.0)return'2';                 // Far east
  if(distKm(lat,lon,36.737,3.086)<55)return'1';  // Algiers core
  return'3';                                       // Interior
}
function detectRegion(){
  return new Promise(resolve=>{
    if(!navigator.geolocation){resolve('1');return;}
    navigator.geolocation.getCurrentPosition(
      p=>resolve(getMenuForCoords(p.coords.latitude,p.coords.longitude)),
      ()=>resolve(null),{timeout:5000,maximumAge:300000});
  });
}

/* ── Price tabs ──────────────────────────────────────── */
async function initPriceTabs(){
  const tabs=document.querySelectorAll('.p-tab');
  if(!tabs.length)return;
  const urlMenu=new URLSearchParams(window.location.search).get('menu');
  const cached=sessionStorage.getItem('sv_menu');
  let active=urlMenu||cached||null;
  const labels={'1':'Alger & région','2':'Oran · Constantine · Mostaganem','3':'Intérieur du pays'};

  function activate(m){
    active=m; sessionStorage.setItem('sv_menu',m);
    tabs.forEach(t=>t.classList.toggle('active',t.dataset.menu===m));
    document.querySelectorAll('.price-set').forEach(ps=>{
      const show=ps.dataset.menu===m;
      ps.style.display=show?(ps.classList.contains('price-single')?'block':'flex'):'none';
    });
    const banner=document.getElementById('geo-banner');
    if(banner){
      const span=banner.querySelector('.geo-region');
      if(span)span.textContent=labels[m]||m;
    }
  }

  tabs.forEach(t=>t.addEventListener('click',()=>activate(t.dataset.menu)));

  if(active){ activate(active); return; }
  const banner=document.getElementById('geo-banner');
  if(banner)banner.style.display='flex';
  const detected=await detectRegion();
  if(detected){
    activate(detected);
    if(banner)setTimeout(()=>{banner.style.opacity='0';setTimeout(()=>banner.style.display='none',500);},3500);
  } else {
    activate('1');
    if(banner){banner.innerHTML='<span style="font-family:var(--fmain);font-size:.72rem;color:rgba(255,255,255,.5)">Choisissez votre région ci-dessus</span>';setTimeout(()=>{banner.style.opacity='0';setTimeout(()=>banner.style.display='none',500);},4000);}
  }
}

/* ── Intro animation ──────────────────────────────────── */
function runIntro(){
  const overlay=document.getElementById('intro-overlay');
  const canvas=document.getElementById('intro-canvas');
  const logoWrap=document.querySelector('.intro-logo-wrap');
  const skipBtn=document.querySelector('.intro-skip');
  if(!overlay||!canvas)return;
  const ctx=canvas.getContext('2d');
  let W,H,done=false;
  const resize=()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;};
  window.addEventListener('resize',resize,{passive:true});resize();
  const rays=[];const NUM=28;const CX=()=>W/2,CY=()=>H/2;
  const initRays=()=>{rays.length=0;for(let i=0;i<NUM;i++){const angle=(i/NUM)*Math.PI*2,dist=Math.max(W,H)*.9;rays.push({x:CX()+Math.cos(angle)*dist,y:CY()+Math.sin(angle)*dist,t:0,speed:.022+Math.random()*.022,width:1.2+Math.random()*2.8,delay:Math.random()*.35,isRed:Math.random()<.65});}};
  initRays();
  let phase='rays',phaseT=0,logoVisible=false,exitT=0;
  const eio=t=>t<.5?2*t*t:-1+(4-2*t)*t;
  const lerp=(a,b,t)=>a+(b-a)*t;
  function frame(){
    if(done)return;
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,W,H);
    phaseT+=.016;
    if(phase==='rays'){
      rays.forEach(r=>{
        if(phaseT<r.delay)return;r.t=Math.min(r.t+r.speed,1);
        const p=eio(r.t),cx=CX(),cy=CY(),tx=lerp(r.x,cx,p),ty=lerp(r.y,cy,p);
        ctx.save();ctx.globalAlpha=p*.72;
        const g=ctx.createLinearGradient(r.x,r.y,tx,ty);
        if(r.isRed){g.addColorStop(0,'rgba(227,30,36,0)');g.addColorStop(.6,'rgba(255,50,50,.55)');g.addColorStop(1,'rgba(255,100,100,.9)');}
        else{g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.7,'rgba(255,230,220,.45)');g.addColorStop(1,'rgba(255,255,255,.85)');}
        ctx.strokeStyle=g;ctx.lineWidth=r.width;ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(tx,ty);ctx.stroke();ctx.restore();
        ctx.save();ctx.globalAlpha=p*.38;
        const g2=ctx.createRadialGradient(tx,ty,0,tx,ty,35);
        g2.addColorStop(0,r.isRed?'rgba(255,50,50,.85)':'rgba(255,255,255,.7)');g2.addColorStop(1,'transparent');
        ctx.fillStyle=g2;ctx.beginPath();ctx.arc(tx,ty,35,0,Math.PI*2);ctx.fill();ctx.restore();
      });
      const avg=rays.reduce((s,r)=>s+r.t,0)/rays.length;
      if(avg>.28){ctx.save();ctx.globalAlpha=(avg-.28)*.65;const cg=ctx.createRadialGradient(CX(),CY(),0,CX(),CY(),130);cg.addColorStop(0,'rgba(255,70,70,.9)');cg.addColorStop(.4,'rgba(227,30,36,.4)');cg.addColorStop(1,'transparent');ctx.fillStyle=cg;ctx.beginPath();ctx.arc(CX(),CY(),130,0,Math.PI*2);ctx.fill();ctx.restore();}
      if(rays.every(r=>r.t>=1)&&phaseT>1.1){phase='flash';phaseT=0;}
    }
    if(phase==='flash'){
      rays.forEach(r=>{ctx.save();ctx.globalAlpha=Math.max(0,.7-phaseT*1.6);const g=ctx.createLinearGradient(r.x,r.y,CX(),CY());g.addColorStop(0,'rgba(227,30,36,0)');g.addColorStop(1,r.isRed?'rgba(255,70,70,.55)':'rgba(255,255,255,.45)');ctx.strokeStyle=g;ctx.lineWidth=r.width;ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(CX(),CY());ctx.stroke();ctx.restore();});
      const fa=Math.max(0,Math.sin(phaseT*Math.PI*2.5)*.9);
      ctx.save();ctx.globalAlpha=fa;ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,W,H);ctx.restore();
      if(phaseT>.55){phase='logo';phaseT=0;}
    }
    if(phase==='logo'){
      const fade=Math.min(phaseT/.5,1);
      ctx.save();ctx.globalAlpha=Math.max(0,1-fade);ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,W,H);ctx.restore();
      ctx.save();ctx.globalAlpha=Math.max(0,.45-phaseT*.4);const cg=ctx.createRadialGradient(CX(),CY(),0,CX(),CY(),220);cg.addColorStop(0,'rgba(255,60,60,.5)');cg.addColorStop(1,'transparent');ctx.fillStyle=cg;ctx.beginPath();ctx.arc(CX(),CY(),220,0,Math.PI*2);ctx.fill();ctx.restore();
      if(!logoVisible&&phaseT>.25){logoVisible=true;if(logoWrap)logoWrap.classList.add('visible');}
      if(phaseT>1.9){phase='exit';phaseT=0;}
    }
    if(phase==='exit'){
      exitT=Math.min(exitT+.018,1);
      ctx.save();ctx.globalAlpha=exitT;ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,W,H);ctx.restore();
      if(exitT>=1){overlay.classList.add('hidden');done=true;return;}
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const skip=()=>{done=true;if(logoWrap)logoWrap.classList.add('visible');overlay.classList.add('hidden');};
  if(skipBtn)skipBtn.addEventListener('click',skip);
  window.addEventListener('keydown',skip,{once:true});
}

/* ── Particles ───────────────────────────────────────── */
function initParticles(id){
  const canvas=document.getElementById(id);if(!canvas)return;
  const ctx=canvas.getContext('2d');let W,H;
  const resize=()=>{W=canvas.width=canvas.offsetWidth;H=canvas.height=canvas.offsetHeight;};
  window.addEventListener('resize',resize,{passive:true});resize();
  const cols=['rgba(227,30,36,','rgba(255,60,60,','rgba(180,20,20,','rgba(255,255,255,','rgba(255,200,200,'];
  const mk=()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.3+.2,vy:-(Math.random()*.22+.06),vx:(Math.random()-.5)*.1,a:Math.random()*Math.PI*2,s:Math.random()*.016,o:Math.random()*.38+.04,c:cols[Math.floor(Math.random()*cols.length)]});
  const pts=Array.from({length:80},mk);
  const draw=()=>{ctx.clearRect(0,0,W,H);pts.forEach(p=>{p.a+=p.s;p.x+=p.vx+Math.sin(p.a)*.1;p.y+=p.vy;if(p.y<-4)Object.assign(p,mk(),{y:H+4});ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.c+p.o+')';ctx.fill();});requestAnimationFrame(draw);};
  draw();
}

/* ── Nav ─────────────────────────────────────────────── */
function initNav(){
  const nav=document.querySelector('nav');
  if(nav)window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>40),{passive:true});
  const page=window.location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav-links a,.mob-nav a').forEach(a=>{if((a.getAttribute('href')||'').includes(page))a.classList.add('active');});
  const burger=document.getElementById('burger'),mobNav=document.getElementById('mobNav');
  if(burger&&mobNav){
    burger.addEventListener('click',()=>{burger.classList.toggle('open');mobNav.classList.toggle('open');document.body.style.overflow=mobNav.classList.contains('open')?'hidden':'';});
    mobNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{burger.classList.remove('open');mobNav.classList.remove('open');document.body.style.overflow='';}));
  }
}

/* ── Reveal ──────────────────────────────────────────── */
function initReveal(){
  const io=new IntersectionObserver(entries=>entries.forEach((e,i)=>{if(e.isIntersecting){setTimeout(()=>e.target.classList.add('in'),i*55);io.unobserve(e.target);}}),{threshold:.07,rootMargin:'0px 0px -25px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}

/* ── Counters ────────────────────────────────────────── */
function initCounters(){
  const cio=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,target=+el.dataset.count,dur=1800,s=performance.now();const tick=n=>{el.textContent=Math.floor(Math.min((n-s)/dur,1)*target);if(n-s<dur)requestAnimationFrame(tick);};requestAnimationFrame(tick);cio.unobserve(el);}),{threshold:.6});
  document.querySelectorAll('[data-count]').forEach(el=>cio.observe(el));
}

/* ── 3D viewer ───────────────────────────────────────── */
window.loadDishViewer=function(btn){
  const d3=btn.closest('.dish-3d');if(!d3)return;
  const glb=d3.dataset.glb||'';d3.classList.add('loaded');
  const mv=d3.querySelector('model-viewer');
  if(mv&&glb)mv.setAttribute('src',glb);if(mv)mv.style.opacity='1';
};

/* ── Tilt ────────────────────────────────────────────── */
function initTilt(){
  if(window.matchMedia('(max-width:768px)').matches)return;
  document.querySelectorAll('.dish-card,.resto-card,.ms-card').forEach(c=>{
    c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(700px) rotateY(${x*3}deg) rotateX(${-y*3}deg)`;});
    c.addEventListener('mouseleave',()=>{c.style.transform='';});
  });
}

/* ── Cursor ──────────────────────────────────────────── */
function initCursor(){
  if(window.matchMedia('(max-width:768px)').matches)return;
  const dots=[];
  for(let i=0;i<6;i++){const d=document.createElement('div'),sz=4-i*.5;d.style.cssText=`position:fixed;pointer-events:none;z-index:9998;width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(227,30,36,${.5-i*.07});transform:translate(-50%,-50%);transition:left ${22+i*22}ms ease,top ${22+i*22}ms ease;`;document.body.appendChild(d);dots.push(d);}
  document.addEventListener('mousemove',e=>{dots[0].style.left=e.clientX+'px';dots[0].style.top=e.clientY+'px';});
  (function loop(){for(let i=1;i<dots.length;i++){dots[i].style.left=(parseFloat(dots[i-1].style.left)||0)+'px';dots[i].style.top=(parseFloat(dots[i-1].style.top)||0)+'px';}requestAnimationFrame(loop);})();
}

/* ── Init ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  if(document.getElementById('intro-overlay'))runIntro();
  initNav();initReveal();initCounters();initPriceTabs();initTilt();initCursor();
  initParticles('particles');initParticles('rparticles');
  document.querySelectorAll('.media-slot video').forEach(v=>v.addEventListener('click',()=>v.paused?v.play():v.pause()));
});
