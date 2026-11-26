const test = require('node:test');
const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {createHash,randomBytes,randomUUID} = require('node:crypto');
const {Pool} = require('pg');
const {createHandler,receiptInput} = require('../live/api.cjs');

test('Validate weight, fineness and photos before writing',()=>{
 const base={requestId:randomUUID(),mass:'0.000001',purity:null,reference:'test',metal:'gold'};
 assert.equal(receiptInput(base).purity,null);
 assert.equal(receiptInput({...base,purity:0}).purity,'0');
 assert.equal(receiptInput({...base,purity:'1000'}).purity,'1000');
 for(const mass of ['0','-1','4e13','1.0000001'])assert.throws(()=>receiptInput({...base,mass}));
 assert.throws(()=>receiptInput({...base,purity:'1000.0001'}));
 assert.throws(()=>receiptInput({...base,photo:'data:image/png;base64,QUJD'}));
});

test('PostgreSQL receipt survives new server connection, distinct sessions, concurrent duplicate submits and retry',{skip:!process.env.ERP_TEST_DATABASE_URL},async t=>{
 const uri=process.env.ERP_TEST_DATABASE_URL;
 const schema='erp_test_'+randomUUID().replaceAll('-','');
 const admin=new Pool({connectionString:uri,max:1});
 await admin.query('CREATE SCHEMA '+schema);
 let db;
 const dbConn=()=>db=new Pool({connectionString:uri,options:'-c search_path='+schema,max:3});
 t.after(async()=>{
  if(db)await db.end();
  try{await admin.query('DROP SCHEMA '+schema+' CASCADE');}finally{await admin.end();}
 });
 const creds={manager:randomBytes(32).toString('hex'),staff:randomBytes(32).toString('hex')};
 const h=role=>createHash('sha256').update(creds[role]).digest('hex');
 const cfg={DATABASE_URL:'postgres://isolated-test',ERP_MANAGER_SHA256:h('manager'),ERP_STAFF_SHA256:h('staff')};
 let handle=createHandler(cfg,dbConn);
 const server=createServer((req,res)=>handle(req,res));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await new Promise(r=>server.close(r));});
 const host='127.0.0.1:'+server.address().port;
 async function request(path,body,cookie,origin='https://'+host){
  const headers={origin,'content-type':'application/json'};if(cookie)headers.cookie=cookie;
  return fetch('http://'+host+'/api/live/'+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined});
 }
 assert.equal((await request('receipts')).status,401);
 const sc=(await request('login',{role:'staff',code:creds.staff})).headers.get('set-cookie');
 assert.match(sc,/HttpOnly; Secure; SameSite=Strict/);
 const staff=sc.split(';')[0];
 const manager=(await request('login',{role:'manager',code:creds.manager})).headers.get('set-cookie').split(';')[0];
 assert.notEqual(manager,staff);
 const payload={requestId:randomUUID(),reference:'Synthetic Ag assay',metal:'silver',mass:'105.231',purity:'1000',
 photo:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='};
 assert.equal((await request('receipts',payload,staff,'https://other.example')).status,403);
 const responses=await Promise.all([request('receipts',payload,staff),request('receipts',payload,staff)]);
 assert.equal(responses[0].status,200);assert.equal(responses[1].status,200);
 const [a,b]=await Promise.all(responses.map(r=>r.json()));
 assert.deepEqual(a,b);assert.equal(a.receipt.createdBy,'staff');assert.equal(a.receipt.approvedBy,'smart-manager');
 assert.equal((await request('receipts',{...payload,mass:'10'},staff)).status,409);
 const photo='receipts/'+a.receipt.id+'/photo';
 assert.equal((await request(photo)).status,401);assert.equal((await request(photo,null,manager)).headers.get('content-type'),'image/png');
 await db.end();db=null;handle=createHandler(cfg,dbConn);
 const list=await (await request('receipts',null,manager)).json();
 assert.equal(list.receipts.length,1);assert.deepEqual(list.receipts[0],a.receipt);
 await t.test('Track custody, concurrent workflow requests, role boundaries and weight reconciliation',async()=>{
  const path='receipts/'+a.receipt.id+'/workflow';
  const read=async cookie=>{
   const response=await request(path,null,cookie);
   assert.equal(response.status,200);
   return response.json();
  };
  const apply=async (body,cookie,expectedStatus=200)=>{
   const response=await request(path,body,cookie);
   const result=await response.json();
   assert.equal(response.status,expectedStatus,JSON.stringify(result));
   return result;
  };
  const initial=await read(manager);
  assert.equal(initial.workflow.version,0);
  assert.equal(initial.workflow.state,'ready');
  assert.equal(initial.workflow.custody,'behnam');
  assert.equal(Number(initial.workflow.availableMass),105.231);
  assert.equal(initial.events.length,0);
  const start={requestId:randomUUID(),version:0,kind:'start',stage:'melt'};
  await Promise.all([apply(start,staff),apply(start,staff)]);
  const active=await read(manager);
  assert.equal(active.workflow.version,1);
  assert.equal(active.workflow.state,'active');
  assert.equal(active.workflow.operator,'staff');
  assert.equal(active.events.length,1);
  await apply({...start,requestId:randomUUID()},staff,409);
  await apply({requestId:randomUUID(),version:1,kind:'record',note:'Scale verified'},staff);
  const complete={requestId:randomUUID(),version:2,kind:'complete',outputMass:'100',residualMass:'5',outputPurity:null};
  assert.ok((await request(path,complete,staff)).status>=400);
  assert.equal((await read(manager)).workflow.version,2);
  // Output and residual were weighed separately. The difference remains open
  // for investigation and must not silently become a physical output.
  await apply({...complete,requestId:randomUUID(),note:'0.231 g pending investigation'},staff);
  const finished=await read(manager);
  assert.equal(finished.workflow.state,'ready');
  assert.equal(finished.workflow.version,3);
  assert.equal(Number(finished.workflow.availableMass),100);
  assert.deepEqual(finished.events.map(e=>e.kind),['start','record','complete']);
  const endEvent=finished.events[2];
  assert.equal(Number(endEvent.outputMass),100);
  assert.equal(Number(endEvent.residualMass),5);
  assert.equal(Number(endEvent.unreconciledMass),0.231);
  assert.equal(endEvent.outputPurity,null);
  await apply({requestId:randomUUID(),version:3,kind:'start',stage:'polish'},manager);
  const managedRecord={requestId:randomUUID(),version:4,kind:'record',note:'Polishing in progress'};
  await apply(managedRecord,staff,403);
  await apply({...managedRecord,requestId:randomUUID()},manager);
  const managed=await read(staff);
  assert.equal(managed.workflow.operator,'manager');
  assert.equal(managed.workflow.version,5);
  assert.equal(managed.events.length,5);
 });
 assert.equal((await request('logout',{},staff)).status,200);
 assert.equal((await request('receipts',null,staff)).status,401);
});
