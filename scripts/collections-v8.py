from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];p=ROOT/'dist/app.js';s=p.read_text()
helpers=r'''
  function argentumGallery(shots,label,key){
    const t=copy[language],first=shots[0];
    return `<div class="collection-detail-art collection-gallery" data-argentum-gallery="${key}" tabindex="0" role="region" aria-roledescription="carousel" aria-label="${label}"><figure><div class="gallery-main"><button type="button" data-expand-gallery aria-label="${t.expandImage}"><img src="${first.src}" width="${first.width}" height="${first.height}" alt="${first.alt[language]}"></button></div><div class="gallery-controls"><span class="gallery-counter" aria-live="polite">01 / ${String(shots.length).padStart(2,'0')}</span><div><button type="button" data-gallery-prev aria-label="${t.previousImage}">←</button><button type="button" data-gallery-next aria-label="${t.nextImage}">→</button></div></div><figcaption class="gallery-caption">${first.caption[language]}</figcaption></figure><div class="gallery-thumbs">${shots.map((x,i)=>`<button type="button" data-gallery-index="${i}" aria-label="${x.alt[language]}" aria-current="${i===0}"><img src="${x.src}" loading="lazy" width="${x.width}" height="${x.height}" alt=""></button>`).join('')}</div></div>`;
  }
  function bindArgentumGallery(gallery,shots){
    let selected=0;const t=copy[language];
    function show(i){selected=(i+shots.length)%shots.length;const x=shots[selected],img=$('.gallery-main img',gallery);img.src=x.src;img.alt=x.alt[language];img.width=x.width;img.height=x.height;$('.gallery-caption',gallery).textContent=x.caption[language];$('.gallery-counter',gallery).textContent=String(selected+1).padStart(2,'0')+' / '+String(shots.length).padStart(2,'0');$$('[data-gallery-index]',gallery).forEach((b,j)=>b.setAttribute('aria-current',String(j===selected)));}
    $('[data-gallery-prev]',gallery).onclick=()=>show(selected-1);$('[data-gallery-next]',gallery).onclick=()=>show(selected+1);
    $$('[data-gallery-index]',gallery).forEach(b=>b.onclick=()=>show(Number(b.dataset.galleryIndex)));
    gallery.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(selected+(e.key==='ArrowRight'?1:-1));}});
    let start=null;gallery.addEventListener('touchstart',e=>start=e.touches[0].clientX,{passive:true});gallery.addEventListener('touchend',e=>{if(start===null)return;const dx=e.changedTouches[0].clientX-start;start=null;if(Math.abs(dx)>45)show(selected+(dx<0?1:-1));},{passive:true});
    $('[data-expand-gallery]',gallery).onclick=()=>{const x=shots[selected],focus=document.activeElement,light=document.createElement('dialog');light.className='media-lightbox';light.innerHTML=`<button type="button" aria-label="${language==='fa'?'بستن':'Close'}">×</button><img src="${x.src}" alt="${x.alt[language]}"><p>${x.caption[language]}</p>`;document.body.append(light);light.querySelector('button').onclick=()=>light.close();light.addEventListener('close',()=>{light.remove();focus?.focus({preventScroll:true});});light.showModal();};
  }
'''
if 'function argentumGallery' not in s:s=s.replace('  function renderCollection(slug) {',helpers+'\n  function renderCollection(slug) {')
branch=r'''
    } else if(c&&c.slug==='argentum') {
      const d=c[language],index=collections.indexOf(c),next=collections[(index+1)%collections.length],fa=language==='fa',all=media.argentum.gallery;
      const detail={src:'assets/v8/argentum-cast-detail.webp',width:1536,height:1024,alt:{fa:'نمای نزدیک شمش نقرهٔ کست آرجنتوم',en:'Argentum cast silver bars, close detail'},caption:{fa:'جزئیات سطح و نشان شمش نقرهٔ کست',en:'Cast silver, surface and hallmark detail'}};
      const groups={bars:[detail,all[2]],granules:[all[0],all[1],all[3]]};
      page.innerHTML=`<article class="collection-page collection-detail argentum-page"><a class="collection-detail-back" href="#/works"><span aria-hidden="true">→</span>${t.allWorks}</a><header class="argentum-intro"><span class="eyebrow">${t.collection} ${String(index+1).padStart(2,'0')}</span><h2 id="collection-page-title" lang="en" tabindex="-1">${c.name}</h2><p class="collection-category">${d.category}</p><p class="collection-description">${d.description}</p>${d.paragraphs.map(p=>`<p class="collection-description">${p}</p>`).join('')}<nav class="argentum-section-nav" aria-label="${fa?'دو شاخهٔ آرجنتوم':'Argentum product forms'}"><button type="button" data-jump-argentum="bars">${d.sections[0].title}</button><button type="button" data-jump-argentum="granules">${d.sections[1].title}</button></nav></header>${d.sections.map((section,i)=>{const key=i===0?'bars':'granules';return `<section class="argentum-section" id="argentum-${key}"><div><span class="eyebrow" lang="en">0${i+1} / ${i===0?'CAST SILVER':'SILVER GRANULES'}</span><h3>${section.title}</h3>${(section.paragraphs||[]).map(p=>`<p>${p}</p>`).join('')}<dl class="collection-specs" aria-label="${t.specifications}">${Object.entries(section.specs).map(([k,v])=>`<div><dt>${t[k]||k}</dt><dd>${v}</dd></div>`).join('')}</dl></div>${argentumGallery(groups[key],section.title,key)}</section>`;}).join('')}<a class="collection-security-link" href="authenticity.html?lang=${language}#guide-argentum">${t.securityGuide}</a><div class="collection-retailer-cta"><button type="button" data-open-dealers><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>${fa?'یافتن نزدیک‌ترین عاملیت فروش':'Find your nearest retailer'}</span></button></div><div class="collection-bottom"><span>${t.location}</span><a href="#/works/${next.slug}">${t.nextCollection} · <span lang="en">${next.name}</span> ←</a></div></article>`;
      Object.entries(groups).forEach(([key,shots])=>bindArgentumGallery($('[data-argentum-gallery="'+key+'"]',page),shots));
      $$('[data-jump-argentum]',page).forEach(b=>b.onclick=()=>$('#argentum-'+b.dataset.jumpArgentum,page).scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'}));
'''
if 'argentum-page' not in s:
    marker='    } else if(c) {';assert marker in s;s=s.replace(marker,branch+'    } else if(c) {',1)
# Stop reducing the heading to a one-line caption. The CSS now owns hierarchy.
a=s.index('  function fitHeritageNote(){');b=s.index('  function setStage(',a)
s=s[:a]+'''  function fitHeritageNote(){
    note.querySelector('h2').style.fontSize='';
    note.querySelector('p').style.fontSize='';
  }
'''+s[b:]
p.write_text(s)
print('Applied dedicated Argentum presentations with independently controlled galleries.')
