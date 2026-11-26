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
 assert.equal((await request('logout',{},staff)).status,200);
 assert.equal((await request('receipts',null,staff)).status,401);
});
