const $ = id => document.getElementById(id);
const actorNames = {staff:'انباردار', manager:'مدیر'};
function numeric(value){
 const [whole,fraction='']=String(value).split('.');
 const tail=fraction.replace(/0+$/,'').replace(/\d/g,n=>'۰۱۲۳۴۵۶۷۸۹'[n]);
 return BigInt(whole).toLocaleString('fa-IR')+(tail?'٫'+tail:'');
}
const dates = new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'short',timeStyle:'short'});
const photoTypes = ['image/jpeg','image/png','image/webp'];
let actor, generation=0, listVersion=0, requestId, lastSubmission, sending=false;
function message(id,text){const el=$(id);el.textContent=text;el.hidden=!text;}
function digits(value){return value.trim().replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace('٫','.');}
async function api(path,data){
 const response=await fetch('/api/live/'+path,{method:data===undefined?'GET':'POST',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),credentials:'same-origin',cache:'no-store'});
 const result=await response.json().catch(()=>({}));
 if(!response.ok){const e=new Error(result.error||'سرور درخواست را انجام نداد.');e.status=response.status;throw e;}
 return result;
}
function errorText(e){return e instanceof TypeError?'پاسخی از سرور دریافت نشد. اتصال را بررسی کنید و دوباره تلاش کنید.':e.message;}
const pages=['home','receipts','new','account'];
let identity=null, checking=true, offline=false, cachedReceipts=[], selectedReceipt=new URLSearchParams(location.search).get('receipt');
function permitted(view){
 if(!identity)return true;
 if(view==='new')return identity.permissions.admission;
 if(view==='receipts')return identity.permissions.receipts;
 return true;
}
function page(){
 const name=location.hash.replace(/^#\/?/,'');
 return pages.includes(name)?name:'home';
}
function navigate(name){
 if(page()===name){renderShell();return;}
 location.hash='/'+name;
}
function renderShell(){
 const view=page(), home=view==='home', gated=!home&&!actor;
 const granted=permitted(view);
 $('forbidden').hidden=granted;
 $('noModules').hidden=!actor||permitted('new')||permitted('receipts');
 document.querySelectorAll('.work-tile').forEach(link=>{link.hidden=!permitted(link.hash.slice(2));});
 $('home').hidden=!home;
 $('homeTitle').textContent=identity?'میزکار '+identity.displayName:'فضای کار';
 const icon=$('profileIcon');icon.setAttribute('aria-label',identity?'حساب '+identity.displayName:'حساب کاربری');
 $('profileLabel').textContent=identity?identity.displayName:'ورود';
 $('recentTitle').textContent=identity?.permissions.allReceipts?'آخرین پارت‌ها':'پارت‌های من';
 $('home').classList.toggle('personal-home',Boolean(identity));
 if(identity)icon.dataset.initial=identity.displayName.trim().charAt(0);else delete icon.dataset.initial;
 document.querySelectorAll('[data-view=account] span').forEach(el=>{el.textContent=identity?identity.displayName:'حساب';});
 $('checking').hidden=!gated||!checking;
 $('failure').hidden=!offline;
 $('entry').hidden=!gated||checking||offline;
 $('account').hidden=view!=='account'||!actor;
 $('desk').hidden=!actor||!granted||!['receipts','new'].includes(view);
 $('receiptList').hidden=view!=='receipts';
 $('receiptForm').hidden=view!=='new'||!actor;
 $('newReceipt').hidden=view==='new'||!permitted('new');
 $('recent').hidden=!actor||!home||!permitted('receipts');
 $('deskTitle').textContent=view==='new'?'ثبت پارت جدید':'پارت‌ها و عملیات تولید';
 $('entryTitle').textContent={new:'ورود برای ثبت پارت',receipts:'ورود برای مشاهده پارت‌ها',account:'ورود به حساب'}[view]||'ورود به حساب';
 document.querySelectorAll('[data-view]').forEach(link=>{
  link.hidden=!permitted(link.dataset.view);const active=link.dataset.view===view;link.classList.toggle('is-active',active);
  if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
 });
 if(view==='receipts'&&actor&&selectedReceipt){
  const card=document.getElementById('receipt-'+selectedReceipt);
  if(card){card.querySelector('details').open=true;card.scrollIntoView({block:'nearest'});selectedReceipt=null;}
 }
}
function entry(){
 actor=null;identity=null;checking=false;offline=false;generation++;listVersion++;requestId=null;lastSubmission=null;cachedReceipts=[];selectedReceipt=null;
 $('receipts').replaceChildren();$('assignee').replaceChildren();$('actor').textContent='';resetDeviceSettings();$('recentRows').replaceChildren();$('receiptForm').reset();message('notice','');message('loginMsg','');
 renderShell();
}
async function desk(session){
 if(!session?.userId||!session.permissions)throw Error('حساب از سرور شناسایی نشد.');
 identity=session;actor=session.actor;checking=false;offline=false;generation++;
 $('actor').textContent=session.displayName;
 const assignees=[new Option('تعیین نشده',''),...(session.productionUsers||[]).map(u=>new Option(u.name,u.id))];
 $('assignee').replaceChildren(...assignees);renderShell();
 if(permitted('receipts'))await list();
}
function showRecent(){
 const rows=cachedReceipts.slice(0,3).map(r=>{
  const button=textEl('button','','recent-row');
  button.type='button';button.append(textEl('strong',r.reference),textEl('span',numeric(r.mass)+' گرم'));
  button.onclick=()=>{selectedReceipt=r.id;navigate('receipts');};return button;
 });
 $('recentRows').replaceChildren(...(rows.length?rows:[textEl('p','هنوز رسید ثبت نشده است.','muted')]));
}
window.addEventListener('hashchange',()=>{
 document.getElementById('main-content').scrollTop=0;
 message('loginMsg','');message('notice','');renderShell();
});
function textEl(tag,text,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;}
const stageNames={melt:'ذوب',refine:'پالایش',polish:'پرداخت',mint:'ضرب',pack:'بسته‌بندی'};
const eventNames={start:'شروع عملیات',record:'ثبت گزارش',complete:'پایان عملیات'};
const custodyNames={...actorNames,behnam:'بهنام'};
function labelled(caption,control){
 const label=document.createElement('label');label.append(textEl('span',caption),control);return label;
}
function inputField(name,decimal=false){
 const input=document.createElement('input');input.name=name;if(decimal){input.dir='ltr';input.inputMode='decimal';}return input;
}
function micrograms(value){
 const input=digits(value);
 if(!/^\d{1,13}(\.\d{1,6})?$/.test(input))return null;
 const [whole,fraction='']=input.split('.');
 return BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0'));
}
function gramsFromMicro(value){
 const text=(value/1000000n)+'.'+String(value%1000000n).padStart(6,'0');return numeric(text);
}
function workflowFor(receipt,details){
 const section=document.createElement('section');section.className='workflow';details.append(section);
 const path='receipts/'+encodeURIComponent(receipt.id)+'/workflow';
 let initialized=false;
 async function load(){
  initialized=true;section.replaceChildren(textEl('p','در حال خواندن عملیات…'));
  try{const result=await api(path);draw(result);}
  catch(e){
   if(e.status===401){entry();return;}
   const retry=textEl('button','تلاش دوباره');retry.type='button';retry.onclick=load;
   section.replaceChildren(textEl('p',errorText(e),'error'),retry);
  }
 }
 details.ontoggle=()=>{if(details.open&&!initialized)load();};
 function draw({workflow:w,events}){
  const available=numeric(w.availableMass)+' گرم';
  const active=w.state==='active';
  const status=active?(stageNames[w.stage]||'عملیات')+' در حال انجام':'آماده برای عملیات';
  section.replaceChildren(textEl('h3',status),textEl('p','موجودی این پارت '+available+' · '+(w.currentPurity==null?'عیار فعلی نامشخص':'عیار فعلی '+numeric(w.currentPurity))+' · نزد '+(w.custody===identity?.userId?identity.displayName:w.custody===receipt.assigneeUserId?receipt.assigneeName:custodyNames[w.custody]||events.findLast(e=>e.actorUserId===w.custody)?.actorName||w.custody)));
  const canAct=identity?.permissions.production && (active?(actor==='manager'||[identity.userId,actor].includes(w.operator)):(actor==='manager'||['behnam',actor,identity.userId].includes(w.custody)));
  if(canAct&&micrograms(w.availableMass)>0n){
   const actions=document.createElement('div');actions.className='actions';
   const editor=document.createElement('div');section.append(actions,editor);
   for(const kind of active?['record','complete']:['start']){
    const button=textEl('button',active?eventNames[kind]:'شروع مرحله');button.type='button';
    button.onclick=()=>openForm(kind,editor,actions,w);actions.append(button);
   }
  }
  if(events.length){
   const history=document.createElement('details'),items=document.createElement('ol');
   history.append(textEl('summary','سابقه عملیات ('+numeric(events.length)+')'),items);
   for(const ev of events.slice().reverse()){
    const li=document.createElement('li');li.append(textEl('strong',(eventNames[ev.kind]||'عملیات')+' · '+(stageNames[ev.stage]||'')));
    const when=new Date(ev.createdAt);li.append(textEl('p',(ev.actorName||actorNames[ev.actor]||'')+(Number.isNaN(when.getTime())?'':' · '+dates.format(when))));
    if(ev.kind==='complete'&&ev.outputMass!=null){
     const parts=['خروجی '+numeric(ev.outputMass)+' گرم','باقیمانده '+numeric(ev.residualMass??0)+' گرم'];
     if(ev.unreconciledMass!=null){
      const delta=String(ev.unreconciledMass),gain=delta.startsWith('-'),magnitude=micrograms(gain?delta.slice(1):delta);
      if(magnitude>0n)parts.push((gain?'اضافه وزن ':'کسری وزن ')+gramsFromMicro(magnitude)+' گرم');
     }
     if(ev.outputPurity!=null)parts.push('عیار '+numeric(ev.outputPurity));
     li.append(textEl('p',parts.join(' · ')));
    }
    if(ev.note)li.append(textEl('p',ev.note));
    items.append(li);
   }
   section.append(history);
  }
 }
 function openForm(kind,editor,actions,w){
  const form=document.createElement('form');form.className='stageForm';actions.hidden=true;editor.replaceChildren(form);
  let stage,output,residual,purity,balance;
  const note=inputField('note');note.maxLength=1000;note.required=kind==='record';
  if(kind==='start'){
   stage=document.createElement('select');for(const [value,name] of Object.entries(stageNames)){const opt=textEl('option',name);opt.value=value;stage.append(opt);}
   form.append(labelled('عملیات',stage));
  }
  if(kind==='complete'){
   output=inputField('outputMass',true);output.required=true;
   residual=inputField('residualMass',true);residual.required=true;residual.value='0';
   purity=inputField('outputPurity',true);purity.placeholder='نامشخص';
   const pair=document.createElement('div');pair.className='pair';
   pair.append(labelled('خروجی (گرم)',output),labelled('باقیمانده (گرم)',residual));
   form.append(pair,labelled('عیار خروجی (در هزار)',purity));balance=textEl('p','','muted');balance.setAttribute('aria-live','polite');form.append(balance);
   const update=()=>{
    const a=micrograms(output.value),b=micrograms(residual.value);note.required=false;
    if(a===null||b===null){balance.textContent='';return;}
    const delta=micrograms(w.availableMass)-a-b;
    balance.textContent=delta===0n?'وزن‌ها تطبیق دارند.':(delta<0n?'اضافه وزن ':'کسری وزن ')+gramsFromMicro(delta<0n?-delta:delta)+' گرم؛ علت را بنویسید.';
    note.required=delta!==0n;
   };output.oninput=residual.oninput=update;
  }
  form.append(labelled(kind==='record'?'گزارش عملیات':'توضیح',note));
  const buttons=document.createElement('div');buttons.className='actions';const submit=textEl('button',kind==='complete'?'ثبت پایان عملیات':'ثبت','primary'),cancel=textEl('button','بستن');
  submit.type='submit';cancel.type='button';cancel.onclick=()=>{editor.replaceChildren();actions.hidden=false;};
  const feedback=textEl('p','','error');feedback.setAttribute('role','alert');buttons.append(submit,cancel);form.append(buttons,feedback);
  let priorPayload,id;
  form.onsubmit=async e=>{
   e.preventDefault();if(submit.disabled)return;feedback.textContent='';
   try{
    const data={kind,version:w.version,note:note.value.trim()};
    if(stage)data.stage=stage.value;
    if(kind==='complete'){
     data.outputMass=digits(output.value);data.residualMass=digits(residual.value);data.outputPurity=digits(purity.value)||null;
     const a=micrograms(data.outputMass),b=micrograms(data.residualMass);if(a===null||b===null)throw Error('وزن خروجی و باقیمانده را بررسی کنید.');
     if(a+b!==micrograms(w.availableMass)&&!data.note)throw Error('علت اختلاف وزن را بنویسید.');
    }
    const serialized=JSON.stringify(data);if(serialized!==priorPayload){id=crypto.randomUUID();priorPayload=serialized;}
    submit.disabled=cancel.disabled=true;
    const result=await api(path,{...data,requestId:id});draw(result);message('notice',eventNames[kind]+' در سرور ثبت شد.');
   }catch(error){
    if(error.status===401){entry();return;}
    if(error.status===409){await load();message('notice','عملیات تغییر کرده است. وضعیت تازه را بررسی کنید.');return;}
    feedback.textContent=errorText(error);
   }finally{submit.disabled=cancel.disabled=false;}
  };
  (stage||output||note).focus();
 }
}

function receiptCard(r){
 const card=document.createElement('article');card.id='receipt-'+r.id;card.className='receipt';const title=document.createElement('div');title.className='title';
 title.append(textEl('strong',r.reference||'پارت ثبت‌شده'));
 if(r.approvedBy==='smart-manager')title.append(textEl('span','تأیید مدیر هوشمند','tag'));
 card.append(title,textEl('p',(r.metal==='gold'?'طلا':'نقره')+' · '+numeric(r.mass)+' گرم · '+(r.purity==null?'عیار نامشخص':'عیار '+numeric(r.purity)),'weight'));
 const when=new Date(r.createdAt);card.append(textEl('p',(Number.isNaN(when.getTime())?'':dates.format(when)+' · ')+'ثبت‌کننده '+(r.createdByName||actorNames[r.createdBy]||'ثبت‌شده در سیستم')+(r.recipient==='behnam'?' · گیرنده بهنام':'')+(r.assigneeName?' · مسئول '+r.assigneeName:'')));
 const details=document.createElement('details');details.append(textEl('summary','جزئیات و عملیات پارت'),textEl('code',r.id));
 if(r.photoAvailable){const link=textEl('a','مشاهدهٔ عکس پارت');link.href='/api/live/receipts/'+encodeURIComponent(r.id)+'/photo';link.target='_blank';link.rel='noopener';details.append(document.createElement('br'),link);}
 workflowFor(r,details);card.append(details);return card;
}
async function list(){
 const current=++listVersion;$('refresh').disabled=true;message('listMsg','در حال دریافت رسیدها…');
 try{const {receipts}=await api('receipts');if(current!==listVersion)return;
 cachedReceipts=receipts;showRecent();$('receipts').replaceChildren(...receipts.map(receiptCard));renderShell();message('listMsg',receipts.length?'':'هنوز رسید ثبت نشده است.');
 }catch(e){if(current!==listVersion)return;if(e.status===401)entry();else message('listMsg',errorText(e));}
 finally{if(current===listVersion)$('refresh').disabled=false;}
}
function readPhoto(file){
 return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('خواندن عکس انجام نشد.'));reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file);});
}
async function startup(){
 checking=true;offline=false;renderShell();
 try{await desk(await api('session'));}
 catch(e){if(e.status===401){entry();return;}checking=false;offline=true;message('failureText',errorText(e));renderShell();}
}
$('today').textContent=new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',weekday:'long',day:'numeric',month:'long'}).format(new Date());
function theme(dark){
 document.documentElement.dataset.theme=dark?'dark':'light';
 $('theme').setAttribute('aria-pressed',String(dark));$('theme').setAttribute('aria-label',dark?'حالت روز':'حالت شب');
 document.querySelector('meta[name="theme-color"]').content=dark?'#090909':'#ffffff';
}
try{theme(localStorage.getItem('erp-live-theme')==='dark');}catch{}
$('theme').onclick=()=>{const dark=document.documentElement.dataset.theme!=='dark';theme(dark);try{localStorage.setItem('erp-live-theme',dark?'dark':'light');}catch{}};
function resetDeviceSettings(){
 $('devicePanel').open=false;$('deviceForm').hidden=true;$('deviceForm').reset();
 $('removePin').hidden=true;message('deviceStatus','');
}
function deviceResult(data){
 $('deviceForm').hidden=false;$('removePin').hidden=!data.enabled;
 message('deviceStatus',data.enabled?'رمز کوتاه برای ورود به حساب شما در همین مرورگر فعال است.':'');
}
$('devicePanel').ontoggle=async()=>{
 if(!$('devicePanel').open||!identity)return;
 const gen=generation;
 try{const status=await api('device-pin');if(gen===generation)deviceResult(status);}
 catch(e){if(gen!==generation)return;if(e.status===401)entry();else message('deviceStatus',errorText(e));}
};
async function setDevicePin(remove){
 const gen=generation,button=remove?$('removePin'):$('deviceForm').querySelector('button');
 button.disabled=true;
 try{
  const payload=remove?{}:{password:$('devicePassword').value,pin:digits($('devicePin').value)};
  const result=await api(remove?'device-pin/remove':'device-pin',payload);
  if(gen!==generation)return;
  $('deviceForm').reset();deviceResult(result);
  if(remove)message('deviceStatus','رمز کوتاه این دستگاه برداشته شد.');
 }catch(e){if(gen===generation)message('deviceStatus',errorText(e));}
 finally{button.disabled=false;}
}
$('deviceForm').onsubmit=e=>{e.preventDefault();setDevicePin(false);};
$('removePin').onclick=()=>setDevicePin(true);
$('retry').onclick=startup;
$('loginForm').onsubmit=async event=>{
 event.preventDefault();const submit=event.submitter||$('loginForm').querySelector('button');submit.disabled=true;
 try{message('loginMsg','');const result=await api('login',{username:$('username').value.trim(),password:$('password').value});$('password').value='';await desk(result);}
 catch(e){message('loginMsg',errorText(e));}finally{submit.disabled=false;}
};
$('logout').onclick=async()=>{
 $('logout').disabled=true;try{await api('logout',{});entry();navigate('home');}catch(e){if(e.status===401)entry();else message('notice',errorText(e));}finally{$('logout').disabled=false;}
};
$('cancel').onclick=()=>navigate('receipts');
$('refresh').onclick=list;
document.addEventListener('visibilitychange',()=>{if(actor&&permitted('receipts')&&!document.hidden&&!$('receipts').querySelector('details[open]'))list();});
$('receiptForm').onsubmit=async event=>{
 event.preventDefault();if(sending)return;
 const form=event.currentTarget,submit=event.submitter||form.querySelector('button.primary'),gen=generation;
 sending=true;submit.disabled=true;$('logout').disabled=true;
 try{
  message('formMsg','');message('notice','');
  const mass=digits($('mass').value),purity=digits($('purity').value)||null;
  if(!/^\d{1,13}(\.\d{1,6})?$/.test(mass)||Number(mass)<=0)throw Error('وزن را به گرم، با حداکثر شش رقم اعشار وارد کنید.');
  if(purity!==null&&(!/^\d{1,4}(\.\d{1,4})?$/.test(purity)||Number(purity)>1000))throw Error('عیار را بین صفر و هزار وارد کنید یا برای عیار نامشخص خالی بگذارید.');
  const data={metal:$('metal').value,mass,purity,reference:$('reference').value.trim()};
  if($('assignee').value)data.assigneeUserId=$('assignee').value;
  if(!data.reference)throw Error('شرح یا شماره پارت را وارد کنید.');
  const file=$('photo').files[0];if(file){if(file.size>4194304||!photoTypes.includes(file.type))throw Error('تصویر JPG، PNG یا WebP تا ۴ مگابایت انتخاب کنید.');data.photo=await readPhoto(file);}
  const payload=JSON.stringify(data);
  if(!requestId||payload!==lastSubmission)requestId=crypto.randomUUID();
  lastSubmission=payload;
  const {receipt}=await api('receipts',{...data,requestId});
  if(!receipt?.id)throw Error('پاسخ سرور شناسه رسید نداشت. دوباره تلاش کنید.');
  if(gen!==generation)return;
  form.reset();requestId=null;lastSubmission=null;navigate('receipts');await list();message('notice','رسید '+receipt.reference+' در سرور ثبت شد.');
 }catch(e){if(e.status===401){entry();message('loginMsg','اعتبار ورود پایان یافته است. دوباره وارد شوید.');}else message('formMsg',errorText(e));}
 finally{sending=false;submit.disabled=false;$('logout').disabled=false;}
};
startup();
