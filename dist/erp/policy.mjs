export const roles={
 alireza:{name:'علیرضا',title:'مدیرعامل',kind:'manager',hr:true,level:'management'},
 behnam:{name:'بهنام',title:'مدیر کارخانه',kind:'manager',hr:true,level:'management'},
 haji:{name:'حاجی',title:'رئیس هیئت‌مدیره',kind:'manager',hr:false,level:'management'},
 nazanin:{name:'نازنین',title:'مالی و حسابداری',kind:'finance',hr:false,level:'management'},
 majid:{name:'مجید',title:'برق، حفاظت و نگهداری',kind:'employee',hr:false,level:'staff'},
 artour:{name:'آرتور',title:'آهنگری و دستگاه‌سازی',kind:'employee',hr:false,level:'staff'},
 mehrab:{name:'محراب',title:'تحویل، سفر بازار و کنترل نهایی',kind:'employee',hr:false,level:'staff'},
 ghazal:{name:'غزل',title:'آزمایشگاه و پژوهش',kind:'employee',hr:false,level:'staff'},
 ala:{name:'آلا',title:'مدیر هنری',kind:'employee',hr:false,level:'staff'},
 sima:{name:'سیما',title:'آشپزخانه و کافه',kind:'employee',hr:false,level:'staff'},
 malika:{name:'ملیکا',title:'آشپزخانه و کافه',kind:'employee',hr:false,level:'staff'},
 employee:{name:'همکار تولید',title:'اپراتور چندمهارته',kind:'employee',hr:false,level:'staff'},
 office:{name:'دفتر مرکزی',title:'دریافت محموله',kind:'employee',hr:false,level:'staff'},
};
export const isManagement=id=>['alireza','behnam','haji'].includes(id);
export const isHR=id=>['alireza','behnam'].includes(id);
export const capabilities={
 inventory:id=>isManagement(id),
 admission:id=>['alireza','behnam','haji','mehrab'].includes(id),
 handover:id=>['alireza','behnam','haji','mehrab','majid','employee','ghazal','office'].includes(id),
 production:id=>['alireza','behnam','haji','employee','ghazal','mehrab'].includes(id),
 finance:id=>['alireza','behnam','haji','nazanin'].includes(id),
 financeWrite:id=>id==='nazanin',
 limits:id=>isHR(id),
 personnel:id=>isHR(id),
 equipment:id=>['alireza','behnam','haji','majid','artour','employee'].includes(id),
 assay:id=>['alireza','behnam','haji','ghazal','employee','mehrab'].includes(id),
 products:id=>['alireza','behnam','haji','mehrab'].includes(id),
 recovery:id=>['alireza','behnam','haji','employee'].includes(id),
 solutions:id=>['alireza','behnam','haji','ghazal','employee'].includes(id),
 trips:id=>['alireza','behnam','haji','mehrab'].includes(id),
 shipping:id=>['alireza','behnam','haji','mehrab','majid','office'].includes(id),
 cameras:id=>['alireza','behnam','haji','majid'].includes(id),
 emergencyIssuer:id=>isHR(id),
 backup:id=>id==='alireza',
 system:id=>id==='alireza',
 requests:id=>!!roles[id],
 attendance:id=>!!roles[id]&&id!=='haji',
};
export function canViewTask(actor,t){
 if(!t)return false;
 if(t.domain==='hr')return actor!=='haji'&&(isHR(actor)||t.creatorId===actor);
 if(isManagement(actor))return true;
 if(t.status==='requested')return t.creatorId===actor;
 return (t.members||[]).some(m=>m.userId===actor&&m.state==='accepted'&&m.active!==false);
}
export const canManageTask=(actor,t)=>canViewTask(actor,t)&&(isManagement(actor)||t.ownerId===actor);
export function canReport(actor,t){return canViewTask(actor,t)&&!['requested','done','cancelled','paused'].includes(t.status)&&(t.type!=='production'||capabilities.production(actor));}
export function canSeeNotification(actor,n,tasks){
 if(n.recipients?.length&&!n.recipients.includes(actor))return false;
 if(n.domain==='hr'&&!isHR(actor)&&n.ownerId!==actor)return false;
 if(actor==='haji'&&(n.domain==='hr'||n.kind==='pay'))return false;
 if(n.task){const t=tasks.find(t=>t.id===n.task);return n.kind==='invite'?!!t?.members?.some(m=>m.userId===actor&&m.state==='invited'):canViewTask(actor,t);}
 return !n.ownerId||n.ownerId===actor;
}
export function canEmergencyCode(issuer,target){return capabilities.emergencyIssuer(issuer)&&!!roles[target]&&!['alireza','haji'].includes(target);}
export const desktopAccount=id=>['alireza','behnam','haji','nazanin'].includes(id);

const seedMemberships={
 'silver-100':['employee','ghazal','behnam'], 'gold-1':['employee','behnam'],
 'silver-coin':['mehrab','employee'],packaging:['mehrab','employee'],artwork:['ala','artour'],
 'cast-250':['employee'],service:['majid','artour'],'frame-order':['artour','ala'],lab:['ghazal'],
 'completed-pack':['mehrab'],'completed-general':['majid'],'cancelled-general':['artour'],
};
export function normalizeTasks(tasks,legacyActor='alireza'){
 return tasks.map(t=>{
  const members=t.members||((seedMemberships[t.id]||[legacyActor]).map((userId,i)=>({userId,state:'accepted',active:true,responsibility:i?'همکاری':'اجرا'})));
  return {...t,creatorId:t.creatorId||'behnam',ownerId:t.ownerId||members[0]?.userId||legacyActor,discrepancyOwnerId:t.discrepancyOwnerId||members[0]?.userId||legacyActor,members,history:t.history||[],dependencies:t.dependencies||[],targetKind:t.targetKind||(t.quantity?'count':'mass')};
 });
}
