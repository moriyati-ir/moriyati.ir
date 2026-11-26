'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const store=require('../live/workspace.cjs');
const {Pool}=require('pg');

function task(id,actor,others=[]){
 return {id,workshop:true,type:'general',title:'بازبینی سفارش',status:'active',creatorId:actor,ownerId:actor,
  members:[actor,...others].map(userId=>({userId,state:'accepted',active:true})),stages:[{id:'start',reports:[]}],history:[]};
}
async function sequential(db,actor,data,command=false){
 return store.write(db,{userId:actor,permissions:{receipts:false}},data,command);
}
test('Live state uses no sample transactions and projects staff work, finance and personnel by identity',async()=>{
 const model=await store.loadModel(), s=store.emptyState(model);
 assert.deepEqual(s.tasks,[]);assert.deepEqual(s.factory.packets,[]);assert.deepEqual(s.factory.payments,[]);
 s.tasks.push(task('mine','sonia',['kimia']),task('theirs','behnam'));
 s.factory.dossiers.kimia={note:'private'};s.factory.journal.push({id:'secret'});s.factory.payroll.push({id:'wage',userId:'kimia'});
 s.accounts.kimia={messages:{self:[{text:'private'}]}};
 const visible=store.project(s,'sonia',model);
 assert.deepEqual(visible.tasks.map(t=>t.id),['mine']);
 assert.deepEqual(visible.factory.dossiers,{});assert.deepEqual(visible.factory.journal,[]);assert.deepEqual(visible.factory.payroll,[]);
 assert.deepEqual(Object.keys(visible.accounts),['sonia']);
});
test('Cannot claim another worker’s task or another account namespace; cannot forge financial or inventory rows',async()=>{
 const model=await store.loadModel(),s=store.emptyState(model);
 s.tasks.push(task('reserved','kimia'),task('group','behnam',['sonia']));
 const mutate=fn=>{
  const v=structuredClone(store.project(s,'sonia',model));fn(v);
  assert.throws(()=>store.applySnapshot(structuredClone(s),1,v,'sonia',model),{status:403});
 };
 mutate(v=>v.tasks.push(task('reserved','sonia')));
 mutate(v=>{v.tasks[0].ownerId='sonia';});
 mutate(v=>{v.accounts.kimia={messages:{},contacts:[],notifications:[]};});
 mutate(v=>{v.factory.packets.push({id:'forged',mass:'100'});});
 mutate(v=>{v.financeRecords.push({id:'forged'});});
});
test('Separate staff, concurrency, rollback, snapshots, DB recovery and preserved prior intake through real PostgreSQL',
 {skip:!process.env.ERP_TEST_DATABASE_URL},async t=>{
 const schemaName='w_'+randomUUID().replaceAll('-','');
 const admin=new Pool({connectionString:process.env.ERP_TEST_DATABASE_URL});
 await admin.query('CREATE SCHEMA '+schemaName);
 const connect=()=>new Pool({connectionString:process.env.ERP_TEST_DATABASE_URL,options:'-c search_path='+schemaName});
 const db=connect(),other=connect();
 t.after(async()=>{await Promise.all([db.end(),other.end()]);await admin.query('DROP SCHEMA '+schemaName+' CASCADE');await admin.end();});
 await db.query(store.schema);
 const who=id=>({userId:id,permissions:{receipts:false}});
 const first=await store.read(db,who('sonia'));
 const v=first.state;
 v.tasks.push(task('swork','sonia',['kimia']));
 v.accounts.sonia.messages.self.push({id:'message',text:'یادداشت شخصی'});
 const creates=await Promise.allSettled([sequential(db,'sonia',{revision:first.revision,state:v}),sequential(other,'sonia',{revision:first.revision,state:v})]);
 assert.equal(creates.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(creates.find(x=>x.status==='rejected').reason.status,409);
 const kimia=await store.read(other,who('kimia'));
 assert.deepEqual(kimia.state.tasks.map(k=>k.id),['swork']);
 assert.deepEqual(kimia.state.accounts.kimia.messages.self,[]);
 assert.deepEqual((await store.read(other,who('sima'))).state.tasks,[]);
 const forged=structuredClone(kimia.state);forged.tasks[0].ownerId='kimia';
 await assert.rejects(sequential(db,'kimia',{revision:kimia.revision,state:forged}),{status:403});
 const attendance=await sequential(other,'sonia',{revision:kimia.revision,command:'attendance-in',data:{day:'2026-11-26',time:'09:00'}},true);
 assert.equal(attendance.revision,kimia.revision+1);
 assert.equal(attendance.state.factory.attendance[0].actor,'sonia');
 assert.deepEqual((await store.read(db,who('kimia'))).state.factory.attendance,[]);
 const privateRead=await store.read(other,who('sonia'));
 assert.equal(privateRead.state.accounts.sonia.messages.self[0].text,'یادداشت شخصی');
 await db.query('CREATE TABLE erp_live_receipts(id uuid PRIMARY KEY,reference text,metal text,mass numeric,purity numeric,created_at timestamptz,created_by_user text,assignee_user text,photo_type text)');
 await db.query(require('../live/workflow.cjs').schema+"ALTER TABLE erp_live_work_events ADD COLUMN actor_user text");
 const media=require('../live/workspace-media.cjs');
 await db.query('CREATE TABLE erp_people(user_id text PRIMARY KEY)');
 await db.query("INSERT INTO erp_people VALUES ('sonia'),('kimia'),('sima')");
 await db.query(media.schema);
 const jpeg='data:image/jpeg;base64,/9j/2Q==';
 const upload=await media.put(db,'sonia',jpeg);
 assert.equal(await media.put(db,'sonia',jpeg),upload);
 const id=upload.split('/').at(-1);
 const response=()=>({writeHead(code,headers){this.status=code;this.headers=headers;},end(body){this.body=body;}});
 const mine=response();
 await media.file(db,id,'sonia',async()=>({}),mine);
 assert.equal(mine.headers['Content-Type'],'image/jpeg');
 await assert.rejects(media.file(db,id,'sima',async()=>({}),response()),{status:404});
 await assert.rejects(media.prepare(db,'sima',{photo:upload},{}),{status:404});
 const note=await store.read(other,who('sonia'));
 note.state.tasks[0].cover=jpeg;
 const saved=await sequential(db,'sonia',{revision:note.revision,state:note.state});
 assert.equal(saved.state.tasks[0].cover,upload);
 await media.file(db,id,'kimia',async()=>(await store.read(other,who('kimia'))).state,response());
 await assert.rejects(sequential(other,'sonia',{revision:saved.revision,command:'sync-preview',data:{}},true),{status:403});
 // Model fixture simulates the result of the authorized product/packaging transition.
 await db.query(`UPDATE erp_workspace SET state=jsonb_set(state,'{factory,products}',$1::jsonb)`,
 [JSON.stringify([{id:'UNIT-42',serial:'MT-42',title:'شمش',net:'8',gross:'9',purity:'999',taskId:'private-task',packaging:[
  {id:'EVT-1',active:true,front:upload,back:upload,date:'2026-11-26',secret:'not public'},
  {id:'EVT-0',active:false,front:upload,back:upload}]}])]);
 const qr=event=>new URLSearchParams({serial:'MT-42',event,side:'front'});
 const info=response();
 await media.verify(db,qr('EVT-1'),info,(res,status,v)=>res.end(v),false);
 assert.equal(info.body.product.active,true);assert.equal(info.body.product.serial,'MT-42');
 assert.ok(!JSON.stringify(info.body).includes('private-task'));
 assert.ok(!JSON.stringify(info.body).includes(id));
 assert.ok(!JSON.stringify(info.body).includes('not public'));
 await media.verify(db,qr('EVT-1'),response(),null,true);
 await assert.rejects(media.verify(db,qr('EVT-0'),response(),null,true),{status:404});
 await assert.rejects(media.verify(db,qr('bad-pair'),response(),null,false),{status:404});
 const oldId=randomUUID();
 await db.query("INSERT INTO erp_live_receipts VALUES ($1,'رسید قبلی','silver',21,999,now(),'mehrab','sonia','image/webp')",[oldId]);
 const user=id=>({userId:id,permissions:{receipts:true,allReceipts:false}});
 const preserved=await store.read(db,user('sonia'));
 assert.equal(preserved.state.tasks.find(r=>r.legacyReceiptId===oldId).weight,'21');
 assert.equal(preserved.state.factory.receipts[0].photo,'/api/live/receipts/'+oldId+'/photo');
 assert.equal((await store.read(db,user('kimia'))).state.factory.receipts.length,0);
 await store.write(db,user('sonia'),{revision:preserved.revision,state:preserved.state},false);
 assert.equal((await db.query("SELECT jsonb_array_length(state->'tasks') n FROM erp_workspace")).rows[0].n,1);
});
