// Shared product identifiers. These are symbolic UI illustrations, not production drawings.
export const media = {
  silver: './visuals/silver-cast.webp',
  granules: './visuals/argentum.webp',
  mint: './visuals/constellation.webp',
  pack: './visuals/constellation.webp',
  gold: './visuals/celestial.webp',
  art: './visuals/artwork.webp',
  lab: './visuals/laboratory.webp',
  coin: './visuals/silver-coin.webp',
  frame: './visuals/artwork.webp',
  strip: './visuals/silver-sheet.webp',
  equipment: './visuals/rolling-mill.webp',
  courtyard: './visuals/courtyard.webp',
  investment: './visuals/investment.webp',
  bespoke: './visuals/bespoke.webp',
};

export const productCatalog = [
  {id:'celestial',name:'Celestial',title:'شمش طلای ضربی',detail:'طلا 995.0 · ۱، ۵، ۱۰، ۲۰ گرم و یک اونس',image:media.gold},
  {id:'artwork',name:'Artwork',title:'شمش طلای هنری',detail:'طلا 995.0 · ۵۰ و ۱۰۰ گرم',image:media.art},
  {id:'courtyard',name:'The Courtyard',title:'شمش طلای کست',detail:'طلا 995.0 · ۲۵۰، ۵۰۰ و ۱۰۰۰ گرم',image:media.courtyard},
  {id:'constellation',name:'Constellation',title:'شمش نقره ضربی',detail:'نقره 999.9 · ۱۰، ۲۰، ۵۰، ۱۰۰ گرم و یک اونس',image:media.mint},
  {id:'argentum',name:'Argentum',title:'ساچمه نقره',detail:'نقره 995.0 / 999.9 · ۱، ۲ و ۵ کیلوگرم',image:media.granules},
  {id:'investment',name:'Investment',title:'نقره تقسیم‌پذیر',detail:'نقره 990.0 · تخته ۱۰۰ گرمی',image:media.investment},
  {id:'bespoke',name:'Bespoke Editions',title:'بسته‌بندی سفارشی',detail:'هنر و بسته‌بندی اختصاصی محصول',image:media.bespoke},
  {id:'silver-cast',name:'Argentum · Cast',title:'شمش نقره کست',detail:'۲۵۰، ۵۰۰ و ۱۰۰۰ گرم',image:media.silver},
  {id:'silver-coin',name:'Silver Coin',title:'سکه نقره',detail:'نقره 999.9 · یک اونس',image:media.coin},
];

const legacyImages = new Map([
  ['../assets/v8/argentum-cast-detail.webp',media.silver],
  ['./photos/granules.jpeg',media.granules],
  ['./photos/silver-100.jpeg',media.mint],
  ['./photos/packaging.png',media.pack],
  ['./photos/gold-1g.png',media.gold],
  ['./photos/artwork.jpeg',media.art],
  ['../assets/expertise-silver.webp',media.lab],
  ['../assets/motion/v7/medallion-lion-emboss.webp',media.coin],
]);

// Upgrade only known built-in media. Preserve uploaded pictures and local task/report data.
export function upgradeWorkspaceVisuals(workspace,seeds=[]){
  if(!workspace||typeof workspace!=='object')return workspace;
  const isLegacy=src=>typeof src==='string'&&legacyImages.has(src);
  const visit=(value,key='')=>{
    if(Array.isArray(value))return value.map(v=>visit(v));
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,visit(v,k)]));
    return ['cover','src','image'].includes(key)&&isLegacy(value)?legacyImages.get(value):value;
  };
  const updated=visit(workspace);
  if(Array.isArray(workspace.tasks))updated.tasks=workspace.tasks.map((task,i)=>{
    const next=updated.tasks[i],seed=seeds.find(s=>s.id===task.id);
    if(!seed)return next;
    if(isLegacy(task.cover))next.cover=seed.cover;
    task.stages?.forEach((stage,j)=>{
      const seedStage=seed.stages?.find(s=>s.id===stage.id),newStage=next.stages[j];
      if(!seedStage)return;
      if(isLegacy(stage.cover))newStage.cover=seedStage.cover;
      stage.reports?.forEach((report,k)=>{
        const seedReport=seedStage.reports?.find(r=>r.id===report.id);
        if(seedReport&&isLegacy(report.image))newStage.reports[k].image=seedReport.image;
      });
    });
    return next;
  });
  return updated;
}
