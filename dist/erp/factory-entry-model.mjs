import * as base from './factory-model.mjs?v=3';
export * from './factory-model.mjs?v=3';
import {supplyCatalog} from './entry-forms.mjs';
import {roles,canReport,canViewTask} from './policy.mjs?v=3';
const {uid,today,numberOrNull,operationallyFrozen}=base;
const positive=v=>{const n=numberOrNull(v);if(n===null||n<=0)throw new Error('مقدار مثبت لازم است.');return n;};
const required=(value,label='توضیح')=>{const s=String(value??'').trim();if(!s)throw new Error(label+' لازم است.');return s;};
const permitted=(condition)=>{if(!condition)throw new Error('این اقدام در اختیار این حساب نیست.');};
function invoiceLines(lines=[]){
 return lines.filter(line=>line.title||line.quantity||line.unitPrice).map(line=>({title:required(line.title,'نام قلم'),quantity:positive(line.quantity),unit:line.unit||'عدد',unitPrice:positive(line.unitPrice)}));
}
export function makeFactoryState(){
 const state=base.makeFactoryState();
 state.supplies.unshift(...structuredClone(supplyCatalog));
 return state;
}
export function hydrateFactory(raw){const initial=makeFactoryState();if(!raw||raw.version!==3)return initial;return {...initial,...raw,hrRequests:(raw.hrRequests||[]).map(r=>r.kind==='تنخواه شخصی'?{...r,kind:'تنخواه'}:r),financialRecords:(raw.financialRecords||[]).map(r=>r.kind==='تنخواه شخصی'?{...r,kind:'تنخواه'}:r),supplies:[...(raw.supplies||initial.supplies),...structuredClone(supplyCatalog.filter(item=>raw.supplies&&!raw.supplies.some(s=>s.id===item.id)))],settings:{...initial.settings,...raw.settings},integrations:{...initial.integrations,...raw.integrations},connection:{...initial.connection,...raw.connection}};}
export function transition(factory,tasks,actor,command,data={}){
 if(!['consume','consume-correct','expense','expense-finalize','expense-edit','hr-request'].includes(command))return base.transition(factory,tasks,actor,command,data);
 if(!roles[actor])throw new Error('حساب نامعتبر است.');
 const s=structuredClone(factory),ts=structuredClone(tasks),now=new Date().toISOString();
 if(data.operationId&&s.audit.some(e=>e.operationId===data.operationId))throw new Error('این رویداد قبلاً ثبت شده است.');
 if(operationallyFrozen(s)&&!['sync-preview','request-login','emergency-code'].includes(command))throw new Error('عملیات بیرون کارخانه تا تکمیل همگام‌سازی متوقف است؛ مسنجر مستقل در دسترس می‌ماند.');
 const find=(list,id,label)=>{const item=list.find(x=>x.id===id);if(!item)throw new Error((label||'رکورد')+' پیدا نشد.');return item;};
 const task=()=>{const t=find(ts,data.taskId,'تسک');permitted(canViewTask(actor,t));if(t.workshop&&['done','cancelled'].includes(t.status))permitted(actor==='alireza');return t;};
 const reason=()=>required(data.reason,'دلیل');
 const log=(type,id,details={})=>s.audit.push({id:uid(),type,entityId:id,actor,date:now,operationId:data.operationId,...details});
 let result=null,notice='ثبت شد.';
 switch(command){
 case 'consume':{const t=data.taskId?task():null;
  permitted(t?canReport(actor,t):actor!=='haji');
  const supply=find(s.supplies,data.supplyId),quantity=positive(data.quantity);
  if(['عدد','جفت'].includes(supply.unit)&&!Number.isInteger(quantity))throw new Error('تعداد باید عدد صحیح باشد.');
  const purpose=required(data.purpose||t?.title,'بابت');
  const r={id:uid('USE'),taskId:t?.id||null,purpose,photo:data.photo||null,serial:data.serial||'',reusable:!!supply.reusable,stageId:data.stageId,supplyId:supply.id,quantity,unit:supply.unit,actor,date:now,reason:data.reason||'',revisions:[]};if(!supply.reusable)supply.stock-=quantity;s.consumptions.unshift(r);log(command,r.id);if(supply.stock<0)notice='مصرف واقعی ثبت شد؛ موجودی ثبت‌شده کافی نیست و نیاز به بررسی دارد.';break;}
 case 'consume-correct':{const r=find(s.consumptions,data.id);permitted(r.actor===actor);const quantity=positive(data.quantity),why=reason(),supply=find(s.supplies,r.supplyId);if(['عدد','جفت'].includes(r.unit)&&!Number.isInteger(quantity))throw new Error('تعداد باید عدد صحیح باشد.');if(!r.reusable)supply.stock+=r.quantity-quantity;r.revisions.push({before:r.quantity,after:quantity,reason:why,date:now});r.quantity=quantity;log(command,r.id,{reason:why});break;}
 case 'expense':{if(actor==='haji')throw new Error('ثبت هزینه اجرایی این حساب تعریف نشده است.');if(data.cashRequestId){const cash=find(s.cashRequests,data.cashRequestId);permitted(cash.actor===actor&&cash.state==='received');}const lines=invoiceLines(data.lines),amount=positive(data.amount||lines.reduce((sum,r)=>sum+r.quantity*r.unitPrice,0));
  s.expenses.unshift({id:uid('EXP'),actor,name:data.name||'',title:required(data.title,'بابت خرید'),cashRequestId:data.cashRequestId||null,lines,amount,
   shipping:numberOrNull(data.shipping)??0,vatIncluded:data.vatIncluded===true,invoiceDate:data.invoiceDate||today(),note:data.note||'',
   receipt:data.receipt||null,noReceiptReason:data.noReceiptReason||'',state:'submitted',date:now});log(command,s.expenses[0].id);break;}
 case 'expense-finalize':{permitted(actor==='nazanin');const e=find(s.expenses,data.id);if(e.state==='finalized')throw new Error('این سند قبلاً نهایی شده است.');e.state='finalized';e.finalizedBy=actor;e.noReceiptReason=data.reason||e.noReceiptReason;log(command,e.id);break;}
 case 'hr-request':{permitted(actor!=='haji');const kind=required(data.kind,'موضوع'),entry={id:uid('HRQ'),actor,kind,reason:data.reason||'',priority:data.priority==='فوری'?'فوری':'عادی',state:'requested',date:now};
  if(['وام','مساعده','تنخواه'].includes(kind))entry.amount=positive(data.amount);
  if(kind==='تنخواه'||kind==='سایر موارد')required(entry.reason,'توضیح');
  if(kind==='حضور ویژه'){entry.start=required(data.start,'شروع');entry.hours=positive(data.hours);}
  if(kind==='مرخصی'){entry.start=required(data.start,'شروع');entry.end=required(data.end,'پایان');if(entry.end<entry.start)throw new Error('پایان مرخصی قبل از شروع است.');}
  s.hrRequests.push(entry);log(command,s.hrRequests.at(-1).id);break;}
 case 'expense-edit':{permitted(actor==='nazanin');const e=find(s.expenses,data.id);if(e.state==='finalized')throw new Error('سند نهایی فقط با اصلاح دارای سابقه قابل تغییر است.');const before=structuredClone(e);if(data.lines)e.lines=invoiceLines(data.lines);if(data.amount)e.amount=positive(data.amount);if(data.shipping!=null)e.shipping=numberOrNull(data.shipping)??0;if(data.vatIncluded!=null)e.vatIncluded=data.vatIncluded;if(data.invoiceDate)e.invoiceDate=data.invoiceDate;if(data.receipt)e.receipt=data.receipt;if(data.note!=null)e.note=data.note;if(data.title)e.title=data.title;e.revisions||=[];e.revisions.push({before,actor,date:now,reason:reason()});log(command,e.id);break;}
 }
 return {state:s,tasks:ts,result,notice};
}
