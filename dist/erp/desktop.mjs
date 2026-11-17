import {fa,escapeHTML as esc} from './core.mjs?v=3';
import {roles as accountRoles} from './policy.mjs?v=3';
export {roles} from './policy.mjs?v=3';
export const initialFinance=[
 {id:'pay-1',name:'همکار نمونه ۱',title:'دستور پرداخت پرسنلی',amount:360000000,category:'personnel',status:'pending',due:'امروز'},
 {id:'pay-2',name:'تأمین‌کننده نمونه',title:'خرید اقلام مصرفی',amount:48000000,category:'purchase',status:'pending',due:'امروز'},
 {id:'pay-3',name:'همکار نمونه ۲',title:'دستور پرداخت پرسنلی',amount:18000000,category:'personnel',status:'pending',due:'فردا'},
 {id:'pay-4',name:'خرید کارگاه',title:'هزینه ابزار',amount:12000000,category:'expense',status:'recorded',due:'دیروز'},
 {id:'pay-5',name:'تنخواه عملیاتی',title:'شارژ تنخواه تأییدشده',amount:60000000,category:'cash',status:'pending',due:'فردا'},
];
export function taskTable(tasks,icon){return `<div class="enterprise-table-wrap"><table class="enterprise-table"><thead><tr><th>تسک</th><th>نوع</th><th>مرحله / محل</th><th>مسئول</th><th>وضعیت</th><th>موعد</th><th></th></tr></thead><tbody>${tasks.map(t=>`<tr><td><button class="table-task" data-action="open-task" data-id="${esc(t.id)}"><img src="${esc(t.cover)}" alt=""><span><b>${esc(t.title)}</b><small class="ltr">${esc(t.code)}</small></span></button></td><td>${t.type==='production'?'محصول':'عمومی'}</td><td>${esc(t.location)}</td><td>${esc(accountRoles[t.ownerId]?.name||t.owner)}</td><td><span class="pill ${t.status==='waiting'?'waiting':'active'}">${({requested:'منتظر تأیید',waiting:'در انتظار',active:'در جریان',paused:'متوقف',done:'به اتمام رسیده',cancelled:'لغوشده'}[t.status]||'در انتظار')}</span></td><td>${esc(t.due||'بدون موعد')}</td><td><button class="icon-btn" data-action="open-task" data-id="${esc(t.id)}" aria-label="جزئیات ${esc(t.title)}">${icon('chevronLeft','sm')}</button></td></tr>`).join('')}</tbody></table></div>`;}
