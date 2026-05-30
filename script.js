/* ============================================================
   SAVANNAH PIZZERIA — script.js v3
   ============================================================ */

/* ── Geolocation menu detection ──────────────────────── */
function distKm(la1,lo1,la2,lo2){
  const R=6371,dL=(la2-la1)*Math.PI/180,dO=(lo2-lo1)*Math.PI/180;
  const a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dO/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function menuForCoords(lat,lon){
  // Menu 2 = Oran & Mostaganem only
  if(distKm(lat,lon,35.697,-0.633)<130)return'2'; // Oran
  if(distKm(lat,lon,35.931,0.089)<90)return'2';   // Mostaganem
  // Menu 1 = Algiers metro
  if(distKm(lat,lon,36.737,3.086)<60)return'1';
  if(distKm(lat,lon,36.737,3.086)<90&&lat>36.4)return'1';
  // Menu 3 = Constantine + interior (everything else)
  return'3';
}

async function initPriceTabs(){
  const tabs=document.querySelectorAll('.p-tab');
  if(!tabs.length)return;

  const LABELS={'1':'Menu 1 (Didouche · Draria · Kouba · Birkhadem · Chéraga · Staouali · Blida)','2':'Menu 2 (Oran · Oran Trait d'Union · Mostaganem)','3':'Menu 3 (Constantine · Khemis Miliana · Khemis Express · Aïn Defla · Djelfa · Chlef)'};

  function activate(m,save){
    if(save!==false)sessionStorage.setItem('sv_menu',m);
    tabs.forEach(t=>t.classList.toggle('active',t.dataset.menu===m));
    document.querySelectorAll('.price-set').forEach(ps=>{
      const show=ps.dataset.menu===m;
      ps.style.display=show?(ps.classList.contains('price-single')?'block':'flex'):'none';
    });
    const banner=document.getElementById('geo-banner');
    if(banner){const sp=banner.querySelector('.geo-region');if(sp)sp.textContent=LABELS[m]||m;}
    // sync region-btns if present
    document.querySelectorAll('.region-btn').forEach(b=>b.classList.toggle('active',b.dataset.menu===m));
  }

  tabs.forEach(t=>t.addEventListener('click',()=>activate(t.dataset.menu)));
  document.querySelectorAll('.region-btn').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.menu)));

  // Priority: 1=URL param, 2=session, 3=geo, 4=default
  const urlMenu=new URLSearchParams(window.location.search).get('menu');
  if(urlMenu){activate(urlMenu);return;}
  const cached=sessionStorage.getItem('sv_menu');
  if(cached){activate(cached,false);return;}

  // Try geolocation
  const banner=document.getElementById('geo-banner');
  const selector=document.getElementById('region-selector');

  if(!navigator.geolocation){
    activate('1');
    if(selector)selector.style.display='block';
    return;
  }

  if(banner)banner.style.display='flex';

  navigator.geolocation.getCurrentPosition(
    pos=>{
      const m=menuForCoords(pos.coords.latitude,pos.coords.longitude);
      activate(m);
      if(banner){
        banner.style.display='flex';
        setTimeout(()=>{banner.style.opacity='0';setTimeout(()=>banner.style.display='none',500);},3500);
      }
    },
    ()=>{
      // User denied — show manual selector
      if(banner)banner.style.display='none';
      if(selector)selector.style.display='block';
      activate('1',false);
    },
    {timeout:6000,maximumAge:600000}
  );
}

