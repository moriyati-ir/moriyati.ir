(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const root = document.documentElement;
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const ease = (n) => { n = clamp(n); return n * n * (3 - 2 * n); };
  const smooth = (a, b, n) => ease((n - a) / (b - a));
  const mediaMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = mediaMotion.matches;
  try { const saved = localStorage.getItem('moriyati-reduced-motion'); if (saved !== null) reduced = saved === 'true'; } catch (_) {}
  const process = $('#process');
  const canvas = $('#metal-canvas');
  const ctx = canvas.getContext('2d', {alpha:true});
  const finishedBar = $('.finished-bar');
  const barTurntable = $('.bar-turntable');
  const barFlip = $('.bar-flip');
  const blueprintPanel = $('.engineering-drawing');
  const blueprintPen = $('.blueprint-pen');
  let manualBarSide = null, blueprintVisible = false, blueprintStart = 0;
  let blueprintSegments = [];
  const stories = $$('.process-story');
  const stageButtons = $$('[data-stage-button]');
  const pageProgress = $('.page-progress');
  const heroImage = $('.hero-photo img');
  const heroCopy = $('.hero-copy');
  const engineering = $('#engineering');
  const halo = $('.map-halo');
  let layout = {}, raf = 0, lastTime = 0, activeStage = -1, stageValue = 0, targetValue = 0;
  let artWidth = 0, artHeight = 0, processVisible = false, pointerX = 0, pointerY = 0;
  let countryIndex = 0;
  const countryNames = $$('[data-country]').map(tab=>tab.dataset.country);
  const countryEnglish = {oman:'OMAN · REFINING & PRODUCTION',uae:'UAE · GLOBAL HEADQUARTERS',tanzania:'TANZANIA · RAW MATERIALS',china:'CHINA · TECHNOLOGY & TRADE',switzerland:'SWITZERLAND · TREASURY',canada:'CANADA · JEWELLERY',usa:'USA · JEWELLERY'};

  function seeded(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const random = seeded(1707);
  const particleCount = innerWidth <= 700 ? 430 : 690;
  const particles = Array.from({length:particleCount}, (_, index) => {
    const u=random(),v=random(),a=random()*Math.PI*2,r=Math.sqrt(random());
    const y=u*2-1;
    const radius=Math.pow(Math.max(.02,Math.sin((y+1)*Math.PI/2)),.58)*(.52-y*.19);
    const liquid={x:Math.cos(a)*radius*r,y:y*.85,z:Math.sin(a)*radius*r};
    const phi=Math.acos(2*v-1),theta=u*Math.PI*2,cr=.72*Math.pow(random(),.22);
    const crystal={x:Math.sin(phi)*Math.cos(theta)*cr,y:Math.cos(phi)*cr,z:Math.sin(phi)*Math.sin(theta)*cr};
    const face=index%5,bx=(u-.5)*1.02,by=(v-.5)*1.68;
    let bar;
    if(face<2)bar={x:bx,y:by,z:face===0?.18:-.18};
    else if(face===2)bar={x:-.51,y:by,z:(u-.5)*.36};
    else if(face===3)bar={x:.51,y:by,z:(u-.5)*.36};
    else bar={x:bx,y:index%2?.84:-.84,z:(v-.5)*.36};
    // Both forms remain rectangular: the last stage resolves into the supplied minted bar.
    const minted={x:bar.x*.93,y:bar.y*.93,z:bar.z*.28};
    return {targets:[liquid,crystal,bar,minted],size:2.2+random()*3.8,metal:random()<.42?1:0,variant:index%6,shade:random(),phase:random()*6.28};
  });

  function makeGranule(metal,variant) {
    const c=document.createElement('canvas');c.width=96;c.height=96;
    const g=c.getContext('2d'),gold=metal===1;
    g.translate(48,48);g.rotate(variant*.77);
    const shape=new Path2D();
    for(let k=0;k<=24;k++){
      const a=k/24*Math.PI*2,rr=30*(.93+.045*Math.cos(a*3+variant)+.035*Math.sin(a*5));
      const x=Math.cos(a)*rr,y=Math.sin(a)*rr*.88;
      if(k===0)shape.moveTo(x,y);else shape.lineTo(x,y);
    }
    shape.closePath();
    g.shadowColor=gold?'#49301555':'#29282255';g.shadowBlur=4;g.shadowOffsetY=3;
    const base=g.createLinearGradient(-30,-27,25,30);
    const colors=gold?['#5f3f12','#b38731','#fff2ae','#b17c22','#f8de84','#785017','#e2b655']:['#51554f','#8e938a','#fffef1','#777e79','#dce0d7','#4f5550','#c4c8bf'];
    [0,.15,.32,.40,.57,.70,1].forEach((stop,i)=>base.addColorStop(stop,colors[i]));
    g.fillStyle=base;g.fill(shape);g.shadowColor='transparent';g.save();g.clip(shape);
    const crown=g.createRadialGradient(-11,-13,0,-6,-10,34);
    crown.addColorStop(0,gold?'#fffbd6f2':'#fffffff2');crown.addColorStop(.23,gold?'#fff0a5a0':'#fafff7a0');crown.addColorStop(.53,'#ffffff00');crown.addColorStop(1,'#16160d55');
    g.fillStyle=crown;g.fillRect(-35,-35,70,70);
    g.strokeStyle=gold?'#ffe8a380':'#f7fff280';g.lineWidth=.7;
    for(let j=0;j<7;j++){g.beginPath();g.ellipse(-4+j*.6,-6+j*4,21-j,5+j*.3,.2,Math.PI*.08,Math.PI*.92);g.stroke();}
    g.restore();g.strokeStyle=gold?'#a78043b0':'#666d64a0';g.lineWidth=.6;g.stroke(shape);
    g.fillStyle='#fffdf3';g.beginPath();g.ellipse(-10,-16,6.5,2.8,-.5,0,Math.PI*2);g.fill();
    return c;
  }
  const granuleSprites=[0,1].map(metal=>Array.from({length:6},(_,i)=>makeGranule(metal,i)));

  function measure() {
    const y = scrollY;
    const p = process.getBoundingClientRect();
    const e = engineering.getBoundingClientRect();
    const h = $('.hero').getBoundingClientRect();
    const art = $('.process-art').getBoundingClientRect();
    const header = $('.masthead').offsetHeight;
    layout = {width:innerWidth,height:innerHeight,small:innerWidth<=700,header:header,processTop:p.top+y-header,processRange:Math.max(1,p.height-innerHeight+header),engTop:e.top+y,engHeight:e.height,heroHeight:h.height,maxScroll:Math.max(1,document.documentElement.scrollHeight-innerHeight)};
    artWidth = art.width; artHeight = art.height;
    const dpr = Math.min(2,devicePixelRatio || 1);
    canvas.width = Math.round(artWidth*dpr); canvas.height = Math.round(artHeight*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    drawPowder();
  }

  function drawParticles(value,time) {
    if(!ctx||!artWidth||!artHeight)return;
    ctx.clearRect(0,0,artWidth,artHeight);if(reduced)return;
    const base=Math.min(3,Math.floor(value)),mix=ease(value-base),next=Math.min(3,base+1);
    const scale=Math.min(artWidth,artHeight)*.42;
    const rotY=-.28+Math.sin(time*.00015)*.09+pointerX*.14,rotX=-.10+pointerY*.07;
    const cy=Math.cos(rotY),sy=Math.sin(rotY),cx=Math.cos(rotX),sx=Math.sin(rotX);
    const nodes=particles.map(p=>{
      const a=p.targets[base],b=p.targets[next];let x=a.x+(b.x-a.x)*mix,y=a.y+(b.y-a.y)*mix,z=a.z+(b.z-a.z)*mix;
      if(value<1.6){const d=(1-clamp(value/1.6))*.025;x+=Math.sin(time*.0005+p.phase)*d;z+=Math.cos(time*.0004+p.phase)*d;}
      const rx=x*cy+z*sy,rz=z*cy-x*sy,ry=y*cx-rz*sx,depth=rz*cx+y*sx;
      return {x:artWidth*.5+rx*scale,y:artHeight*.48+ry*scale,z:depth,size:p.size*(1+depth*.23)*(layout.small?.76:1),metal:p.metal,variant:p.variant,phase:p.phase,shade:p.shade};
    }).sort((a,b)=>a.z-b.z);
    const reveal=smooth(2.55,2.95,value),fade=1-reveal;
    if(fade<.005)return;
    const shadow=ctx.createRadialGradient(artWidth*.5,artHeight*.83,0,artWidth*.5,artHeight*.83,artWidth*.29);
    shadow.addColorStop(0,'#64523916');shadow.addColorStop(1,'#64523900');ctx.globalAlpha=fade;ctx.fillStyle=shadow;ctx.fillRect(0,artHeight*.66,artWidth,artHeight*.3);
    const sweep=Math.sin(time*.00042)*artWidth*.44+artWidth*.5;
    const stars=[];
    for(const n of nodes){
      const glint=Math.pow(Math.max(0,Math.sin(time*.00115+n.phase)),30);
      const lit=Math.exp(-Math.pow((n.x-sweep)/Math.max(1,artWidth*.14),2));
      ctx.globalAlpha=fade*(.76+Math.max(lit*.18,glint*.24));
      const size=n.size*2.95;
      ctx.drawImage(granuleSprites[n.metal][n.variant],n.x-size/2,n.y-size/2,size,size);
      if(n.z>-.05&&(glint>.68||lit>.97&&n.shade>.93))stars.push({x:n.x-n.size*.23,y:n.y-n.size*.35,r:n.size*(1.2+lit*.6),a:Math.max(glint,lit*.72),metal:n.metal});
    }
    // Sparse, slow specular flashes; the light moves over solid granules.
    ctx.globalCompositeOperation='screen';
    stars.slice(0,9).forEach(n=>{
      ctx.globalAlpha=fade*n.a*.9;
      const glow=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*2.3);glow.addColorStop(0,'#fffdf1bb');glow.addColorStop(1,'#fff4c500');ctx.fillStyle=glow;ctx.fillRect(n.x-n.r*2.3,n.y-n.r*2.3,n.r*4.6,n.r*4.6);
      ctx.fillStyle=n.metal?'#fff8ce':'#ffffff';ctx.beginPath();ctx.moveTo(n.x-n.r,n.y);ctx.quadraticCurveTo(n.x-.5,n.y-.5,n.x,n.y-n.r);ctx.quadraticCurveTo(n.x+.5,n.y-.5,n.x+n.r,n.y);ctx.quadraticCurveTo(n.x+.5,n.y+.5,n.x,n.y+n.r);ctx.quadraticCurveTo(n.x-.5,n.y+.5,n.x-n.r,n.y);ctx.fill();
    });
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }

  function drawPowder() {
    const c=$('.powder-canvas'),box=c.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
    c.width=Math.round(box.width*dpr);c.height=Math.round(box.height*dpr);
    const g=c.getContext('2d');if(!g)return;g.setTransform(dpr,0,0,dpr,0,0);
    const rng=seeded(1955),w=box.width,h=box.height;
    const shadow=g.createRadialGradient(w*.53,h*.74,0,w*.53,h*.74,w*.31);
    shadow.addColorStop(0,'#79603632');shadow.addColorStop(1,'#79603600');g.fillStyle=shadow;g.fillRect(0,0,w,h);
    const n=innerWidth<=700?1700:2600;
    for(let i=0;i<n;i++){
      const u=rng(),v=rng(),a=rng()*Math.PI*2,rr=Math.sqrt(u);
      const x=w*.53+Math.cos(a)*rr*w*.28;
      const mound=(1-rr*rr)*h*.27;
      const y=h*.72+Math.sin(a)*rr*h*.1-mound*v;
      const l=rng();g.fillStyle=l>.85?'#f8dda0':l>.45?'#c4a05b':l>.2?'#9b7b44':'#6e5837';
      const r=.35+rng()*(innerWidth<=700?.85:1.3);g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
    }
  }

  function setStage(index) {
    if(index===activeStage)return;
    activeStage=index;
    $('.stage-count').textContent=String(index+1).padStart(2,'0');
    stories.forEach((story,i)=>{story.classList.toggle('active',i===index);if(reduced)story.removeAttribute('aria-hidden');else story.setAttribute('aria-hidden',String(i!==index));});
    stageButtons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  }

  function update(time,delta=16) {
    const y=scrollY,p=clamp((y-layout.processTop)/layout.processRange);
    targetValue=reduced?3:clamp(p*4,0,3);
    stageValue=delta>75?targetValue:stageValue+(targetValue-stageValue)*(1-Math.pow(.88,delta/16));if(Math.abs(targetValue-stageValue)<.001)stageValue=targetValue;
    setStage(Math.min(3,Math.round(targetValue)));
    stageButtons.forEach((b,i)=>b.style.setProperty('--step-progress',String(clamp(p*4-i))));
    const reveal=reduced?1:smooth(2.55,2.95,stageValue);
    finishedBar.style.opacity=String(reveal);
    finishedBar.style.transform=reduced?'none':'translate3d(0,'+(1-reveal)*14+'px,0) scale('+(.90+reveal*.1)+')';
    const autoFlip=reduced?0:smooth(.84,.98,p);
    const side=manualBarSide===null?autoFlip:manualBarSide;
    const angle=side*180;
    barTurntable.style.transform='rotateX('+(reduced?0:-pointerY*3)+'deg) rotateY('+(angle+(reduced?0:pointerX*5))+'deg) rotateZ('+(reduced?0:-3+side*6)+'deg)';
    finishedBar.style.setProperty('--foil-angle',(time*.005+pointerX*23)+'deg');
    finishedBar.style.setProperty('--foil-x',(47+Math.sin(time*.00028)*9+pointerX*8)+'%');
    const back=side>.5;
    barFlip.hidden=reveal<.9;
    barFlip.setAttribute('aria-pressed',String(back));
    $('.bar-flip span').textContent=window.MoriyatiLocale?.language==='en'?(back?'Show front of bar':'Show back of bar'):(back?'نمایش روی شمش':'نمایش پشت شمش');
    if(targetValue<2.5)manualBarSide=null;
    const hp=clamp(y/layout.heroHeight);
    heroImage.style.transform=reduced?'none':'translate3d(0,'+(hp*65)+'px,0) scale('+(1.04+hp*.055)+')';
    heroCopy.style.transform=reduced?'none':'translateY('+(hp*32)+'px)';
    pageProgress.style.transform='scaleX('+clamp(y/layout.maxScroll)+')';
    if(processVisible||Math.abs(stageValue-targetValue)>.001)drawParticles(stageValue,time);
    if(blueprintVisible||reduced)drawBlueprint(time);
    if(!reduced&&(processVisible||blueprintVisible)){raf=requestAnimationFrame(tick);}else{raf=0;}
  }

  function tick(time){raf=0;if(document.hidden||menu.open){lastTime=0;return;}const delta=lastTime?Math.max(1,time-lastTime):16;lastTime=time;update(time,delta);}
  function requestDraw(){if(!raf)raf=requestAnimationFrame(tick);}

  function applyMotion(persist=false) {
    root.classList.toggle('motion-on',!reduced);
    root.classList.toggle('motion-reduced',reduced);
    $('.motion-toggle').setAttribute('aria-pressed',String(reduced));
    $('.blueprint-replay').disabled=reduced;
    $('.motion-toggle span').textContent=window.MoriyatiLocale?.language==='en'?(reduced?'Motion: reduced':'Motion: on'):(reduced?'حرکت: خاموش':'حرکت: روشن');
    if(persist)try{localStorage.setItem('moriyati-reduced-motion',String(reduced));}catch(_){}
    activeStage=-1;
    if(reduced)$$('.reveal').forEach(el=>el.classList.add('visible'));
    requestAnimationFrame(()=>{measure();setStage(0);requestDraw();});
  }

  function selectCountry(index,focus=false) {
    countryIndex=(index+countryNames.length)%countryNames.length;
    const country=countryNames[countryIndex];
    $$('[data-country]').forEach((tab,i)=>{const active=i===countryIndex;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus({preventScroll:true});});
    $$('.country-panel').forEach(panel=>{const active=panel.id==='country-'+country;panel.hidden=!active;panel.classList.toggle('active',active);});
    $$('[data-map]').forEach(point=>point.classList.toggle('active',point.dataset.map===country));
    const marker=$('[data-map="'+country+'"]');
    halo.setAttribute('cx',marker.getAttribute('cx'));halo.setAttribute('cy',marker.getAttribute('cy'));
    $('.atlas-coordinates').textContent=countryEnglish[country];
    $('.country-index').textContent=String(countryIndex+1).padStart(2,'0')+' / '+String(countryNames.length).padStart(2,'0');
  }

  function initBlueprint() {
    // Separate SVG strokes so the vessel, internals and dimensions are drawn in order.
    $$('.draw-lines path').forEach(path=>{
      const d=path.getAttribute('d')||'',parts=d.match(/[Mm][^Mm]*/g)||[];
      if(parts.length<2||path.getAttribute('fill'))return;
      const fragment=document.createDocumentFragment();
      parts.forEach(part=>{const line=path.cloneNode(false);line.setAttribute('d',part);fragment.appendChild(line);});
      path.replaceWith(fragment);
    });
    blueprintSegments=$$('.draw-lines path, .draw-lines ellipse').map((path,index)=>{
      const length=path.getTotalLength();path.style.setProperty('--line-length',String(length));
      return {path:path,length:length,start:index*.055,duration:Math.max(.22,Math.min(.95,length/320))};
    });
  }
  function drawBlueprint(time) {
    const cycle=reduced?100:((time-blueprintStart)%12500)/1000;
    const ink=reduced?1:cycle>10.6?1-smooth(10.6,12.5,cycle):1;
    let head=null;
    blueprintSegments.forEach(segment=>{
      const progress=reduced?1:ease((cycle-segment.start)/segment.duration);
      segment.path.style.strokeDashoffset=String(segment.length*(1-progress));
      segment.path.style.opacity=String(ink);
      if(progress>0&&progress<1)head={segment:segment,progress:progress};
    });
    if(head&&!reduced){const point=head.segment.path.getPointAtLength(head.segment.length*head.progress);blueprintPen.setAttribute('transform','translate('+point.x+' '+point.y+')');blueprintPen.setAttribute('opacity','.9');}else blueprintPen.setAttribute('opacity','0');
    blueprintPanel.style.setProperty('--grid-visibility',String(reduced?1:smooth(0,.7,cycle)*ink));
    const phase=cycle<1.1?'01 / CONCEPT':cycle<3.4?'02 / ENGINEERING':cycle<6?'03 / DETAILING':'04 / DESIGN COMPLETE';
    $('.blueprint-phase').textContent=reduced?'DESIGNED IN-HOUSE':phase;
  }
  addEventListener('moriyati:language',()=>{applyMotion();requestDraw();});
  initBlueprint();
  $('.blueprint-replay').addEventListener('click',()=>{blueprintStart=performance.now();drawBlueprint(blueprintStart);requestDraw();});
  barFlip.addEventListener('click',()=>{manualBarSide=barFlip.getAttribute('aria-pressed')==='true'?0:1;barTurntable.style.transform='rotateY('+(manualBarSide*180)+'deg)';barFlip.setAttribute('aria-pressed',String(manualBarSide===1));$('.bar-flip span').textContent=manualBarSide?'نمایش روی شمش':'نمایش پشت شمش';requestDraw();});
  stageButtons.forEach((button,i)=>button.addEventListener('click',()=>{
    if(reduced){stories[i].scrollIntoView({behavior:'auto',block:'center'});return;}
    const fraction=(i+.08)/4;
    scrollTo({top:layout.processTop+layout.processRange*fraction,behavior:'smooth'});
  }));
  $$('[data-country]').forEach((tab,i)=>{tab.addEventListener('click',()=>selectCountry(i));tab.addEventListener('keydown',event=>{let index=i;const next=root.dir==='ltr'?'ArrowRight':'ArrowLeft',previous=root.dir==='ltr'?'ArrowLeft':'ArrowRight';if(event.key===next||event.key==='ArrowDown')index++;else if(event.key===previous||event.key==='ArrowUp')index--;else if(event.key==='Home')index=0;else if(event.key==='End')index=countryNames.length-1;else return;event.preventDefault();selectCountry(index,true);});});
  $('.country-prev').addEventListener('click',()=>selectCountry(countryIndex-1));
  $('.country-next').addEventListener('click',()=>selectCountry(countryIndex+1));
  $('.motion-toggle').addEventListener('click',()=>{reduced=!reduced;applyMotion(true);});
  mediaMotion.addEventListener('change',event=>{reduced=event.matches;applyMotion();});

  const menu=$('#mobile-menu'),menuButton=$('.menu-toggle');
  function closeMenu(){if(menu.open)menu.close();menuButton.setAttribute('aria-expanded','false');}
  menuButton.addEventListener('click',()=>{menu.showModal();menuButton.setAttribute('aria-expanded','true');});
  $('.menu-close').addEventListener('click',closeMenu);
  $$('a',menu).forEach(link=>link.addEventListener('click',closeMenu));
  menu.addEventListener('close',()=>{menuButton.setAttribute('aria-expanded','false');lastTime=0;requestDraw();});
  menu.addEventListener('click',event=>{if(event.target===menu)closeMenu();});

  if('IntersectionObserver' in window){
    const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target);}}),{threshold:.08});
    $$('.reveal').forEach(el=>revealObserver.observe(el));
    new IntersectionObserver(entries=>{processVisible=entries[0].isIntersecting;requestDraw();},{threshold:0}).observe(process);
    new IntersectionObserver(entries=>{const visible=entries[0].isIntersecting;if(visible&&!blueprintVisible)blueprintStart=performance.now();blueprintVisible=visible;requestDraw();},{threshold:.1}).observe(blueprintPanel);
  }else{$$('.reveal').forEach(el=>el.classList.add('visible'));processVisible=true;blueprintVisible=true;blueprintStart=performance.now();}
  if(matchMedia('(hover:hover)').matches){$('.process-art').addEventListener('pointermove',event=>{if(reduced)return;const box=event.currentTarget.getBoundingClientRect();pointerX=(event.clientX-box.left)/box.width-.5;pointerY=(event.clientY-box.top)/box.height-.5;requestDraw();},{passive:true});$('.process-art').addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;requestDraw();});}
  let resizeTimer;
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{measure();requestDraw();},120);},{passive:true});
  addEventListener('scroll',requestDraw,{passive:true});
  document.addEventListener('visibilitychange',()=>{lastTime=0;requestDraw();});
  $$('details').forEach(detail=>detail.addEventListener('toggle',()=>{measure();requestDraw();}));
  document.fonts.ready.then(()=>{measure();requestDraw();});
  addEventListener('load',()=>{measure();requestDraw();});
  selectCountry(0);
  applyMotion();

})();
