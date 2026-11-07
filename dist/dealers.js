(() => {
 'use strict';
 const data=window.MORIYATI_DEALERS||[];
 const text={fa:{title:'عاملیت‌های فروش',find:'یافتن نزدیک‌ترین عاملیت فروش',intro:'شهر خود را انتخاب کنید یا از موقعیت فعلی برای یافتن نزدیک‌ترین مرکز استفاده کنید.',locate:'استفاده از موقعیت من',city:'انتخاب شهر',all:'همهٔ شهرها',demo:'نمونهٔ طراحی',notice:'اطلاعات هفت عاملیت شهرستان، نمونهٔ طراحی است. موقعیت آن‌ها مرکز تقریبی شهر است؛ مشخصات نهایی پس از تکمیل شبکهٔ فروش درج می‌شود.',nearest:'نزدیک‌ترین به موقعیت شما',distance:'فاصلهٔ تقریبی مستقیم',km:'کیلومتر',map:'مسیریابی',cityMap:'نمایش محدودهٔ نمونه',call:'تماس با مرکز',pending:'در حال دریافت موقعیت شما…',found:'مراکز بر اساس فاصله از موقعیت شما مرتب شدند.',denied:'دسترسی به موقعیت فراهم نشد. شهر خود را از فهرست انتخاب کنید.',unsupported:'برای یافتن مرکز، شهر خود را از فهرست انتخاب کنید.',close:'بستن عاملیت‌های فروش',hours:'ساعت کاری',appointment:'پیش از مراجعه، موجودی مجموعه و زمان حضور را با مرکز هماهنگ کنید.',sampleContact:'شمارهٔ نمایشی',count:'مرکز',view:'مشاهدهٔ عاملیت‌های فروش'},en:{title:'Retailers',find:'Find your nearest retailer',intro:'Choose a city or use your current location to find the nearest centre.',locate:'Use my location',city:'Choose a city',all:'All cities',demo:'Design sample',notice:'The seven regional retailers are design samples. Their pins represent approximate city centres; final details will follow as the retail network is completed.',nearest:'Nearest to your location',distance:'Approximate straight-line distance',km:'km',map:'Directions',cityMap:'View sample area',call:'Call this centre',pending:'Finding your location…',found:'Centres are ordered by distance from your location.',denied:'Location is unavailable. Choose your city from the list.',unsupported:'Choose your city to find a centre.',close:'Close retailers',hours:'Opening hours',appointment:'Please contact the centre before visiting to confirm collection availability and opening hours.',sampleContact:'Sample phone number',count:'centres',view:'View retailers'}};
 const language=()=>window.MoriyatiLocale?.language||document.documentElement.lang||'fa';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pin='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
 let counter=0,position=null,modal=null,lastFocus=null;
 const states=new Set();
 function distanceKm(a,b){const r=Math.PI/180,dlat=(b.lat-a.lat)*r,dlon=(b.lon-a.lon)*r;const h=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlon/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
 function rank(origin,records=data){return records.map(record=>({...record,distance:distanceKm(origin,record)})).sort((a,b)=>a.distance-b.distance);}
 function render(state){
  const lang=language(),t=text[lang],root=state.root;
  if(!root.isConnected)return;
  const records=position?rank(position):data.map(x=>({...x}));
  const filtered=state.city==='all'?records:records.filter(r=>r.id===state.city);
  const nearest=position?records[0]?.id:null;
  const fmt=new Intl.NumberFormat(lang,{maximumFractionDigits:1});
  root.innerHTML='<div class="dealer-panel-heading"><div><span class="eyebrow" lang="en">THE MORIYATI RETAIL NETWORK</span><h2 id="dealer-title-'+state.id+'">'+t.title+'</h2><p>'+t.intro+'</p></div>'+pin+'</div><div class="dealer-tools"><button class="dealer-locate" type="button" data-locate '+(state.pending?'disabled':'')+'>'+pin+'<span>'+t.locate+'</span></button><label class="dealer-city">'+t.city+'<select data-city>'+['<option value="all">'+t.all+'</option>',...data.map(r=>'<option value="'+r.id+'" '+(r.id===state.city?'selected':'')+'>'+esc(r.city[lang])+'</option>')].join('')+'</select></label></div><p class="dealer-status" role="status" aria-live="polite">'+(state.pending?t.pending:state.status?t[state.status]:'')+'</p><p class="dealer-sample-notice">'+t.notice+'</p><div class="dealer-result-meta"><span>'+fmt.format(filtered.length)+' '+t.count+'</span><span>'+t.appointment+'</span></div><div class="dealer-grid">'+filtered.map(r=>{
   const query=r.lat+','+r.lon;
   const map=r.sample?'https://www.google.com/maps/search/?api=1&query='+query:'https://www.google.com/maps/dir/?api=1&destination='+query+(position?'&origin='+position.lat+','+position.lon:'');
   return '<article class="dealer-card '+(r.id===nearest?'is-nearest':'')+'" data-dealer="'+r.id+'"><div class="dealer-card-top"><span>'+esc(r.city[lang])+'</span>'+(r.sample?'<span class="dealer-badge">'+t.demo+'</span>':'<span class="dealer-badge">'+(lang==='fa'?'خانهٔ موریاتی':'House of Moriyati')+'</span>')+'</div>'+(r.id===nearest?'<span class="dealer-nearest">'+t.nearest+'</span>':'')+'<h3>'+esc(r.name[lang])+'</h3><p class="dealer-address">'+esc(r.address[lang])+'</p><p class="dealer-hours">'+esc(r.hours[lang])+'</p>'+(position?'<p class="dealer-distance">'+t.distance+' · '+fmt.format(r.distance)+' '+t.km+'</p>':'')+'<div class="dealer-card-actions">'+(r.tel?'<a href="tel:'+r.tel+'" aria-label="'+t.call+'"><span dir="ltr">'+esc(r.phone)+'</span></a>':'<span class="dealer-sample-phone" aria-label="'+t.sampleContact+'" dir="ltr">'+esc(r.phone)+'</span>')+'<a href="'+map+'" target="_blank" rel="noopener noreferrer">'+pin+'<span>'+(r.sample?t.cityMap:t.map)+'</span></a></div></article>';
  }).join('')+'</div>';
  root.querySelector('[data-city]').value=state.city;
  root.querySelector('[data-city]').addEventListener('change',e=>{state.city=e.target.value;state.status='';render(state);});
  root.querySelector('[data-locate]').addEventListener('click',()=>locate(state));
 }
 function locate(state){
  if(!navigator.geolocation){state.status='unsupported';render(state);return;}
  state.pending=true;state.status='';render(state);
  navigator.geolocation.getCurrentPosition(result=>{position={lat:result.coords.latitude,lon:result.coords.longitude};state.pending=false;state.city='all';state.status='found';states.forEach(render);},()=>{state.pending=false;state.status='denied';render(state);},{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
 }
 function mount(root,city='all'){const state={root,id:++counter,city,pending:false,status:''};states.add(state);render(state);return state;}
 function open(){
  lastFocus=document.activeElement;
  if(!modal){modal=document.createElement('dialog');modal.className='retailer-dialog';modal.setAttribute('aria-labelledby','retailer-dialog-title');document.body.append(modal);modal.addEventListener('click',e=>{if(e.target===modal)modal.close();});modal.addEventListener('close',()=>lastFocus?.focus({preventScroll:true}));}
  const lang=language(),t=text[lang];
  modal.innerHTML='<div class="retailer-dialog-head"><span lang="en">MORIYATI</span><button type="button" data-close-retailers aria-label="'+t.close+'">×</button></div><div class="retailer-dialog-content"><h1 class="sr-only" id="retailer-dialog-title">'+t.find+'</h1><div data-dealer-directory></div></div>';
  modal.querySelector('[data-close-retailers]').addEventListener('click',()=>modal.close());
  states.forEach(s=>{if(!s.root.isConnected)states.delete(s);});
  mount(modal.querySelector('[data-dealer-directory]'),'tehran');modal.showModal();
 }
 document.querySelectorAll('[data-dealer-directory]').forEach(root=>mount(root));
 document.addEventListener('click',e=>{const b=e.target.closest('[data-open-dealers]');if(b){e.preventDefault();open();}});
 addEventListener('moriyati:language',()=>states.forEach(render));
 window.MoriyatiDealers={distanceKm,rank,open};
})();
