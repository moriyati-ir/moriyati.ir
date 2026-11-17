export const media = {
  silver: '../assets/v8/argentum-cast-detail.webp',
  granules: './photos/granules.jpeg',
  mint: './photos/silver-100.jpeg',
  pack: './photos/packaging.png',
  gold: './photos/gold-1g.png',
  art: './photos/artwork.jpeg',
  lab: '../assets/expertise-silver.webp',
  coin: '../assets/motion/v7/medallion-lion-emboss.webp',
  frame: './photos/artwork.jpeg',
  strip: '../assets/expertise-silver.webp',
};
const report = (id, title, text, image, weight, time, author='کاربر نمونه') => ({id,title,text,image,weight,time,author});
export const initialTasks = [
  {id:'silver-100',code:'MT-0248',type:'production',title:'تولید شمش نقره',subtitle:'Constellation · 100 g',cover:media.mint,material:'نقره',purity:'999.9',weight:3000,quantity:30,owner:'شما',team:['شما','بهنام','همکار ۱','همکار ۲'],status:'active',location:'بخش نورد',due:'امروز، ۱۶:۰۰',description:'تولید ۳۰ عدد شمش نقره ۱۰۰ گرمی؛ از تحویل مواد تا بسته‌بندی نهایی.',stages:[
    {id:'receive',name:'تحویل',cover:media.granules,done:true,reports:[report('r1','دریافت مواد از صندوق','مواد اولیه تحویل گرفته شد. وزن و مشخصات بار در این مرحله ثبت شده است.',media.granules,3000,'۰۸:۱۰'),report('r2','آماده شروع','بار برای شروع فرایند آماده شد و به بخش ذوب انتقال پیدا کرد.',media.silver,3000,'۰۸:۲۵')]},
    {id:'melt',name:'ذوب',cover:media.silver,done:true,reports:[report('r3','آماده‌سازی بار','بار و ابزار لازم برای این نوبت آماده شدند.',media.granules,3000,'۰۹:۰۰'),report('r4','توزین پس از ذوب','وزن خروجی پس از ذوب ثبت شد؛ مواد برای نورد آماده‌اند.',media.silver,3000,'۰۹:۴۰')]},
    {id:'roll',name:'نورد',cover:media.strip,done:false,reports:[report('r5','شروع نورد','ورودی این نوبت ثبت شد و نورد آغاز شد.',media.silver,3000,'۱۰:۰۰'),report('r6','کنترل ورق','سطح و یکنواختی ورق کنترل شد. ادامه فرایند در همین نوبت انجام می‌شود.',media.strip,3000,'۱۰:۲۰'),report('r7','آماده مرحله بعد','ورق برای مرحله بعد آماده شده است. عکس و وزن مرحله ثبت شدند.',media.strip,3000,'۱۰:۳۵')]},
  ]},
  {id:'gold-1',code:'MT-0251',type:'production',title:'شمش طلای یک گرمی',subtitle:'Celestial · 1 g',cover:media.gold,material:'طلا',purity:'995.0',weight:100,quantity:100,owner:'شما',team:['شما','همکار ۱'],status:'waiting',location:'بخش ضرب',due:'فردا، ۱۲:۰۰',description:'آماده‌سازی و ضرب شمش‌های یک گرمی مجموعه Celestial.',stages:[{id:'blank',name:'پولک‌زنی',cover:media.gold,done:true,reports:[report('g1','آماده‌سازی پولک','پولک‌ها آماده شدند و منتظر مرحله بعد هستند.',media.gold,100,'دیروز')]},{id:'strike',name:'ضرب',cover:media.gold,done:false,reports:[]}]},
  {id:'silver-coin',code:'MT-0249',type:'production',title:'سکه نقره',subtitle:'Fine Silver · 1 oz',cover:media.coin,material:'نقره',purity:'999.9',weight:311.035,quantity:10,owner:'شما',team:['شما','همکار ۲'],status:'active',location:'کنترل کیفیت',due:'امروز، ۱۵:۰۰',description:'کنترل نمونه‌های ضرب و ثبت نتیجه نهایی کیفیت.',stages:[{id:'coin-strike',name:'ضرب',cover:media.coin,done:true,reports:[report('c1','نمونه ضرب','نمونه ضرب برای بررسی کیفیت آماده است.',media.coin,311.035,'۰۹:۳۰')]},{id:'coin-qc',name:'کنترل کیفیت',cover:media.coin,done:false,reports:[report('c2','بررسی سطح','کیفیت سطح و خوانایی جزئیات در حال بررسی است.',media.coin,311.035,'۱۱:۱۰')]}]},
  {id:'packaging',code:'MT-0250',type:'production',title:'بسته‌بندی نقره',subtitle:'Constellation · Final pack',cover:media.pack,material:'نقره',purity:'999.9',weight:2000,quantity:20,owner:'شما',team:['شما','همکار ۱'],status:'active',location:'بسته‌بندی',due:'امروز، ۱۷:۰۰',description:'ثبت عکس پشت و رو و آماده‌سازی بسته‌های نهایی.',stages:[{id:'packing',name:'بسته‌بندی',cover:media.pack,done:false,reports:[report('p1','کنترل بسته‌ها','عکس‌های محصول و بسته‌بندی در حال ثبت هستند.',media.pack,2000,'۱۱:۴۵')]}]},
  {id:'artwork',code:'MT-0252',type:'production',title:'قاب مجموعه آرت‌ورک',subtitle:'Artwork · 100 g',cover:media.art,material:'طلا',purity:'995.0',weight:100,quantity:1,owner:'شما',team:['شما','همکار ۲'],status:'waiting',location:'آماده‌سازی',due:'پس‌فردا',description:'آماده‌سازی قاب و کنترل نمونه مجموعه آرت‌ورک.',stages:[{id:'art-check',name:'بررسی',cover:media.art,done:false,reports:[report('a1','نمونه قاب','نمونه برای بررسی و تطبیق آماده شده است.',media.art,100,'دیروز')]}]},
  {id:'cast-250',code:'MT-0253',type:'production',title:'شمش کست نقره',subtitle:'Argentum · 250 g',cover:media.silver,material:'نقره',purity:'999.9',weight:2500,quantity:10,owner:'شما',team:['شما','همکار ۱'],status:'active',location:'ذوب',due:'فردا',description:'آماده‌سازی نوبت شمش‌های کست نقره.',stages:[{id:'cast-melt',name:'ذوب',cover:media.silver,done:false,reports:[report('s1','شروع نوبت','بار این نوبت آماده شد و شروع کار ثبت شد.',media.silver,2500,'۱۲:۰۰')]}]},
  {id:'service',code:'GN-0086',type:'general',title:'سرویس دستگاه نورد',subtitle:'تعمیر و نگهداری',cover:media.strip,owner:'شما',team:['شما','همکار ۲'],status:'active',location:'کارگاه',due:'فردا، ۱۰:۰۰',description:'بررسی وضعیت دستگاه، ثبت موارد لازم و انجام سرویس برنامه‌ریزی‌شده.',stages:[{id:'inspect',name:'بررسی',cover:media.strip,done:false,reports:[report('x1','بررسی اولیه','بررسی اولیه دستگاه انجام شد. اقلام مورد نیاز در مرحله بعد ثبت می‌شوند.',null,null,'۰۹:۱۵')]}]},
  {id:'frame-order',code:'GN-0087',type:'general',title:'پیگیری سفارش قاب',subtitle:'سفارش بیرونی',cover:media.frame,owner:'شما',team:['شما','بهنام'],status:'waiting',location:'پیگیری بیرونی',due:'امروز، ۱۴:۰۰',description:'تطبیق مشخصات نمونه قاب و پیگیری زمان تحویل سفارش.',stages:[{id:'sample',name:'نمونه',cover:media.frame,done:true,reports:[report('f1','ثبت نمونه','تصویر نمونه برای بررسی مشخصات ثبت شد.',media.frame,null,'دیروز')]},{id:'follow',name:'پیگیری',cover:media.frame,done:false,reports:[]}]},
  {id:'lab',code:'GN-0088',type:'general',title:'آماده‌سازی آزمایشگاه',subtitle:'کار داخلی',cover:media.lab,owner:'شما',team:['شما','همکار ۱'],status:'active',location:'آزمایشگاه',due:'امروز',description:'مرتب‌سازی و آماده‌سازی ابزار و فضای آزمایشگاه برای نوبت بعد.',stages:[{id:'prepare',name:'آماده‌سازی',cover:media.lab,done:false,reports:[report('l1','آماده‌سازی ابزار','ابزار و فضای کار بررسی و مرتب شدند.',media.lab,null,'۱۰:۴۵')]}]},
];
initialTasks.push(
 {id:'completed-pack',code:'MT-0231',type:'production',title:'کنترل بسته‌های نقره',subtitle:'Constellation · Completed',cover:media.pack,material:'نقره',purity:'999.9',weight:1000,quantity:10,owner:'همکار ۱',team:['همکار ۱','همکار ۲'],status:'done',mine:false,location:'بسته‌بندی نهایی',due:'تکمیل‌شده',description:'کار نمونه تکمیل‌شده برای مرور سوابق مدیر.',stages:[{id:'final',name:'کنترل نهایی',cover:media.pack,done:true,reports:[report('done-1','پایان کنترل','کنترل نهایی این نوبت ثبت شده است.',media.pack,1000,'دیروز','همکار ۱')]}]},
 {id:'completed-general',code:'GN-0071',type:'general',title:'خرید ابزار کارگاه',subtitle:'Completed',cover:media.lab,owner:'همکار ۲',team:['همکار ۲'],status:'done',mine:false,location:'تحویل‌شده',due:'تکمیل‌شده',description:'سابقه یک کار عمومی تکمیل‌شده.',stages:[{id:'delivery',name:'تحویل',cover:media.lab,done:true,reports:[report('done-2','تحویل ابزار','نتیجه کار ثبت و ابزار تحویل شده است.',null,null,'هفته قبل','همکار ۲')]}]},
 {id:'cancelled-general',code:'GN-0069',type:'general',title:'پیگیری نمونه قبلی',subtitle:'Cancelled',cover:media.frame,owner:'همکار ۱',team:['همکار ۱'],status:'cancelled',mine:false,location:'لغوشده',due:'—',description:'کار نمونه لغوشده با حفظ سابقه.',stages:[]}
);
export const presets = {
 production:[{id:'constellation-100',name:'شمش نقره ۱۰۰ گرمی',subtitle:'Constellation',image:media.mint,material:'نقره',purity:'999.9',unit:100},{id:'celestial-1',name:'شمش طلای یک گرمی',subtitle:'Celestial',image:media.gold,material:'طلا',purity:'995.0',unit:1},{id:'silver-coin',name:'سکه نقره یک اونس',subtitle:'Fine silver',image:media.coin,material:'نقره',purity:'999.9',unit:31.1035}],
 general:[{id:'maintenance',name:'تعمیر و نگهداری',subtitle:'بررسی و سرویس تجهیزات',image:media.strip},{id:'purchase',name:'خرید و تأمین',subtitle:'اقلام مورد نیاز کار',image:media.granules},{id:'research',name:'تحقیق و توسعه',subtitle:'نمونه‌سازی و بررسی',image:media.lab},{id:'external',name:'سفارش بیرونی',subtitle:'پیگیری و تحویل سفارش',image:media.frame}]
};
export const contacts = [
 {id:'behnam',name:'بهنام',role:'مدیر کارخانه',initial:'ب',online:true,preview:'ممنون، بررسی می‌کنم.',time:'۱۰:۳۷',unread:2},
 {id:'team',name:'تیم تولید',role:'گروه هم‌سطح · ۴ عضو',initial:'ت',online:false,group:true,preview:'برنامه امروز در گروه ثبت شد.',time:'۰۹:۴۰',unread:1},
 {id:'colleague',name:'همکار ۱',role:'همکار تولید',initial:'ه',online:false,preview:'نمونه برای بررسی آماده است.',time:'دیروز',unread:0},
 {id:'self',name:'برای خودم',role:'نوت‌ها و یادآورها',initial:'م',online:false,preview:'یادداشت‌های شخصی شما',time:'',unread:0},
];
export const initialMessages = {
 behnam:[{id:'m1',self:true,kind:'text',text:'سلام، عکس مرحله را فرستادم.',time:'۱۰:۳۵'},{id:'m2',self:true,kind:'image',src:media.silver,text:'نمونه ثبت مرحله',time:'۱۰:۳۵'},{id:'m3',self:false,kind:'text',text:'ممنون، بررسی می‌کنم.',time:'۱۰:۳۷'}],
 team:[{id:'t1',self:false,kind:'text',text:'برنامه امروز در گروه ثبت شد. هر نفر کارهای خودش را از اکسپلور دنبال کند.',time:'۰۹:۴۰',sender:'همکار ۲'}],
 colleague:[{id:'h1',self:false,kind:'text',text:'نمونه برای بررسی آماده است.',time:'دیروز'}],self:[]
};
export const initialNotifications = [
 {id:'n1',kind:'mention',name:'بهنام',text:'شما را در گزارش مرحله تگ کرد.',detail:'تولید شمش نقره · نورد',time:'۵ دقیقه پیش',task:'silver-100',read:false},
 {id:'n2',kind:'invite',name:'دعوت به همکاری',text:'برای پیگیری سفارش قاب دعوت شده‌اید.',detail:'عمومی · سفارش بیرونی',time:'۲۰ دقیقه پیش',task:'frame-order',read:false},
 {id:'n3',kind:'announcement',name:'اطلاعیه کارخانه',text:'برنامه سرویس تجهیزات برای فردا ثبت شد.',detail:'تعمیر و نگهداری',time:'۱ ساعت پیش',task:'service',read:false},
 {id:'n4',kind:'pay',name:'واریزی جدید',text:'یک فیش واریزی در پروفایل شخصی شما ثبت شد.',detail:'فقط برای شما · اطلاعات نمونه',time:'دیروز',profile:3,read:true},
 {id:'n5',kind:'done',name:'ثبت مرحله',text:'گزارش مرحله ذوب در کار شما تکمیل شد.',detail:'تولید شمش نقره',time:'دیروز',task:'silver-100',read:true},
];

