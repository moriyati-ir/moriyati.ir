import {accountBalance} from './factory-model.mjs';
import {escapeHTML as esc} from './core.mjs?v=3';

export function managerHome({tasks,state,actor,alerts,preferences}){
 const count=status=>tasks.filter(t=>t.status===status).length;
 const digits=n=>Number(n).toLocaleString(document.documentElement.lang);
 const line=(label,value)=>'<p>'+esc(label)+' <b>'+esc(String(value))+'</b></p>';
 const bars=items=>items.map(([label,value])=>'<div>'+line(label,digits(value))+'<meter min="0" max="'+Math.max(1,...items.map(i=>i[1]))+'" value="'+value+'"></meter></div>').join('');
 const widgets=[
 ['tasks','وضعیت تسک‌ها',bars([['در جریان',count('active')],['توقف موقت',count('paused')],['پایان‌یافته',count('done')]])],
 ['production','فرایندهای در جریان',bars(Object.entries(tasks.filter(t=>t.status==='active').flatMap(t=>(t.stages||[]).filter(s=>!s.done)).reduce((counts,s)=>({...counts,[s.name]:(counts[s.name]||0)+1}),{})))||'فرایند فعالی ثبت نشده'],
 ['alerts','هشدارها',alerts.filter(n=>!n.read).slice(0,5).map(n=>line(n.title||'اعلان',n.text||'')).join('')||'هشدار تازه‌ای ثبت نشده'],
 ['accounts','موجودی حساب‌های شرکت',state.accounts.map(a=>{const balance=accountBalance(state,a.id);return line(a.name,balance==null?'مانده ثبت نشده':digits(balance)+' ریال');}).join('')],
 ['petty','تنخواه من',(()=>{const received=state.cashRequests.filter(r=>r.actor===actor&&r.state==='received');const spent=state.expenses.filter(e=>received.some(r=>r.id===e.cashRequestId)).reduce((n,e)=>n+Number(e.amount||0),0);return received.length?line('مانده ثبت‌شده',digits(received.reduce((n,r)=>n+Number(r.approvedAmount??r.amount),0)-spent)+' ریال'):'دریافت تنخواه ثبت نشده';})()],
 ['rates','نرخ بازار',['طلا','نقره','دلار'].map(k=>line(k,'منبع نرخ متصل نشده')).join('')]
 ];
 if(['alireza','behnam'].includes(actor))widgets.push(['urgent','درخواست‌های فوری',state.hrRequests.filter(r=>r.priority==='فوری'&&r.state==='requested').map(r=>line(r.kind,r.reason)).join('')||'درخواست فوری در انتظار نیست']);
 const enabled=k=>!preferences.hiddenWidgets?.includes(k);
 return '<section><h1>نمای کلی کارخانه</h1><details><summary>انتخاب ویجت‌ها</summary>'+widgets.map(([k,l])=>'<label><input type="checkbox" data-widget="'+k+'" '+(enabled(k)?'checked':'')+'>'+l+'</label>').join('')+'</details><div class="manager-widgets">'+widgets.filter(([k])=>enabled(k)).map(([,label,body])=>'<article><h2>'+label+'</h2>'+body+'</article>').join('')+'</div></section>';
}
