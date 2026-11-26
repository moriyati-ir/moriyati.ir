'use strict';

const {existsSync} = require('node:fs');
const media=require('./workspace-media.cjs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {isDeepStrictEqual: equal} = require('node:util');

const schema = `
 CREATE TABLE IF NOT EXISTS erp_workspace (
  id smallint PRIMARY KEY CHECK (id=1),
  revision integer NOT NULL DEFAULT 0,
  state jsonb NOT NULL
 );`;

const fail = (status, message) => Object.assign(new Error(message), {status});
const denied = () => fail(403, 'این تغییر در اختیار حساب شما نیست.');
const invalid = () => fail(400, 'ساختار دادهٔ میزکار معتبر نیست.');
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const safeId = s => typeof s === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(s);
const legacyId = id => typeof id === 'string' && id.startsWith('prior-');
const stale = () => fail(409,'میزکار تغییر کرده است. صفحه را تازه کنید و تغییرتان را دوباره ثبت کنید.');
let modules;
function loadModel(){
 if (!modules) {
  const packaged = path.resolve(__dirname,'../erp');
  const root = existsSync(path.join(packaged,'policy.mjs')) ? packaged : path.resolve(__dirname,'../../../dist/erp');
  const load = name => import(pathToFileURL(path.join(root,name+'.mjs')).href);
  modules = Promise.all([load('factory-entry-model'),load('policy')]).then(([factory,policy])=>({factory,policy}));
 }
 return modules;
}
function emptyState(model){
 const factory = model.factory.makeFactoryState({demo:false});
 return {factory,tasks:[],financeRecords:[],accounts:{}};
}
function directorySpace(userId,roles) {
 const contacts = Object.entries(roles)
  .filter(([id])=>id!==userId&&!['office','employee'].includes(id))
  .map(([id,r])=>({id,name:r.name,initial:r.name[0]}));
 contacts.unshift({id:'self',name:'یادداشت‌های من',initial:'م'});
 return {messages:Object.fromEntries(contacts.map(c=>[c.id,[]])),contacts,notifications:[]};
}
function project(state, user, model){
 const {capabilities:cap,isHR,isManagement,canSeeNotification,canViewTask} = model.policy;
 const own = r => r.actor===user||r.owner===user||r.userId===user;
 const manager=isManagement(user), hr=isHR(user), finance=cap.finance(user);
 const tasks=state.tasks.filter(t=>canViewTask(user,t));
 const ids=new Set(tasks.map(t=>t.id));
 const related=r=>ids.has(r.taskId);
 const canStock=r=>manager||own(r)||related(r);
 const rules={
  packets:canStock, receipts:r=>manager||own(r),
  handovers:r=>manager||r.sender===user||r.receiver===user,
  reservations:canStock, workSessions:r=>hr||own(r)||related(r), consumptions:canStock,
  tools:()=>cap.equipment(user)||cap.production(user),supplies:()=>true,
  devices:r=>user==='alireza'||r.viewers?.includes(user)||r.controllers?.includes(user),
  solutions:()=>cap.solutions(user),recoveries:r=>cap.recovery(user)&&(manager||own(r)||related(r)),
  products:r=>cap.products(user)||cap.shipping(user)||related(r),
  shipments:r=>cap.shipping(user)||r.receiver===user,
  assaySessions:r=>manager||r.operator===user, assays:r=>manager||own(r)||related(r),
  trips:r=>cap.trips(user)&&(manager||own(r)||r.participants?.some(p=>p.userId===user)),
  accounts:()=>finance,journal:()=>finance,payments:r=>finance&&(user!=='haji'||r.category!=='personnel'),
  expenses:r=>finance||own(r),cashRequests:r=>finance||own(r),
  financialRecords:r=>hr||r.userId===user, hrRequests:r=>hr||own(r),
  payroll:r=>hr||r.userId===user,awards:r=>hr||own(r),attendance:r=>hr||own(r),
  schedules:r=>hr||r.userId===user, emergency:r=>r.issuer===user||r.target===user,
  loginRequests:r=>r.owner===user,
  audit:r=>hr||(manager&&!/^(hr|payroll|attendance|schedule|emergency|request-login|approve-login)/.test(r.type))||r.actor===user,
  archive:r=>user==='alireza'||r.actor===user,
  notifications:r=>canSeeNotification(user,r,state.tasks)
 };
 const factory={};
 for(const [key,value] of Object.entries(state.factory)){
  if(Array.isArray(value)) factory[key]=rules[key]?value.filter(rules[key]):[];
 }
 for(const key of ['version','connection','integrations','settings','identities']){
  if(state.factory[key]!==undefined)factory[key]=state.factory[key];
 }
 const dossiers=state.factory.dossiers||{};
 factory.dossiers=hr?dossiers:(Object.hasOwn(dossiers,user)?{[user]:dossiers[user]}:{});
 const invitations=state.tasks.filter(t=>!ids.has(t.id)&&t.members?.some(m=>m.userId===user&&m.state==='invited'));
 for(const t of invitations) tasks.push({id:t.id,title:t.title,type:t.type,status:t.status,stages:[],members:t.members.filter(m=>m.userId===user)});
 // Equipment may be selectable for a member's own work without granting access to other work histories.
 if(!cap.equipment(user))factory.tools=factory.tools.map(tool=>({...tool,uses:(tool.uses||[]).filter(r=>own(r)||related(r)),workload:null}));
 return {tasks,factory,financeRecords:finance?state.financeRecords:[],
  accounts:{[user]:state.accounts[user]||directorySpace(user,model.policy.roles)}};
}
function safeInput(data){
 // JSON can contain names that shadow object properties in the browser's maps.
 const stack=[data];
 while(stack.length){
  const v=stack.pop();
  if (!v||typeof v!=='object')continue;
  for(const k of Object.keys(v)){
   if(['__proto__','constructor','prototype'].includes(k))throw invalid();
   if(v[k]&&typeof v[k]==='object')stack.push(v[k]);
  }
 }
}
function listChanges(previous,next,visitor){
 if(!Array.isArray(next)||!Array.isArray(previous))throw invalid();
 const index=new Map(previous.map(x=>[x.id,x]));
 const seen=new Set();
 for(const row of next){
  if(!plain(row)||!safeId(row.id)||seen.has(row.id))throw invalid();
  seen.add(row.id);
  const old=index.get(row.id);
  if(!equal(old,row))visitor(old,row);
 }
 if(previous.some(r=>!seen.has(r.id)))throw denied();
}
function replace(rows,before,after){
 if(!before){if(rows.some(r=>r.id===after.id))throw denied();rows.unshift(after);}
 else rows[rows.findIndex(r=>r.id===before.id)]=after;
}
function writeWorkshopTask(state,actor,p,old,next){
 const roles=p.roles;
 if(!next.workshop||next.domain==='hr'||!Array.isArray(next.stages)||!next.stages.length||
    !Array.isArray(next.members)||!next.members.every(m=>Object.hasOwn(roles,m.userId))||
    !next.members.some(m=>m.userId===next.ownerId&&m.active!==false&&m.state==='accepted'))throw denied();
 if(old){
  if(!old.workshop||old.creatorId!==next.creatorId||old.type!==next.type||old.domain!==next.domain||
     !(actor==='alireza'||(old.ownerId===actor&&!['done','cancelled'].includes(old.status))))throw denied();
 }else if(next.creatorId!==actor||next.ownerId!==actor||!['general','production'].includes(next.type)||
   (next.type==='production'&&!p.capabilities.production(actor)))throw denied();
 const persisted=state.tasks.find(t=>t.id===next.id);
 if(persisted&&!equal(persisted,old))throw denied();
 if(!['active','paused','done','waiting','cancelled'].includes(next.status))throw invalid();
 replace(state.tasks,old,next);
}
function cleanImported(state){
 const without=rows=>Array.isArray(rows)?rows.filter(r=>!legacyId(r?.id)):rows;
 return {...state,tasks:without(state.tasks),factory:{...state.factory,receipts:without(state.factory?.receipts),packets:without(state.factory?.packets)}};
}
function applySnapshot(state,revision,submitted,actor,model){
 if(!plain(submitted)||!plain(submitted.accounts)||Object.keys(submitted.accounts).length!==1||
    !plain(submitted.accounts[actor])||!plain(submitted.factory))throw denied();
 const next=cleanImported(submitted);
 const view=project(state,actor,model);
 const personal=next.accounts[actor];
 if(!plain(personal.messages)||!Array.isArray(personal.contacts)||!Array.isArray(personal.notifications))throw invalid();
 if(!equal(next.financeRecords,view.financeRecords))throw denied();
 listChanges(view.tasks,next.tasks,(old,row)=>writeWorkshopTask(state,actor,model.policy,old,row));
 for(const key of new Set([...Object.keys(view.factory),...Object.keys(next.factory)])){
  const previous=view.factory[key], updated=next.factory[key];
  if(equal(previous,updated))continue;
  if(key==='identities'){
   if(!plain(updated)||!Object.hasOwn(updated,actor)||!equal(updated[actor],personal.identity))throw denied();
   for(const id of new Set([...Object.keys(previous||{}),...Object.keys(updated)]))
    if(id!==actor&&!equal(previous?.[id],updated[id]))throw denied();
   (state.factory.identities||={})[actor]=updated[actor];
  }else if(key==='archive'){
   listChanges(previous,updated,(old,r)=>{
    if(old||r.actor!==actor||!['message-edit','message-delete'].includes(r.type))throw denied();
    replace(state.factory.archive,null,r);
   });
  }else if(key==='products'){
   listChanges(previous,updated,(old,row)=>{
    const task=state.tasks.find(t=>t.id===row.taskId);
    if(!task?.workshop||!(actor==='alireza'||task.ownerId===actor)||!row.serial||
       !task.stages.some(s=>s.reports?.some(r=>r.serial===row.serial))||
       state.factory.products.some(p=>p.serial===row.serial&&p.id!==row.id))throw denied();
    if(old&&(old.taskId!==row.taskId||old.serial!==row.serial||old.qc!==row.qc||old.location!==row.location||
       old.packaged!==row.packaged||old.packetId!==row.packetId))throw denied();
    if(!old&&(row.qc!=='pending'||row.packaged!==true||row.location!==task.location||row.packetId))throw denied();
    replace(state.factory.products,old,row);
   });
  }else throw denied();
 }
 state.accounts[actor]=personal;
 return state;
}
const stageTitles={melt:'ذوب',refine:'پالایش',polish:'پرداخت',mint:'ضرب',pack:'بسته‌بندی'};
async function addPriorReceipts(db,view,person,model){
 if(!person.permissions.receipts)return view;
 // Keep the existing receipt ledger and custody history authoritative. Only alias its
 // view into the workspace. Private attachments continue through the scoped photo API.
 const result=await db.query(`SELECT r.id,r.reference,r.metal,r.mass,r.purity,r.created_at,r.created_by_user,r.assignee_user,
  r.photo_type IS NOT NULL AS photo,
  COALESCE((SELECT json_agg(json_build_object('id',e.id,'version',e.version,'actor',e.actor_user,
    'date',e.created_at,'stage',e.stage,'kind',e.kind,'note',e.note,'outputMass',e.output_mass::text,
    'residualMass',e.residual_mass::text,'availableMass',e.available_mass::text,'currentPurity',e.current_purity::text,
    'operator',e.operator,'custody',e.custody) ORDER BY e.version)
   FROM erp_live_work_events e WHERE e.receipt_id=r.id),'[]'::json) AS events
  FROM erp_live_receipts r WHERE $1::boolean OR r.created_by_user=$2 OR r.assignee_user=$2
  ORDER BY r.created_at DESC,r.id DESC`,[person.permissions.allReceipts,person.userId]);
 for(const row of result.rows){
  const owner=row.assignee_user||row.created_by_user||'behnam';
  const members=[...new Set([owner,row.created_by_user,row.assignee_user].filter(Boolean))].map(userId=>({userId,state:'accepted',active:true}));
  const id='prior-'+row.id,packetId=id+'-lot';
  const legacyUrl='/live/?receipt='+row.id+'#/receipts';
  const photo=row.photo?'/api/live/receipts/'+row.id+'/photo':null;
  const name=id=>model.policy.roles[id]?.name||'ثبت قبلی';
  const metal=row.metal==='gold'?'طلا':'نقره';
  const last=row.events.at(-1);
  const image=row.metal==='gold'?'./visuals/celestial.webp':'./visuals/silver-cast.webp';
  const date=new Date(row.created_at).toISOString();
  const reports=row.events.map(e=>({id:e.id,date:e.date,authorId:e.actor,author:name(e.actor),title:stageTitles[e.stage]||e.stage,
   text:e.note,weight:e.outputMass,residualMass:e.residualMass,assay:e.currentPurity}));
  view.tasks.push({id,legacyReceiptId:row.id,legacyUrl,code:row.id.slice(0,8),creatorId:row.created_by_user||owner,
   ownerId:owner,owner:name(owner),type:'production',title:row.reference,status:last?.operator?'active':'waiting',
   description:row.reference,cover:image,started:date,weight:row.mass,material:metal,purity:row.purity,location:name(last?.custody||'behnam'),
   targetKind:'mass',team:members.map(m=>name(m.userId)),members,history:[],dependencies:[],
   stages:[{id:id+'-history',name:'سابقه پارت',cover:image,done:false,reports}]});
  view.factory.receipts.push({id,legacyReceiptId:row.id,legacyUrl,counterparty:row.reference,date,actor:row.created_by_user,photo,items:[packetId]});
  view.factory.packets.push({id:packetId,legacyReceiptId:row.id,legacyUrl,receiptId:id,taskId:id,metal,
   form:'بار ثبت‌شده',mass:last?.availableMass??row.mass,originalNet:row.mass,purity:last?last.currentPurity:row.purity,
   certainty:(last?last.currentPurity:row.purity)==null?'unknown':last?'measured':'declared',
   place:name(last?.custody||'behnam'),state:last?.operator?'work':'available',reserved:0,photo});
 }
 return view;
}
async function loadRow(db,model,lock=false){
 const query='SELECT revision,state FROM erp_workspace WHERE id=1'+(lock?' FOR UPDATE':'');
 let row=(await db.query(query)).rows[0];
 if(row)return row;
 await db.query('INSERT INTO erp_workspace(id,state) VALUES(1,$1::jsonb) ON CONFLICT(id) DO NOTHING',[JSON.stringify(emptyState(model))]);
 row=(await db.query(query)).rows[0];
 return row;
}
async function read(db,person){
 const model=await loadModel();
 const row=await loadRow(db,model);
 return {revision:row.revision,state:await addPriorReceipts(db,project(row.state,person.userId,model),person,model)};
}
async function write(db,person,data,command){
 if(!Number.isSafeInteger(data.revision)||data.revision<0)throw invalid();
 safeInput(data);
 const model=await loadModel();
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  const row=await loadRow(client,model,true);
  if(row.revision!==data.revision)throw stale();
  const state=row.state,actor=person.userId;
  let out={};
  const visible=project(state,actor,model);
  const normalized=await media.prepare(client,actor,command?data.data:data.state,visible);
  if(command){
   if(typeof data.command!=='string'||!plain(data.data))throw invalid();
   if(['userId','ownerId','discrepancyOwnerId','receiver','actor'].some(k=>
    data.data[k]!=null&&data.data[k]!==''&&!Object.hasOwn(model.policy.roles,data.data[k])))throw invalid();
   // Never resolve references against records the user cannot even see.
   if(['sync-preview','emergency-code','request-login','approve-login'].includes(data.command))throw denied();
   for(const [key,value] of Object.entries(data.data)){
    if(!['id','taskId','packetId','supplyId','toolId','assayId','accountId','cashRequestId','dependencyId','productIds'].includes(key)||!value)continue;
    const known=new Set([...visible.tasks,...Object.values(visible.factory).filter(Array.isArray).flat()].map(r=>r.id));
    for(const id of Array.isArray(value)?value:[value])if(!known.has(id))throw denied();
   }
   let next;
   try{next=model.factory.transition(state.factory,state.tasks,actor,data.command,data.data);}
   catch(error){throw fail(422,error.message||'عملیات معتبر نیست.');}
   state.factory=next.state;state.tasks=next.tasks;
   out={result:next.result,notice:next.notice};
  }else applySnapshot(state,row.revision,data.state,actor,model);
  const result=await client.query('UPDATE erp_workspace SET state=$1::jsonb,revision=revision+1 WHERE id=1 RETURNING revision',[JSON.stringify(state)]);
  if(command||normalized)out.state=await addPriorReceipts(client,project(state,actor,model),person,model);
  await client.query('COMMIT');
  return {revision:result.rows[0].revision,...out};
 }catch(error){
  await client.query('ROLLBACK'); throw error;
 }finally{client.release();}
}
module.exports={schema,loadModel,emptyState,project,applySnapshot,read,write,addPriorReceipts};
