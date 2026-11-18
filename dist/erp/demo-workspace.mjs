import {makeFactoryState,transition,today} from './factory-entry-model.mjs';
import {roles} from './policy.mjs?v=3';

const taskId='demo-argentum-04';
const photo=name=>'./visuals/demo/'+name+'.webp';
export function addWorkshopDemo(factory,tasks){
 if(factory.demoEdition===4)return;
 const day=today(), date=new Date().toISOString();
 const stages=[
  ['دریافت','receipt','تحویل بار نقره به کارگاه',{weight:1002,shape:'شمش',via:'صندوق'}],
  ['ذوب','melt','ریژه برای نمونه‌گیری آماده شد',{weight:1001,mold:'R-04'}],
  ['عیارسنجی','assay','نتیجه دستگاه ثبت شد',{assay:'۹۹۹٫۹',sampleNumber:'X-04'}],
  ['بسته‌بندی','pack','سریال ظرف و وزن خالص کنترل شد',{weight:1000,serial:'AG-DEMO-0401'}]
 ].map(([name,key,text,fields],index)=>({id:taskId+'-'+key,name,cover:photo(key),done:true,reports:[{id:'REPORT-DEMO-'+key,title:name,text,image:photo(key),actor:'sonia',author:roles.sonia.name,authorId:'sonia',time:date,date,workers:['sonia'],activities:{[name]:['sonia']},...fields}]}));
 const task={id:taskId,code:'MT-DEMO-04',title:'ساچمه نقره · پارت نمونه ۰۴',type:'production',workshop:true,status:'active',owner:roles.sonia.name,ownerId:'sonia',creatorId:'alireza',material:'نقره',weight:1000,purity:'999.9',source:'صندوق',destination:'بسته‌بندی',location:'بسته‌بندی',cover:photo('pack'),started:date,description:'گزارش تصویری نمونه از دریافت تا بسته‌بندی',members:['sonia','alireza','behnam'].map(userId=>({userId,state:'accepted',active:true,responsibility:userId==='sonia'?'مسئول':'همکار'})),team:['سونیا','علیرضا','بهنام'],stages,history:[],dependencies:[]};
 // Run the example transactions in an isolated ledger so existing local work is preserved.
 let state=makeFactoryState(), examples=[task];
 const initial=structuredClone(state);
 function record(actor,action,data){const next=transition(state,examples,actor,action,data);state=next.state;examples=next.tasks;return next.result;}
 record('sonia','expense',{title:'خرید ظرف پلمب ساچمه',amount:16500000,shipping:550000,vatIncluded:true,invoiceDate:day,note:'۲۰ ظرف یک کیلویی برای پارت نمونه',lines:[{title:'ظرف پلمب‌دار',quantity:20,unit:'عدد',unitPrice:725000}]});
 record('sonia','consume',{purpose:'بسته‌بندی پارت ۰۴',supplyId:'cloth-filter',quantity:1,serial:'CF-DEMO-04',taskId});
 record('sonia','cash-request',{amount:16000000,reason:'خرید ملزومات بسته‌بندی',needDate:day,taskId});
 record('sonia','hr-request',{kind:'مرخصی',start:day,end:day,reason:'درخواست نمونه'});
 record('sonia','hr-request',{kind:'حضور ویژه',start:day,hours:2,reason:'کنترل نهایی بسته‌ها'});
 record('behnam','hr-decide',{id:state.hrRequests.at(-1).id,decision:'approve',amount:2400000});
 record('behnam','schedule',{userId:'sonia',day,start:'08:00',end:'16:00'});
 record('sonia','attendance',{day,start:'08:05',end:'16:10',reason:'شیفت تولید نمونه'});
 record('behnam','payroll-instruction',{userId:'sonia',kind:'پاداش',amount:2400000,reason:'حضور ویژه نمونه'});
 record('nazanin','account-event',{amount:16000000,accountId:'cash',direction:'in',reason:'شارژ صندوق نمونه'});
 record('alireza','receive',{counterparty:'تأمین‌کننده نمونه آبان',photo:photo('receipt'),items:[{photo:photo('receipt'),gross:1007,net:1002,metal:'نقره',form:'شمش',purity:999.9,certainty:'declared'}]});
 const lot=state.packets.at(-1);
 record('alireza','admit',{packetId:lot.id,accepted:1002,returned:0});
 const accepted=state.packets.at(-1);
 record('alireza','reserve',{packetId:accepted.id,taskId,mass:1000});
 record('alireza','handover',{packetId:accepted.id,taskId,mass:1000,to:'ذوب',receiver:'sonia'});
 record('alireza','assay-request',{});
 record('alireza','assay-activate',{id:state.assaySessions.at(-1).id});
 record('alireza','assay-result',{taskId,purity:999.9,sampleWeight:2,sampleNumber:'X-DEMO-04',samplePhoto:photo('receipt'),analysisPhoto:photo('assay')});
 record('sonia','handover-confirm',{id:state.handovers[0].id});
 record('alireza','package',{packetId:state.handovers[0].outputPacketId,net:1000,gross:1058,serial:'AG-DEMO-0401',collection:'argentum',title:'ساچمه نقره · یک کیلوگرم',purity:999.9,front:photo('pack'),back:photo('pack')});
 const unit=state.products.at(-1);
 record('mehrab','product-qc',{id:unit.id,decision:'pass',weightCheck:true,surfaceCheck:true,sealCheck:true,serialCheck:true,assayId:state.assays[0].id});
 record('alireza','shipment-create',{productIds:[unit.id],destination:'دفتر تحویل',receiver:'office'});
 record('alireza','solution-create',{name:'محلول گرانول · دوره نمونه'});
 record('alireza','solution-work',{id:state.solutions.at(-1).id,taskId,mass:1000});
 record('alireza','recovery-create',{sourceId:accepted.id,form:'باقیمانده نمونه‌گیری',place:'آزمایشگاه',mass:2,certainty:'measured'});
 record('alireza','tool-register',{name:'بوته گرافیتی نمونه',serial:'CR-DEMO-04'});
 record('alireza','tool-use',{taskId,toolId:state.tools.at(-1).id,mass:1001});
 record('behnam','hr-dossier',{userId:'sonia',note:'همکار نمونه کارگاه',reason:'تکمیل پرونده نمایشی',contract:'تولید'});
 if(!factory.dossiers.sonia)factory.dossiers.sonia=state.dossiers.sonia;
 record('alireza','device-config',{name:'دوربین میز بسته‌بندی نمونه',kind:'dvr'});
 record('alireza','trip-start',{vehicle:'خودروی نمونه ۰۲',destination:'دفتر تحویل',role:'همراه'});
 record('alireza','trip-end',{id:state.trips.at(-1).id,reason:'تحویل مدارک بسته‌بندی'});
 for(const [key,rows] of Object.entries(state)){
  if(!Array.isArray(rows)||!Array.isArray(factory[key]))continue;
  const existing=new Set(initial[key].concat(factory[key]).map(row=>row.id));
  factory[key].push(...rows.filter(row=>row.id&&!existing.has(row.id)));
 }
 if(!tasks.some(t=>t.id===taskId))tasks.unshift(examples[0]);
 factory.demoEdition=4;
}
