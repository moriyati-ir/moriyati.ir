export type FMetal = 'silver' | 'gold';
export type Share = { lotId: string; owner: string; weight: number };
export type Lot = { id: string; metal: FMetal; owner: string; ownership: 'company' | 'customer'; conditional: boolean; isolated: boolean; form: string; gross: number; net: number; claimedAssay: number; description: string; photo: string; status: 'conditional' | 'accepted' | 'returned' | 'complete'; created: string; target: string; decisionNote?: string; returnedWeight?: number };
export type Packet = { id: string; metal: FMetal; weight: number; originalWeight: number; assay: number; confirmed: boolean; shape: string; station: string; shares: Share[]; originShares: Share[]; parents: string[]; state: 'available' | 'consumed' | 'returned'; final: boolean; created: string };
export type FSession = { id: string; personId: string; role: string; start: string; end?: string };
export type Run = { id: string; op: string; station: string; packetId: string; metal: FMetal; input: number; inputAssay: number; inputConfirmed: boolean; shares: Share[]; vessel: string; note: string; state: 'open' | 'done'; sessions: FSession[]; created: string; ended?: string; output?: number; outputAssay?: number; outputId?: string; residueId?: string; quality?: string };
export type Assay = { id: string; packetId: string; sample: string; purpose: string; method: string; result: number; personId: string; status: 'pending' | 'approved' | 'superseded'; created: string; approved?: string; supersedes?: string };
export type FMaterial = { id: string; name: string; category: string; grams: number; minimum: number };
export type FConsumption = { id: string; materialId: string; runId: string; grams: number; kind: 'consume' | 'receipt' | 'adjust'; note: string; time: string };
export type FAsset = { id: string; name: string; purpose: string; serial: string; heat: boolean; station: string; baselineCycles: number; baselineGrams: number; state: 'active' | 'retired'; created: string; retired?: string; reason?: string; replaces?: string };
export type Solution = { id: string; vessel: string; label: string; assay: number; opened: string; closed?: string; state: 'active' | 'replaced'; baselineCycles: number; baselineGrams: number };
export type Cycle = { id: string; runId: string; assetId: string; solutionId: string; grams: number; personId: string; reason: string; time: string };
export type Residue = { id: string; sourceType: 'station' | 'asset' | 'solution'; sourceId: string; label: string; station: string; vessel: string; metal: FMetal; grams: number; assay: number | null; shares: Share[]; runId: string; state: 'queued' | 'processing' | 'recovered' | 'returned'; created: string; recoveryId?: string };
export type Recovery = { id: string; sourceIds: string[]; metal: FMetal; state: 'open' | 'done'; created: string; ended?: string; output?: number; assay?: number; note: string; allocation: string; packetId?: string; allocations?: Share[] };
export type FProduct = { id: string; serial: string; packaging: string; tag: string; collection: string; metal: FMetal; weight: number; assay: number; packetId: string; shares: Share[]; front: string; back: string; created: string; status: 'ready' | 'delivered'; deliveryNote?: string };
export type Person = { id: string; name: string; role: string; departments: string[]; permissions: string[]; level: 'super' | 'chair' | 'staff'; active: boolean };
export type Attendance = { id: string; personId: string; start: string; end?: string };
export type Trip = { id: string; personId: string; destination: string; purpose: string; start: string; end?: string; report?: string };
export type InternalRequest = { id: string; department: string; title: string; description: string; personId: string; status: 'open' | 'doing' | 'done'; created: string };
export type FEvent = { id: string; time: string; actor: string; title: string; refs: string[]; type: string };
export type FactoryData = { version: 2; lots: Lot[]; packets: Packet[]; runs: Run[]; assays: Assay[]; materials: FMaterial[]; consumption: FConsumption[]; assets: FAsset[]; solutions: Solution[]; cycles: Cycle[]; residues: Residue[]; recoveries: Recovery[]; products: FProduct[]; people: Person[]; attendance: Attendance[]; trips: Trip[]; requests: InternalRequest[]; events: FEvent[]; settings: { accent: string; background: string; font: string; maxUsers: number } };
export type FCommand = { type: string; data: Record<string, unknown> };
export const departments = ['انبار', 'آزمایشگاه', 'ذوب', 'اسیدکاری', 'ضرابخانه', 'بسته‌بندی', 'آشپزخانه و کافه', 'استراحت و بازی', 'رختکن', 'آهنگری'];
export const operations = [
 {id:'cut',name:'کات / گیوتین / آماده‌سازی',station:'ذوب',shape:'برش‌خورده'},
 {id:'melt',name:'ذوب اولیه / ذوب مجدد',station:'ذوب',shape:'آب‌شده'},
 {id:'riegeh',name:'ریژه و آماده‌سازی نمونه',station:'ذوب',shape:'ریژه'},
 {id:'flake',name:'پرک‌سازی',station:'ذوب',shape:'پرک'},
 {id:'acid',name:'اسیدکاری',station:'اسیدکاری',shape:'محلول'},
 {id:'filter',name:'فیلتر',station:'اسیدکاری',shape:'محلول فیلترشده'},
 {id:'precipitate',name:'رسوب‌گیری',station:'اسیدکاری',shape:'رسوب'},
 {id:'dry',name:'خشک‌کردن',station:'اسیدکاری',shape:'پودر خشک'},
 {id:'electro',name:'پالایش الکترولیتی',station:'اسیدکاری',shape:'نقره پالایش‌شده'},
 {id:'alloy',name:'مس‌گذاری / تنظیم عیار',station:'ذوب',shape:'آلیاژ'},
 {id:'granulate',name:'گرانول‌سازی',station:'ذوب',shape:'ساچمه'},
 {id:'cast',name:'شمش کست',station:'ذوب',shape:'شمش کست'},
 {id:'roll',name:'نورد',station:'ضرابخانه',shape:'ورق'},
 {id:'blank',name:'پولک‌زنی',station:'ضرابخانه',shape:'پولک'},
 {id:'mint',name:'ضرب / مینت',station:'ضرابخانه',shape:'شمش ضربی'},
 {id:'polish',name:'پوست و پرداخت',station:'ضرابخانه',shape:'پرداخت‌شده'},
 {id:'qc',name:'کنترل کیفیت محصول نهایی',station:'آزمایشگاه',shape:'محصول تأییدشده'},
 {id:'pack',name:'بسته‌بندی',station:'بسته‌بندی',shape:'بسته‌بندی‌شده'},
];
export const residualLocations = ['گرانول', 'کیسه سانتر', 'پوست و پرداخت', 'شیره بوته', 'میز ریژه', 'فیلتر', 'ریزش اسیدکاری'];
export const permissions = ['دریافت', 'تولید', 'آزمایشگاه', 'انبار', 'ابزار', 'محلول', 'بازیافت', 'محصول', 'حضور', 'بازار', 'درخواست', 'گزارش', 'تنظیمات'];
const id = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
const round = (n:number)=>Math.round(n*1e6)/1e6;
export const pure = (w:number,a:number)=>w*a/1000;
const text = (d:Record<string,unknown>,k:string,def='')=>{const v=d[k]??def;if(typeof v!=='string'||v.length>2000)throw Error('متن واردشده معتبر نیست.');return v.trim();};
const need = (v:string,label:string)=>{if(!v)throw Error(`${label} را وارد کن.`);return v;};
const number = (d:Record<string,unknown>,k:string,min=0,max=1e12)=>{const v=d[k];if(v===''||v==null||typeof v==='boolean'||!['number','string'].includes(typeof v))throw Error('مقدار عددی لازم را وارد کن.');const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw Error(`مقدار ${k} خارج از محدوده است.`);return n;};
const list = (d:Record<string,unknown>,k:string)=>{const v=d[k];if(!Array.isArray(v)||v.some(x=>typeof x!=='string'))throw Error('فهرست انتخاب معتبر نیست.');return [...new Set(v as string[])];};
const scale = (shares:Share[],factor:number)=>shares.map(s=>({...s,weight:round(s.weight*factor)}));
const lotIds = (shares:Share[])=>[...new Set(shares.map(s=>s.lotId))];
const shapesForAssay = ['ریژه','آب‌شده','شمش کست','شمش ضربی','شمش','نقره پالایش‌شده','محصول تأییدشده','گرانول','ساچمه','آلیاژ','پودر خشک','پرداخت‌شده','بسته‌بندی‌شده'];
const clone = <T>(v:T):T=>structuredClone(v);
const photoValue=(d:Record<string,unknown>,key:string)=>{const v=d[key]??'';if(typeof v!=='string'||v.length>350000||v&&!( /^\/api\/photos\/[a-f0-9-]+$/.test(v)||/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v)))throw Error('عکس معتبر انتخاب کن.');return v;};

