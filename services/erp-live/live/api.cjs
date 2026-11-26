'use strict';
const {createHash, randomBytes, randomUUID, timingSafeEqual} = require('node:crypto');
const {Pool} = require('pg');

const workflow = require('./workflow.cjs');
const hours = 12;
const maxImage = 4 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const digest = value => createHash('sha256').update(value).digest('hex');
const publicColumns = `id,created_at AS "createdAt",metal,mass::text,purity::text,reference,
 created_by AS "createdBy",approved_by AS "approvedBy",recipient,
 photo_type IS NOT NULL AS "photoAvailable"`;
const schema = `
 CREATE TABLE IF NOT EXISTS erp_live_sessions(
  token_hash text PRIMARY KEY, role text NOT NULL CHECK(role IN ('manager','staff')),
  credential_hash text NOT NULL, expires_at timestamptz NOT NULL);
 CREATE TABLE IF NOT EXISTS erp_live_receipts(
  id uuid PRIMARY KEY, request_id uuid NOT NULL, payload_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), created_by text NOT NULL CHECK(created_by IN ('manager','staff')),
  metal text NOT NULL CHECK(metal IN ('gold','silver')),
  mass numeric(19,6) NOT NULL CHECK(mass>0),purity numeric(8,4) CHECK(purity BETWEEN 0 AND 1000),
  reference text NOT NULL, recipient text NOT NULL CHECK(recipient='behnam'),
  approved_by text NOT NULL CHECK(approved_by='smart-manager'),
  photo_type text, photo_bytes bytea,
  CHECK((photo_type IS NULL)=(photo_bytes IS NULL)), UNIQUE(created_by,request_id));
 CREATE INDEX IF NOT EXISTS erp_live_receipts_date ON erp_live_receipts(created_at DESC,id DESC);`;

function problem(status, message){ return Object.assign(new Error(message), {status}); }
function json(res,status,value){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end(JSON.stringify(value));
}
async function readInput(req){
 if(req.headers['content-type']?.split(';')[0]!=='application/json') throw problem(415,'دادهٔ درخواست باید JSON باشد.');
 let length=0;
 const chunks=[];
 for await(const chunk of req){
  length+=chunk.length;
  if(length>Math.ceil(maxImage*4/3)+8192) throw problem(413,'حجم فایل بیش از حد مجاز است.');
  chunks.push(chunk);
 }
 try{
  const data=JSON.parse(Buffer.concat(chunks).toString());
  if(!data || Array.isArray(data) || typeof data!=='object') throw new Error();
  return data;
 }catch{throw problem(400,'ساختار درخواست معتبر نیست.');}
}
function parsePhoto(value){
 if(value==null || value==='')return {mime:null,bytes:null};
 if(typeof value!=='string'||value.length>Math.ceil(maxImage*4/3)+100)throw problem(413,'حداکثر حجم عکس چهار مگابایت است.');
 const comma=value.indexOf(',');
 const info=value.slice(0,comma),mime=info.slice(5,-7);
 if(!['data:image/jpeg;base64','data:image/png;base64','data:image/webp;base64'].includes(info))throw problem(400,'عکس باید JPEG، PNG یا WebP باشد.');
 const encoded=value.slice(comma+1);
 const bytes=Buffer.from(encoded,'base64');
 if(bytes.length>maxImage || bytes.toString('base64')!==encoded)throw problem(400,'دادهٔ عکس معتبر نیست.');
 const valid=mime==='image/jpeg'?bytes.subarray(0,3).toString('hex')==='ffd8ff'
 :mime==='image/png'?bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a'
 :bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 if(!valid)throw problem(400,'نوع فایل با محتوای عکس هم‌خوانی ندارد.');
 return {mime,bytes};
}
function receiptInput(data){
 if(typeof data.requestId!=='string'||!uuid.test(data.requestId))throw problem(400,'شناسهٔ درخواست معتبر نیست.');
 if(!['gold','silver'].includes(data.metal))throw problem(400,'نوع فلز را انتخاب کنید.');
 const mass=String(data.mass??'').trim();
 if(!/^\d{1,13}(\.\d{1,6})?$/.test(mass)||!/[1-9]/.test(mass))throw problem(400,'وزن مثبت بر حسب گرم با حداکثر شش رقم اعشار وارد کنید.');
 const purity=data.purity==null||data.purity===''?null:String(data.purity).trim();
 if(purity!==null&&(!/^\d{1,4}(\.\d{1,4})?$/.test(purity)||Number(purity)>1000))throw problem(400,'عیار باید بین صفر و هزار باشد.');
 const reference=typeof data.reference==='string'?data.reference.trim():'';
 if(!reference||reference.length>240)throw problem(400,'مرجع تحویل را در یک تا ۲۴۰ حرف وارد کنید.');
 const {mime,bytes}=parsePhoto(data.photo);
 const hash=digest(JSON.stringify([data.metal,mass,purity,reference,mime,bytes?digest(bytes):null]));
 return {requestId:data.requestId,metal:data.metal,mass,purity,reference,mime,bytes,hash};
}