/* ── Intro animation ──────────────────────────────────── */
function runIntro(){
  const overlay=document.getElementById('intro-overlay');
  const canvas=document.getElementById('intro-canvas');
  const logoWrap=document.querySelector('.intro-logo-wrap');
  const skipBtn=document.querySelector('.intro-skip');
  if(!overlay||!canvas)return;
  const ctx=canvas.getContext('2d');let W,H,done=false;
  const sz=()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;};
  window.addEventListener('resize',sz,{passive:true});sz();
  const rays=[];const N=28;const CX=()=>W/2,CY=()=>H/2;
  const mkRays=()=>{rays.length=0;for(let i=0;i<N;i++){const a=(i/N)*Math.PI*2,d=Math.max(W,H)*.9;rays.push({x:CX()+Math.cos(a)*d,y:CY()+Math.sin(a)*d,t:0,sp:.022+Math.random()*.022,w:1.2+Math.random()*2.8,del:Math.random()*.35,red:Math.random()<.65});}};
  mkRays();
  let phase='rays',pt=0,lv=false,et=0;
  const eio=t=>t<.5?2*t*t:-1+(4-2*t)*t;
  const lr=(a,b,t)=>a+(b-a)*t;
  function frame(){
    if(done)return;
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,W,H);
    pt+=.016;
    if(phase==='rays'){
      rays.forEach(r=>{
        if(pt<r.del)return;r.t=Math.min(r.t+r.sp,1);
        const p=eio(r.t),cx=CX(),cy=CY(),tx=lr(r.x,cx,p),ty=lr(r.y,cy,p);
        ctx.save();ctx.globalAlpha=p*.72;
        const g=ctx.createLinearGradient(r.x,r.y,tx,ty);
        if(r.red){g.addColorStop(0,'rgba(227,30,36,0)');g.addColorStop(.6,'rgba(255,55,55,.55)');g.addColorStop(1,'rgba(255,100,100,.9)');}
        else{g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.7,'rgba(200,240,255,.5)');g.addColorStop(1,'rgba(255,255,255,.85)');}
        ctx.strokeStyle=g;ctx.lineWidth=r.w;ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(tx,ty);ctx.stroke();ctx.restore();
        ctx.save();ctx.globalAlpha=p*.4;
        const g2=ctx.createRadialGradient(tx,ty,0,tx,ty,32);
        g2.addColorStop(0,r.red?'rgba(255,55,55,.85)':'rgba(200,240,255,.75)');g2.addColorStop(1,'transparent');
        ctx.fillStyle=g2;ctx.beginPath();ctx.arc(tx,ty,32,0,Math.PI*2);ctx.fill();ctx.restore();
      });
      const avg=rays.reduce((s,r)=>s+r.t,0)/rays.length;
      if(avg>.28){ctx.save();ctx.globalAlpha=(avg-.28)*.65;const cg=ctx.createRadialGradient(CX(),CY(),0,CX(),CY(),130);cg.addColorStop(0,'rgba(255,70,70,.9)');cg.addColorStop(.4,'rgba(227,30,36,.4)');cg.addColorStop(1,'transparent');ctx.fillStyle=cg;ctx.beginPath();ctx.arc(CX(),CY(),130,0,Math.PI*2);ctx.fill();ctx.restore();}
      if(rays.every(r=>r.t>=1)&&pt>1.1){phase='flash';pt=0;}
    }
    if(phase==='flash'){
      rays.forEach(r=>{ctx.save();ctx.globalAlpha=Math.max(0,.7-pt*1.6);const g=ctx.createLinearGradient(r.x,r.y,CX(),CY());g.addColorStop(0,'rgba(227,30,36,0)');g.addColorStop(1,r.red?'rgba(255,70,70,.55)':'rgba(200,240,255,.5)');ctx.strokeStyle=g;ctx.lineWidth=r.w;ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(CX(),CY());ctx.stroke();ctx.restore();});
      const fa=Math.max(0,Math.sin(pt*Math.PI*2.5)*.9);ctx.save();ctx.globalAlpha=fa;ctx.fillStyle='#FFF';ctx.fillRect(0,0,W,H);ctx.restore();
      if(pt>.55){phase='logo';pt=0;}
    }
    if(phase==='logo'){
      ctx.save();ctx.globalAlpha=Math.max(0,1-pt/.5);ctx.fillStyle='#FFF';ctx.fillRect(0,0,W,H);ctx.restore();
      ctx.save();ctx.globalAlpha=Math.max(0,.45-pt*.4);const cg=ctx.createRadialGradient(CX(),CY(),0,CX(),CY(),200);cg.addColorStop(0,'rgba(255,60,60,.5)');cg.addColorStop(1,'transparent');ctx.fillStyle=cg;ctx.beginPath();ctx.arc(CX(),CY(),200,0,Math.PI*2);ctx.fill();ctx.restore();
      if(!lv&&pt>.25){lv=true;if(logoWrap)logoWrap.classList.add('visible');}
      if(pt>1.9){phase='exit';pt=0;}
    }
    if(phase==='exit'){
      et=Math.min(et+.018,1);ctx.save();ctx.globalAlpha=et;ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,W,H);ctx.restore();
      if(et>=1){overlay.classList.add('hidden');done=true;return;}
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
  const c=document.getElementById(id);if(!c)return;
  const ctx=c.getContext('2d');let W,H;
  const rsz=()=>{W=c.width=c.offsetWidth;H=c.height=c.offsetHeight;};
  window.addEventListener('resize',rsz,{passive:true});rsz();
  const cols=['rgba(227,30,36,','rgba(255,60,60,','rgba(180,20,20,','rgba(255,255,255,','rgba(200,240,255,'];
  const mk=()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2+.2,vy:-(Math.random()*.2+.06),vx:(Math.random()-.5)*.09,a:Math.random()*Math.PI*2,s:Math.random()*.015,o:Math.random()*.36+.04,col:cols[Math.floor(Math.random()*cols.length)]});
  const pts=Array.from({length:70},mk);
  (function draw(){ctx.clearRect(0,0,W,H);pts.forEach(p=>{p.a+=p.s;p.x+=p.vx+Math.sin(p.a)*.09;p.y+=p.vy;if(p.y<-4)Object.assign(p,mk(),{y:H+4});ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.col+p.o+')';ctx.fill();});requestAnimationFrame(draw);})();
}

