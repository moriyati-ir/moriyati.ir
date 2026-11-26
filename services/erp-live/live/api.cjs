'use strict';
const {createHash, randomBytes, randomUUID, timingSafeEqual} = require('node:crypto');
const {Pool} = require('pg');

const workflow = require('./workflow.cjs');
const named=require('./named-auth.cjs');
const workspace=require('./workspace.cjs');
const workspaceMedia=require('./workspace-media.cjs');
const messenger=require('./messenger.cjs');
const personFiles=require('./person-files.cjs');
const gifs=require('./gifs.cjs');
const devicePin=require('./device-pin.cjs');
const maxImage = 4 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const digest = value => createHash('sha256').update(value).digest('hex');
const publicColumns = `id,created_at AS "createdAt",metal,mass::text,purity::text,reference,
 created_by AS "createdBy",created_by_user AS "createdByUserId",assignee_user AS "assigneeUserId",approved_by AS "approvedBy",recipient,
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
async function readInput(req,limit=Math.ceil(maxImage*4/3)+8192){
 if(req.headers['content-type']?.split(';')[0]!=='application/json') throw problem(415,'دادهٔ درخواست باید JSON باشد.');
 let length=0;
 const chunks=[];
 for await(const chunk of req){
  length+=chunk.length;
  if(length>limit) throw problem(413,'حجم فایل بیش از حد مجاز است.');
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

function decorate(r){return {...r,createdByName:named.display(r.createdByUserId),assigneeName:named.display(r.assigneeUserId)};}
function createHandler(env=process.env,connect=options=>new Pool(options)){
 let pool,ready;
 async function database(){
  if(!env.DATABASE_URL)throw problem(503,'تنظیم اتصال به دیتابیس و حساب‌های عملیاتی تکمیل نشده است.');
  pool??=connect({connectionString:env.DATABASE_URL,max:5,connectionTimeoutMillis:6000,statement_timeout:10000});
  if(!ready){
   pool.on?.('error',()=>{});
   ready=pool.query(schema+workflow.schema+named.schema+workspace.schema+workspaceMedia.schema+messenger.schema+personFiles.schema+gifs.schema).then(()=>named.initialize(pool,env)).catch(e=>{ready=null;throw e;});
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
    return json(res,200,await named.login(db,req,res,await readInput(req)));
   }
   if(req.method==='GET'&&['/api/live/verify','/api/live/verify/photo'].includes(pathname))
    return await workspaceMedia.verify(db,new URL(req.url,'http://localhost').searchParams,res,json,pathname.endsWith('/photo'));
   const person=await named.authenticate(db,req);
   const actor=person.actor,owner=person.userId,permissions=person.permissions;
   const scope='($1::boolean OR created_by_user=$2 OR assignee_user=$2)';
   const scopeParams=[permissions.allReceipts,owner];
   if(req.method==='GET'&&pathname==='/api/live/session')return json(res,200,named.describe(person));
   if(req.method==='POST'&&pathname==='/api/live/logout'){
    await named.logout(db,req,res);
    return json(res,200,{ok:true});
   }
   if(pathname==='/api/live/device-pin'&&req.method==='POST'){
    const data=await readInput(req);
    const fingerprint=await named.verifyPassword(db,req,person,data.password,false);
    return json(res,200,await devicePin.enroll(db,req,res,owner,fingerprint,data.pin));
   }
   if(pathname==='/api/live/device-pin'&&req.method==='GET'){
    const result=await db.query('SELECT password_hash FROM erp_people WHERE user_id=$1',[owner]);
    return json(res,200,{enabled:await devicePin.hasPin(db,req,owner,result.rows[0].password_hash)});
   }
   if(pathname==='/api/live/device-pin/remove'&&req.method==='POST'){
    return json(res,200,await devicePin.revoke(db,req,res,owner));
   }
   if(req.headers['x-workspace-user'] && req.headers['x-workspace-user']!==owner)throw problem(409,'حساب فعال تغییر کرده است. دوباره وارد میزکار شوید.');
   if(pathname.startsWith('/api/live/files/'))return await personFiles.handle(db,req,res,person,pathname,json,readInput);
   if(pathname==='/api/live/gifs'||pathname.startsWith('/api/live/gifs/'))return await gifs.handleGifs({req,res,pool:db,actor:owner,route:pathname.slice('/api/live'.length),json,readInput});
   if(pathname.startsWith('/api/live/messenger/media/')&&req.method==='GET')return await messenger.media(db,person,pathname,res);
   if(pathname.startsWith('/api/live/messenger/'))return json(res,200,await messenger.route({db,req,pathname,person,readInput,problem}));
   if(pathname==='/api/live/workspace/assets'&&req.method==='POST')
    return json(res,200,{url:await workspaceMedia.put(db,owner,(await readInput(req,12*1024*1024)).data)});
   if(pathname.startsWith(workspaceMedia.prefix)&&req.method==='GET')
    return await workspaceMedia.file(db,pathname.slice(workspaceMedia.prefix.length),owner,async()=>(await workspace.read(db,person)).state,res);
   if(pathname==='/api/live/workspace' || pathname==='/api/live/workspace/command'){
    const command=pathname.endsWith('/command');
    if(req.method==='GET'&&command)throw problem(405,'برای ثبت عملیات درخواست POST لازم است.');
    const output=req.method==='GET'?await workspace.read(db,person):
     await workspace.write(db,person,await readInput(req,32*1024*1024),command);
    return json(res,200,output);
   }
   if(!permissions.receipts)throw problem(403,'دسترسی به عملیات پارت برای حساب شما تعریف نشده است.');
   if(req.method==='GET'&&pathname==='/api/live/receipts'){
    const result=await db.query(`SELECT ${publicColumns} FROM erp_live_receipts WHERE ${scope} ORDER BY created_at DESC,id DESC LIMIT 200`,scopeParams);
    return json(res,200,{receipts:result.rows.map(decorate)});
   }
   if(req.method==='POST'&&pathname==='/api/live/receipts'){
    if(!permissions.admission)throw problem(403,'مجوز پذیرش بار برای این حساب تعریف نشده است.');
    const data=await readInput(req);
    const v=receiptInput(data);
    const assignee=data.assigneeUserId||null;
    if(assignee&&!(await named.directory()).get(assignee)?.permissions.production)throw problem(400,'مسئول تولید معتبر نیست.');
    const payloadHash=digest(JSON.stringify([v.hash,assignee,owner]));
    // A single row commits both the receipt and system decision. Concurrent retries
    // serialize on the unique index and return the original immutable receipt.
    const result=await db.query(`INSERT INTO erp_live_receipts AS existing(id,request_id,payload_hash,created_by,metal,mass,purity,reference,recipient,approved_by,photo_type,photo_bytes,created_by_user,assignee_user)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'behnam','smart-manager',$9,$10,$11,$12)
     ON CONFLICT(created_by,request_id) DO UPDATE SET request_id=existing.request_id
      WHERE existing.payload_hash=EXCLUDED.payload_hash RETURNING ${publicColumns}`,
     [randomUUID(),v.requestId,payloadHash,actor,v.metal,v.mass,v.purity,v.reference,v.mime,v.bytes,owner,assignee]);
    if(!result.rowCount)throw problem(409,'این شناسه قبلاً با مشخصات دیگری ثبت شده است.');
    return json(res,200,{receipt:decorate(result.rows[0])});
   }
   const work=pathname.match(/^\/api\/live\/receipts\/([^/]+)\/workflow$/);
   if(work&&uuid.test(work[1])){
    const visible=await db.query(`SELECT 1 FROM erp_live_receipts WHERE ${scope} AND id=$3`,[...scopeParams,work[1]]);
    if(!visible.rowCount)throw problem(404,'رسید پیدا نشد.');
    if(req.method==='POST'&&!permissions.production)throw problem(403,'مجوز عملیات تولید ندارید.');
    const info=req.method==='GET'?await workflow.read(db,work[1]):
     await workflow.write(db,work[1],actor,workflow.eventInput(await readInput(req),uuid),owner);
    for(const event of info.events)event.actorName=named.display(event.actorUserId);
    return json(res,200,info);
   }
   const photo=pathname.match(/^\/api\/live\/receipts\/([^/]+)\/photo$/);
   if(req.method==='GET'&&photo&&uuid.test(photo[1])){
    const row=(await db.query(`SELECT photo_type,photo_bytes FROM erp_live_receipts WHERE ${scope} AND id=$3 AND photo_type IS NOT NULL`,[...scopeParams,photo[1]])).rows[0];
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