export function seedFactory(): FactoryData {
 const now=Date.now(),at=(h:number)=>new Date(now-h*3600000).toISOString();
 const own=(lotId:string,owner:string,weight:number):Share[]=>[{lotId,owner,weight}];
 const packet=(pid:string,lid:string,owner:string,weight:number,assay:number,shape:string,station:string,final=false):Packet=>({id:pid,metal:'silver',weight,originalWeight:weight,assay,confirmed:true,shape,station,shares:own(lid,owner,weight),originShares:own(lid,owner,weight),parents:[],state:'available',final,created:at(12)});
 return {version:2,
  lots:[
   {id:'LOT-AG-0101',metal:'silver',owner:'مالک نمونه الف',ownership:'customer',conditional:false,isolated:false,form:'آب‌شده',gross:12100,net:12000,claimedAssay:990,description:'بار نمونه؛ ۳۰۰۰ گرم به مرحلهٔ بعد رفته و بقیه بار هنوز بالادست است.',photo:'',status:'accepted',created:at(24),target:'گرانول 990.0'},
   {id:'LOT-AG-0102',metal:'silver',owner:'مالک نمونه ب',ownership:'customer',conditional:false,isolated:false,form:'آب‌شده',gross:6050,net:6000,claimedAssay:990,description:'هم‌عیار با بار الف؛ تجمیع با حفظ سهم مالک امکان‌پذیر است.',photo:'',status:'accepted',created:at(20),target:'گرانول 990.0'},
   {id:'LOT-AG-0103',metal:'silver',owner:'مالک نمونه ج',ownership:'customer',conditional:true,isolated:true,form:'مصنوعات / ظروف',gross:8240,net:8000,claimedAssay:850,description:'اسیدکاری شرطی؛ ظرف‌ها، بچ‌ها، مانده و بازیافت کاملاً مستقل.',photo:'',status:'conditional',created:at(3),target:'پالایش مستقل'},
   {id:'LOT-AG-0100',metal:'silver',owner:'موجودی موریاتی',ownership:'company',conditional:false,isolated:false,form:'ساچمه',gross:5050,net:5000,claimedAssay:999.9,description:'بار کامل‌شدهٔ نمونه برای شناسنامه و تراز.',photo:'',status:'complete',created:at(72),target:'گرانول 999.9'},
  ],
  packets:[
   packet('PKT-101-RAW','LOT-AG-0101','مالک نمونه الف',6000,990,'آب‌شده','ذوب'),
   packet('PKT-101-NEXT','LOT-AG-0101','مالک نمونه الف',2999,990,'ساچمه','ذوب'),
   packet('PKT-102-RAW','LOT-AG-0102','مالک نمونه ب',6000,990,'آب‌شده','ذوب'),
   {...packet('PKT-103-HELD','LOT-AG-0103','مالک نمونه ج',8000,850,'مصنوعات / ظروف','انبار'),confirmed:false},
   packet('PKT-100-FINAL','LOT-AG-0100','موجودی موریاتی',3998,999.9,'ساچمه','بسته‌بندی',true),
  ],
  runs:[
   {id:'RUN-AG-0007',op:'melt',station:'ذوب',packetId:'PKT-101-RAW',metal:'silver',input:3000,inputAssay:990,inputConfirmed:true,shares:own('LOT-AG-0101','مالک نمونه الف',3000),vessel:'CR-MELT-005',note:'۳ کیلوگرم از بار، مستقل از بقیهٔ بار در حال ذوب است.',state:'open',sessions:[{id:'WORK-01',personId:'OP-MELT',role:'اپراتور ذوب',start:at(1.5)}],created:at(2)},
   {id:'RUN-AG-0006',op:'granulate',station:'ذوب',packetId:'PKT-101-SOURCE',metal:'silver',input:3000,inputAssay:990,inputConfirmed:true,shares:own('LOT-AG-0101','مالک نمونه الف',3000),vessel:'CR-GRAN-001',note:'این خروجی می‌تواند جلو برود؛ بقیهٔ بار هنوز کامل نشده است.',state:'done',sessions:[{id:'WORK-02',personId:'OP-MELT',role:'اپراتور گرانول',start:at(5),end:at(4)}],created:at(6),ended:at(4),output:2999,outputAssay:990,outputId:'PKT-101-NEXT',residueId:'REC-GRAN-001'},
  ],
  assays:[{id:'LAB-100',packetId:'PKT-100-FINAL',sample:'SMP-100',purpose:'کنترل کیفیت',method:'روش آزمایشگاه · نمونه',result:999.9,personId:'OP-LAB',status:'approved',created:at(45),approved:at(44)}],
  materials:[{id:'CHEM-HNO3',name:'محلول اسید نیتریک ۵۵٪',category:'محلول مصرفی',grams:120000,minimum:150000},{id:'CHEM-POWDER',name:'پودر مصرفی اسیدکاری · نمونه',category:'پودر مصرفی',grams:12000,minimum:5000},{id:'CHEM-WATER',name:'آب دیونیزه',category:'محلول مصرفی',grams:850000,minimum:200000},{id:'MAT-CU',name:'مس برای تنظیم عیار',category:'مواد آلیاژ',grams:25000,minimum:5000}],
  consumption:[],
  assets:[
   {id:'TOOL-01',name:'بوته ذوب ۵ کیلویی',purpose:'ذوب ۵ کیلویی',serial:'CR-MELT-005',heat:true,station:'ذوب',baselineCycles:18,baselineGrams:246000,state:'active',created:at(500)},
   {id:'TOOL-02',name:'بوته گرانول 990.0',purpose:'گرانول',serial:'CR-GRAN-001',heat:true,station:'ذوب',baselineCycles:8,baselineGrams:24000,state:'active',created:at(300)},
   {id:'TOOL-03',name:'بوته شمش',purpose:'شمش کست',serial:'CR-CAST-001',heat:true,station:'ذوب',baselineCycles:12,baselineGrams:72000,state:'active',created:at(400)},
   {id:'TOOL-04',name:'ترازوی آزمایشگاه',purpose:'تجهیزات',serial:'RFID-DEMO-LAB-01',heat:false,station:'آزمایشگاه',baselineCycles:0,baselineGrams:0,state:'active',created:at(500)},
   {id:'TOOL-05',name:'بوته نو برای افزایش ظرفیت',purpose:'ذوب ۵ کیلویی',serial:'CR-MELT-006',heat:true,station:'ذوب',baselineCycles:0,baselineGrams:0,state:'active',created:at(5)},
  ],
  solutions:[{id:'SOL-990-01',vessel:'TANK-GRAN-990',label:'محلول گرانول 990.0',assay:990,opened:at(120),state:'active',baselineCycles:12,baselineGrams:36000},{id:'SOL-9999-01',vessel:'TANK-GRAN-9999',label:'محلول گرانول 999.9',assay:999.9,opened:at(96),state:'active',baselineCycles:8,baselineGrams:24000}],
  cycles:[{id:'CYCLE-01',runId:'RUN-AG-0007',assetId:'TOOL-01',solutionId:'',grams:3000,personId:'OP-MELT',reason:'ذوب اول',time:at(1.4)},{id:'CYCLE-02',runId:'RUN-AG-0007',assetId:'TOOL-01',solutionId:'',grams:3000,personId:'OP-MELT',reason:'ذوب مجدد برای اصلاح',time:at(1)},{id:'CYCLE-03',runId:'RUN-AG-0006',assetId:'TOOL-02',solutionId:'SOL-990-01',grams:3000,personId:'OP-MELT',reason:'گرانول‌سازی',time:at(4.5)}],
  residues:[
   {id:'REC-GRAN-001',sourceType:'station',sourceId:'GRAN-990',label:'ماندهٔ گرانول',station:'گرانول',vessel:'BIN-GRAN-990',metal:'silver',grams:1,assay:null,shares:own('LOT-AG-0101','مالک نمونه الف',1),runId:'RUN-AG-0006',state:'queued',created:at(4)},
   {id:'REC-CR-000',sourceType:'asset',sourceId:'CR-OLD-000',label:'بوته خارج از چرخه · نمونه',station:'شیره بوته',vessel:'REC-BOX-01',metal:'silver',grams:850,assay:null,shares:[],runId:'',state:'queued',created:at(24)},
   {id:'REC-TABLE-01',sourceType:'station',sourceId:'RIEGEH-TABLE-01',label:'ماندهٔ میز ریژه · نمونه',station:'میز ریژه',vessel:'REC-BOX-02',metal:'silver',grams:42,assay:null,shares:[],runId:'',state:'queued',created:at(15)},
  ],recoveries:[],
  products:[{id:'PRODUCT-100',serial:'MOR-AG-000100',packaging:'PACK-000100',tag:'NFC-DEMO-100',collection:'Argentum',metal:'silver',weight:1000,assay:999.9,packetId:'PKT-100-FINAL',shares:own('LOT-AG-0100','موجودی موریاتی',1000),front:'',back:'',created:at(23),status:'ready'}],
  people:[
   {id:'CEO',name:'علیرضا',role:'مدیرعامل / سوپرحساب',departments:[...departments],permissions:[...permissions],level:'super',active:true},
   {id:'CHAIR',name:'حاجی',role:'رئیس هیئت‌مدیره',departments:[...departments],permissions:permissions.filter(p=>p!=='تنظیمات'),level:'chair',active:true},
   {id:'ART',name:'آلا',role:'مدیر هنری',departments:['ضرابخانه','بسته‌بندی'],permissions:['محصول','درخواست','گزارش'],level:'staff',active:true},
   {id:'OPS',name:'بهنام',role:'مدیر میانی',departments:departments.slice(0,6),permissions:permissions.filter(p=>!['تنظیمات','بازار'].includes(p)),level:'staff',active:true},
   {id:'FINANCE',name:'نازنین',role:'مالی',departments:['انبار'],permissions:['دریافت','انبار','گزارش','درخواست'],level:'staff',active:true},
   {id:'ELECTRIC',name:'مجید',role:'تکنسین برق',departments:['ذوب','ضرابخانه','آهنگری'],permissions:['ابزار','درخواست','حضور'],level:'staff',active:true},
   {id:'METALWORK',name:'آرتور',role:'آهنگری و دستگاه‌سازی',departments:['آهنگری'],permissions:['ابزار','درخواست','حضور'],level:'staff',active:true},
   {id:'CAFE-01',name:'سیما',role:'آشپزخانه و کافه',departments:['آشپزخانه و کافه'],permissions:['درخواست','حضور'],level:'staff',active:true},
   {id:'CAFE-02',name:'ملیکا',role:'آشپزخانه و کافه',departments:['آشپزخانه و کافه'],permissions:['درخواست','حضور'],level:'staff',active:true},
   {id:'MARKET',name:'محراب',role:'سفر بازار',departments:['انبار'],permissions:['بازار','درخواست','حضور'],level:'staff',active:true},
   {id:'OP-MELT',name:'اپراتور ذوب · نمونه',role:'اپراتور ذوب',departments:['ذوب'],permissions:['تولید','ابزار','محلول','حضور','درخواست'],level:'staff',active:true},
   {id:'OP-LAB',name:'اپراتور آزمایشگاه · نمونه',role:'عیارسنج',departments:['آزمایشگاه'],permissions:['تولید','آزمایشگاه','حضور','درخواست'],level:'staff',active:true},
  ],attendance:[{id:'ATT-01',personId:'CHAIR',start:at(6)},{id:'ATT-02',personId:'OP-MELT',start:at(5)}],trips:[{id:'TRIP-01',personId:'CHAIR',destination:'بازار · نمونه',purpose:'پیگیری بار و تأمین',start:at(2)}],
  requests:[{id:'REQ-01',department:'آهنگری',title:'بازبینی قالب ریژه · نمونه',description:'ثبت درخواست داخلی و پیگیری مسئولیت واحد',personId:'METALWORK',status:'open',created:at(4)}],
  events:[{id:'EV-DEMO-01',time:at(1),actor:'دادهٔ نمونه',title:'دومین ذوب همان ۳۰۰۰ گرم ثبت شد؛ کارکرد بوته ۶۰۰۰ گرم و خروجی یکتای تولید هنوز ثبت نشده است.',refs:['RUN-AG-0007','CR-MELT-005'],type:'cycle'},{id:'EV-DEMO-02',time:at(3),actor:'دادهٔ نمونه',title:'بار شرطی مستقل با وزن خالص ۸۰۰۰ گرم دریافت شد.',refs:['LOT-AG-0103'],type:'lot'}],
  settings:{accent:'#204e40',background:'#f6f7f3',font:'Moriyati',maxUsers:20}
 };
}

