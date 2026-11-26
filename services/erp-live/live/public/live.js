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
function entry(){
 actor=null;generation++;listVersion++;requestId=null;lastSubmission=null;
 $('checking').hidden=$('failure').hidden=$('desk').hidden=$('logout').hidden=true;$('entry').hidden=false;
 $('receipts').replaceChildren();$('receiptForm').reset();toggleForm(false);message('notice','');message('loginMsg','');
}
async function desk(identity){
 if(!actorNames[identity])throw Error('حساب از سرور شناسایی نشد.');
 actor=identity;generation++;$('actor').textContent=actorNames[actor];$('checking').hidden=$('entry').hidden=$('failure').hidden=true;
 $('desk').hidden=$('logout').hidden=false;await list();
}
function textEl(tag,text,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;}
function receiptCard(r){
 const card=document.createElement('article');card.className='receipt';const title=document.createElement('div');title.className='title';
 title.append(textEl('strong',r.reference||'پارت ثبت‌شده'));
 if(r.approvedBy==='smart-manager')title.append(textEl('span','تأیید مدیر هوشمند','tag'));
 card.append(title,textEl('p',(r.metal==='gold'?'طلا':'نقره')+' · '+numeric(r.mass)+' گرم · '+(r.purity==null?'عیار نامشخص':'عیار '+numeric(r.purity)),'weight'));
 const when=new Date(r.createdAt);card.append(textEl('p',(Number.isNaN(when.getTime())?'':dates.format(when)+' · ')+'ثبت‌کننده '+(actorNames[r.createdBy]||'ثبت‌شده در سیستم')+(r.recipient==='behnam'?' · گیرنده بهنام':'')));
 const details=document.createElement('details');details.append(textEl('summary','جزئیات رسید'),textEl('code',r.id));
 if(r.photoAvailable){const link=textEl('a','مشاهدهٔ عکس پارت');link.href='/api/live/receipts/'+encodeURIComponent(r.id)+'/photo';link.target='_blank';link.rel='noopener';details.append(document.createElement('br'),link);}
 card.append(details);return card;
}
async function list(){
 const current=++listVersion;$('refresh').disabled=true;message('listMsg','در حال دریافت رسیدها…');
 try{const {receipts}=await api('receipts');if(current!==listVersion)return;
 $('receipts').replaceChildren(...receipts.map(receiptCard));message('listMsg',receipts.length?'':'هنوز رسید ثبت نشده است.');
 }catch(e){if(current!==listVersion)return;if(e.status===401)entry();else message('listMsg',errorText(e));}
 finally{if(current===listVersion)$('refresh').disabled=false;}
}
function toggleForm(open){
 $('receiptForm').hidden=!open;$('newReceipt').setAttribute('aria-expanded',String(open));
 if(open){$('reference').focus();message('notice','');}
}
function readPhoto(file){
 return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('خواندن عکس انجام نشد.'));reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file);});
}
async function startup(){
 $('checking').hidden=false;$('failure').hidden=true;
 try{await desk((await api('session')).actor);}
 catch(e){if(e.status===401){entry();return;}$('checking').hidden=true;$('failure').hidden=false;message('failureText',errorText(e));}
}
$('retry').onclick=startup;
$('loginForm').onsubmit=async event=>{
 event.preventDefault();const submit=event.submitter||$('loginForm').querySelector('button');submit.disabled=true;
 try{message('loginMsg','');const result=await api('login',{role:$('role').value,code:$('code').value.trim()});$('code').value='';await desk(result.actor||(await api('session')).actor);}
 catch(e){message('loginMsg',errorText(e));}finally{submit.disabled=false;}
};
$('logout').onclick=async()=>{
 $('logout').disabled=true;try{await api('logout',{});entry();}catch(e){if(e.status===401)entry();else message('notice',errorText(e));}finally{$('logout').disabled=false;}
};
$('newReceipt').onclick=()=>toggleForm($('receiptForm').hidden);
$('cancel').onclick=()=>toggleForm(false);
$('refresh').onclick=list;
document.addEventListener('visibilitychange',()=>{if(actor&&!document.hidden)list();});
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
  if(!data.reference)throw Error('شرح یا شماره پارت را وارد کنید.');
  const file=$('photo').files[0];if(file){if(file.size>4194304||!photoTypes.includes(file.type))throw Error('تصویر JPG، PNG یا WebP تا ۴ مگابایت انتخاب کنید.');data.photo=await readPhoto(file);}
  const payload=JSON.stringify(data);
  if(!requestId||payload!==lastSubmission)requestId=crypto.randomUUID();
  lastSubmission=payload;
  const {receipt}=await api('receipts',{...data,requestId});
  if(!receipt?.id)throw Error('پاسخ سرور شناسه رسید نداشت. دوباره تلاش کنید.');
  if(gen!==generation)return;
  form.reset();requestId=null;lastSubmission=null;toggleForm(false);message('notice','رسید '+receipt.reference+' در سرور ثبت شد.');await list();
 }catch(e){if(e.status===401){entry();message('loginMsg','اعتبار ورود پایان یافته است. دوباره وارد شوید.');}else message('formMsg',errorText(e));}
 finally{sending=false;submit.disabled=false;$('logout').disabled=false;}
};
startup();
