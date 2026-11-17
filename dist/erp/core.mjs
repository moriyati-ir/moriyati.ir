export const fa=(n,digits=0)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:digits}).format(Number(n)||0);
export const dateLabel=(date,options={day:'numeric',month:'short'})=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'UTC',...options}).format(new Date(date));
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function parseNumber(value){return Number(String(value??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,\s]/g,'').replace('٫','.'));}
export const total=(items,key)=>items.reduce((sum,r)=>sum+(Number(r[key])||0),0);
export function periodRecords(records,range,end){
 const days={week:7,month:30,quarter:90,half:180,all:Infinity}[range]??30;
 const last=new Date(end);last.setUTCHours(23,59,59,999);
 const first=new Date(last);if(Number.isFinite(days))first.setUTCDate(first.getUTCDate()-days+1);else first.setUTCFullYear(2000);first.setUTCHours(0,0,0,0);
 return records.filter(r=>{const d=new Date(r.date+'T12:00:00Z');return d>=first&&d<=last;});
}
export function chartBuckets(records,key,range,end,filterKind){
 const selected=periodRecords(records,range,end).filter(r=>!filterKind||r.kind===filterKind);
 const days={week:7,month:30,quarter:90,half:180,all:180}[range]??30;
 const count=range==='week'?7:range==='month'?10:6;
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
 if(draft.type==='production'&&(!Number.isFinite(draft.quantity)||draft.quantity<=0||!Number.isInteger(draft.quantity)))return 'تعداد هدف را به‌صورت عدد صحیح مثبت وارد کنید.';
 if(draft.type==='production'&&(!Number.isFinite(draft.weight)||draft.weight<=0))return 'وزن هدف را به گرم وارد کنید.';
 return '';
}