export function assetWork(f:FactoryData,assetId:string){const a=f.assets.find(x=>x.id===assetId)!;const cycles=f.cycles.filter(x=>x.assetId===assetId);return {cycles:a.baselineCycles+cycles.length,grams:a.baselineGrams+cycles.reduce((s,c)=>s+c.grams,0)};}
export function solutionWork(f:FactoryData,solutionId:string){const a=f.solutions.find(x=>x.id===solutionId)!;const cycles=f.cycles.filter(x=>x.solutionId===solutionId);return {cycles:a.baselineCycles+cycles.length,grams:a.baselineGrams+cycles.reduce((s,c)=>s+c.grams,0)};}
export function can(f:FactoryData,personId:string,permission:string){const p=f.people.find(x=>x.id===personId);return !!p?.active&&(p.level==='super'||p.permissions.includes(permission));}
export function lotSummary(f:FactoryData,lotId:string){
 const lot=f.lots.find(x=>x.id===lotId)!;
 const open=f.runs.filter(r=>r.state==='open'&&r.shares.some(s=>s.lotId===lotId));
 const packets=f.packets.filter(p=>p.state==='available'&&p.shares.some(s=>s.lotId===lotId));
 const products=f.products.filter(p=>p.shares.some(s=>s.lotId===lotId));
 const measured=f.assays.filter(a=>a.status==='approved'&&f.packets.find(p=>p.id===a.packetId)?.originShares.some(s=>s.lotId===lotId));
 const baseAssay=measured.find(a=>a.purpose==='ورودی')?.result??lot.claimedAssay;
 const shareWeight=(shares:Share[])=>shares.filter(s=>s.lotId===lotId).reduce((n,s)=>n+s.weight,0);
 const finalWeight=packets.filter(p=>p.final).reduce((s,p)=>s+shareWeight(p.shares),0)+products.reduce((s,p)=>s+shareWeight(p.shares),0);
 const finalFine=packets.filter(p=>p.final&&p.confirmed).reduce((s,p)=>s+pure(shareWeight(p.shares),p.assay),0)+products.reduce((s,p)=>s+pure(shareWeight(p.shares),p.assay),0);
 const pending=f.residues.filter(r=>r.shares.some(s=>s.lotId===lotId)&&!['recovered','returned'].includes(r.state));
 return {lot,open,packets,products,baseAssay,baseFine:pure(lot.net,baseAssay),finalWeight,finalFine,pending,readyToClose:lot.status==='accepted'&&!open.length&&packets.every(p=>p.final)};
}
export function alloyCopper(weight:number,current:number,target:number){if(target<=0||target>current)throw Error('عیار هدف باید مثبت و حداکثر برابر عیار ورودی باشد.');return round(weight*current/target-weight);}

