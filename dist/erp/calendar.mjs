const calendar=new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'});
const yearCache=new Map();
const pad=v=>String(v).padStart(2,'0');
function parts(date){
 return Object.fromEntries(calendar.formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
}
function daysOfYear(year){
 if(yearCache.has(year))return yearCache.get(year);
 const days=new Map();
 for(let time=Date.UTC(year+621,2,17),i=0;i<373;i++,time+=86400000){
  const date=new Date(time),p=parts(date);
  if(p.year===year)days.set(p.month+'-'+p.day,date.toISOString().slice(0,10));
 }
 yearCache.set(year,days);return days;
}
export function installCalendars(root){
 if(document.documentElement.lang==='en')return;
 for(const input of root.querySelectorAll('input[type=date],input[type=datetime-local]')){
  const hasTime=input.type==='datetime-local',initial=input.value,required=input.required;
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran'}).format(new Date());
  const p=parts(new Date((initial.slice(0,10)||today)+'T12:00:00Z'));
  const wrap=document.createElement('div');wrap.className='ws-dates';input.after(wrap);input.type='hidden';
  function select(label,start,end,current){
   const el=document.createElement('select');el.ariaLabel=label;el.required=required;
   el.add(new Option(label,''));for(let i=start;i<=end;i++)el.add(new Option(i.toLocaleString('fa',{useGrouping:false}),i));
   el.value=initial||required?current:'';wrap.append(el);return el;
  }
  const year=select('سال',p.year-10,p.year+10,p.year),month=select('ماه',1,12,p.month),day=select('روز',1,31,p.day);
  const time=document.createElement('input');if(hasTime){time.type='time';time.required=required;time.value=initial.slice(11,16);wrap.append(time);}
  function sync(){
   const dates=daysOfYear(Number(year.value));
   for(const opt of day.options)opt.disabled=!!opt.value&&!!month.value&&!!year.value&&!dates.has(month.value+'-'+opt.value);
   if(day.selectedOptions[0]?.disabled)day.value='';
   const iso=dates.get(month.value+'-'+day.value);
   input.value=iso&&(!hasTime||time.value)?iso+(hasTime?'T'+time.value:''):'';
  }
  wrap.addEventListener('change',sync);sync();
 }
}
