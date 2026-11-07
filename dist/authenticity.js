(() => {
 'use strict';
 const $=s=>document.querySelector(s),lang=()=>window.MoriyatiLocale.language;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const text=(fa,en)=>lang()==='fa'?fa:en;
 const parse=window.MoriyatiAuth.parse;
 let lastLookup=null,selectedGuide='celestial',stream=null,frame=0,generation=0,lastScan=0,detector=null;
 const video=$('#qr-video'),canvas=$('#qr-canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true}),start=$('#start-camera'),stop=$('#stop-camera'),status=$('#scanner-status');
 function message(fa,en){status.textContent=text(fa,en);}
 function stopCamera(){generation++;cancelAnimationFrame(frame);frame=0;stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;video.hidden=true;$('#scan-idle').hidden=false;stop.hidden=true;start.disabled=false;$('.scanner-panel').classList.remove('scanning');}
 function result(raw){
  const serial=parse(raw);lastLookup=raw;const out=$('#auth-result');out.hidden=false;
  if(!serial){out.innerHTML=`<h3>${text('شناسه قابل بررسی نیست','Identifier not recognised')}</h3><p>${text('شمارهٔ سریال روی شناسنامه را وارد کنید. این کد، شناسهٔ قابل‌بررسی موریاتی ندارد.','Enter the serial number on the certificate. This code does not contain a recognised Moriyati identifier.')}</p>`;return;}
  const record=window.MORIYATI_AUTH_REGISTRY.records[serial];
  if(record?.demo){out.innerHTML=`<span class="result-kind">DEMONSTRATION RECORD</span><h3>${text('نمونهٔ نمایشی پیدا شد','Demonstration record found')}</h3><p>${text('این نتیجه، شیوهٔ نمایش شناسنامه را نشان می‌دهد و تأیید اصالت کالای واقعی نیست.','This result illustrates a product record; it does not authenticate a physical product.')}</p><dl><div><dt>${text('کالکشن','Collection')}</dt><dd lang="en">Celestial</dd></div><div><dt>${text('شمارهٔ سریال','Serial number')}</dt><dd dir="ltr">${escape(record.serial)}</dd></div><div><dt>${text('فلز / وزن / عیار','Metal / weight / fineness')}</dt><dd>${record.metal[lang()]} · <bdi>${record.weight} · ${record.fineness}</bdi></dd></div></dl><a href="#guide-celestial">${text('شناخت بسته‌بندی سلستیال','Explore Celestial packaging')} ↓</a>`;
  }else{
   out.innerHTML=`<span class="result-kind">${escape(serial)}</span><h3>${text('استعلام تولید در دسترس نیست','Production lookup is not available')}</h3><p>${text('پایگاه سریال‌های واقعی هنوز متصل نشده است؛ از این نتیجه نمی‌توان دربارهٔ اصالت یا عدم اصالت محصول نتیجه گرفت. برای بررسی، با موریاتی در ارتباط باشید.','The production serial registry is not connected yet. This result cannot establish whether a product is genuine. Please contact Moriyati for an examination.')}</p><a href="contact.html?lang=${lang()}">${text('ارتباط با موریاتی','Contact Moriyati')} </a>`;
  }
 }
 async function scan(time){
  if(!stream)return;
  if(time-lastScan>140 && video.readyState>=2){lastScan=time;
   try{let data=null;if(detector){const found=await detector.detect(video);data=found[0]?.rawValue;}else if(window.jsQR){const w=Math.min(720,video.videoWidth),h=Math.round(video.videoHeight*w/video.videoWidth);canvas.width=w;canvas.height=h;ctx.drawImage(video,0,0,w,h);const image=ctx.getImageData(0,0,w,h);data=window.jsQR(image.data,w,h,{inversionAttempts:'attemptBoth'})?.data;}
    if(data){stopCamera();$('#serial-input').value=parse(data)||'';result(data);message('کد خوانده شد؛ نتیجه را بررسی کنید.','Code read. Please review the result.');return;}
   }catch(_){/* A transient unreadable camera frame is retried. */}
  }
  if(stream)frame=requestAnimationFrame(scan);
 }
 start.addEventListener('click',async()=>{
  if(!navigator.mediaDevices?.getUserMedia){message('دوربین در این مرورگر در دسترس نیست؛ شمارهٔ سریال را وارد کنید.','Camera access is unavailable in this browser. Please enter the serial number.');return;}
  const ticket=++generation;start.disabled=true;message('برای اسکن، دسترسی دوربین را در مرورگر مجاز کنید.','Allow camera access in your browser to scan.');
  try{
   if(!('BarcodeDetector' in window)&&!window.jsQR)throw new Error('decoder');
   const incoming=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
   if(ticket!==generation){incoming.getTracks().forEach(t=>t.stop());return;}
   stream=incoming;video.srcObject=stream;video.hidden=false;$('#scan-idle').hidden=true;stop.hidden=false;$('.scanner-panel').classList.add('scanning');
   if('BarcodeDetector' in window){try{detector=new BarcodeDetector({formats:['qr_code']});}catch(_){detector=null;}}
   await video.play();if(ticket!==generation)return;message('کد QR را روشن و ثابت داخل کادر نگه دارید.','Keep the QR code well lit and steady inside the frame.');lastScan=0;frame=requestAnimationFrame(scan);
  }catch(error){stopCamera();if(error.name==='NotAllowedError')message('دسترسی دوربین مجاز نشد. از تنظیمات مرورگر اجازه دهید یا سریال را دستی وارد کنید.','Camera permission was not granted. Enable it in browser settings or enter the serial manually.');else if(error.name==='NotFoundError')message('دوربینی پیدا نشد؛ سریال را دستی وارد کنید.','No camera was found. Please enter the serial number manually.');else message('دوربین فعال نشد؛ دوباره تلاش کنید یا سریال را وارد کنید.','The camera could not start. Try again or enter the serial number.');}
 });
 stop.addEventListener('click',()=>{stopCamera();message('دوربین بسته شد.','Camera closed.');});
 addEventListener('pagehide',stopCamera);document.addEventListener('visibilitychange',()=>{if(document.hidden&&stream)stopCamera();});
 $('#serial-form').addEventListener('submit',e=>{e.preventDefault();result($('#serial-input').value);});
 $('#show-demo').addEventListener('click',()=>{$('#serial-input').value='AA0002008';result('AA0002008');});
 function guide(slug,focus=false){
  selectedGuide=slug in window.MORIYATI_COLLECTION_GUIDES?slug:'celestial';
  const c=window.MORIYATI_COLLECTIONS.find(x=>x.slug===selectedGuide),d=window.MORIYATI_COLLECTION_GUIDES[selectedGuide][lang()],shot=window.MORIYATI_MEDIA.collections[selectedGuide].gallery[0];
  document.querySelectorAll('[data-guide]').forEach(b=>{const active=b.dataset.guide===selectedGuide;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
  $('#guide-panel').setAttribute('aria-labelledby','guide-tab-'+selectedGuide);
  $('#guide-panel').innerHTML=`<figure class="guide-image"><img src="${shot.src}" width="${shot.width}" height="${shot.height}" alt="${escape(shot.alt[lang()])}" loading="lazy"><figcaption>${escape(shot.caption[lang()])}</figcaption></figure><article class="guide-detail"><h3 lang="en">${c.name}</h3><p class="guide-summary">${d.summary}</p><ol class="guide-checks">${d.checks.map((check,i)=>`<li><span class="guide-no">${String(i+1).padStart(2,'0')}</span><div><h4>${check.title}</h4><p>${check.text}</p></div></li>`).join('')}</ol><p class="guide-opening">${d.opening}</p><p>${d.nextStep}</p></article><a class="guide-collection-link" href="index.html?lang=${lang()}#/works/${selectedGuide}">${text('مشاهدهٔ کامل مجموعه','Explore the collection')}</a>`;
  if(focus)$('#guide-panel').focus({preventScroll:true});
 }
 $('#guide-tabs').innerHTML=window.MORIYATI_COLLECTIONS.map(c=>`<button type="button" role="tab" id="guide-tab-${c.slug}" data-guide="${c.slug}" aria-controls="guide-panel" aria-selected="false" tabindex="-1">${c.name}</button>`).join('');
 document.querySelectorAll('[data-guide]').forEach((b,i)=>{b.onclick=()=>{history.replaceState(null,'','#guide-'+b.dataset.guide);guide(b.dataset.guide);};b.onkeydown=e=>{const tabs=[...document.querySelectorAll('[data-guide]')];if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[j].focus();tabs[j].click();}};});
 function route(){const slug=location.hash.match(/^#guide-(.+)$/)?.[1];if(slug){guide(slug);$('#packaging').scrollIntoView({behavior:document.documentElement.classList.contains('motion-reduced')?'instant':'smooth'});}}
 addEventListener('hashchange',route);addEventListener('moriyati:language',()=>{guide(selectedGuide);if(lastLookup!==null)result(lastLookup);if(stream)message('کد QR را روشن و ثابت داخل کادر نگه دارید.','Keep the QR code well lit and steady inside the frame.');});guide(selectedGuide);if(location.hash.startsWith('#guide-'))requestAnimationFrame(route);
})();