const requirementFor:Record<string,string>={receive_lot:'دریافت',decide_lot:'دریافت',close_lot:'تولید',create_run:'تولید',finish_run:'تولید',start_work:'تولید',end_work:'تولید',pool:'تولید',submit_assay:'آزمایشگاه',approve_assay:'آزمایشگاه',material_move:'انبار',create_material:'انبار',record_cycle:'تولید',create_asset:'ابزار',retire_asset:'ابزار',create_solution:'محلول',replace_solution:'محلول',add_residue:'بازیافت',weigh_residue:'بازیافت',start_recovery:'بازیافت',finish_recovery:'بازیافت',allocate_recovery:'بازیافت',register_product:'محصول',deliver_product:'محصول',clock_in:'حضور',clock_out:'حضور',start_trip:'بازار',end_trip:'بازار',create_request:'درخواست',update_request:'درخواست',update_settings:'تنظیمات',save_person:'تنظیمات'};

export function applyFactoryCommand(input:FactoryData,command:FCommand,actorName='مدیر سامانه'):{factory:FactoryData;message:string}{
 const f=clone(input),d=command.data,type=command.type.replace(/^factory\//,'');
 if(!d||typeof d!=='object'||Array.isArray(d))throw Error('درخواست معتبر نیست.');
 const actorId=text(d,'actorId','CEO'),person=f.people.find(p=>p.id===actorId);
 const operatorConsumption=type==='material_move'&&d.kind==='consume'&&can(f,actorId,'تولید');
 if(!person||(!operatorConsumption&&!can(f,actorId,requirementFor[type]||'تنظیمات')))throw Error('این عملیات در الگوی دسترسی نقش انتخاب‌شده مجاز نیست.');
 const now=new Date().toISOString();let message='ثبت شد.';
 const audit=(title:string,refs:string[]=[])=>f.events.unshift({id:id('EV'),title,refs,time:now,type,actor:`${person.name} · ${actorName}`});
 const getPacket=(key='packetId')=>{const p=f.packets.find(p=>p.id===d[key]&&p.state==='available'&&p.weight>0);if(!p)throw Error('مادهٔ در جریان قابل استفاده پیدا نشد.');return p;};
 const getRun=()=>{const r=f.runs.find(r=>r.id===d.runId);if(!r)throw Error('بچ عملیاتی پیدا نشد.');return r;};
 const getPerson=(pid:string)=>{const p=f.people.find(p=>p.id===pid&&p.active);if(!p)throw Error('همکار فعال را انتخاب کن.');return p;};
 const reserve=(p:Packet,w:number)=>{if(w>p.weight+1e-6)throw Error('وزن انتخاب‌شده از ماندهٔ آزاد بیشتر است.');const shares=scale(p.shares,w/p.weight);p.shares=scale(p.shares,(p.weight-w)/p.weight);p.weight=round(p.weight-w);if(p.weight<1e-6){p.weight=0;p.state='consumed';}return shares;};
 const makePacket=(metal:FMetal,w:number,assay:number,confirmed:boolean,shape:string,station:string,shares:Share[],parents:string[],final=false)=>{const adjusted=scale(shares,w/shares.reduce((s,x)=>s+x.weight,0));const p:Packet={id:id('PKT'),metal,weight:w,originalWeight:w,assay,confirmed,shape,station,shares:adjusted,originShares:clone(adjusted),parents,state:'available',final,created:now};f.packets.unshift(p);return p;};
 const residue=(info:Omit<Residue,'id'|'created'|'state'>)=>{const r:Residue={...info,id:id('REC'),created:now,state:'queued'};f.residues.unshift(r);return r;};
 const assertIsolation=(shares:Share[],vessel:string)=>{const lids=lotIds(shares);const isolated=f.lots.filter(l=>lids.includes(l.id)&&l.isolated);if(isolated.length&&(lids.length!==1||!vessel))throw Error('بار اسیدکاری شرطی باید تک‌مالک و دارای ظرف مستقل باشد.');if(vessel){const others=f.runs.filter(r=>r.vessel===vessel&&r.shares.some(s=>!lids.includes(s.lotId)));if(others.some(r=>r.state==='open'||r.shares.some(s=>f.lots.find(l=>l.id===s.lotId)?.isolated)))throw Error('این ظرف به بار مستقل دیگری اختصاص دارد.');}};
 switch(type){
  case 'receive_lot':{
   const metal=text(d,'metal');if(!['silver','gold'].includes(metal))throw Error('فلز معتبر نیست.');
   const net=number(d,'net',0.001),gross=number(d,'gross',net),owner=need(text(d,'owner'),'مالک');
   const photo=photoValue(d,'photo');
   const lot:Lot={id:id(metal==='silver'?'LOT-AG':'LOT-AU'),metal:metal as FMetal,owner,ownership:d.ownership==='company'?'company':'customer',conditional:d.conditional===true,isolated:d.isolated===true,form:need(text(d,'form'),'شکل ورودی'),gross,net,claimedAssay:number(d,'assay',0,1000),description:text(d,'description'),photo,status:d.conditional===true?'conditional':'accepted',created:now,target:need(text(d,'target'),'مسیر درخواستی')};
   f.lots.unshift(lot);makePacket(lot.metal,net,lot.claimedAssay,false,lot.form,'انبار',[{lotId:lot.id,owner,weight:net}],[]);
   audit(`ورود ${net} گرم؛ وزن با بسته ${gross} گرم؛ ${owner}${lot.conditional?' · بار شرطی':''}${lot.isolated?' · گردش کاملاً مستقل':''}`,[lot.id]);message=`بار ${lot.id} ثبت شد؛ عیار هنوز نیازمند تأیید آزمایشگاه است.`;break;
  }
  case 'submit_assay':{
   const p=getPacket();if(!shapesForAssay.includes(p.shape))throw Error('این شکل ورودی باید ابتدا آماده، ذوب و ریژه شود؛ ظروف مستقیماً عیارسنجی نمی‌شوند.');
   const sample=need(text(d,'sample'),'شماره نمونه');if(f.assays.some(a=>a.sample===sample))throw Error('شماره نمونه تکراری است.');
   const a:Assay={id:id('LAB'),packetId:p.id,sample,purpose:text(d,'purpose','ورودی'),method:need(text(d,'method'),'روش آزمون'),result:number(d,'result',0.001,1000),personId:need(text(d,'personId'),'عیارسنج'),status:'pending',created:now};getPerson(a.personId);f.assays.unshift(a);audit(`ثبت نتیجهٔ نمونه ${sample}: ${a.result}؛ در انتظار تأیید`,[p.id,...lotIds(p.shares)]);break;
  }
  case 'approve_assay':{
   const a=f.assays.find(a=>a.id===d.assayId&&a.status==='pending');if(!a)throw Error('نتیجهٔ در انتظار تأیید پیدا نشد.');
   const p=f.packets.find(p=>p.id===a.packetId);if(!p||p.state!=='available'||p.weight<=0)throw Error('نمونه متعلق به ماده‌ای است که اکنون آزاد نیست.');
   const prior=f.assays.find(x=>x.packetId===p.id&&x.status==='approved');if(prior){prior.status='superseded';a.supersedes=prior.id;}
   a.status='approved';a.approved=now;p.assay=a.result;p.confirmed=true;audit(`تأیید عیار ${a.result} برای ${a.sample}؛ نسخه‌های قبلی حفظ شدند`,[p.id,...lotIds(p.shares)]);break;
  }
  case 'decide_lot':{
   const lot=f.lots.find(l=>l.id===d.lotId&&l.status==='conditional');if(!lot)throw Error('بار شرطی پیدا نشد.');
   const s=lotSummary(f,lot.id);if(s.open.length)throw Error('ابتدا تمام آماده‌سازی‌های باز این بار را تمام کن.');
   if(!s.packets.length||s.packets.some(p=>!p.confirmed))throw Error('عیار تمام بخش‌های موجود این بار باید تأیید شده باشد.');
   lot.decisionNote=need(text(d,'note'),'شرح تصمیم');const decision=text(d,'decision');
   if(decision==='accept'){lot.status='accepted';audit('پذیرش کل بار شرطی پس از عیارسنجی',[lot.id]);}
   else if(decision==='return'){
    const remaining=f.residues.filter(r=>r.shares.some(x=>x.lotId===lot.id)&&r.state==='queued');
    if(remaining.some(r=>!r.vessel))throw Error('ظرف مانده‌های این بار را مشخص کن.');
    lot.status='returned';lot.returnedWeight=round(s.packets.reduce((w,p)=>w+p.weight,0)+remaining.reduce((w,r)=>w+r.grams,0));
    for(const p of s.packets)p.state='returned';for(const r of remaining)r.state='returned';
    audit(`مرجوعی کل بار و تمام ظرف‌های مانده؛ وزن فعلی مرجوعی ${lot.returnedWeight} گرم، ورودی ${lot.net} گرم؛ کسر آماده‌سازی در سوابق محفوظ است`,[lot.id]);
   }else throw Error('نوع تصمیم را انتخاب کن.');break;
  }
  case 'pool':{
   const ids=list(d,'packetIds');if(ids.length<2)throw Error('حداقل دو مادهٔ هم‌عیار را انتخاب کن.');
   const packets=ids.map(pid=>f.packets.find(p=>p.id===pid&&p.state==='available'&&p.weight>0));if(packets.some(p=>!p))throw Error('بخشی از مواد انتخاب‌شده دیگر آزاد نیست.');const ps=packets as Packet[],base=ps[0];
   if(base.metal!=='silver'||ps.some(p=>p.metal!==base.metal||!p.confirmed||Math.abs(p.assay-base.assay)>1e-9))throw Error('فقط نقره با عیار تأییدشدهٔ کاملاً یکسان قابل تجمیع است.');
   if(ps.some(p=>p.shape!==base.shape||p.station!==base.station))throw Error('شکل و ایستگاه مواد باید یکسان باشند.');
   if(ps.some(p=>p.shares.some(s=>{const l=f.lots.find(l=>l.id===s.lotId);return l?.isolated||l?.status!=='accepted';})))throw Error('بار شرطی یا اسیدکاری مستقل با هیچ بار دیگری تجمیع نمی‌شود.');
   const shares=ps.flatMap(p=>clone(p.shares)),weight=ps.reduce((w,p)=>w+p.weight,0);for(const p of ps)reserve(p,p.weight);
   const pooled=makePacket(base.metal,weight,base.assay,true,base.shape,base.station,shares,ids);audit(`تجمیع هم‌عیار ${base.assay}؛ ${shares.length} سهم مالکیت مستقل حفظ شد`,[pooled.id,...lotIds(shares)]);break;
  }
  case 'create_run':{
   const p=getPacket(),op=operations.find(o=>o.id===d.op);if(!op)throw Error('عملیات را انتخاب کن.');
   const lids=lotIds(p.shares);if(lids.some(lid=>['returned','complete'].includes(f.lots.find(l=>l.id===lid)?.status||'')))throw Error('بار مرجوع یا بسته‌شده قابل پردازش نیست.');
   const prep=['cut','melt','riegeh'];
   if(lids.some(lid=>f.lots.find(l=>l.id===lid)?.status==='conditional')&&!prep.includes(op.id))throw Error('بار شرطی پیش از پذیرش فقط آماده‌سازی، ذوب و ریژه می‌شود.');
   if(!p.confirmed&&!prep.includes(op.id))throw Error('برای این عملیات ابتدا عیار ماده را تأیید کن.');
   if(op.id==='qc'&&p.metal==='gold'&&['ساچمه','گرانول'].includes(p.shape))throw Error('ساچمهٔ طلا محصول نهایی موریاتی نیست؛ مسیر شمش یا مینت را انتخاب کن.');
   const weight=number(d,'weight',0.001,p.weight),vessel=need(text(d,'vessel'),'شناسهٔ ظرف / دستگاه');assertIsolation(p.shares,vessel);
   const shares=reserve(p,weight);const r:Run={id:id('RUN'),op:op.id,station:op.station,packetId:p.id,metal:p.metal,input:weight,inputAssay:p.assay,inputConfirmed:p.confirmed,shares,vessel,note:text(d,'note'),state:'open',sessions:[],created:now};f.runs.unshift(r);audit(`بچ ${weight} گرمی برای ${op.name}؛ ماندهٔ بار در ایستگاه قبلی آزاد ماند`,[r.id,...lids]);break;
  }
  case 'start_work':{
   const r=getRun();if(r.state!=='open')throw Error('بچ عملیاتی پایان یافته است.');const p=getPerson(need(text(d,'personId'),'همکار'));
   if(r.sessions.some(s=>s.personId===p.id&&!s.end))throw Error('برای همین نفر در همین بچ کار باز ثبت شده است.');
   r.sessions.push({id:id('WORK'),personId:p.id,role:need(text(d,'role'),'نقش در این بچ'),start:now});audit(`شروع کار ${p.name}؛ ${text(d,'role')}`,[r.id,...lotIds(r.shares)]);break;
  }
  case 'end_work':{
   const r=getRun(),s=r.sessions.find(s=>s.id===d.sessionId&&!s.end);if(!s)throw Error('کار باز پیدا نشد.');s.end=now;audit('پایان و تأیید کار توسط اپراتور',[r.id,...lotIds(r.shares)]);break;
  }
  case 'material_move':{
   const m=f.materials.find(m=>m.id===d.materialId);if(!m)throw Error('ماده را انتخاب کن.');const kind=text(d,'kind');const qty=number(d,'grams',kind==='adjust'?-1e12:0.001),note=need(text(d,'note'),'شرح گردش');
   if(!['consume','receipt','adjust'].includes(kind))throw Error('نوع گردش معتبر نیست.');const runId=text(d,'runId');if(kind==='consume'&&!f.runs.some(r=>r.id===runId&&r.state==='open'))throw Error('مصرف اسید، پودر و محلول باید به یک بچ عملیاتی باز متصل باشد.');
   const delta=kind==='adjust'?qty-m.grams:kind==='consume'?-qty:qty;m.grams=round(m.grams+delta);
   f.consumption.unshift({id:id('MAT-MV'),materialId:m.id,runId,grams:kind==='consume'?qty:delta,kind:kind as FConsumption['kind'],note,time:now});
   audit(`${kind==='consume'?'مصرف':kind==='receipt'?'ورود':'اصلاح موجودی'} ${m.name}؛ ${qty} گرم`,[runId,m.id].filter(Boolean));
   if(m.grams<0){message='مصرف ثبت شد؛ موجودی منفی است. اگر ماده موجود است، موجودی را اصلاح کن.';audit(`هشدار موجودی منفی ${m.name}؛ موجودی باید اصلاح شود`,[m.id,runId]);}break;
  }
  case 'create_material':{
   const m:FMaterial={id:id('MAT'),name:need(text(d,'name'),'نام ماده'),category:need(text(d,'category'),'گروه'),grams:number(d,'grams',0),minimum:number(d,'minimum',0)};f.materials.unshift(m);audit(`تعریف ${m.name}؛ مبنای ثبت گرم`,[m.id]);break;
  }
  case 'record_cycle':{
   const r=getRun();if(r.state!=='open')throw Error('برای بچ تمام‌شده کارکرد تازه ثبت نمی‌شود.');const a=f.assets.find(a=>a.id===d.assetId&&a.state==='active');if(!a)throw Error('ابزار فعال را انتخاب کن.');
   const solutionId=text(d,'solutionId');if(solutionId){const s=f.solutions.find(s=>s.id===solutionId&&s.state==='active');if(!s)throw Error('دورهٔ محلول فعال را انتخاب کن.');if(r.metal!=='silver'||Math.abs(s.assay-r.inputAssay)>1e-9)throw Error('عیار محلول گرانول و عیار مادهٔ این بچ باید یکسان باشند.');}
   const added=f.consumption.filter(c=>c.runId===r.id&&c.kind==='consume').reduce((s,c)=>s+c.grams,0);
   const grams=number(d,'grams',0.001,r.input+added);const personId=getPerson(need(text(d,'personId'),'اپراتور')).id;
   f.cycles.unshift({id:id('CYCLE'),runId:r.id,assetId:a.id,solutionId,grams,personId,reason:need(text(d,'reason'),'علت این نوبت'),time:now});
   audit(`کارکرد ${a.serial}؛ ${grams} گرم؛ ${text(d,'reason')}${solutionId?' · متصل به دورهٔ محلول '+solutionId:''}؛ خروجی نهایی افزایش نیافت`,[r.id,a.serial,solutionId,...lotIds(r.shares)].filter(Boolean));break;
  }
  case 'finish_run':{
   const r=getRun();if(r.state!=='open')throw Error('این بچ قبلاً تمام شده است.');if(r.sessions.some(s=>!s.end))throw Error('پایان کار همهٔ افراد همین بچ را ثبت کن؛ سایر بچ‌ها می‌توانند باز بمانند.');
   const output=number(d,'output',0.001),assay=number(d,'assay',0,1000),scrap=number(d,'residue',0),shape=need(text(d,'shape'),'شکل خروجی');
   const added=f.consumption.filter(c=>c.runId===r.id&&c.kind==='consume').reduce((s,c)=>s+c.grams,0);
   if(output+scrap>r.input+added+1e-6)throw Error('وزن خروجی و مانده از ورودی به‌اضافهٔ مواد افزوده‌شده بیشتر است.');
   if(r.inputConfirmed&&assay&&pure(output,assay)>pure(r.input,r.inputAssay)+1e-6)throw Error('فلز خالص خروجی از ورودی خالص بیشتر است؛ وزن، عیار و مواد فلزی افزوده‌شده را بررسی کن.');
   const mechanical=['cut','melt','riegeh','cast','granulate','roll','blank','mint','polish','pack'].includes(r.op);
   if(mechanical&&r.inputConfirmed&&Math.abs(assay-r.inputAssay)>1e-9)throw Error('برای تغییر عیار خروجی، نتیجهٔ آزمایش جدید ثبت کن.');
   const pass=r.op==='qc'&&text(d,'quality','pass')==='pass';
   if(pass&&(!r.inputConfirmed||!assay||assay!==r.inputAssay))throw Error('کنترل کیفیت به عیار تأییدشدهٔ همین ماده نیاز دارد.');
   if(pass&&r.metal==='gold'&&['ساچمه','گرانول'].includes(shape))throw Error('ساچمهٔ طلا محصول نهایی نیست.');
   const final=pass||(r.op==='pack'&&f.packets.find(p=>p.id===r.packetId)?.final===true);
   const p=makePacket(r.metal,output,assay,assay>0&&r.inputConfirmed&&(mechanical||pass),shape,operations.find(o=>o.id===r.op)!.station,r.shares,[r.packetId],final);
   r.state='done';r.ended=now;r.output=output;r.outputAssay=assay;r.outputId=p.id;r.quality=text(d,'quality','pass');
   if(scrap>0){const rec=residue({sourceType:'station',sourceId:r.vessel,label:`ماندهٔ ${operations.find(o=>o.id===r.op)!.name}`,station:need(text(d,'residueLocation'),'محل مانده'),vessel:need(text(d,'residueVessel'),'شناسهٔ ظرف مانده'),metal:r.metal,grams:scrap,assay:null,shares:scale(r.shares,scrap/r.input),runId:r.id});r.residueId=rec.id;}
   audit(`پایان ${r.id}؛ خروجی ${output} گرم، مانده ${scrap} گرم، اختلاف ناخالص ثبت‌شده ${round(r.input+added-output-scrap)} گرم؛ بقیهٔ بار همچنان مستقل است`,[r.id,p.id,...lotIds(r.shares)]);message='خروجی همین بچ آزاد شد و می‌تواند وارد مرحلهٔ بعد شود؛ کل بار هنوز به‌صورت جداگانه جمع‌بندی می‌شود.';break;
  }
  case 'create_asset':{
   const serial=need(text(d,'serial'),'سریال');if(f.assets.some(a=>a.serial===serial))throw Error('سریال ابزار تکراری است.');
   const replaces=text(d,'replaces');if(replaces&&!f.assets.some(a=>a.id===replaces&&a.state==='active'))throw Error('ابزار قبلی فعال نیست.');
   f.assets.unshift({id:id('TOOL'),name:need(text(d,'name'),'نام ابزار'),purpose:need(text(d,'purpose'),'کاربرد'),serial,heat:d.heat===true,station:need(text(d,'station'),'محل'),baselineCycles:0,baselineGrams:0,state:'active',created:now,replaces});
   audit(`افزودن ${serial}؛ ابزارهای قبلی تا خروج صریح از چرخه، فعال می‌مانند`,[serial,replaces].filter(Boolean));break;
  }
  case 'retire_asset':{
   const a=f.assets.find(a=>a.id===d.assetId&&a.state==='active');if(!a)throw Error('ابزار فعال پیدا نشد.');a.state='retired';a.retired=now;a.reason=need(text(d,'reason'),'علت خروج');const work=assetWork(f,a.id);
   const uses=f.cycles.filter(c=>c.assetId===a.id),shares=uses.flatMap(c=>f.runs.find(r=>r.id===c.runId)?.shares||[]);
   residue({sourceType:'asset',sourceId:a.serial,label:a.name,station:'شیره بوته',vessel:need(text(d,'vessel'),'ظرف بازیافت'),metal:text(d,'metal','silver')==='gold'?'gold':'silver',grams:number(d,'grams',0),assay:null,shares,runId:'',});
   audit(`خروج ${a.serial} و ورود به صف بازیافت؛ ${work.cycles} نوبت و ${work.grams} گرم کارکرد تجمعی`,[a.serial]);break;
  }
  case 'create_solution':{
   const vessel=need(text(d,'vessel'),'شناسهٔ مخزن');if(f.solutions.some(s=>s.vessel===vessel&&s.state==='active'))throw Error('این مخزن محلول فعال دارد؛ از تعویض محلول استفاده کن.');
   const s:Solution={id:id('SOL'),vessel,label:need(text(d,'label'),'عنوان'),assay:number(d,'assay',0.001,1000),opened:now,state:'active',baselineCycles:0,baselineGrams:0};f.solutions.unshift(s);audit(`شروع دورهٔ محلول ${s.label}`,[s.id,vessel]);break;
  }
  case 'replace_solution':{
   const s=f.solutions.find(s=>s.id===d.solutionId&&s.state==='active');if(!s)throw Error('محلول فعال پیدا نشد.');s.state='replaced';s.closed=now;const w=solutionWork(f,s.id);
   const shares=f.cycles.filter(c=>c.solutionId===s.id).flatMap(c=>f.runs.find(r=>r.id===c.runId)?.shares||[]);
   residue({sourceType:'solution',sourceId:s.id,label:s.label,station:'گرانول',vessel:need(text(d,'recoveryVessel'),'ظرف محلول مصرف‌شده'),metal:'silver',grams:number(d,'grams',0),assay:null,shares,runId:''});
   const next:Solution={id:id('SOL'),vessel:s.vessel,label:s.label,assay:s.assay,opened:now,state:'active',baselineCycles:0,baselineGrams:0};f.solutions.unshift(next);
   audit(`تعویض ${s.id}؛ از تعویض قبلی ${w.cycles} نوبت / ${w.grams} گرم کارکرد؛ دورهٔ تازه ${next.id}؛ محلول قبلی در صف بازیافت`,[s.id,next.id,s.vessel]);break;
  }
  case 'add_residue':{
   const runId=text(d,'runId'),r=runId?f.runs.find(r=>r.id===runId):undefined;if(runId&&!r)throw Error('بچ مرتبط پیدا نشد.');
   const isolatedLots=r?.shares.filter(s=>f.lots.find(l=>l.id===s.lotId)?.isolated)||[];
   const vessel=need(text(d,'vessel'),'شناسهٔ ظرف');if(isolatedLots.length&&f.residues.some(x=>x.vessel===vessel&&x.shares.some(s=>!lotIds(isolatedLots).includes(s.lotId))))throw Error('ظرف ماندهٔ بار شرطی باید مستقل باشد.');
   const rec=residue({sourceType:'station',sourceId:need(text(d,'sourceId'),'دستگاه / محل مبدأ'),label:need(text(d,'label'),'شرح مانده'),station:need(text(d,'station'),'ایستگاه'),vessel,metal:r?.metal||(text(d,'metal','silver')==='gold'?'gold':'silver'),grams:number(d,'grams',0),assay:null,shares:r?clone(r.shares):[],runId});audit(`ثبت مانده در ${rec.station}، ${rec.grams} گرم؛ ورود به صف بازیافت`,[rec.id,runId,rec.sourceId].filter(Boolean));break;
  }
  case 'weigh_residue':{
   const r=f.residues.find(r=>r.id===d.residueId&&r.state==='queued');if(!r)throw Error('ماندهٔ در صف پیدا نشد.');r.grams=number(d,'grams',0);const value=d.assay;r.assay=value===''||value==null?null:number(d,'assay',0.001,1000);audit(`توزین / عیار مانده ${r.id}؛ ${r.grams} گرم`,[r.id,r.sourceId]);break;
  }
  case 'start_recovery':{
   const ids=list(d,'sourceIds');if(!ids.length)throw Error('منابع بازیافت را انتخاب کن.');const items=ids.map(rid=>f.residues.find(r=>r.id===rid&&r.state==='queued'));if(items.some(r=>!r))throw Error('بعضی منابع دیگر در صف نیستند.');const rs=items as Residue[],metal=rs[0].metal;if(rs.some(r=>r.metal!==metal))throw Error('طلا و نقره در یک بازیافت جمع نمی‌شوند.');
   const isolated=rs.flatMap(r=>r.shares).filter(s=>f.lots.find(l=>l.id===s.lotId)?.isolated);if(isolated.length&&(lotIds(isolated).length!==1||rs.some(r=>r.shares.some(s=>!lotIds(isolated).includes(s.lotId))||!r.shares.length)))throw Error('بازیافت بار شرطی مستقل با منابع دیگر ادغام نمی‌شود.');
   const job:Recovery={id:id('RCV'),sourceIds:ids,metal,state:'open',created:now,note:text(d,'note'),allocation:'بازیافت گروهی؛ بازده تک‌منبعی تا اندازه‌گیری جداگانه نامشخص است.'};f.recoveries.unshift(job);for(const r of rs){r.state='processing';r.recoveryId=job.id;}audit(`آغاز بازیافت گروه ${job.id}؛ منابع ${rs.map(r=>r.sourceId).join('، ')}`,[job.id,...ids]);break;
  }
  case 'finish_recovery':{
   const job=f.recoveries.find(r=>r.id===d.recoveryId&&r.state==='open');if(!job)throw Error('بازیافت باز پیدا نشد.');const output=number(d,'output',0),assay=number(d,'assay',0.001,1000);const sources=f.residues.filter(r=>job.sourceIds.includes(r.id));
   if(output>sources.reduce((w,r)=>w+r.grams,0)+1e-6)throw Error('خروجی بازیافت از وزن ناخالص منابع بیشتر است؛ ابتدا توزین منابع را اصلاح کن.');
   job.state='done';job.output=output;job.assay=assay;job.ended=now;job.note=text(d,'note');for(const r of sources)r.state='recovered';
   // No invented per-source or per-owner allocation of a jointly recovered yield.
   audit(`پایان ${job.id}؛ ${output} گرم با عیار ${assay}، ${pure(output,assay)} گرم خالص؛ تمام شماره‌های مبدأ حفظ شد. انتساب مالکیتی نیازمند ثبت جداگانه است.`,[job.id,...sources.map(r=>r.sourceId)]);message='بازده واقعی گروه ثبت شد؛ سهم فردی منابع یا مالک‌ها خودکار حدس زده نشده است.';break;
  }
  case 'allocate_recovery':{
   const job=f.recoveries.find(j=>j.id===d.recoveryId&&j.state==='done'&&!j.packetId&&j.output&&j.assay);if(!job)throw Error('خروجی تخصیص‌نیافتهٔ بازیافت پیدا نشد.');
   const sources=f.residues.filter(r=>job.sourceIds.includes(r.id));const possible=lotIds(sources.flatMap(s=>s.shares));
   let shares:Share[]=[];
   if(possible.length){
    const raw=d.allocations;if(!Array.isArray(raw)||!raw.length)throw Error('سهم وزنی هر بار را صریح ثبت کن.');
    for(const value of raw){if(!value||typeof value!=='object')throw Error('سهم مالکیت معتبر نیست.');const a=value as Record<string,unknown>;const lid=text(a,'lotId');const lot=f.lots.find(l=>l.id===lid&&possible.includes(lid));if(!lot)throw Error('بار انتخاب‌شده از مبدأهای این بازیافت نیست.');shares.push({lotId:lid,owner:lot.owner,weight:number(a,'weight',0.001)});}
    if(Math.abs(shares.reduce((w,s)=>w+s.weight,0)-job.output!)>1e-6)throw Error('جمع سهم‌ها باید دقیقاً برابر وزن خروجی بازیافت باشد.');
    for(const lid of lotIds(shares)){const l=f.lots.find(l=>l.id===lid)!;if(l.status==='returned')throw Error('خروجی به بار مرجوع تخصیص داده نمی‌شود.');if(l.status==='complete')l.status='accepted';}
   }else{
    const lot:Lot={id:id('LOT-RCV'),metal:job.metal,owner:'موجودی موریاتی',ownership:'company',conditional:false,isolated:false,form:'فلز بازیافتی',gross:job.output!,net:job.output!,claimedAssay:job.assay!,description:`برگشت از بازیافت ${job.id}`,photo:'',status:'accepted',created:now,target:'کنترل کیفیت بازیافتی'};f.lots.unshift(lot);shares=[{lotId:lot.id,owner:lot.owner,weight:job.output!}];
   }
   const p=makePacket(job.metal,job.output!,job.assay!,false,'آب‌شده','آزمایشگاه',shares,[job.id]);job.packetId=p.id;job.allocations=clone(shares);job.allocation='تخصیص صریح اپراتور ثبت شد؛ خروجی برای تأیید آزمایشگاه به گردش برگشت.';audit(job.allocation,[job.id,p.id,...lotIds(shares)]);break;
  }
  case 'register_product':{
   const p=getPacket();if(!p.final||!p.confirmed)throw Error('محصول باید از خروجی کنترل کیفیتِ تأییدشده صادر شود.');
   const weight=number(d,'weight',0.001,p.weight),serial=need(text(d,'serial'),'سریال محصول'),packaging=need(text(d,'packaging'),'سریال بسته‌بندی'),tag=text(d,'tag'),collection=need(text(d,'collection'),'مجموعه');
   if(f.products.some(x=>x.serial===serial||x.packaging===packaging||(tag&&x.tag===tag)))throw Error('سریال محصول، بسته‌بندی یا تگ تکراری است.');
   if(p.metal==='gold'&&collection==='Argentum')throw Error('طلا محصول نهایی ساچمه ندارد.');
   const specs:Record<string,{metal:FMetal;assays:number[];weights:number[]}>= {Celestial:{metal:'gold',assays:[995],weights:[1,5,10,20,31.1034768]},Artwork:{metal:'gold',assays:[995],weights:[50,100]},Courtyard:{metal:'gold',assays:[995],weights:[250,500,1000]},Constellation:{metal:'silver',assays:[999.9],weights:[10,20,31.1034768,50,100]},Argentum:{metal:'silver',assays:[995,999.9],weights:[1000,2000,5000,10000]},Investment:{metal:'silver',assays:[990],weights:[100]}};
   const spec=specs[collection];if(collection!=='Bespoke Edition'&&(!spec||spec.metal!==p.metal||!spec.assays.includes(p.assay)||!spec.weights.some(w=>Math.abs(w-weight)<1e-6)))throw Error('فلز، وزن یا عیار با مشخصات مجموعه یکسان نیست.');
   const photo=(k:string)=>photoValue(d,k);
   const shares=reserve(p,weight);f.products.unshift({id:id('PRODUCT'),serial,packaging,tag,collection,metal:p.metal,weight,assay:p.assay,packetId:p.id,shares,front:photo('front'),back:photo('back'),created:now,status:'ready'});audit(`شناسنامهٔ ${serial}؛ بسته ${packaging}؛ متصل به مسیر و سهم مالکیت`,[serial,p.id,...lotIds(shares)]);break;
  }
  case 'deliver_product':{
   const p=f.products.find(p=>p.id===d.productId&&p.status==='ready');if(!p)throw Error('محصول آمادهٔ تحویل پیدا نشد.');p.status='delivered';p.deliveryNote=need(text(d,'note'),'شرح تحویل');audit(`تحویل ${p.serial}؛ ${p.deliveryNote}`,[p.serial,...lotIds(p.shares)]);break;
  }
  case 'close_lot':{
   const s=lotSummary(f,need(text(d,'lotId'),'بار'));if(!s.readyToClose)throw Error('هنوز کار باز یا موادِ کامل‌نشده از این بار در خط تولید وجود دارد.');s.lot.status='complete';audit(`جمع‌بندی کل بار پس از پایان همهٔ بخش‌ها؛ ${s.finalWeight} گرم محصول نهایی متعلق به این بار${s.pending.length?'؛ ماندهٔ بازیافت باز است و اختلاف قطعی اعلام نمی‌شود.':''}`,[s.lot.id]);break;
  }
  case 'clock_in':{
   const pid=getPerson(need(text(d,'personId'),'همکار')).id;if(f.attendance.some(a=>a.personId===pid&&!a.end))throw Error('ورود این همکار باز است.');f.attendance.unshift({id:id('ATT'),personId:pid,start:now});audit('ثبت ورود به کارخانه',[pid]);break;
  }
  case 'clock_out':{
   const a=f.attendance.find(a=>a.id===d.attendanceId&&!a.end);if(!a)throw Error('حضور باز پیدا نشد.');a.end=now;audit('ثبت خروج از کارخانه؛ مستقل از سفر بازار',[a.personId]);break;
  }
  case 'start_trip':{
   const personId=getPerson(need(text(d,'personId'),'مسئول سفر')).id;if(f.trips.some(t=>t.personId===personId&&!t.end))throw Error('این همکار سفر بازار باز دارد.');f.trips.unshift({id:id('TRIP'),personId,destination:need(text(d,'destination'),'مقصد'),purpose:need(text(d,'purpose'),'هدف سفر'),start:now});audit('شروع سفر بازار؛ حضور و غیاب تغییر نکرد',[personId]);break;
  }
  case 'end_trip':{
   const t=f.trips.find(t=>t.id===d.tripId&&!t.end);if(!t)throw Error('سفر باز پیدا نشد.');t.end=now;t.report=need(text(d,'report'),'گزارش سفر');audit('پایان سفر بازار؛ حضور و غیاب مستقل باقی ماند',[t.id,t.personId]);break;
  }
  case 'create_request':{
   const department=need(text(d,'department'),'واحد');if(!departments.includes(department))throw Error('واحد معتبر نیست.');const req:InternalRequest={id:id('REQ'),department,title:need(text(d,'title'),'موضوع'),description:text(d,'description'),personId:getPerson(need(text(d,'personId'),'مسئول')).id,status:'open',created:now};f.requests.unshift(req);audit(`درخواست داخلی ${req.title} برای ${department}`,[req.id]);break;
  }
  case 'update_request':{
   const r=f.requests.find(r=>r.id===d.requestId);const status=text(d,'status');if(!r||!['open','doing','done'].includes(status))throw Error('درخواست معتبر نیست.');r.status=status as InternalRequest['status'];audit(`وضعیت درخواست ${r.title}: ${status}`,[r.id]);break;
  }
  case 'update_settings':{
   if(person.level!=='super')throw Error('ویرایش ERP فقط در اختیار سوپرحساب است.');const accent=text(d,'accent'),background=text(d,'background'),font=text(d,'font');if(!/^#[\da-fA-F]{6}$/.test(accent)||!/^#[\da-fA-F]{6}$/.test(background)||!['Moriyati','Tahoma','Arial'].includes(font))throw Error('تنظیمات ظاهر معتبر نیست.');f.settings={...f.settings,accent,background,font};audit('ویرایش رنگ و فونت سامانه توسط سوپرحساب');break;
  }
  case 'save_person':{
   if(person.level!=='super')throw Error('ویرایش حساب‌ها فقط در اختیار سوپرحساب است.');const existing=f.people.find(p=>p.id===d.personId);if(!existing&&f.people.length>=f.settings.maxUsers)throw Error('حداکثر ۲۰ حساب در ساختار کارخانه تعریف می‌شود.');
   const name=need(text(d,'name'),'نام'),role=need(text(d,'role'),'سمت'),deps=list(d,'departments'),perms=list(d,'permissions');if(deps.some(x=>!departments.includes(x))||perms.some(x=>!permissions.includes(x)))throw Error('واحد یا مجوز معتبر نیست.');
   if(existing&&['super','chair'].includes(existing.level))throw Error('نقش‌های مدیرعامل و رئیس هیئت‌مدیره در این فرم تغییر نمی‌کنند.');
   if(existing)Object.assign(existing,{name,role,departments:deps,permissions:perms});else f.people.push({id:id('PERSON'),name,role,departments:deps,permissions:perms,level:'staff',active:true});audit(`ویرایش الگوی حساب ${name}`);break;
  }
  default:throw Error('عملیات شناخته نشده است.');
 }
 return {factory:f,message};
}
