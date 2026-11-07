(() => {
  'use strict';
  const root=document.documentElement;
  const tree=document.querySelector('.genealogy');
  const svg=tree.querySelector('.genealogy-lines');
  const group=svg.querySelector('g');
  const people=[...tree.querySelectorAll('[data-person]')];
  const timeline=document.querySelector('.heritage-milestones');
  const city=document.querySelector('.heritage-city-portrait');
  const artwork=document.querySelector('.art-reveal');
  const ns='http://www.w3.org/2000/svg';
  const clamp=v=>Math.max(0,Math.min(1,v));
  const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  let queued=false,clip;
  function build(){
    const bounds=tree.getBoundingClientRect();
    svg.setAttribute('viewBox','0 0 '+bounds.width+' '+bounds.height);
    svg.setAttribute('width',bounds.width);svg.setAttribute('height',bounds.height);
    group.replaceChildren();
    let defs=svg.querySelector('defs');if(defs)defs.remove();
    defs=document.createElementNS(ns,'defs');const cut=document.createElementNS(ns,'clipPath');cut.id='genealogy-progress';clip=document.createElementNS(ns,'rect');clip.setAttribute('width',bounds.width);clip.setAttribute('height',bounds.height);cut.append(clip);defs.append(cut);svg.prepend(defs);group.setAttribute('clip-path','url(#genealogy-progress)');
    const point=el=>{const r=el.getBoundingClientRect();return{x:r.left-bounds.left+r.width/2,top:r.top-bounds.top,bottom:r.bottom-bounds.top};};
    const person=id=>point(tree.querySelector('[data-person="'+id+'"]'));
    function path(d,kind){const p=document.createElementNS(ns,'path');p.setAttribute('d',d);if(kind)p.setAttribute('class',kind);group.append(p);}
    const father=person('mohammad'),mother=person('elahe'),son=person('alireza'),daughter=person('ala');
    tree.querySelectorAll('.family-column').forEach((column,i)=>{const start=point(column.querySelector('.family-name'));const end=i===0?father:mother;path('M'+start.x+' '+start.bottom+' V'+end.top,'family-stem');});
    const unionY=Math.max(father.bottom,mother.bottom)+25;
    const mid=(father.x+mother.x)/2;
    const forkY=Math.min(son.top,daughter.top)-25;
    path('M'+father.x+' '+father.bottom+' V'+unionY+' H'+mother.x+' V'+mother.bottom);
    path('M'+mid+' '+unionY+' V'+forkY+' M'+son.x+' '+son.top+' V'+forkY+' H'+daughter.x+' V'+daughter.top);
    request();
  }
  function draw(){
    queued=false;
    const reduced=root.classList.contains('motion-reduced');
    const h=innerHeight;
    const r=tree.getBoundingClientRect();
    const trace=reduced?r.height:Math.max(0,Math.min(r.height,h*.7-r.top));
    if(clip)clip.setAttribute('height',trace);
    people.forEach(el=>{const b=el.getBoundingClientRect();el.style.setProperty('--node-progress',reduced?1:ease((h*.87-b.top)/Math.min(230,h*.38)));});
    const t=timeline.getBoundingClientRect();timeline.style.setProperty('--timeline-progress',reduced?1:clamp((h*.75-t.top)/t.height));
    const c=city.getBoundingClientRect();city.style.setProperty('--city-ink',reduced?1:ease((h*.95-c.top)/(Math.min(c.height,h*.5))));
    const a=artwork.getBoundingClientRect();const p=reduced?1:ease((h*.9-a.top)/(Math.min(a.height,h*.72)));
    artwork.style.setProperty('--art-image',reduced?1:ease((p-.13)/.74));
    artwork.querySelectorAll('.art-gesture').forEach((path,i)=>{const len=path.getTotalLength();path.style.strokeDasharray=len;path.style.strokeDashoffset=len*(1-clamp(p*1.5-i*.15));});
  }
  function request(){if(!queued){queued=true;requestAnimationFrame(draw);}}
  document.querySelectorAll('.lineage-mark path,.lineage-mark rect,.lineage-mark ellipse').forEach(path=>{path.style.setProperty('--stroke-length',path.getTotalLength());});
  root.classList.add('heritage-animated');
  addEventListener('scroll',request,{passive:true});
  addEventListener('resize',build,{passive:true});
  addEventListener('moriyati:language',()=>requestAnimationFrame(build));
  addEventListener('moriyati:motion',request);
  new ResizeObserver(()=>requestAnimationFrame(build)).observe(tree);
  document.fonts.ready.then(build);build();
})();

/* Reveal connected Persian lettering in its own font, in reading direction. */
(() => {
 const root=document.documentElement,head=document.querySelector('.heritage-entry-heading');
 const title=head.querySelector('h1'),subtitle=head.querySelector('.heritage-subtitle');
 let frame=0;
 title.style.setProperty('--write',0);subtitle.style.setProperty('--write',0);
 function reveal(){
  cancelAnimationFrame(frame);
  if(root.classList.contains('motion-reduced')){title.style.setProperty('--write',1);subtitle.style.setProperty('--write',1);return;}
  title.style.setProperty('--write',0);subtitle.style.setProperty('--write',0);
  let start;
  function tick(now){start??=now;const elapsed=now-start;title.style.setProperty('--write',Math.min(1,elapsed/1250));subtitle.style.setProperty('--write',Math.max(0,Math.min(1,(elapsed-1270)/620)));if(elapsed<1900)frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);
 }
 document.fonts.ready.then(reveal);addEventListener('moriyati:language',reveal);addEventListener('moriyati:motion',()=>{if(root.classList.contains('motion-reduced'))reveal();});
})();
