import { applyFactoryCommand, seedFactory, can, operations, pure, type FactoryData, type FCommand, type Packet, type Lot, type Share, type Run, type AssayBasis, type FlowPlan, type Priority, type Residue, type FMetal } from './factory.ts';

// v3 tracks physical material and source identities. Legacy owner fields are retained
// only for backwards-compatible records; they are never requested or used for access.
export const flowOperations = [
 {id:'weigh',name:'وزن‌کشی و ثبت موجودی',station:'انبار',shape:''},
 ...operations.slice(0,3),
 {id:'assay',name:'نمونه‌برداری و عیارسنجی',station:'آزمایشگاه',shape:''},
 ...operations.slice(3,7),
 {id:'chloride',name:'ثبت کلرید / تبدیل میانی',station:'اسیدکاری',shape:'کلرید'},
 {id:'wash',name:'شست‌وشو',station:'اسیدکاری',shape:'شسته‌شده'},
 ...operations.slice(7),
 {id:'seal',name:'پلمب و آماده‌سازی خروج',station:'بسته‌بندی',shape:'پلمب‌شده'},
 {id:'research',name:'تحقیق و توسعه / R&D',station:'R&D',shape:''},
 {id:'transfer',name:'برداشت / انتقال داخلی',station:'انبار',shape:''},
];
export const stockLocations = ['انبار','صندوق','ذوب','اسیدکاری','محلول','فیلتر','کلرید','رسوب','خشک‌کن','گرانول','ضرابخانه','پوست و پرداخت','بسته‌بندی','R&D','آزمایشگاه','بازیافت'];
export const priorityLabels:Record<Priority,string>={urgent:'فوری',high:'بالا',normal:'عادی',low:'پایین'};
export const basisLabel=(basis:AssayBasis|undefined)=>basis==='final'?'نهایی':basis==='estimated'?'تقریبی':'نامشخص';
const uid=(prefix:string)=>`${prefix}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
const r6=(v:number)=>Math.round(v*1e6)/1e6;
const copy=<T>(v:T):T=>structuredClone(v);
const txt=(d:Record<string,unknown>,k:string,def='')=>{const v=d[k]??def;if(typeof v!=='string'||v.length>2000)throw Error('متن معتبر وارد کن.');return v.trim();};
const req=(v:string,label:string)=>{if(!v)throw Error(`${label} را وارد کن.`);return v;};
const num=(d:Record<string,unknown>,k:string,min=0,max=1e12)=>{const v=d[k];if(v==null||v===''||typeof v==='boolean'||!['string','number'].includes(typeof v))throw Error(`مقدار ${k} لازم است.`);const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw Error(`مقدار ${k} خارج از محدوده است.`);return n;};
const optionalNum=(d:Record<string,unknown>,k:string,max=1e12)=>d[k]==null||d[k]===''?null:num(d,k,0,max);
const strs=(v:unknown)=>{if(!Array.isArray(v)||v.some(x=>typeof x!=='string'))throw Error('فهرست معتبر انتخاب کن.');return v as string[];};
const ids=(s:Share[])=>[...new Set(s.map(x=>x.lotId))];
const scale=(s:Share[],n:number)=>s.map(x=>({...x,weight:r6(x.weight*n)}));
const isFluid=(shape:string)=>/محلول|کلرید|رسوب|فیلتر|لجن/.test(shape);
const isRecycled=(lot:Lot)=>lot.claimedKnown===false||/مصنوع|ظروف|بازیافت|متفرقه/.test(lot.form);
export function packetFine(p:Packet):number|null {
 if(p.containedFine!=null)return p.containedFine;
 if(isFluid(p.shape)||!p.assay||p.assayBasis==='unknown')return null;
 return pure(p.weight,p.assay);
}
const routeValue=(value:unknown):string[]=>{
 if(value==null||value==='')return [];
 const result=Array.isArray(value)?strs(value):typeof value==='string'?value.split(/[\n,،>←]+/).map(s=>s.trim()).filter(Boolean):[];
 if(result.length>30||result.some(op=>!flowOperations.some(o=>o.id===op)))throw Error('مراحل مسیر را از فهرست عملیات انتخاب کن.');return result;
};
const getPlan=(d:Record<string,unknown>,base:FlowPlan={}):FlowPlan=>{
 const priority=txt(d,'priority',base.priority||'normal') as Priority;if(!priorityLabels[priority])throw Error('اولویت معتبر نیست.');
 return {route:d.route===undefined?copy(base.route||[]):routeValue(d.route),target:txt(d,'target',base.target||'موجودی کارخانه'),targetAssay:d.targetAssay===undefined?base.targetAssay??null:optionalNum(d,'targetAssay',1000),destination:txt(d,'destination',base.destination||'انبار'),finish:txt(d,'finish',base.finish||''),priority};
};
function configurePacket(f:FactoryData,p:Packet){
 const lot=f.lots.find(l=>l.id===p.shares[0]?.lotId);p.assayBasis??=p.assay>0?(p.final?'final':'estimated'):'unknown';p.weightBasis??='measured';
 p.route??=copy(lot?.route||[]);p.target??=lot?.target||'موجودی کارخانه';p.priority??=lot?.priority||'normal';p.destination??=lot?.destination||p.station;
 if(p.refined===undefined)p.refined=p.final&&p.assay>=995;
 if(p.dry===undefined)p.dry=p.final;
 if(p.meltedAfterRefining===undefined)p.meltedAfterRefining=p.final;
}
export function upgradeFactory(input:FactoryData):FactoryData {
 const f=copy(input);f.version=3;
 for(const lot of f.lots){lot.invoice??='';lot.supplier??='';lot.claimedKnown??=lot.claimedAssay>0;lot.route??=[];lot.priority??='normal';lot.destination??='انبار';}
 for(const p of f.packets)configurePacket(f,p);
 for(const r of f.runs){r.priority??='normal';r.inputBasis??=r.inputAssay>0?'estimated':'unknown';r.route??=[];r.destination??=r.station;}
 for(const a of f.assays)a.certainty??='estimated';
 return f;
}
export function createFlowSeed():FactoryData {
 const f=upgradeFactory(seedFactory());
 for(const l of f.lots){l.owner='';l.ownership='company';l.supplier='تأمین‌کنندهٔ نمونه';l.invoice='INV-'+l.id.slice(-4);}
 for(const p of f.packets)for(const s of [...p.shares,...p.originShares])s.owner='';
 for(const r of f.runs)for(const s of r.shares)s.owner='';
 for(const r of f.residues)for(const s of r.shares)s.owner='';
 for(const p of f.products)for(const s of p.shares)s.owner='';
 const incoming=f.lots.find(l=>l.id==='LOT-AG-0103')!;incoming.claimedKnown=false;incoming.claimedAssay=0;incoming.description='بار بازیافتی با عیار نامشخص؛ مقدار واقعی فلز پس از پالایش، خشک‌کردن، ذوب و XRF نهایی معلوم می‌شود.';incoming.route=['cut','melt','riegeh','assay','acid','filter','chloride','precipitate','wash','dry','melt','qc','pack','seal'];
 const p=f.packets.find(p=>p.id==='PKT-103-HELD')!;p.assay=0;p.assayBasis='unknown';p.route=copy(incoming.route);
 f.lots[0].description='بار شماره‌دار؛ هر بخش مسیر، اولویت و محل مستقل دارد. حساب طرف در زرین می‌ماند.';f.lots[1].description='نقرهٔ هم‌عیار؛ امکان تجمیع با حفظ شماره‌های مبدأ.';
 f.runs[0].priority='high';f.runs[0].target='گرانول 990.0';f.runs[0].route=['granulate','wash','dry','qc','pack'];
 f.packets.find(p=>p.id==='PKT-101-NEXT')!.route=['wash','dry','qc','pack','seal'];
 const addStock=(id:string,shape:string,weight:number,station:string,fine:number|null)=>{
  const lid='LOT-'+id;const now=new Date().toISOString();f.lots.push({id:lid,metal:'silver',owner:'',ownership:'company',conditional:false,isolated:false,form:shape,gross:weight,net:weight,claimedAssay:0,claimedKnown:false,invoice:'ثبت موجودی نمونه',supplier:'',description:'موجودی میانی نمونه؛ وزن ماده با فلز محتوای آن یکی نیست.',photo:'',status:'accepted',created:now,target:'موجودی کارخانه',route:[],priority:'normal'});
  const source=[{lotId:lid,owner:'',weight}];const p:Packet={id:'PKT-'+id,metal:'silver',weight,originalWeight:weight,assay:0,confirmed:false,assayBasis:fine===null?'unknown':'estimated',weightBasis:'measured',containedFine:fine,shape,station,shares:source,originShares:copy(source),parents:[],state:'available',final:false,created:now,route:[],priority:'normal'};configurePacket(f,p);f.packets.push(p);
 };
 addStock('WIP-SOLUTION','محلول',18000,'محلول',680);addStock('WIP-CHLORIDE','کلرید',2200,'کلرید',null);addStock('WIP-RD','ریژه',150,'R&D',null);
 f.events.unshift({id:uid('EV'),time:new Date().toISOString(),actor:'دادهٔ نمونه',title:'نسخهٔ ۰.۳: شمارهٔ بار و موجودی فیزیکی مبناست؛ مالکیت و حساب طرف در زرین.',refs:[],type:'flow_v3'});
 return f;
}

export type StockRow={id:string;kind:'packet'|'run'|'residue'|'recovery'|'product';lotIds:string[];metal:FMetal;shape:string;location:string;status:string;weight:number;weightBasis:'measured'|'estimated';fine:number|null;basis:AssayBasis;priority:Priority;vessel:string};
export function physicalStock(input:FactoryData):StockRow[]{
 const f=upgradeFactory(input),rows:StockRow[]=[];
 for(const p of f.packets.filter(p=>p.state==='available'&&p.weight>0))rows.push({id:p.id,kind:'packet',lotIds:ids(p.shares),metal:p.metal,shape:p.shape,location:p.station,status:p.final?'آمادهٔ محصول':'موجود',weight:p.weight,weightBasis:p.weightBasis||'measured',fine:packetFine(p),basis:p.assayBasis||'unknown',priority:p.priority||'normal',vessel:''});
 for(const r of f.runs.filter(r=>r.state==='open'))rows.push({id:r.id,kind:'run',lotIds:ids(r.shares),metal:r.metal,shape:flowOperations.find(o=>o.id===r.op)?.shape||'مادهٔ در جریان',location:r.station,status:r.pause?'متوقف با علت':({melt:'در حال ذوب',dry:'در حال خشک‌شدن',filter:'در حال فیلتر',precipitate:'در حال رسوب‌گیری'})[r.op]||'در حال انجام',weight:r.input,weightBasis:'measured',fine:r.inputFine??(r.inputAssay&&!isFluid(flowOperations.find(o=>o.id===r.op)?.shape||'')?pure(r.input,r.inputAssay):null),basis:r.inputBasis||'unknown',priority:r.priority||'normal',vessel:r.vessel});
 for(const r of f.residues.filter(r=>['queued','processing'].includes(r.state)))rows.push({id:r.id,kind:'residue',lotIds:ids(r.shares),metal:r.metal,shape:r.label,location:r.station,status:r.state==='processing'?'در حال بازیافت':'مانده / صف بازیافت',weight:r.grams,weightBasis:r.weightBasis||'measured',fine:r.containedFine??(r.assay?pure(r.grams,r.assay):null),basis:r.assay||r.containedFine!=null?'estimated':'unknown',priority:'normal',vessel:r.vessel});
 for(const r of f.recoveries.filter(r=>r.state==='done'&&!r.packetId&&r.output))rows.push({id:r.id,kind:'recovery',lotIds:ids(f.residues.filter(s=>r.sourceIds.includes(s.id)).flatMap(s=>s.shares)),metal:r.metal,shape:'فلز بازیافتی',location:'بازیافت',status:'خروجی بازیافت؛ منتظر ورود به گردش',weight:r.output!,weightBasis:'measured',fine:r.assay?pure(r.output!,r.assay):null,basis:'estimated',priority:'normal',vessel:''});
 for(const p of f.products.filter(p=>p.status==='ready'))rows.push({id:p.id,kind:'product',lotIds:ids(p.shares),metal:p.metal,shape:p.collection,location:'بسته‌بندی',status:'آمادهٔ خروج',weight:p.weight,weightBasis:'measured',fine:pure(p.weight,p.assay),basis:'final',priority:'normal',vessel:p.packaging});
 return rows;
}
export function compareLot(input:FactoryData,lotId:string){
 const f=upgradeFactory(input),lot=f.lots.find(l=>l.id===lotId);if(!lot)throw Error('بار پیدا نشد.');
 const ps=f.packets.filter(p=>p.state==='available'&&p.weight>0&&p.shares.some(s=>s.lotId===lotId));
 const runs=f.runs.filter(r=>r.state==='open'&&r.shares.some(s=>s.lotId===lotId));
 const residues=f.residues.filter(r=>r.shares.some(s=>s.lotId===lotId)&&!['returned','recovered'].includes(r.state));
 const product=f.products.filter(p=>p.shares.some(s=>s.lotId===lotId));
 const unallocated=f.recoveries.some(r=>!r.packetId&&r.output&&f.residues.some(s=>r.sourceIds.includes(s.id)&&s.shares.some(x=>x.lotId===lotId)));
 const returned=f.packets.some(p=>p.state==='returned'&&p.shares.some(s=>s.lotId===lotId))||(lot.returnedWeight||0)>0;
 const mixed=ps.some(p=>ids(p.shares).length>1)||product.some(p=>ids(p.shares).length>1)||f.packets.some(p=>p.originShares.some(s=>s.lotId===lotId)&&ids(p.originShares).length>1);
 const shareOf=(shares:Share[])=>shares.filter(s=>s.lotId===lotId).reduce((w,s)=>w+s.weight,0);
 const finalWeight=ps.filter(p=>p.final).reduce((w,p)=>w+shareOf(p.shares),0)+product.reduce((w,p)=>w+shareOf(p.shares),0);
 const finalFine=ps.filter(p=>p.final).reduce((w,p)=>w+pure(shareOf(p.shares),p.assay),0)+product.reduce((w,p)=>w+pure(shareOf(p.shares),p.assay),0);
 const unresolved=f.runs.some(r=>r.shares.some(s=>s.lotId===lotId)&&(r.differenceRemaining??r.difference??0)>1e-6);
 const exact=!unresolved&&!runs.length&&!residues.length&&!unallocated&&!returned&&!mixed&&ps.every(p=>p.final&&p.assayBasis==='final'&&p.weightBasis!=='estimated')&&(finalWeight>0);
 const initial=f.assays.find(a=>a.status==='approved'&&a.purpose==='ورودی'&&f.packets.find(p=>p.id===a.packetId)?.originShares.some(s=>s.lotId===lotId));
 const factoryAssay=exact?finalFine/lot.net*1000:initial?.result??null;
 const claimed=lot.claimedKnown&&lot.claimedAssay>0?lot.claimedAssay:null;
 const claimed9999=claimed===null?null:lot.net*claimed/999.9;
 const difference=claimed===null||factoryAssay===null?null:lot.net*(factoryAssay-claimed)/999.9;
 return {lot,packets:ps,open:runs,pending:residues,finalWeight,finalFine,factoryAssay,claimed,claimed9999,difference,exact,returned,mixed,actual9999:finalFine>0?finalFine/0.9999:null,unresolved,readyToClose:!unresolved&&!runs.length&&ps.every(p=>p.final)&&finalWeight>0};
}

const scope:Record<string,string>={receive_lot:'دریافت',decide_lot:'دریافت',submit_assay:'آزمایشگاه',approve_assay:'آزمایشگاه',create_run:'تولید',finish_run:'تولید',update_plan:'تولید',split_packet:'تولید',pause_run:'تولید',resume_run:'تولید',return_residue:'بازیافت',allocate_recovery:'بازیافت',close_lot:'تولید',pool:'تولید',resolve_difference:'تولید'};
export function applyFlowCommand(input:FactoryData,command:FCommand,actorName='مدیر سامانه'):{factory:FactoryData;message:string}{
 const f=upgradeFactory(input),d=command.data,type=command.type.replace(/^factory\//,'');if(!d||typeof d!=='object'||Array.isArray(d))throw Error('درخواست معتبر نیست.');
 const actor=f.people.find(p=>p.id===txt(d,'actorId','CEO'));if(!actor)throw Error('همکار مجاز پیدا نشد.');
 if(scope[type]&&!can(f,actor.id,scope[type]))throw Error('نقش انتخاب‌شده مجوز این عملیات را ندارد.');
 const now=new Date().toISOString();let message='ثبت شد.';
 const audit=(title:string,refs:string[]=[])=>f.events.unshift({id:uid('EV'),title,refs,time:now,type,actor:`${actor.name} · ${actorName}`});
 const getPacket=()=>{const p=f.packets.find(p=>p.id===d.packetId&&p.state==='available'&&p.weight>0);if(!p)throw Error('مادهٔ آزاد پیدا نشد.');return p;};
 const getRun=()=>{const r=f.runs.find(r=>r.id===d.runId&&r.state==='open');if(!r)throw Error('تسک باز پیدا نشد.');return r;};
 const reserve=(p:Packet,w:number)=>{if(w>p.weight+1e-6)throw Error('وزن از ماندهٔ آزاد بیشتر است.');const ratio=w/p.weight,shares=scale(p.shares,ratio);if(p.containedFine!=null)p.containedFine=r6(p.containedFine*(1-ratio));p.shares=scale(p.shares,1-ratio);p.weight=r6(p.weight-w);if(p.weight<1e-6){p.weight=0;p.state='consumed';}return shares;};
 const addPacket=(data:Omit<Packet,'id'|'state'|'created'|'originalWeight'|'originShares'>)=>{const p:Packet={...data,id:uid('PKT'),state:'available',created:now,originalWeight:data.weight,originShares:copy(data.shares)};configurePacket(f,p);f.packets.unshift(p);return p;};
 const internalLot=(weight:number,metal:FMetal,form:string,description:string,sourceLotIds:string[]=[])=>{const l:Lot={id:uid('LOT-REC'),metal,owner:'',ownership:'company',conditional:false,isolated:false,form,gross:weight,net:weight,claimedAssay:0,claimedKnown:false,supplier:'',invoice:'',description,photo:'',status:'accepted',created:now,target:'موجودی کارخانه',sourceLotIds};f.lots.unshift(l);return l;};
 switch(type){
  case 'receive_lot':{
   const metal=txt(d,'metal');if(!['silver','gold'].includes(metal))throw Error('فلز را انتخاب کن.');
   const net=num(d,'net',0.001),gross=num(d,'gross',net),known=d.claimedKnown===true||(d.claimedKnown===undefined&&Number(d.assay)>0),assay=known?num(d,'assay',0.001,1000):0;
   const invoice=req(txt(d,'invoice'),'شمارهٔ فاکتور / مرجع ورودی');
   const custom=txt(d,'lotCode');if(custom&&!/^[A-Za-z0-9_-]{3,60}$/.test(custom))throw Error('شمارهٔ بار باید ۳ تا ۶۰ حرف لاتین، عدد، خط یا زیرخط باشد.');
   if(custom&&f.lots.some(l=>l.id===custom))throw Error('شمارهٔ بار تکراری است.');
   const photo=typeof d.photo==='string'?d.photo:'';if(photo.length>350000)throw Error('عکس بیش از حد بزرگ است.');if(photo&&!( /^\/api\/photos\/[a-f0-9-]+$/.test(photo)||/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo)))throw Error('عکس معتبر انتخاب کن.');
   const plan=getPlan(d),lot:Lot={...plan,id:custom||uid(metal==='gold'?'LOT-AU':'LOT-AG'),metal:metal as FMetal,owner:'',ownership:'company',conditional:d.conditional===true,isolated:d.isolated===true,form:req(txt(d,'form'),'شکل ورودی'),gross,net,claimedAssay:assay,claimedKnown:known,invoice,supplier:txt(d,'supplier'),description:txt(d,'description'),photo,status:d.conditional===true?'conditional':'accepted',created:now,target:plan.target||'موجودی کارخانه'};
   f.lots.unshift(lot);addPacket({...plan,metal:lot.metal,weight:net,assay,confirmed:false,assayBasis:known?'estimated':'unknown',shape:lot.form,station:'انبار',shares:[{lotId:lot.id,owner:'',weight:net}],parents:[],final:false});
   audit(`ورود بار ${lot.id}؛ ${net} گرم ماده؛ عیار ${known?assay+' اعلامی':'نامشخص'}؛ مرجع ${invoice}`,[lot.id]);message='بار شماره‌دار ثبت شد؛ وزن ماده با مقدار فلز خالص تفکیک شده است.';break;
  }
  case 'decide_lot':{
   const lot=f.lots.find(l=>l.id===d.lotId&&l.status==='conditional');if(!lot)throw Error('بار شرطی پیدا نشد.');
   if(f.runs.some(r=>r.state==='open'&&r.shares.some(s=>s.lotId===lot.id)))throw Error('ابتدا تسک‌های آماده‌سازی همین بار را ببند.');
   const ps=f.packets.filter(p=>p.state==='available'&&p.shares.some(s=>s.lotId===lot.id));if(!ps.length)throw Error('مادهٔ آزاد برای تصمیم وجود ندارد.');
   const decision=txt(d,'decision'),total=ps.reduce((w,p)=>w+p.weight,0),note=req(txt(d,'note'),'شرح تصمیم');lot.decisionNote=note;
   if(decision==='return'){
    for(const p of ps)p.state='returned';const rs=f.residues.filter(r=>r.state==='queued'&&r.shares.some(s=>s.lotId===lot.id));for(const r of rs)r.state='returned';
    lot.status='returned';lot.returnedWeight=r6(total+rs.reduce((w,r)=>w+r.grams,0));lot.acceptedWeight=0;lot.decision='return';
   }else if(decision==='accept'||decision==='partial'){
    const keep=decision==='partial'?num(d,'acceptedWeight',0.001,total-0.000001):total;let remaining=keep;
    for(const p of ps){if(remaining>=p.weight-1e-6){remaining-=p.weight;continue;}if(remaining>0){const weight=p.weight-remaining,shares=reserve(p,weight);const returned=addPacket({...copy(p),weight,shares,parents:[p.id],containedFine:null,final:false});returned.state='returned';remaining=0;}else p.state='returned';}
    lot.status='accepted';lot.acceptedWeight=keep;lot.returnedWeight=r6(total-keep);lot.decision=decision==='partial'?'partial':'full';
   }else throw Error('تصمیم معتبر نیست.');
   audit(`تصمیم بار: ${decision==='return'?'مرجوعی کامل':decision==='partial'?'پذیرش جزئی':'پذیرش کامل'}؛ پذیرفته ${lot.acceptedWeight||0} گرم، مرجوع ${lot.returnedWeight||0} گرم از موجودی فعلی؛ ${note}`,[lot.id]);break;
  }
  case 'submit_assay':{
   const p=getPacket();if(isFluid(p.shape)||/مصنوع|ظروف|برش/.test(p.shape))throw Error('برای عیار فلز، نمونهٔ آمادهٔ ذوب/ریژه یا فلز خشک لازم است؛ عیار محلول از وزن کل آن نتیجه نمی‌شود.');
   const sample=req(txt(d,'sample'),'شمارهٔ نمونه');if(f.assays.some(a=>a.sample===sample))throw Error('شمارهٔ نمونه تکراری است.');
   const certainty=txt(d,'certainty','estimated');if(!['estimated','final'].includes(certainty))throw Error('قطعیت نتیجه معتبر نیست.');
   const personId=req(txt(d,'personId'),'عیارسنج');if(!f.people.some(p=>p.id===personId&&p.active))throw Error('همکار فعال را انتخاب کن.');
   if(certainty==='final'){
    if(d.weighed!==true)throw Error('وزن‌کشی واقعی فلز خشک را تأیید کن.');
    if(p.shares.some(s=>{const l=f.lots.find(l=>l.id===s.lotId);return l&&isRecycled(l);})&&!(p.refined&&p.dry&&p.meltedAfterRefining))throw Error('بار بازیافتی/عیار نامشخص پیش از ثبت پالایش، خشک‌کردن و ذوب پس از آن، نتیجهٔ نهایی نمی‌گیرد.');
   }
   f.assays.unshift({id:uid('LAB'),packetId:p.id,sample,purpose:txt(d,'purpose','ورودی'),method:req(txt(d,'method'),'روش آزمون'),result:num(d,'result',0.001,1000),personId,status:'pending',certainty:certainty as 'estimated'|'final',weighed:d.weighed===true,created:now});audit(`ثبت نمونه ${sample}؛ نتیجهٔ ${certainty==='final'?'نهاییِ در انتظار تأیید':'تقریبیِ در انتظار تأیید'}`,[p.id,...ids(p.shares)]);break;
  }
  case 'approve_assay':{
   const a=f.assays.find(a=>a.id===d.assayId&&a.status==='pending');if(!a)throw Error('نتیجهٔ در انتظار پیدا نشد.');const p=f.packets.find(p=>p.id===a.packetId&&p.state==='available'&&p.weight>0);if(!p)throw Error('مادهٔ نمونه اکنون آزاد نیست.');
   const prior=f.assays.find(x=>x.packetId===p.id&&x.status==='approved');if(prior){prior.status='superseded';a.supersedes=prior.id;}a.status='approved';a.approved=now;p.assay=a.result;p.confirmed=true;p.assayBasis=a.certainty==='final'?'final':'estimated';p.containedFine=null;
   audit(`تأیید نمونه ${a.sample}؛ عیار ${a.result} (${basisLabel(p.assayBasis)})؛ تأیید نتیجهٔ میانی به معنی مقدار نهایی کل بار نیست`,[p.id,...ids(p.shares)]);break;
  }
  case 'update_plan':{
   const p=getPacket(),note=req(txt(d,'note'),'علت تغییر مسیر');const before=p.route?.join(' ← ')||'بدون مسیر';Object.assign(p,getPlan(d,p));p.final=false;
   audit(`تغییر برنامهٔ ${p.id}: ${before} به ${(p.route||[]).join(' ← ')}؛ مقصد ${p.destination}؛ اولویت ${priorityLabels[p.priority||'normal']}؛ ${note}`,[p.id,...ids(p.shares)]);break;
  }
  case 'split_packet':{
   const p=getPacket(),weight=num(d,'weight',0.001,p.weight-0.000001),fine=packetFine(p),ratio=weight/p.weight;const plan=getPlan(d,p),shares=reserve(p,weight);
   const next=addPacket({...copy(p),...plan,weight,shares,parents:[p.id],containedFine:fine===null?null:r6(fine*ratio),final:p.final});
   audit(`تفکیک ${weight} گرم برای مسیر مستقل ${next.id}؛ باقی ماده در ${p.id} محفوظ است؛ ${req(txt(d,'note'),'شرح تفکیک')}`,[p.id,next.id,...ids(shares)]);break;
  }
  case 'create_run':{
   const p=getPacket(),op=flowOperations.find(o=>o.id===d.op);if(!op)throw Error('عملیات معتبر نیست.');const lids=ids(p.shares);
   if(lids.some(lid=>['returned','complete'].includes(f.lots.find(l=>l.id===lid)?.status||'')))throw Error('بار مرجوع یا بسته قابل پردازش نیست.');
   const prepare=['weigh','cut','melt','riegeh','assay','transfer','research'];
   if(lids.some(lid=>f.lots.find(l=>l.id===lid)?.status==='conditional')&&!prepare.includes(op.id))throw Error('دربارهٔ پذیرش بار تصمیم بگیر؛ پذیرش عیار نامشخص هم با ثبت شرح ممکن است.');
   if(['alloy','granulate','cast','roll','blank','mint','qc'].includes(op.id)&&!p.confirmed)throw Error('برای این عملیات عیارسنجی و تأیید نمونه لازم است؛ پالایش بار نامشخص مسدود نیست.');
   if(op.id==='qc'&&(p.assayBasis!=='final'||isFluid(p.shape)))throw Error('QC نهایی به عیار نهاییِ تأییدشدهٔ فلز نیاز دارد.');
   if(op.id==='qc'&&p.metal==='gold'&&/ساچمه|گرانول/.test(p.shape))throw Error('ساچمهٔ طلا محصول نهایی نیست.');
   const weight=num(d,'weight',0.001,p.weight),vessel=req(txt(d,'vessel'),'ظرف / دستگاه'),plan=getPlan(d,p),expected=p.route?.[0];
   if(expected&&op.id!==expected&&!txt(d,'note'))throw Error('علت انتخاب مرحله‌ای متفاوت از برنامه را بنویس.');
   if(p.route?.[0]===op.id&&d.route===undefined)plan.route=p.route.slice(1);
   const isolated=lids.some(lid=>f.lots.find(l=>l.id===lid)?.isolated);if(isolated&&(lids.length!==1||f.runs.some(r=>r.vessel===vessel&&r.shares.some(s=>!lids.includes(s.lotId)))))throw Error('ظرف و گردش بار مستقل با بار دیگر مشترک نمی‌شود.');
   const fine=packetFine(p),ratio=weight/p.weight,shares=reserve(p,weight);
   const r:Run={...plan,id:uid('RUN'),op:op.id,station:op.id==='transfer'?p.station:op.station,packetId:p.id,metal:p.metal,input:weight,inputAssay:p.assay,inputConfirmed:p.confirmed,inputFine:fine===null?null:r6(fine*ratio),inputBasis:p.assayBasis,shares,vessel,note:txt(d,'note'),state:'open',sessions:[],created:now};f.runs.unshift(r);
   audit(`تسک ${op.name}؛ ${weight} گرم؛ اولویت ${priorityLabels[r.priority||'normal']}؛ مسیر بعدی ${(r.route||[]).join(' ← ')||'تعیین‌پذیر'}`,[r.id,p.id,...lids]);message='فقط مقدار این تسک تخصیص یافت؛ بقیهٔ بار آزاد و مسیرش مستقل ماند.';break;
  }
  case 'pause_run':{const r=getRun();if(r.pause)throw Error('این تسک قبلاً متوقف شده.');r.pause={reason:req(txt(d,'note'),'علت توقف'),time:now,person:actor.name};audit(`توقف تسک: ${r.pause.reason}`,[r.id,...ids(r.shares)]);break;}
  case 'resume_run':{const r=getRun();if(!r.pause)throw Error('تسک متوقف نیست.');const old=r.pause.reason;delete r.pause;audit(`ادامهٔ تسک پس از توقف ${old}؛ ${req(txt(d,'note'),'شرح ادامه‌کار')}`,[r.id,...ids(r.shares)]);break;}
  case 'finish_run':{
   const r=getRun();if(r.pause)throw Error('ابتدا ادامه‌کارِ تسک متوقف را ثبت کن.');if(r.sessions.some(s=>!s.end))throw Error('پایان کار افراد همین تسک را ثبت کن.');const source=f.packets.find(p=>p.id===r.packetId)!;
   const op=flowOperations.find(o=>o.id===r.op)!,output=num(d,'output',0.001),scrap=num(d,'residue',0),otherOut=d.otherOut==null||d.otherOut===''?0:num(d,'otherOut',0),shape=req(txt(d,'shape',op.shape||source.shape),'شکل خروجی');
   const added=f.consumption.filter(c=>c.runId===r.id&&c.kind==='consume').reduce((w,c)=>w+c.grams,0),difference=r6(r.input+added-output-scrap-otherOut);
   if(difference< -1e-6)throw Error('خروجی، مانده و خروج جانبی از ورودی و افزودنی‌های ثبت‌شده بیشتر است.');
   const differenceNote=txt(d,'differenceNote');if((difference>0||otherOut>0)&&!differenceNote)throw Error('علت اختلاف جرمی یا خروج جانبی را ثبت کن؛ ماندهٔ نامعلوم افت قطعی نیست.');
   const accountablePerson=difference>0?req(txt(d,'accountablePerson'),'مسئول پیگیری اختلاف'):txt(d,'accountablePerson');
   const liquid=isFluid(shape);const mechanical=['weigh','cut','melt','riegeh','cast','granulate','roll','blank','mint','polish','pack','seal','transfer'].includes(r.op);
   const assay=liquid?0:d.assay==null||d.assay===''?r.inputAssay:num(d,'assay',0,1000);
   if(mechanical&&r.inputConfirmed&&assay!==r.inputAssay)throw Error('عیار مرحلهٔ مکانیکی از ورودی منتقل می‌شود؛ تغییر عیار را با نمونهٔ جدید ثبت کن.');
   const quality=txt(d,'quality','pass'),pass=r.op==='qc'&&quality==='pass';if(pass&&r.inputBasis!=='final')throw Error('پیش از QC نهایی، نتیجهٔ عیار نهایی لازم است.');
   const basis:AssayBasis=assay>0?(mechanical||r.op==='qc'?r.inputBasis||'estimated':'estimated'):'unknown';
   const inputFine=r.inputFine??null;let containedFine=optionalNum(d,'containedFine');if(liquid&&containedFine!==null&&containedFine>output)throw Error('فلز محتوای ماده از وزن کل آن بیشتر نمی‌شود.');
   if(!liquid)containedFine=null;
   if(containedFine!==null&&inputFine!==null&&r.inputBasis==='final'&&containedFine>inputFine+1e-6)throw Error('برآورد فلز خروجی از فلز ورودیِ نهایی بیشتر است؛ ورودی و افزودنی‌ها را بررسی کن.');
   const refined=source.refined||['precipitate','electro'].includes(r.op),dry=(r.op==='dry')||(source.dry&&!['acid','wash','filter','chloride','precipitate'].includes(r.op)),melted=!!refined&&!!dry&&(r.op==='melt'||!!source.meltedAfterRefining);
   const final=pass||(['pack','seal','transfer'].includes(r.op)&&source.final);
   const station=r.op==='transfer'?req(txt(d,'destination',r.destination),'مقصد انتقال'):({dry:'خشک‌کن',polish:'پوست و پرداخت',chloride:'کلرید',precipitate:'رسوب',filter:'فیلتر',acid:'محلول'})[r.op]||op.station;
   const shares=scale(r.shares,output/r.input),p=addPacket({...getPlan({},r),metal:r.metal,weight:output,assay,confirmed:assay>0&&r.inputConfirmed&&(mechanical||pass),assayBasis:liquid?(containedFine===null?'unknown':'estimated'):basis,containedFine,shape,station,shares,parents:[r.packetId],final,refined:!!refined,dry:!!dry,meltedAfterRefining:melted,weightBasis:d.weightBasis==='estimated'?'estimated':'measured'});
   r.state='done';r.ended=now;r.output=output;r.outputAssay=assay;r.outputId=p.id;r.outputBasis=p.assayBasis;r.otherOut=otherOut;r.difference=difference;r.differenceRemaining=difference;r.differenceNote=differenceNote;r.accountablePerson=accountablePerson;r.quality=quality;
   if(scrap>0){const residue:Residue={id:uid('REC'),created:now,state:'queued',sourceType:'station',sourceId:r.vessel,label:`ماندهٔ ${op.name}`,station:req(txt(d,'residueLocation'),'محل مانده'),vessel:req(txt(d,'residueVessel'),'ظرف مانده'),metal:r.metal,grams:scrap,originalGrams:scrap,assay:null,shares:scale(r.shares,scrap/r.input),runId:r.id,weightBasis:d.residueBasis==='estimated'?'estimated':'measured'};f.residues.unshift(residue);r.residueId=residue.id;}
   audit(`بستن تسک ${op.name}؛ خروجی ${output} گرم ماده، مانده ${scrap} گرم، خروج جانبی ${otherOut} گرم؛ اختلاف جرمی ${difference} گرم برای بررسی (${differenceNote||'بدون اختلاف'})؛ افت فلز خالص خودکار اعلام نشد`,[r.id,p.id,...ids(r.shares)]);message='تسک بسته و خروجی برای مسیر بعدی یا موجودی آزاد شد.';break;
  }
  case 'resolve_difference':{
   const r=f.runs.find(r=>r.id===d.runId&&r.state==='done'&&(r.differenceRemaining??r.difference??0)>0);if(!r)throw Error('اختلاف جرمیِ باز پیدا نشد.');
   const remaining=r.differenceRemaining??r.difference??0,grams=num(d,'grams',0.000001,remaining),kind=txt(d,'disposition'),note=req(txt(d,'note'),'شرح تعیین تکلیف');
   if(!['found','nonmetal','confirmed'].includes(kind))throw Error('نوع تعیین تکلیف معتبر نیست.');
   if(kind==='found'){
    const res:Residue={id:uid('REC'),created:now,state:'queued',sourceType:'station',sourceId:r.vessel,label:'ماندهٔ پیدا‌شده از اختلاف تسک',station:req(txt(d,'station'),'محل کشف'),vessel:req(txt(d,'vessel'),'ظرف مانده'),metal:r.metal,grams,originalGrams:grams,assay:null,shares:scale(r.shares,grams/r.input),runId:r.id};f.residues.unshift(res);
   }
   r.differenceRemaining=r6(remaining-grams);r.differenceResolution=(r.differenceResolution||'')+`\n${grams} گرم: ${kind==='found'?'مانده پیدا و در ظرف ثبت شد':kind==='nonmetal'?'خروج مادهٔ غیرفلزی با تأیید اپراتور':'کسر جرمی تأییدشدهٔ اپراتور'}؛ ${note}`;
   audit(`تعیین تکلیف اختلاف ${r.id}؛ ${grams} گرم ماده؛ ${note}؛ ماندهٔ بررسی ${r.differenceRemaining} گرم. مقدار فلز خالص بدون عیارِ مستقل تعیین نمی‌شود.`,[r.id,...ids(r.shares)]);break;
  }
  case 'pool':{
   const pids=strs(d.packetIds);if(new Set(pids).size!==pids.length||pids.length<2)throw Error('حداقل دو مادهٔ متفاوت انتخاب کن.');const ps=pids.map(pid=>f.packets.find(p=>p.id===pid&&p.state==='available'&&p.weight>0));if(ps.some(p=>!p))throw Error('ماده‌ای دیگر آزاد نیست.');const packets=ps as Packet[],p=packets[0];
   if(p.metal!=='silver'||packets.some(x=>x.metal!==p.metal||!x.confirmed||x.assay!==p.assay||x.shape!==p.shape||x.station!==p.station||x.assayBasis!==p.assayBasis||isFluid(x.shape)))throw Error('تجمیع فقط برای نقرهٔ فلزیِ تأییدشده با عیار، قطعیت، شکل و محل یکسان است.');
   if(packets.some(p=>p.shares.some(s=>{const l=f.lots.find(l=>l.id===s.lotId);return l?.isolated||l?.status!=='accepted';})))throw Error('بار شرطی یا گردش مستقل تجمیع نمی‌شود.');
   const weight=packets.reduce((w,p)=>w+p.weight,0),shares=packets.flatMap(x=>reserve(x,x.weight));const next=addPacket({...copy(p),weight,shares,parents:pids,final:false,containedFine:null});audit('تجمیع فیزیکی نقرهٔ هم‌عیار؛ تمام شماره‌های مبدأ محفوظ‌اند؛ حساب مالکیت محاسبه نمی‌شود',[next.id,...ids(shares)]);break;
  }
  case 'return_residue':{
   const rec=f.residues.find(r=>r.id===d.residueId&&r.state==='queued'&&r.grams>0);if(!rec)throw Error('ماندهٔ آزاد پیدا نشد.');const weight=num(d,'weight',0.001,rec.grams),ratio=weight/rec.grams;
   const sourceShares=rec.shares.length?scale(rec.shares,weight/rec.shares.reduce((w,s)=>w+s.weight,0)):[];let shares=sourceShares;
   if(!shares.length){const l=internalLot(weight,rec.metal,txt(d,'shape','ماندهٔ برگشتی'),`برگشت جزئی از ${rec.sourceId}`);shares=[{lotId:l.id,owner:'',weight}];}
   const assay=d.assay==null||d.assay===''?0:num(d,'assay',0,1000),p=addPacket({...getPlan(d),metal:rec.metal,weight,assay,confirmed:false,assayBasis:assay?'estimated':'unknown',shape:req(txt(d,'shape'),'شکل برگشتی'),station:req(txt(d,'destination'),'محل برگشت'),shares,parents:[rec.id],final:false});
   rec.originalGrams??=rec.grams;rec.grams=r6(rec.grams-weight);if(rec.containedFine!=null)rec.containedFine=r6(rec.containedFine*(1-ratio));if(!rec.grams)rec.state='returned';
   audit(`برگشت ${weight} گرم از ${rec.id} به ${p.station}؛ ${rec.grams} گرم در ظرف مانده باقی است؛ ${req(txt(d,'note'),'شرح برگشت')}`,[rec.id,p.id,...ids(shares)]);break;
  }
  case 'allocate_recovery':{
   const job=f.recoveries.find(j=>j.id===d.recoveryId&&j.state==='done'&&!j.packetId&&j.output);if(!job)throw Error('خروجی بازیافت آماده پیدا نشد.');
   const sources=f.residues.filter(r=>job.sourceIds.includes(r.id)),lids=ids(sources.flatMap(s=>s.shares));
   // A group gets a new physical identity. No fictitious division of measured yield.
   const lot=internalLot(job.output!,job.metal,'فلز بازیافتی',`خروجی گروه ${job.id}؛ منابع ${sources.map(s=>s.sourceId).join(' + ')}`,lids);
   const p=addPacket({...getPlan(d),metal:job.metal,weight:job.output!,assay:job.assay||0,confirmed:false,assayBasis:job.assay?'estimated':'unknown',shape:'آب‌شده',station:'آزمایشگاه',shares:[{lotId:lot.id,owner:'',weight:job.output!}],parents:[job.id],final:false});job.packetId=p.id;job.allocation='خروجی با شمارهٔ جدید به موجودی فیزیکی برگشت؛ بازده گروه به منابع جداگانه تقسیم نشد.';audit(job.allocation,[job.id,p.id,lot.id,...lids]);break;
  }
  case 'close_lot':{
   const s=compareLot(f,req(txt(d,'lotId'),'بار'));if(s.lot.status!=='accepted'||!s.readyToClose)throw Error('تسک یا مادهٔ تمام‌نشده باقی است؛ مسیر یا علت توقف را تعیین کن.');s.lot.status='complete';audit(`تکمیل گردش بار؛ خروجی ${s.finalWeight} گرم؛ ${s.exact?'مقدار فلز نهایی قابل محاسبه است':'مانده/برآورد/اختلاط مانع اعلام افت قطعی است'}`,[s.lot.id]);break;
  }
  default:{
   if(type==='start_work'&&f.runs.find(r=>r.id===d.runId)?.pause)throw Error('برای تسک متوقف ابتدا ادامه‌کار ثبت کن.');
   const result=applyFactoryCommand(f,command,actorName);result.factory.version=3;
   // Legacy records stay readable; source links remain, owner-account wording is removed.
   for(const e of result.factory.events.slice(0,2))e.title=e.title.replaceAll('انتساب مالکیتی نیازمند ثبت جداگانه است.','برگشت به موجودی با شمارهٔ جدید جدا ثبت می‌شود.').replaceAll('سهم مالکیت','ردپای مبدأ');
   result.message=result.message.replaceAll('سهم فردی منابع یا مالک‌ها','بازده تک‌تک منابع');
   return result;
  }
 }
 return {factory:f,message};
}