// Synthetic records only. No real staff, payroll or bank information is included.
export const referenceDate = new Date('2026-11-17T12:00:00Z');
export const workRecords = Array.from({length:180},(_,i)=>{
 const date=new Date(referenceDate);date.setUTCDate(date.getUTCDate()-179+i);
 const weekday=date.getUTCDay(),working=weekday!==5;
 const hours=working?7+((i*7)%12)/10:0;
 return {date:date.toISOString().slice(0,10),hours,special:working&&i%8===0?2:0,tasks:working&&i%3===0?1:0,mission:working&&i%23===0?1:0,start:working?'۰۸:۱۰':'—',end:working?'۱۶:۲۰':'—'};
});
export const moneyRecords=Array.from({length:6},(_,i)=>{
 const date=new Date(Date.UTC(2026,5+i,10)).toISOString().slice(0,10);
 return [{id:'salary'+i,date,kind:'salary',title:'واریز حقوق',amount:360000000+i*10000000},{id:'bonus'+i,date,kind:'bonus',title:'پاداش حضور ویژه',amount:12000000+i*2000000},{id:'installment'+i,date,kind:'installment',title:'پرداخت قسط وام',amount:20000000}];
}).flat();
export const slideTopics=[
 {name:'فعالیت‌ها و تسک‌ها',short:'فعالیت',unit:'کار',key:'tasks',icon:'grid'},
 {name:'کارکرد و حضور',short:'کارکرد',unit:'ساعت',key:'hours',icon:'clock'},
 {name:'حضور ویژه و پاداش',short:'حضور ویژه',unit:'ساعت',key:'special',icon:'spark'},
 {name:'حقوق و دریافتی‌ها',short:'دریافتی',unit:'ریال',key:'salary',icon:'wallet'},
 {name:'وام و اقساط',short:'اقساط',unit:'ریال',key:'installment',icon:'layers'},
 {name:'مأموریت‌ها',short:'مأموریت',unit:'مأموریت',key:'mission',icon:'pin'},
];
