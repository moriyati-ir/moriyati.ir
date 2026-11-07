(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, parent = document) => parent.querySelector(s);
  const $$ = (s, parent = document) => [...parent.querySelectorAll(s)];
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };
  const mediaMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let storedMotion = null;
  try { storedMotion = localStorage.getItem('moriyati-reduced-motion'); } catch (_) {}
  let reduced = mediaMotion.matches || storedMotion === 'true';
  let language = window.MoriyatiLocale?.language || 'fa';
  let currentStage = -1;
  let currentCollection = null;
  let stageTimer;
  let raf = 0;
  let needsMeasure=false;
  let currentY = scrollY;
  let lastPose = -1;
  let pointerX = 0, pointerY = 0;
  let layout = {};

  const copy = {
    fa: {
      skip:'رفتن به محتوای اصلی', navAria:'منوی اصلی', homeAria:'موریاتی، صفحهٔ نخست', introAria:'خانهٔ موریاتی', works:'آثار', capabilities:'توانمندی‌ها', heritage:'میراث', contact:'ارتباط با ما', heroTitle:'ضرابخانه و خزانهٔ موریاتی', viewWorks:'مشاهدهٔ آثار', location:'تهران، ایران', continueAria:'ادامهٔ صفحه', scrollLabel:'برای ادامه، اسکرول کنید', engravingEyebrow:"میراث موریاتی", engravingTitle:"راه گذشتگان را با نگاه امروز ادامه می‌دهیم.", engravingText:"موریاتی بر پایهٔ بیش از دو قرن پیشینهٔ خانوادگی در تجارت جواهر و اشیای نفیس شکل گرفته است.", collectionsEyebrow:'مجموعه‌های موریاتی', worksTitle:"آثار", worksIntro:"از شمش‌های سرمایه‌ای تا قطعات هنری، هر مجموعهٔ موریاتی طراحی و کاربرد مشخصی دارد.", enterCollections:"مشاهدهٔ آثار", stagesAria:'مراحل ساخت', stage0:'پالایش', stage1:'عیارسنجی', stage2:'ریخته‌گری', stage3:'ضرب', heritageTitle:"میراث موریاتی", heritageP1:"موریاتی حاصل پیوند تجربهٔ نسل‌های گذشته با دانش و مهارت امروز است؛ پیشینه‌ای خانوادگی که در شیوهٔ طراحی و ساخت ما ادامه پیدا می‌کند.", heritageFoot:"میراث خانوادگی · دانش و مهارت امروز", house:'خانهٔ موریاتی', backTop:'بازگشت به بالا', motionLabel:'حرکت: روشن', motionOff:'حرکت: کاهش‌یافته', download:'دریافت HTML', closeMenuAria:'بستن منو', openMenuAria:'باز کردن منو', returnHouse:'بازگشت به خانه', medallionAlt:"دو روی سکهٔ موریاتی؛ شیر و نقش‌برجستهٔ عمارت و کالسکه", collectionsIntro:"از شمش‌های سرمایه‌ای تا قطعات هنری، هر مجموعهٔ موریاتی طراحی و کاربرد مشخصی دارد.", allWorks:'همهٔ آثار', specifications:'مشخصات مجموعه', collection:'مجموعه', kind:'ساخت', purity:'عیار', weights:'وزن‌ها', presentation:'ارائه', nextCollection:'مجموعهٔ بعد', noResult:'این مجموعه یافت نشد.'
    },
    en: {
      skip:'Skip to content', navAria:'Main navigation', homeAria:'Moriyati, home', introAria:'House of Moriyati', works:'Creations', capabilities:'Capabilities', heritage:'Heritage', contact:'Contact', heroTitle:'Moriyati Mint & Treasury', viewWorks:'View creations', location:'Tehran, Iran', continueAria:'Continue exploring', scrollLabel:'Scroll to continue', engravingEyebrow:"The Moriyati heritage", engravingTitle:"We carry our predecessors’ work forward with a contemporary outlook.", engravingText:"Moriyati is founded on more than two centuries of family history in the trade of jewellery and fine objects.", collectionsEyebrow:'The Moriyati collections', worksTitle:"Creations", worksIntro:"From investment bars to works of art, each Moriyati collection has its own design and purpose.", enterCollections:"View creations", stagesAria:'Stages of making', stage0:'Refining', stage1:'Assaying', stage2:'Casting', stage3:'Minting', heritageTitle:"Moriyati heritage", heritageP1:"Moriyati combines the experience of earlier generations with today’s knowledge and craftsmanship. This family heritage continues in the way we design and make.", heritageFoot:"Family heritage · Knowledge and craftsmanship today", house:'House of Moriyati', backTop:'Back to top', motionLabel:'Motion: on', motionOff:'Motion: reduced', download:'Download HTML', closeMenuAria:'Close menu', openMenuAria:'Open menu', returnHouse:'Return to the House', medallionAlt:"Two-sided Moriyati silver coin: lion obverse, pavilion and carriage reverse", collectionsIntro:"From investment bars to works of art, each Moriyati collection has its own design and purpose.", allWorks:'All creations', specifications:'Collection specifications', collection:'Collection', kind:'Making', purity:'Fineness', weights:'Weights', presentation:'Presentation', nextCollection:'Next collection', noResult:'Collection not found.'
    }
  };
  Object.assign(copy.fa,{twoCenturies:'بیش از دو قرن',familyHistory:'پیشینهٔ خانوادگی در جواهر و اشیای نفیس',panoramaAlt:'برداشت نقاشانه از اصفهان در روزگار قاجار',panoramaCaption:'روایتی نقاشانه از شهر، در امتداد یک پیشینهٔ خانوادگی',contactIntro:'گفت‌وگو دربارهٔ آثار، شرایط خرید و سفارش‌های اختصاصی.',authenticity:'اصالت‌سنجی',usage:'کاربرد',dimensions:'ابعاد',securityGuide:'آشنایی با بسته‌بندی و اصالت‌سنجی',previousImage:'تصویر قبلی',nextImage:'تصویر بعدی',expandImage:'بزرگ‌نمایی تصویر'});
  Object.assign(copy.en,{twoCenturies:'Over two centuries',familyHistory:'A family history in jewellery and fine objects',panoramaAlt:'A painterly interpretation of Qajar-era Isfahan',panoramaCaption:'A painterly view of the city, continuing a family history',contactIntro:'A conversation about our creations, purchasing and bespoke commissions.',authenticity:'Authenticity',usage:'Purpose',dimensions:'Dimensions',securityGuide:'Packaging & authenticity guide',previousImage:'Previous image',nextImage:'Next image',expandImage:'Enlarge image'});
  Object.assign(copy.fa,{bulletin:'خبرنامه',readHeritage:'روایت کامل میراث',collectionUse:'کاربری',metal:'فلز'});
  Object.assign(copy.en,{bulletin:'Bulletin',readHeritage:'The full heritage story',collectionUse:'Purpose',metal:'Metal',engravingTitle:'Our forebears’ work, continued with a modern eye.',engravingText:'Moriyati draws on over two centuries of family trade in jewellery and fine objects.'});
  const stages = [
    {
        "fa": [
            "آغاز فرایند",
            "پالایش",
            "پالایش را در مجموعهٔ خود انجام می‌دهیم تا بر عیار و کیفیت فلز مورد استفاده در تولید نظارت داشته باشیم."
        ],
        "en": [
            "The beginning",
            "Refining",
            "We refine in-house to oversee the fineness and quality of the metal used in production."
        ]
    },
    {
        "fa": [
            "کنترل کیفیت",
            "عیارسنجی",
            "کنترل عیار، بخشی از فرایند کنترل کیفیت ما در تولید شمش و گرانول است."
        ],
        "en": [
            "Quality control",
            "Assaying",
            "Fineness control is part of our quality-control process in the production of bars and granules."
        ]
    },
    {
        "fa": [
            "شکل‌دادن به فلز",
            "ریخته‌گری",
            "در واحد ریخته‌گری موریاتی، شمش‌های طلا و نقره در قالب‌ها و وزن‌های مشخص تولید می‌شوند."
        ],
        "en": [
            "Giving metal its form",
            "Casting",
            "Moriyati’s casting unit produces gold and silver bars using defined moulds and weights."
        ]
    },
    {
        "fa": [
            "دقت در جزئیات",
            "ضرب",
            "از آماده‌سازی ورق تا ضرب نهایی، مراحل تولید شمش در مجموعهٔ موریاتی انجام می‌شود."
        ],
        "en": [
            "Precision in the details",
            "Minting",
            "From preparing the sheet to the final strike, bar production takes place at Moriyati."
        ]
    }
];
  const collections = window.MORIYATI_COLLECTIONS;
  const media = window.MORIYATI_MEDIA.collections;
  const metals={celestial:['طلا','Gold'],artwork:['طلا','Gold'],courtyard:['طلا','Gold'],constellation:['نقره','Silver'],argentum:['نقره','Silver'],investment:['نقره','Silver'],bespoke:['طلا و نقره','Gold & silver']};
  const indexCopy={
    fa:{celestial:{usage:'اندوختهٔ شخصی و هدیه'},artwork:{usage:'مجموعه‌داری و هدیهٔ هنری'},courtyard:{usage:'سرمایه‌گذاری و خزانهٔ شخصی'},constellation:{usage:'اندوختهٔ شخصی و هدیه'},argentum:{usage:'تولید و مصارف صنعتی',weights:'شمش: ۲۵۰، ۵۰۰، ۱۰۰۰ گرم؛ ساچمه: ۱، ۲، ۵ کیلوگرم',purity:'۹۹۵٫۰ و ۹۹۹٫۹ در هزار'},investment:{usage:'سرمایه‌گذاری',weights:'۱۰۰ گرم ±۱ گرم'},bespoke:{usage:'هدایای اختصاصی و سازمانی',weights:'طبق شمش انتخابی',purity:'طبق شمش انتخابی'}},
    en:{celestial:{usage:'Personal reserve & gifting'},artwork:{usage:'Collecting & artistic gifts'},courtyard:{usage:'Investment & a personal treasury'},constellation:{usage:'Personal reserve & gifting'},argentum:{usage:'Manufacturing & industrial use',weights:'Bars: 250, 500, 1,000 g; granules: 1, 2, 5 kg',purity:'995.0 & 999.9 per thousand'},investment:{usage:'Investment',weights:'100 g ±1 g'},bespoke:{usage:'Personal & corporate gifts',weights:'As the selected bar',purity:'As the selected bar'}}
  };

  const entrance = $('#home'), capabilities = $('#capabilities');
  const architecture = $('#architecture'), coin = $('#medallion-position');
  const hero = $('#hero-copy'), note = $('#engraving-note');
  const shade = $('#room-shade'), progress = $('#reading-progress');
  const daylight = $('#daylight');
  const portalImg = $('.portal-art img');
  const heritageType = $('#heritage-marquee');
  const dialog = $('#collection-dialog'), page = $('#collection-page'), menu = $('#mobile-menu');
  const writtenStyles=new WeakMap();
  function style(node,key,value){
    let previous=writtenStyles.get(node);
    if(!previous){previous={};writtenStyles.set(node,previous);}
    if(previous[key]===value)return;
    node.style[key]=value;previous[key]=value;
  }

  function measure() {
    const y = scrollY;
    const box = entrance.getBoundingClientRect(), cap = capabilities.getBoundingClientRect();
    const pinHeight=$('.entrance-pin').offsetHeight,capHeight=$('.capabilities-pin').offsetHeight;
    style(coin,'top','36.5%');lastPose=-1;
    layout = {width:innerWidth,height:pinHeight,capHeight,roomHeight:$('#architecture-viewport').clientHeight,small:innerWidth<=700,entryTop:box.top+y,entryRange:Math.max(1,box.height-pinHeight),capTop:cap.top+y,capRange:Math.max(1,cap.height-capHeight),portalTop:$('#beyond-entrance').getBoundingClientRect().top+y,heritageTop:$('#heritage').getBoundingClientRect().top+y};
  }
  function setStage(index, animate = true) {
    if(index === currentStage) return;
    currentStage = index;
    const target = $('#capability-content');
    const update = () => {
      const [sub,title,text] = stages[index][language];
      $('#capability-subtitle').textContent = sub;
      $('#capabilities-title').textContent = title;
      $('#capability-description').textContent = text;
      $('#capability-index').textContent = String(index+1).padStart(2,'0');
      target.style.opacity = '1'; target.style.transform = 'translateY(0)';
    };
    clearTimeout(stageTimer);
    if(animate && !reduced) {target.style.opacity='0';target.style.transform='translateY(9px)';stageTimer=setTimeout(update,150);} else update();
    $$('[data-step]').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',String(i===index));});
  }
  function draw(y) {
    const p = reduced ? 0 : clamp((y-layout.entryTop)/layout.entryRange);
    const zoom = smooth(.03,.86,p), depart = smooth(.24,.88,p);
    const shift = layout.small ? 0 : -layout.width*.22*depart;
    const lift=layout.roomHeight*(layout.small?-4.5:12)*zoom/100;
    if(p!==lastPose){
      style(coin,'transform',`translate(-50%,-50%) translate3d(${shift.toFixed(2)}px,${lift.toFixed(2)}px,0) scale(${(1+zoom*(layout.small?.3:.83)).toFixed(4)})`);
    style(architecture,'transform',`scale(${(1.015+zoom*.12).toFixed(4)}) translate3d(0,${(-zoom*1.8).toFixed(3)}%,0)`);
    style(shade,'opacity',(depart*(layout.small?.58:.63)).toFixed(3));
    const titleOpacity = 1-smooth(.015,.23,p);
    style(hero,'opacity',titleOpacity.toFixed(3));style(hero,'transform',`translateY(${-smooth(0,.24,p)*24}px)`);
    style(hero,'visibility',titleOpacity<.01?'hidden':'visible');
    const n = smooth(.79,.95,p);
    style(note,'opacity',n.toFixed(3));style(note,'transform',`translateY(${(1-n)*22}px)`);
    style(note,'visibility',n<.01?'hidden':'visible');
    style(progress,'transform',`scaleX(${p})`);
      lastPose=p;
    }
    style(daylight,'transform',reduced?'none':`translate3d(${(pointerX*9-zoom*18).toFixed(2)}px,${(pointerY*6).toFixed(2)}px,0)`);
    const cp=clamp((y-layout.capTop)/layout.capRange);
    if(!reduced) setStage(Math.min(3,Math.floor(cp*4)));
    const stageProgress=reduced ? currentStage/3 : cp;

    const pp=clamp((y-layout.portalTop+layout.height)/(layout.height*1.7));
    style(portalImg,'transform',reduced?'rotate(-5deg)':`translateY(${((.5-pp)*36).toFixed(2)}px) rotate(${(-9+pp*10).toFixed(2)}deg)`);
    const hp=clamp((y-layout.heritageTop+layout.height)/(layout.height*2));
    style(heritageType,'transform',reduced?'none':`translateX(${((.5-hp)*layout.width*.12).toFixed(2)}px)`);
    window.MoriMotion?.draw({entry:p,stage:cp,heritage:hp,reduced,currentStage});
  }
  function frame() {
    raf=0;
    if(document.hidden||dialog.open||menu.open)return;
    if(needsMeasure){needsMeasure=false;resizeLayout();}
    // Native scroll owns the position. No second easing loop follows behind it.
    currentY=scrollY;
    draw(currentY);
  }
  function requestDraw() {if(!raf)raf=requestAnimationFrame(frame);}
  function applyMotion(save = false) {
    root.classList.toggle('motion-reduced',reduced);
    root.classList.toggle('js-motion',!reduced);
    $('#motion-toggle').setAttribute('aria-pressed',String(reduced));
    $('#motion-toggle span[data-i18n]').textContent=copy[language][reduced?'motionOff':'motionLabel'];
    if(save)try{localStorage.setItem('moriyati-reduced-motion',String(reduced));}catch(_){}
    currentY=scrollY;measure();draw(currentY);
    if(reduced)$$('.reveal').forEach(e=>e.classList.add('visible'));
  }
  function translate() {
    root.lang=language;root.dir=language==='fa'?'rtl':'ltr';
    $$('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(copy[language][k])el.innerHTML=copy[language][k];});
    $$('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',copy[language][el.dataset.i18nAria]));
    $$('[data-i18n-alt]').forEach(el=>el.alt=copy[language][el.dataset.i18nAlt]);
    $('.coin-layers')?.setAttribute('aria-label',copy[language].medallionAlt);
    $('#menu-button').setAttribute('aria-label',copy[language].openMenuAria);
    $('#language-button').textContent=language==='fa'?'EN':'فا';
    $('#language-button').setAttribute('aria-label',language==='fa'?'Switch to English':'تغییر زبان به فارسی');
    $$('.chapter-number').forEach((el,index)=>{el.textContent=language==='fa'?new Intl.NumberFormat('fa',{minimumIntegerDigits:2,useGrouping:false}).format(index+1):String(index+1).padStart(2,'0');});
    document.title=language==='fa'?'موریاتی | ضرابخانه و خزانه':'Moriyati | Mint & Treasury';
    const index=Math.max(0,currentStage);currentStage=-1;setStage(index,false);
    $('#motion-toggle span[data-i18n]').textContent=copy[language][reduced?'motionOff':'motionLabel'];
    if(dialog.open)renderCollection(currentCollection);
    window.MoriyatiLocale?.set(language);
    measure();requestDraw();
  }


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

  function renderCollection(slug) {
    const c=collections.find(x=>x.slug===slug);
    currentCollection=slug||null;
    const t=copy[language];
    if(!slug){
      page.innerHTML=`<article class="collection-page"><header class="collection-page-header"><h2 id="collection-page-title" tabindex="-1">${t.works}</h2><p>${t.collectionsIntro}</p></header><div class="collection-list">${collections.map((c,i)=>{const specs={...c[language].specs,...indexCopy[language][c.slug]};const facts=[[t.collectionUse,specs.usage],[t.weights,specs.weights],[t.purity,specs.purity],[t.metal,metals[c.slug][language==='fa'?0:1]]];return `<a class="collection-row" href="#/works/${c.slug}"><span class="collection-row-no">${String(i+1).padStart(2,'0')}</span><h3 lang="en">${c.name}</h3><dl class="collection-row-summary">${facts.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><span class="collection-row-arrow" aria-hidden="true">←</span></a>`;}).join('')}</div><div class="collection-bottom"><span>${t.location}</span><span lang="en" dir="ltr">MORIYATI · MINT & TREASURY</span></div></article>`;

    } else if(c&&c.slug==='argentum') {
      const d=c[language],index=collections.indexOf(c),next=collections[(index+1)%collections.length],fa=language==='fa',all=media.argentum.gallery;
      const detail={src:'assets/v8/argentum-cast-detail.webp',width:1536,height:1024,alt:{fa:'نمای نزدیک شمش نقرهٔ کست آرجنتوم',en:'Argentum cast silver bars, close detail'},caption:{fa:'جزئیات سطح و نشان شمش نقرهٔ کست',en:'Cast silver, surface and hallmark detail'}};
      const groups={bars:[detail,all[2]],granules:[all[0],all[1],all[3]]};
      page.innerHTML=`<article class="collection-page collection-detail argentum-page"><a class="collection-detail-back" href="#/works"><span aria-hidden="true">→</span>${t.allWorks}</a><header class="argentum-intro"><span class="eyebrow">${t.collection} ${String(index+1).padStart(2,'0')}</span><h2 id="collection-page-title" lang="en" tabindex="-1">${c.name}</h2><p class="collection-category">${d.category}</p><p class="collection-description">${d.description}</p>${d.paragraphs.map(p=>`<p class="collection-description">${p}</p>`).join('')}<nav class="argentum-section-nav" aria-label="${fa?'دو شاخهٔ آرجنتوم':'Argentum product forms'}"><button type="button" data-jump-argentum="bars">${d.sections[0].title}</button><button type="button" data-jump-argentum="granules">${d.sections[1].title}</button></nav></header>${d.sections.map((section,i)=>{const key=i===0?'bars':'granules';return `<section class="argentum-section" id="argentum-${key}"><div><span class="eyebrow" lang="en">0${i+1} / ${i===0?'CAST SILVER':'SILVER GRANULES'}</span><h3>${section.title}</h3>${(section.paragraphs||[]).map(p=>`<p>${p}</p>`).join('')}<dl class="collection-specs" aria-label="${t.specifications}">${Object.entries(section.specs).map(([k,v])=>`<div><dt>${t[k]||k}</dt><dd>${v}</dd></div>`).join('')}</dl></div>${argentumGallery(groups[key],section.title,key)}</section>`;}).join('')}<a class="collection-security-link" href="authenticity.html?lang=${language}#guide-argentum">${t.securityGuide}</a><div class="collection-retailer-cta"><button type="button" data-open-dealers><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>${fa?'یافتن نزدیک‌ترین عاملیت فروش':'Find your nearest retailer'}</span></button></div><div class="collection-bottom"><span>${t.location}</span><a href="#/works/${next.slug}">${t.nextCollection} · <span lang="en">${next.name}</span> ←</a></div></article>`;
      Object.entries(groups).forEach(([key,shots])=>bindArgentumGallery($('[data-argentum-gallery="'+key+'"]',page),shots));
      $$('[data-jump-argentum]',page).forEach(b=>b.onclick=()=>$('#argentum-'+b.dataset.jumpArgentum,page).scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'}));
    } else if(c) {
      const d=c[language],index=collections.indexOf(c),next=collections[(index+1)%collections.length];
      const specs=Object.entries(d.specs).map(([k,v])=>`<div><dt>${t[k]||k}</dt><dd>${v}</dd></div>`).join('');
      const shots=media[c.slug]?.gallery||[];
      const first=shots[0];
      const narrative=[...d.paragraphs].map(p=>`<p>${p}</p>`).join('')+(d.sections||[]).map(section=>`<section><h3>${section.title}</h3>${(section.paragraphs||[]).map(p=>`<p>${p}</p>`).join('')}${section.specs?`<dl class="collection-specs">${Object.entries(section.specs).map(([k,v])=>`<div><dt>${t[k]||k}</dt><dd>${v}</dd></div>`).join('')}</dl>`:''}${section.bullets?`<ul>${section.bullets.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}</section>`).join('');
      page.innerHTML=`<article class="collection-page collection-detail"><a class="collection-detail-back" href="#/works"><span aria-hidden="true">→</span>${t.allWorks}</a><div class="collection-detail-layout"><div><span class="eyebrow">${t.collection} ${String(index+1).padStart(2,'0')}</span><h2 id="collection-page-title" lang="en" tabindex="-1">${c.name}</h2><p class="collection-category">${d.category}</p><p class="collection-product-line">${d.productLine||''}</p><p class="collection-description">${d.description}</p><dl class="collection-specs" aria-label="${t.specifications}">${specs}${(d.extraSpecs||[]).map(x=>`<div><dt>${x.label}</dt><dd>${x.value}</dd></div>`).join('')}</dl><a class="collection-security-link" href="authenticity.html?lang=${language}#guide-${c.slug}">${t.securityGuide}</a></div><div class="collection-detail-art collection-gallery" tabindex="0" role="region" aria-roledescription="carousel" aria-label="${c.name}"><figure><div class="gallery-main"><button type="button" data-expand-gallery aria-label="${t.expandImage}"><img src="${first.src}" width="${first.width}" height="${first.height}" alt="${first.alt[language]}"></button></div><div class="gallery-controls"><span class="gallery-counter" aria-live="polite">01 / ${String(shots.length).padStart(2,'0')}</span><div><button type="button" data-gallery-prev aria-label="${t.previousImage}">←</button><button type="button" data-gallery-next aria-label="${t.nextImage}">→</button></div></div><figcaption class="gallery-caption">${first.caption[language]}</figcaption></figure><div class="gallery-thumbs">${shots.map((x,i)=>`<button type="button" data-gallery-index="${i}" aria-label="${x.alt[language]}" aria-current="${i===0}"><img src="${x.src}" loading="lazy" width="${x.width}" height="${x.height}" alt=""></button>`).join('')}</div><div class="collection-retailer-cta"><button type="button" data-open-dealers><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>${language==='fa'?'یافتن نزدیک‌ترین عاملیت فروش':'Find your nearest retailer'}</span></button></div></div></div><div class="collection-narrative">${narrative}</div><div class="collection-bottom"><span>${t.location}</span><a href="#/works/${next.slug}">${t.nextCollection} · <span lang="en">${next.name}</span> ←</a></div></article>`;
      let selected=0;const gallery=$('.collection-gallery',page);
      function showImage(i){selected=(i+shots.length)%shots.length;const x=shots[selected],img=$('.gallery-main img',gallery);img.src=x.src;img.alt=x.alt[language];img.width=x.width;img.height=x.height;$('.gallery-caption',gallery).textContent=x.caption[language];$('.gallery-counter',gallery).textContent=String(selected+1).padStart(2,'0')+' / '+String(shots.length).padStart(2,'0');$$('[data-gallery-index]',gallery).forEach((b,j)=>b.setAttribute('aria-current',String(j===selected)));}
      $('[data-gallery-prev]',gallery).onclick=()=>showImage(selected-1);$('[data-gallery-next]',gallery).onclick=()=>showImage(selected+1);
      $$('[data-gallery-index]',gallery).forEach(b=>b.onclick=()=>showImage(Number(b.dataset.galleryIndex)));
      gallery.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();showImage(selected+(e.key==='ArrowRight'?1:-1));}});
      let touchStart;gallery.addEventListener('touchstart',e=>touchStart=e.touches[0].clientX,{passive:true});gallery.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchStart;if(Math.abs(dx)>45)showImage(selected+(dx<0?1:-1));},{passive:true});
      $('[data-expand-gallery]',gallery).onclick=()=>{const x=shots[selected];const light=document.createElement('dialog');light.className='media-lightbox';light.innerHTML=`<button type="button" aria-label="${language==='fa'?'بستن':'Close'}">×</button><img src="${x.src}" alt="${x.alt[language]}"><p>${x.caption[language]}</p>`;document.body.append(light);light.querySelector('button').onclick=()=>light.close();light.addEventListener('close',()=>light.remove());light.showModal();};

    } else {
      currentCollection=null;
      page.innerHTML=`<article class="collection-page"><h2 id="collection-page-title" tabindex="-1">${t.noResult}</h2><a class="text-link" href="#/works">${t.allWorks}</a></article>`;
    }
    dialog.scrollTop=0;
    requestAnimationFrame(()=>$('#collection-page-title').focus({preventScroll:true}));
  }
  let lastWorksFocus=null;
  function route() {
    if(location.hash.startsWith('#/works')){
      const slug=location.hash.split('/')[2]||null;
      if(menu.open)closeMenu();
      if(!dialog.open){lastWorksFocus=document.activeElement;dialog.showModal();}
      renderCollection(slug);
    }else if(dialog.open)dialog.close();
  }
  function closeCollection() {
    try{history.replaceState(null,'',location.href.split('#')[0]);}catch(_){location.hash='';}
    if(dialog.open)dialog.close();
    if(lastWorksFocus instanceof HTMLElement)lastWorksFocus.focus({preventScroll:true});
    requestDraw();
  }
  function closeMenu(){if(menu.open)menu.close();$('#menu-button').setAttribute('aria-expanded','false');requestDraw();}

  $('#menu-button').addEventListener('click',()=>{menu.showModal();$('#menu-button').setAttribute('aria-expanded','true');});
  $('[data-close-menu]').addEventListener('click',closeMenu);
  menu.addEventListener('close',()=>{$('#menu-button').setAttribute('aria-expanded','false');requestDraw();});
  dialog.addEventListener('close',requestDraw);
  $$('a',menu).forEach(a=>a.addEventListener('click',closeMenu));
  $('#close-collection').addEventListener('click',closeCollection);
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeCollection();});
  addEventListener('hashchange',route);
  $('#language-button').addEventListener('click',()=>{language=language==='fa'?'en':'fa';translate();});
  $('#motion-toggle').addEventListener('click',()=>{reduced=!reduced;applyMotion(true);});
  mediaMotion.addEventListener('change',e=>{reduced=e.matches;applyMotion();});
  $$('[data-step]').forEach(button=>button.addEventListener('click',()=>{
    const index=Number(button.dataset.step);
    if(reduced){setStage(index,false);draw(scrollY);return;}
    const fraction=(index+.22)/4;
    scrollTo({top:layout.capTop+layout.capRange*fraction,behavior:'smooth'});
  }));
  addEventListener('scroll',requestDraw,{passive:true});
  let wasLandscape=innerWidth>innerHeight;
  function resizeLayout(){
    const landscape=innerWidth>innerHeight;
    const rotated=landscape!==wasLandscape;
    const old=layout;
    const y=scrollY;
    const entryFraction=clamp((y-old.entryTop)/old.entryRange);
    const capFraction=clamp((y-old.capTop)/old.capRange);
    const inEntry=y>=old.entryTop&&y<old.entryTop+old.entryRange;
    const inCapabilities=y>=old.capTop&&y<old.capTop+old.capRange;
    measure();wasLandscape=landscape;
    if(rotated&&!reduced&&!dialog.open&&(inEntry||inCapabilities)){
      const next=inEntry?layout.entryTop+layout.entryRange*entryFraction:layout.capTop+layout.capRange*capFraction;
      scrollTo({top:next,behavior:'instant'});currentY=next;
    }
  }
  function requestMeasure(){needsMeasure=true;requestDraw();}
  // Mobile toolbar height changes do not change the svh pins. Let their actual
  // ResizeObserver sizes, or a real width/orientation change, request layout.
  addEventListener('resize',()=>{if(innerWidth!==layout.width)requestMeasure();},{passive:true});
  if(window.ResizeObserver){
    const pinObserver=new ResizeObserver(entries=>{
      if(entries.some(entry=>{
        const box=entry.borderBoxSize,first=Array.isArray(box)?box[0]:box;
        const height=first?.blockSize||entry.target.offsetHeight;
        const previous=entry.target.classList.contains('entrance-pin')?layout.height:layout.capHeight;
        return Math.abs(height-previous)>.5;
      }))requestMeasure();
    });
    pinObserver.observe($('.entrance-pin'));pinObserver.observe($('.capabilities-pin'));
  }
  addEventListener('moriyati:assets-ready',requestDraw);
  document.addEventListener('visibilitychange',requestDraw);
  if(matchMedia('(hover:hover)').matches){
    $('#architecture-viewport').addEventListener('pointermove',e=>{if(reduced)return;pointerX=(e.clientX/innerWidth-.5)*2;pointerY=(e.clientY/innerHeight-.5)*2;requestDraw();},{passive:true});
    $('#architecture-viewport').addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;requestDraw();});
  }
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.12});
  $$('.reveal').forEach(el=>observer.observe(el));
  setStage(0,false);translate();applyMotion();route();
  document.fonts.ready.then(()=>{measure();requestDraw();});
  addEventListener('load',()=>{measure();currentY=scrollY;requestDraw();});
})();
