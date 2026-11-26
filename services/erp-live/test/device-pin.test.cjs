const test=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID,randomBytes}=require('node:crypto');
const {Pool}=require('pg');
const device=require('../live/device-pin.cjs');
test('PIN is scoped to one account, browser, and credential version with enforceable expiration and failure limit',{skip:!process.env.ERP_TEST_DATABASE_URL},async t=>{
 const uri=process.env.ERP_TEST_DATABASE_URL;
 const ns='erp_pin_test_'+randomUUID().replaceAll('-','');
 const admin=new Pool({connectionString:uri,max:1});
 await admin.query('CREATE SCHEMA '+ns);
 const db=new Pool({connectionString:uri,options:'-c search_path='+ns,max:8});
 t.after(async()=>{await db.end();try{await admin.query('DROP SCHEMA '+ns+' CASCADE');}finally{await admin.end();}});
 await db.query(device.schema);
 const account='sonia', credential=randomBytes(32).toString('hex');
 const req={headers:{}},res={appendHeader(key,value){assert.equal(key,'Set-Cookie');this.cookie=value;}};
 async function enroll(pin){
  assert.equal((await device.enroll(db,req,res,account,credential,pin)).enabled,true);
  assert.match(res.cookie,/HttpOnly; Secure; SameSite=Strict/);req.headers.cookie=res.cookie.split(';')[0];
 }
 await assert.rejects(device.enroll(db,req,res,account,credential,'12'),{status:400});
 await enroll('۱۲۳۴');
 assert.equal(await device.hasPin(db,req,account,credential),true);
 assert.equal(await device.verify(db,req,account,credential,'١٢٣٤'),true);
 assert.equal(await device.verify(db,{headers:{}},account,credential,'1234'),false);
 assert.equal(await device.verify(db,req,'manager',credential,'1234'),false);
 assert.equal(await device.hasPin(db,req,account,'replaced-password-hash'),false);
 const old={headers:{...req.headers}};
 await enroll('2345');
 assert.equal(await device.verify(db,old,account,credential,'1234'),false);
 const attempts=await Promise.all(Array.from({length:7},()=>device.verify(db,req,account,credential,'2222')));
 assert.ok(attempts.every(v=>!v));assert.equal(await device.verify(db,req,account,credential,'2345'),false);
 await enroll('5432');
 await db.query("UPDATE erp_live_device_pins SET expires_at=now()-interval '1 hour'");
 assert.equal(await device.verify(db,req,account,credential,'5432'),false);
 await enroll('4567');
 assert.equal(await device.verify(db,req,account,credential,'4567'),true);
 assert.equal((await device.revoke(db,req,res,account)).enabled,false);assert.match(res.cookie,/Max-Age=0/);
 assert.equal(await device.verify(db,req,account,credential,'4567'),false);
});