function createHandler(env=process.env,connect=options=>new Pool(options)){
 let pool,ready;
 const roles={manager:env.ERP_MANAGER_SHA256,staff:env.ERP_STAFF_SHA256};
 const configured=Object.values(roles).every(v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v))&&roles.staff!==roles.manager&&!!env.DATABASE_URL;
 async function database(){
  if(!configured)throw problem(503,'تنظیم اتصال به دیتابیس و حساب‌های عملیاتی تکمیل نشده است.');
  pool??=connect({connectionString:env.DATABASE_URL,max:5,connectionTimeoutMillis:6000,statement_timeout:10000});
  if(!ready){
   pool.on?.('error',()=>{});
   ready=pool.query(schema+workflow.schema).catch(e=>{ready=null;throw e;});
  }
  await ready;
  return pool;
 }
 return async function handle(req,res){
  try{
   const pathname=new URL(req.url,'http://localhost').pathname;
   if(!['GET','POST'].includes(req.method))throw problem(405,'این روش درخواست پشتیبانی نمی‌شود.');
   if(req.method==='POST'){
    let origin;
    try{origin=new URL(req.headers.origin);}catch{}
    if(!origin||origin.protocol!=='https:'||origin.host!==req.headers.host)throw problem(403,'مبدأ درخواست معتبر نیست.');
   }
   const db=await database();
   if(req.method==='POST'&&pathname==='/api/live/login'){
    const {role,code}=await readInput(req);
    const known=Object.hasOwn(roles,role), expected=known?roles[role]:'0'.repeat(64);
    const actual=digest(typeof code==='string'&&code.length>=32&&code.length<=256?code:'');
    if(!timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex'))||!known)throw problem(401,'مشخصات ورود صحیح نیست.');
    await db.query('DELETE FROM erp_live_sessions WHERE expires_at <= now()');
    const token=randomBytes(32).toString('hex');
    await db.query(`INSERT INTO erp_live_sessions(token_hash,role,credential_hash,expires_at) VALUES($1,$2,$3,now()+interval '12 hours')`,[digest(token),role,expected]);
    res.setHeader('Set-Cookie',`__Host-mori-session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${hours*3600}`);
    return json(res,200,{actor:role});
   }
   const token=(req.headers.cookie||'').match(/(?:^|;\s*)__Host-mori-session=([0-9a-f]{64})(?:;|$)/)?.[1];
   if(!token)throw problem(401,'وارد حساب خود شوید.');
   const session=(await db.query('SELECT role,credential_hash FROM erp_live_sessions WHERE token_hash=$1 AND expires_at>now()',[digest(token)])).rows[0];
   if(!session||roles[session.role]!==session.credential_hash)throw problem(401,'دوباره وارد حساب خود شوید.');
   const actor=session.role;
   if(req.method==='GET'&&pathname==='/api/live/session')return json(res,200,{actor});
   if(req.method==='POST'&&pathname==='/api/live/logout'){
    await db.query('DELETE FROM erp_live_sessions WHERE token_hash=$1',[digest(token)]);
    res.setHeader('Set-Cookie','__Host-mori-session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    return json(res,200,{ok:true});
   }
   if(req.method==='GET'&&pathname==='/api/live/receipts'){
    const result=await db.query(`SELECT ${publicColumns} FROM erp_live_receipts ORDER BY created_at DESC,id DESC LIMIT 200`);
    return json(res,200,{receipts:result.rows});
   }
   if(req.method==='POST'&&pathname==='/api/live/receipts'){
    const v=receiptInput(await readInput(req));
    // A single row commits both the receipt and system decision. Concurrent retries
    // serialize on the unique index and return the original immutable receipt.
    const result=await db.query(`INSERT INTO erp_live_receipts AS existing(id,request_id,payload_hash,created_by,metal,mass,purity,reference,recipient,approved_by,photo_type,photo_bytes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'behnam','smart-manager',$9,$10)
     ON CONFLICT(created_by,request_id) DO UPDATE SET request_id=existing.request_id
      WHERE existing.payload_hash=EXCLUDED.payload_hash RETURNING ${publicColumns}`,
     [randomUUID(),v.requestId,v.hash,actor,v.metal,v.mass,v.purity,v.reference,v.mime,v.bytes]);
    if(!result.rowCount)throw problem(409,'این شناسه قبلاً با مشخصات دیگری ثبت شده است.');
    return json(res,200,{receipt:result.rows[0]});
   }
   const work=pathname.match(/^\/api\/live\/receipts\/([^/]+)\/workflow$/);
   if(work&&uuid.test(work[1])){
    const info=req.method==='GET'?await workflow.read(db,work[1]):
     await workflow.write(db,work[1],actor,workflow.eventInput(await readInput(req),uuid));
    return json(res,200,info);
   }
   const photo=pathname.match(/^\/api\/live\/receipts\/([^/]+)\/photo$/);
   if(req.method==='GET'&&photo&&uuid.test(photo[1])){
    const row=(await db.query('SELECT photo_type,photo_bytes FROM erp_live_receipts WHERE id=$1 AND photo_type IS NOT NULL',[photo[1]])).rows[0];
    if(!row)throw problem(404,'عکس پیدا نشد.');
    res.writeHead(200,{'Content-Type':row.photo_type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"});return res.end(row.photo_bytes);
   }
   throw problem(404,'مسیر پیدا نشد.');
  }catch(error){
   if(!error.status)console.error('ERP database request failed:',/^[A-Z0-9_]{2,30}$/.test(error.code||'')?error.code:'internal');
   if(!res.headersSent)json(res,error.status||503,{error:error.status?error.message:'ارتباط با دیتابیس برقرار نشد. دوباره تلاش کنید.'});
   else res.end();
  }
 };
}
module.exports=createHandler();
module.exports.createHandler=createHandler;
module.exports.receiptInput=receiptInput;
