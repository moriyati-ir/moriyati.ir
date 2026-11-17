let uiLocale='fa-IR',uiCalendar='persian';
export function configureLocale(language='fa',calendar='auto'){uiLocale=language==='en'?'en-GB':'fa-IR';uiCalendar=calendar==='auto'?(language==='en'?'gregory':'persian'):calendar;}
export const fa=(n,digits=0)=>n===null||n===undefined||n===''||!Number.isFinite(Number(n))?'—':new Intl.NumberFormat(uiLocale,{maximumFractionDigits:digits}).format(Number(n));
export const dateLabel=(date,options={day:'numeric',month:'short'})=>new Intl.DateTimeFormat(uiLocale+'-u-ca-'+uiCalendar,{timeZone:'UTC',...options}).format(new Date(date));
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function parseNumber(value){if(value===null||value===undefined||String(value).trim()==='')return NaN;return Number(String(value).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,\s]/g,'').replace('٫','.'));}
export function grams(value){if(value===null||value===undefined||value==='')return 'نامشخص';const n=parseNumber(value);if(!Number.isFinite(n))return 'نامشخص';const decimals=typeof value==='string'?(value.replace('٫','.').split('.')[1]?.length||0):0;return new Intl.NumberFormat(uiLocale,{minimumFractionDigits:Math.min(12,decimals),maximumFractionDigits:12}).format(n);}
export const total=(items,key)=>items.reduce((sum,r)=>sum+(Number(r[key])||0),0);
export function periodRecords(records,range,end){
 const days={day:1,week:7,month:30,quarter:90,half:180,year:365,all:Infinity}[range]??30;
 const last=new Date(end);last.setUTCHours(23,59,59,999);
 const first=new Date(last);if(Number.isFinite(days))first.setUTCDate(first.getUTCDate()-days+1);else first.setTime(-8640000000000000);first.setUTCHours(0,0,0,0);
 return records.filter(r=>{const d=new Date(r.date+'T12:00:00Z');return d>=first&&d<=last;});
}
export function chartBuckets(records,key,range,end,filterKind){
 const selected=periodRecords(records,range,end).filter(r=>!filterKind||r.kind===filterKind);
 const earliest=records.length?Math.min(...records.map(r=>new Date(r.date+'T00:00:00Z').getTime())):new Date(end).getTime();
 const days=range==='all'?Math.max(1,Math.ceil((new Date(end).getTime()-earliest)/86400000)+1):({day:1,week:7,month:30,quarter:90,half:180,year:365}[range]??30);
 const count=range==='day'?1:range==='week'?7:range==='month'?10:range==='year'?12:6;
 const first=new Date(end);first.setUTCDate(first.getUTCDate()-days+1);first.setUTCHours(0,0,0,0);
 return Array.from({length:count},(_,i)=>{
  const start=new Date(first.getTime()+Math.floor(i*days/count)*86400000);
  const finish=new Date(first.getTime()+Math.floor((i+1)*days/count)*86400000);
  const rows=selected.filter(r=>{const d=new Date(r.date+'T12:00:00Z');return d>=start&&d<finish;});
  return {date:start.toISOString().slice(0,10),value:Math.round(total(rows,key)*10)/10,rows};
 });
}
export function validateTaskDraft(draft){
 if(!draft.preset)return 'یک گزینه آماده یا «سایر موارد» را انتخاب کنید.';
 if(!String(draft.title??'').trim())return 'عنوان کار را وارد کنید.';
 if(draft.preset==='other'&&!String(draft.description??'').trim())return 'برای «سایر موارد»، توضیح کار لازم است.';
 if(draft.type==='production'&&draft.targetKind!=='mass'&&(!Number.isFinite(draft.quantity)||draft.quantity<=0||!Number.isInteger(draft.quantity)))return 'تعداد هدف را به‌صورت عدد صحیح مثبت وارد کنید.';
 if(draft.type==='production'&&(!Number.isFinite(draft.weight)||draft.weight<=0))return 'وزن هدف را به گرم وارد کنید.';
 return '';
}