/* ── Nav ─────────────────────────────────────────────── */
function initNav(){
  const nav=document.querySelector('nav');
  if(nav)window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>40),{passive:true});
  const page=window.location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav-links a,.mob-nav a').forEach(a=>{if((a.getAttribute('href')||'').includes(page))a.classList.add('active');});
  const burger=document.getElementById('burger'),mob=document.getElementById('mobNav');
  if(burger&&mob){
    burger.addEventListener('click',()=>{burger.classList.toggle('open');mob.classList.toggle('open');document.body.style.overflow=mob.classList.contains('open')?'hidden':'';});
    mob.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{burger.classList.remove('open');mob.classList.remove('open');document.body.style.overflow='';}));
  }
}

/* ── Scroll reveal ───────────────────────────────────── */
function initReveal(){
  const io=new IntersectionObserver(es=>es.forEach((e,i)=>{if(e.isIntersecting){setTimeout(()=>e.target.classList.add('in'),i*50);io.unobserve(e.target);}}),{threshold:.07,rootMargin:'0px 0px -20px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}

/* ── Counters ────────────────────────────────────────── */
function initCounters(){
  const cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,tgt=+el.dataset.count,dur=1800,s=performance.now();(function tick(n){el.textContent=Math.floor(Math.min((n-s)/dur,1)*tgt);if(n-s<dur)requestAnimationFrame(tick);})(performance.now());cio.unobserve(el);}),{threshold:.6});
  document.querySelectorAll('[data-count]').forEach(el=>cio.observe(el));
}

/* ── 3D viewer ───────────────────────────────────────── */
window.loadDishViewer=function(btn){
  const d3=btn.closest('.dish-3d');if(!d3)return;
  d3.classList.add('loaded');
  const mv=d3.querySelector('model-viewer'),glb=d3.dataset.glb||'';
  if(mv&&glb)mv.setAttribute('src',glb);if(mv)mv.style.opacity='1';
};

/* ── Tilt (desktop) ──────────────────────────────────── */
function initTilt(){
  if(window.matchMedia('(hover:none)').matches)return;
  document.querySelectorAll('.dish-card,.resto-card,.ms-card').forEach(c=>{
    c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(700px) rotateY(${x*2.5}deg) rotateX(${-y*2.5}deg)`;});
    c.addEventListener('mouseleave',()=>{c.style.transform='';});
  });
}

/* ── Cursor trail (desktop) ──────────────────────────── */
function initCursor(){
  if(window.matchMedia('(hover:none)').matches)return;
  const dots=[];
  for(let i=0;i<6;i++){const d=document.createElement('div'),sz=3.5-i*.45;d.style.cssText=`position:fixed;pointer-events:none;z-index:9998;width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(227,30,36,${.48-i*.07});transform:translate(-50%,-50%);transition:left ${20+i*20}ms linear,top ${20+i*20}ms linear;`;document.body.appendChild(d);dots.push(d);}
  document.addEventListener('mousemove',e=>{dots[0].style.left=e.clientX+'px';dots[0].style.top=e.clientY+'px';});
  (function loop(){for(let i=1;i<dots.length;i++){dots[i].style.left=(parseFloat(dots[i-1].style.left)||0)+'px';dots[i].style.top=(parseFloat(dots[i-1].style.top)||0)+'px';}requestAnimationFrame(loop);})();
}

/* ── Init ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  const introOverlay=document.getElementById('intro-overlay');
  if(introOverlay){
    runIntro();
    // Hard fallback — force-remove after 7s no matter what
    setTimeout(()=>{
      if(introOverlay && !introOverlay.classList.contains('hidden')){
        const logoWrap=document.querySelector('.intro-logo-wrap');
        if(logoWrap)logoWrap.classList.add('visible');
        introOverlay.classList.add('hidden');
        setTimeout(()=>introOverlay.style.display='none',800);
      }
    },7000);
  }
  initNav();initReveal();initCounters();initPriceTabs();initTilt();initCursor();
  initParticles('particles');initParticles('rparticles');
  document.querySelectorAll('.media-slot video').forEach(v=>v.addEventListener('click',()=>v.paused?v.play():v.pause()));
});
