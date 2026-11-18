import {escapeHTML as esc} from './core.mjs?v=3';
const processArt = new Map([
  ['دریافت', 'receive'],
  ['عیارسنجی', 'assay'],
  ['گیوتین', 'shear'],
  ['آلیاژسازی', 'alloy'],
  ['ذوب همگن‌سازی', 'melt'],
  ['گرانول‌سازی', 'granulate'],
  ['شست‌وشو', 'wash'],
  ['پرداخت‌کاری', 'polish'],
  ['بسته‌بندی', 'pack'],
  ['تحویل', 'deliver'],
  ['نورد', 'roll'],
  ['ضرب', 'strike'],
  ['پولک‌زنی', 'blank'],
  ['آنیل', 'anneal'],
  ['کنترل کیفیت', 'inspect'],
  ['ریژه', 'cast'],
  ['ذوب با مس', 'alloy'],
  ['ذوب', 'melt'],
  ['بررسی', 'inspect'],
  ['کنترل نهایی', 'inspect'],
]);
function picture(name, cover) {
  const art = processArt.get(name);
  if (cover && (!art || !cover.startsWith("./visuals/"))) return cover;
  return art ? "./visuals/process/" + art + ".webp" : "./visuals/laboratory.webp";
}
const processes=['دریافت','عیارسنجی','گیوتین','آلیاژسازی','ذوب همگن‌سازی','گرانول‌سازی','شست‌وشو','پرداخت‌کاری','بسته‌بندی','تحویل'];
const locations=['صندوق','کارگاه','آزمایشگاه','انبار','دفتر','دستگاه'];
const other='سایر موارد',now=()=>new Date().toISOString(),id=()=>crypto.randomUUID(),date=d=>new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Tehran'}).format(new Date(d));
const opts=a=>a.map(x=>'<option>'+esc(String(x))+'</option>').join('');
const input=(n,l,type='text',required=true)=>'<label>'+l+'<input name="'+n+'" type="'+type+'" '+(type==='number'?'step="any" min="0" ':'')+(type==='file'?'accept="image/*" ':'')+(required?'required':'')+'></label>';
const pick=(n,l,a)=>'<label>'+l+'<select name="'+n+'">'+opts([...a,other])+'</select><input hidden name="'+n+'Other" placeholder="توضیح"></label>';
const button=(action,title,value='')=>'<button type="button" class="secondary" data-w="'+action+'" data-value="'+esc(value)+'">'+esc(title)+'</button>';
const selected=(f,n)=>f.get(n)===other?f.get(n+'Other'):f.get(n);
const stage=name=>({id:id(),name,cover:picture(name),reports:[],done:false});
export function packageWarning(f){
 const sizes=[1,2,5,10], counts=sizes.map(k=>Number(f.get('p'+k)||0));
 if(counts.some(x=>!Number.isInteger(x)||x<0))return 'تعداد بسته باید عدد صحیح و مثبت یا صفر باشد.';
 const grams=counts.reduce((sum,x,i)=>sum+x*sizes[i]*1000,0),limit=Number(f.get('weight'));
 return grams>limit?'مجموع بسته‌ها '+grams.toLocaleString('fa')+' گرم است؛ '+(grams-limit).toLocaleString('fa')+' گرم بیشتر از وزن پارت.':'';
 }
 const numeric=x=>Number(String(x).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٫،]/g,'.'));
export function alloy(f){
 const w=numeric(f.get('weight')),a=numeric(selected(f,'assay')),b=numeric(selected(f,'target'));
 if(!(w>0&&a>0&&a<=1000&&b>0&&b<=1000))return {error:'وزن و عیار معتبر وارد کن.'};
 if(a===b)return {text:'عیار بار روی هدف است.'};
 if(b>a&&b>=999.9)return {error:'با افزودن نقره ۹۹۹٫۹ رسیدن به این عیار ممکن نیست.'};
 const mass=b<a?w*(a-b)/b:w*(b-a)/(999.9-b),metal=b<a?'مس':'نقره ۹۹۹٫۹';
 return {mass,metal,text:mass.toLocaleString('fa',{maximumFractionDigits:4})+' گرم '+metal+' اضافه کن.'};
 }

