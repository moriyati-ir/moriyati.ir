(() => {
 'use strict';
 const root=document.documentElement,menu=document.querySelector('#mobile-menu'),menuButton=document.querySelector('#menu-button'),motion=document.querySelector('#page-motion-toggle');
 let reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 try{reduced=reduced||localStorage.getItem('moriyati-reduced-motion')==='true';}catch(_){}
 function closeMenu(){menu.close();menuButton.setAttribute('aria-expanded','false');}
 menuButton?.addEventListener('click',()=>{menu.showModal();menuButton.setAttribute('aria-expanded','true');});
 menu?.querySelector('[data-close-menu]').addEventListener('click',closeMenu);
 menu?.addEventListener('close',()=>menuButton.setAttribute('aria-expanded','false'));
 function labels(){const lang=window.MoriyatiLocale.language;document.title=document.body.dataset[lang==='fa'?'titleFa':'titleEn'];const el=document.querySelector('#page-motion-label');el.textContent=lang==='fa'?(reduced?'حرکت: کاهش‌یافته':'حرکت: روشن'):(reduced?'Motion: reduced':'Motion: on');}
 function motionState(save=false){root.classList.toggle('motion-reduced',reduced);motion?.setAttribute('aria-pressed',String(reduced));if(save)try{localStorage.setItem('moriyati-reduced-motion',String(reduced));}catch(_){}labels();draw();dispatchEvent(new CustomEvent('moriyati:motion',{detail:{reduced}}));}
 motion?.addEventListener('click',()=>{reduced=!reduced;motionState(true);});
 addEventListener('moriyati:language',labels);
 const intro=document.querySelector('.contact-intro'),map=document.querySelector('.city-map');
 let pending=false,zoom=1;
 const clamp=x=>Math.max(0,Math.min(1,x));
 function draw(){pending=false;if(intro){const r=intro.getBoundingClientRect();intro.style.setProperty('--letter-open',reduced?1:clamp(.2+(innerHeight-r.top)/innerHeight*.45+(-r.top)/r.height*.6));}if(map){const r=map.getBoundingClientRect();map.style.setProperty('--city-rise',reduced?1:clamp((innerHeight-r.top)/(innerHeight*.8)));}}
 function request(){if(!pending){pending=true;requestAnimationFrame(draw);}}
 document.querySelectorAll('[data-map-zoom]').forEach(b=>b.addEventListener('click',()=>{zoom=b.dataset.mapZoom==='reset'?1:Math.max(1,Math.min(2.4,zoom+(b.dataset.mapZoom==='in'?.35:-.35)));map.style.setProperty('--map-zoom',zoom);}));
 map?.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='-'||e.key==='0'){e.preventDefault();document.querySelector('[data-map-zoom="'+(e.key==='0'?'reset':e.key==='+'?'in':'out')+'"]').click();}});
 addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',e=>{reduced=e.matches;motionState();});motionState();
})();