export function workshop(c){
 let current,stageId,storyIndex=0,editing=null;
 const actor=()=>c.actor(),name=k=>c.roles[k]?.name||k,editable=t=>actor()==='alireza'||(t.ownerId===actor()&&!['done','cancelled'].includes(t.status)),commit=()=>{c.save();c.closeModal();c.render(true);};
 const log=(t,type,detail='')=>(t.history??=[]).push({type,actor:actor(),date:now(),reason:detail});
 const excluded=['alireza','nazanin','majid','artour','ala','sima','malika'];
 const eligible=(k,product)=>!product||!excluded.includes(k);
 const people=()=>Object.entries(c.roles).filter(([k])=>!['employee','office'].includes(k));
 const members=t=>(t.members||[]).filter(m=>m.active!==false&&m.state==='accepted');
 const box=(title,html)=>c.modal(title,'<div class="ws">'+html+'</div>');
 function form(title,body,submit,word='ثبت'){
 box(title,'<form id="ws-form">'+body+'<button class="primary">'+word+'</button></form>');
 const el=document.querySelector('#ws-form');el.onsubmit=async e=>{e.preventDefault();const b=el.querySelector('button.primary');b.disabled=true;try{await submit(new FormData(el),el);}catch(err){c.toast(err.message);}finally{b.disabled=false;}};
 }
 function create(){
 const types=c.canProduct()?['محصول','عمومی']:['عمومی'];
 form('تسک جدید','<label>نوع تسک<select name="kind">'+opts(types)+'</select></label><section data-product>'+pick('product','محصول',['ساچمه نقره','شمش نقره','شمش طلا','سکه نقره'])+input('weight','وزن هدف · گرم','number')+pick('purity','عیار هدف',['۹۹۰٫۰','۹۹۱٫۰','۹۹۲٫۰','۹۹۳٫۰','۹۹۴٫۰','۹۹۵٫۰','۹۹۹٫۹'])+pick('source','مبدأ',locations)+pick('dest','مقصد',locations)+'<details><summary>بسته‌بندی</summary>'+pick('pack','نوع بسته',['ظرف پلاستیکی','قاب','بلیستر'])+[1,2,5,10].map(k=>input('p'+k,'تعداد بسته '+k+' کیلویی','number',false)).join('')+'<output role="alert" data-pack-warning></output></details></section><section data-general>'+input('title','عنوان کار')+'</section><details><summary>افزودن همکار</summary>'+people().filter(([k])=>k!==actor()).map(([k,r])=>'<label><input type="checkbox" name="member" value="'+k+'">'+r.name+'<input hidden name="role-'+k+'" placeholder="پوزیشن"></label>').join('')+'</details>',f=>{
 const prod=f.get('kind')==='محصول';if(prod&&!c.canProduct())return;
 if(prod&&packageWarning(f))throw Error(packageWarning(f));
 const t={id:id(),code:'MT-'+id().slice(0,6),workshop:true,type:prod?'production':'general',status:'active',title:prod?'تولید '+selected(f,'product'):f.get('title'),creatorId:actor(),ownerId:actor(),owner:name(actor()),material:prod&&String(selected(f,'product')).includes('طلا')?'طلا':'نقره',weight:Number(f.get('weight')),purity:selected(f,'purity'),source:selected(f,'source'),destination:selected(f,'dest'),location:selected(f,'source'),pack:selected(f,'pack'),packages:Object.fromEntries([1,2,5,10].filter(k=>Number(f.get('p'+k))>0).map(k=>[k,Number(f.get('p'+k))])),members:[actor(),...f.getAll('member').filter(k=>eligible(k,prod))].map(k=>({userId:k,state:'accepted',active:true,responsibility:k===actor()?'مسئول':f.get('role-'+k),since:now()})),stages:[stage(prod?'دریافت':'شروع کار')],cover:prod?'./visuals/argentum.webp':'./visuals/laboratory.webp',history:[],dependencies:[],started:now(),targetKind:'mass',description:''};
 t.team=t.members.map(m=>name(m.userId));log(t,'ایجاد تسک');log(t,'مدیر هوشمند تایید کرد','اجازه دریافت');c.add(t);c.save();c.nav('task/'+t.id);
 });
 const el=document.querySelector('#ws-form');function sync(){for(const [selector,show] of [['[data-product]',el.kind.value==='محصول'],['[data-general]',el.kind.value==='عمومی']]){const s=el.querySelector(selector);s.hidden=!show;s.querySelectorAll('input,select').forEach(x=>x.disabled=!show);}
 for(const m of el.querySelectorAll('[name=member]')){
 const hide=!eligible(m.value,el.kind.value==='محصول');m.closest('label').hidden=hide;m.disabled=hide;
 }
 const message=el.kind.value==='محصول'?packageWarning(new FormData(el)):'';
 el.querySelector('[data-pack-warning]').textContent=message;
 el.querySelector('.primary').disabled=!!message;
 }el.kind.onchange=sync;el.oninput=sync;sync();
 }
 document.addEventListener('change',e=>{const el=e.target;if(!el.closest('.ws'))return;if(el.tagName==='SELECT'){const x=el.closest('label')?.querySelector('input[hidden],input[name$="Other"]');if(x?.name===el.name+'Other'){x.hidden=el.value!==other;x.required=!x.hidden;}}if(el.name==='member'){el.nextElementSibling.hidden=!el.checked;}});
 const getStage=t=>t.stages.find(s=>s.id===stageId)||t.stages[0];
 const grades=['۹۹۰٫۰','۹۹۱٫۰','۹۹۲٫۰','۹۹۳٫۰','۹۹۴٫۰','۹۹۵٫۰','۹۹۹٫۹'];
 const capture=(key,label,required=true)=>input(key,label,'file',required).replace('accept="image/*"','accept="image/*" capture="environment"');
 const activities=n=>({'ذوب همگن‌سازی':['ذوب','ریژه‌ریزی','عیارسنجی با XRF'],'آلیاژسازی':['تنظیم عیار','افزودن مس بعد از عیارسنجی','آماده‌سازی بار بوته'],'گرانول‌سازی':['ریختن گرانول'],'عیارسنجی':['عیارسنجی با XRF']}[n]||[n]);
 const displayName=s=>s.name==='ذوب با مس'?'آلیاژسازی':s.name;
 function entry(t,s){
 const n=displayName(s),weight=input('weight','وزن · گرم','number'),assay=pick('assay','عیار دستگاه',grades);
 const weighing=capture('image','عکس ترازو')+weight,testing=capture('assayPhoto','عکس صفحه XRF')+assay;
 let fields='';
 if(/دریافت|تحویل/.test(n))fields=capture('image','عکس بار دریافتی')+weight+pick('assay','عیار تقریبی',grades)+pick('shape','شکل بار',['قرص','ریژه','ساچمه','شمش','ورق'])+pick('via','طرف تحویل',['حاجی','مجید','بهنام']);
 else if(n==='گیوتین')fields=weighing;
 else if(n==='آلیاژسازی')fields='<h4>محاسبه تنظیم عیار</h4>'+weight+pick('assay','عیار فعلی',grades)+pick('target','عیار هدف',grades)+'<output data-alloy></output>'+input('mold','شماره ماژیک روی ریژه')+capture('image','عکس ظرف و شماره ریژه');
 else if(/ذوب/.test(n)){const sum=s.reports.reduce((a,r)=>a+Number(r.weight||0),0);fields='<b>ریژه '+(s.reports.length+1).toLocaleString('fa')+' · جمع '+sum.toLocaleString('fa')+' گرم</b>'+weighing+testing;}
 else if(n==='عیارسنجی')fields=weighing+testing;
 else if(n==='بسته‌بندی')fields=capture('image','عکس بسته و سریال')+input('serial','سریال بسته')+weight+assay;
 else fields=capture('image','عکس مرحله',false);
 const choices=activities(n).map((activity,i)=>'<fieldset><legend>'+esc(activity)+'</legend>'+members(t).map(m=>'<label><input type="checkbox" name="activity'+i+'" value="'+esc(m.userId)+'">'+esc(name(m.userId))+'</label>').join('')+'</fieldset>').join('');
 return '<form class="ws" id="ws-entry"><h3>'+esc(n)+'</h3>'+fields+'<details><summary>چه کسی چه کاری کرد؟</summary>'+choices+'</details>'+input('note','یادداشت','text',false)+'<button class="primary">ثبت</button></form>';
 }
 document.addEventListener('input',e=>{const el=e.target.closest('#ws-entry');const out=el?.querySelector('[data-alloy]');if(out){const result=alloy(new FormData(el));out.textContent=result.error||result.text;}});
 function page(t){current=t.id;const s=getStage(t),owner=editable(t),open=!['done','cancelled','requested'].includes(t.status);
 return '<section class="ws"><p>'+esc([t.source,t.destination].filter(Boolean).join(' ← '))+'</p>'+button('team','همکاران')+(owner?button('dates','تاریخ و ساعت'):'')+'<div class="stage-row">'+t.stages.map(st=>'<button class="stage" data-w="story" data-value="'+esc(st.id)+'"><span class="stage-image"><img src="'+esc(picture(st.name,st.cover))+'"></span>'+esc(displayName(st))+'</button>').join('')+(owner&&(open||actor()==='alireza')?button('add','+ فرایند جدید'):'')+'</div>'+(owner&&(open||actor()==='alireza')&&t.status!=='paused'&&s?'<label>ثبت در فرایند<select id="ws-stage">'+t.stages.map(st=>'<option value="'+esc(st.id)+'" '+(st===s?'selected':'')+'>'+esc(displayName(st))+'</option>').join('')+'</select></label>'+entry(t,s):'')+'<details><summary>سابقه تسک</summary>'+t.history.map(h=>'<p>'+esc(h.type)+' · '+esc(h.reason||'')+'</p>').join('')+'</details></section>';
 }
 function story(t,s){const r=s.reports[storyIndex];box(displayName(s),r?'<div data-w="next" class="ws-story"><small>'+Number(storyIndex+1).toLocaleString('fa')+' / '+s.reports.length.toLocaleString('fa')+'</small><h3>'+esc(r.title||s.name)+'</h3>'+'<p>'+esc([r.weight&&r.weight+' گرم',r.assay,r.serial,r.mold&&'ریژه '+r.mold,r.alloy?.text,r.text,r.shape,r.via,...(r.activities?Object.entries(r.activities).map(([activity,ids])=>activity+' · '+ids.map(name).join('، ')):(r.workers||[]).map(name))].filter(Boolean).join(' · '))+'</p>'+[r.image,r.assayPhoto].filter(Boolean).map(url=>'<img src="'+esc(url)+'">').join('')+'</div>'+(editable(t)?button('edit-report','ویرایش گزارش'):''):'هنوز گزارشی ثبت نشده.');document.querySelector('.sheet')?.classList.add('ws-story-sheet');}
 document.addEventListener('change',e=>{if(e.target.id==='ws-stage'){stageId=e.target.value;c.render(true);}});
 document.addEventListener('submit',async e=>{if(e.target.id!=='ws-entry')return;e.preventDefault();const t=c.task(current);if(!t||!editable(t)||['paused','requested'].includes(t.status))return;const s=getStage(t),f=new FormData(e.target),b=e.target.querySelector('button.primary');if(b.disabled)return;b.disabled=true;
 try{const r={id:id(),title:s.name,text:f.get('note'),author:name(actor()),authorId:actor(),date:now(),time:new Date().toLocaleTimeString('fa',{timeZone:'Asia/Tehran'}),workers:f.getAll('worker'),shape:selected(f,'shape'),via:selected(f,'via')};r.activities=Object.fromEntries(activities(displayName(s)).map((activity,i)=>[activity,f.getAll('activity'+i)]).filter(([,ids])=>ids.length));
 if(/ذوب/.test(displayName(s)))r.mold=String(s.reports.length+1);
 r.workers=[...new Set(Object.values(r.activities).flat())];
 for(const key of ['weight','serial','mold'])if(f.has(key))r[key]=f.get(key);
 r.assay=selected(f,'assay');
 if(f.has('target')){r.alloy=alloy(f);if(r.alloy.error)return c.toast(r.alloy.error);r.target=selected(f,'target');}
 for(const key of ['image','assayPhoto'])if(f.get(key)?.size){r[key]=await c.fileData(f.get(key));if(!r[key])return;}
 if(r.serial){const state=c.factory();if(state.products.some(p=>p.serial===r.serial)){c.toast('سریال تکراری است');return;}state.products.push({id:id(),serial:r.serial,taskId:t.id,net:Number(r.weight),weight:Number(r.weight),purity:r.assay,image:r.image,title:t.title,createdAt:r.date,packaged:true,location:t.location,qc:"pending",packaging:[{id:id(),date:r.date,active:true,front:r.image,net:r.weight}]});}
 s.reports.push(r);log(t,'ثبت '+s.name,r.serial||'');if(r.via)log(t,'مدیر هوشمند تایید کرد',r.via);commit();}finally{b.disabled=false;}});
 document.addEventListener('click',async e=>{const b=e.target.closest('[data-w]');if(!b)return;const t=c.task(current);if(!t)return;const a=b.dataset.w,v=b.dataset.value;
 if(a==='story'){stageId=v;storyIndex=0;c.render(true);story(t,getStage(t));return;}if(a==='next'){const s=getStage(t);if(++storyIndex<s.reports.length)story(t,s);else c.closeModal();return;}
 if(a==='modify'){const s=getStage(t);if(!editable(t))return;form('ویرایش فرایند',input('title','نام فرایند')+button('remove','حذف فرایند'),f=>{s.name=f.get('title');log(t,'ویرایش فرایند',s.name);commit();});document.querySelector('#ws-form [name=title]').value=s.name;return;}if(a==='remove'&&editable(t)){const s=getStage(t);if(t.stages.length===1)return c.toast('یک فرایند باید باقی بماند');(t.archivedStages??=[]).push(s);t.stages=t.stages.filter(x=>x!==s);log(t,'حذف فرایند',s.name);commit();return;}if(a==='team'){box('همکاران',members(t).map(m=>button('member',name(m.userId)+' · '+(m.responsibility||'همکار'),m.userId)).join(''));return;}
 if(!editable(t))return;
 if(a==='edit-report'){const r=getStage(t).reports[storyIndex];form('ویرایش گزارش',input('note','یادداشت','text',false)+(r.weight?input('weight','وزن · گرم','number'):'')+(r.assay?input('assay','عیار دستگاه'):''),f=>{r.text=f.get('note');for(const k of ['weight','assay'])if(f.has(k))r[k]=f.get(k);if(r.serial){const p=c.factory().products.find(x=>x.serial===r.serial);if(p){p.net=p.weight=Number(r.weight);p.packaging[0].net=p.net;p.purity=r.assay;}}log(t,'ویرایش گزارش',r.title);commit();});const el=document.querySelector('#ws-form');el.note.value=r.text||'';for(const k of ['weight','assay'])if(el.elements[k])el.elements[k].value=r[k];return;}
 if(a==='reopen'&&actor()==='alireza'){t.status='active';log(t,'بازگشایی تسک',t.ended);delete t.ended;commit();return;}
 if(a==='status'&&['done','cancelled'].includes(t.status)){box('وضعیت تسک',button('reopen','بازگشایی تسک'));return;}
 if(a==='status'){box('وضعیت تسک',button('pause',t.status==='paused'?'ادامه تسک':'توقف موقت')+button('finish','پایان تسک'));return;}
 if(a==='dates'){dateForm(t);return;}
 if(['done','cancelled'].includes(t.status)&&actor()!=='alireza')return;
 if(a==='add'){box('فرایند جدید','<div class="process-grid">'+processes.map(n=>'<button class="stage" data-w="choose" data-value="'+n+'"><span class="stage-image"><img src="'+picture(n)+'"></span>'+n+'</button>').join('')+'<button class="stage" data-w="custom"><span class="stage-image">•••</span>'+other+'</button></div>');return;}
 const append=(n,img)=>{const s=stage(n);if(img)s.cover=img;t.stages.push(s);stageId=s.id;log(t,'افزودن فرایند',n);commit();};
 if(a==='choose')append(v);if(a==='custom')form(other,input('title','عنوان')+input('photo','عکس','file'),async f=>{const img=await c.fileData(f.get('photo'));if(img)append(f.get('title'),img);});
 if(a==='pause'){if(t.status==='paused'){t.status='active';log(t,'ادامه تسک');commit();}else form('توقف موقت',input('why','دلیل توقف')+pick('where','محل بار',['صندوق','داخل دستگاه']),f=>{t.status='paused';t.location=selected(f,'where');log(t,'توقف موقت',f.get('why')+' · '+t.location);commit();});}
 if(a==='finish')form('پایان تسک','<p>'+esc(t.destination||t.title)+'</p>',()=>{t.status='done';t.ended=now();if(t.destination)t.location=t.destination;log(t,'پایان تسک',t.destination);commit();},'نتیجه محقق شد');
 if(a==='member'){if(v===t.ownerId)return;box(name(v),['تعویض','پایان همکاری','ویرایش پوزیشن','واگذاری مسئولیت'].map((n,i)=>button('member-'+i,n,v)).join(''));return;}
 if(a.startsWith('member-')){const m=members(t).find(m=>m.userId===v);if(!m)return;const end=()=>{m.active=false;m.until=now();t.team=members(t).map(m=>name(m.userId));log(t,'پایان همکاری',name(v));};if(a==='member-1'){end();commit();}if(a==='member-2')form('پوزیشن',input('position','پوزیشن'),f=>{m.responsibility=f.get('position');log(t,'تغییر پوزیشن',name(v)+' · '+m.responsibility);commit();});if(a==='member-3'){t.ownerId=v;t.owner=name(v);log(t,'واگذاری مسئولیت',name(v));commit();}if(a==='member-0')form('تعویض','<select name="person">'+people().filter(([k])=>eligible(k,t.type==='production')&&!members(t).some(m=>m.userId===k)).map(([k,r])=>'<option value="'+k+'">'+r.name+'</option>').join('')+'</select>',f=>{const k=f.get('person');if(!k)return;end();t.members.push({...m,userId:k,active:true,since:now(),until:null});t.team=members(t).map(m=>name(m.userId));log(t,'تعویض',name(v)+' ← '+name(k));commit();});}
 });
 function dateForm(t){const english=document.documentElement.lang==='en';const parts=d=>new Intl.DateTimeFormat(english?'en-US-u-ca-gregory':'en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'Asia/Tehran'}).formatToParts(d).reduce((a,p)=>({...a,[p.type]:Number(p.value)}),{});
 const fields=t.ended?['started','ended']:['started'];const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>i+a);
 const select=(n,l,values,v)=>'<label>'+l+'<select name="'+n+'">'+values.map(x=>'<option value="'+x+'" '+(x===v?'selected':'')+'>'+x.toLocaleString(english?'en':'fa',{useGrouping:false})+'</option>').join('')+'</select></label>';
 form('تاریخ و ساعت',fields.map(k=>{const p=parts(new Date(t[k]||now()));return '<b>'+(k==='started'?'شروع':'پایان')+'</b><div class="ws-dates">'+[['year','سال',range(p.year-2,p.year+2)],['month','ماه',range(1,12)],['day','روز',range(1,31)],['hour','ساعت',range(0,23)],['minute','دقیقه',range(0,59)]].map(([key,l,arr])=>select(k+key,l,arr,p[key])).join('')+'</div>';}).join(''),f=>{const updates={};for(const k of fields){const val=n=>Number(f.get(k+n));let d=new Date(Date.UTC(val('year')+(english?0:621),english?0:2,english?1:17));let found=false;for(let i=0;i<370;i++,d.setUTCDate(d.getUTCDate()+1)){const p=parts(d);if(p.year===val('year')&&p.month===val('month')&&p.day===val('day')){updates[k]=new Date(d.getTime()+(val('hour')*60+val('minute')-210)*60000).toISOString();found=true;break;}}if(!found)throw Error('تاریخ معتبر انتخاب کن.');}if(updates.ended<updates.started)throw Error('پایان باید بعد از شروع باشد.');Object.assign(t,updates);log(t,'اصلاح زمان');commit();});
 }
 return {create,page};
}
