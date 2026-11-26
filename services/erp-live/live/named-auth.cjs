'use strict';
const {randomBytes,createHash,scrypt,timingSafeEqual}=require('node:crypto');
const {promisify}=require('node:util');
const {readFile}=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const derive=promisify(scrypt);
const devicePin=require('./device-pin.cjs');
const digest=s=>createHash('sha256').update(s).digest('hex');
const fail=(n,m)=>Object.assign(new Error(m),{status:n});
const schema=`
CREATE TABLE IF NOT EXISTS erp_people(
 user_id text PRIMARY KEY,salt text NOT NULL,password_hash text NOT NULL,
 attempts integer NOT NULL DEFAULT 0, next_window timestamptz DEFAULT now() NOT NULL,
 active boolean DEFAULT true NOT NULL);
CREATE TABLE IF NOT EXISTS erp_person_sessions(
 token_hash text PRIMARY KEY,user_id text NOT NULL REFERENCES erp_people(user_id),credential_hash text NOT NULL,
 expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS erp_person_sessions_expiry ON erp_person_sessions(expires_at);
ALTER TABLE erp_live_receipts ADD COLUMN IF NOT EXISTS created_by_user text;
ALTER TABLE erp_live_receipts ADD COLUMN IF NOT EXISTS assignee_user text;
ALTER TABLE erp_live_work_events ADD COLUMN IF NOT EXISTS actor_user text;`;
// RTL account sheets can surround a copied field with Unicode direction marks.
function withoutDirectionWrap(value){
 return value.replace(/^[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]+|[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]+$/gu,'');
}
function nameKey(x){
 const label=withoutDirectionWrap(String(x??'').trim()).normalize('NFKC').trim().toLowerCase();
 return label.replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\s]+/g,' ');
}
function passKey(x){return String(x??'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632));}
let catalog;
async function directory(){
 if(catalog)return catalog;
 const packaged=path.resolve(__dirname,'../erp/policy.mjs');
 const canonical=path.resolve(__dirname,'../../../dist/erp/policy.mjs');
 let policy;
 try{policy=await import(pathToFileURL(packaged).href);}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;policy=await import(pathToFileURL(canonical).href);}
 catalog=new Map();
 for(const [id,person] of Object.entries(policy.roles)){
  if(['office','employee'].includes(id))continue;
  const admission=policy.capabilities.admission(id);
  const production=['alireza','behnam','haji','mohaddeseh','kimia','sonia','hana','mehrab','ghazal'].includes(id)&&policy.capabilities.production(id);
  const allReceipts=policy.capabilities.inventory(id);
  catalog.set(id,{userId:id,displayName:person.name,level:person.level||'staff',actor:allReceipts?'manager':'staff',
   permissions:{admission,production,allReceipts,receipts:admission||production||allReceipts}});
 }
 return catalog;
}
async function initialize(db,env){
 const people=await directory();
 const file=env.ERP_ACCOUNTS_SEED_FILE||path.join(__dirname,'accounts-seed.json');
 let seed;
 try{seed=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return;throw e;}
 if(!Array.isArray(seed)||seed.length>people.size||seed.some(v=>!people.has(v.userId)||!/^[a-f0-9]{32}$/.test(v.salt)||!/^[a-f0-9]{128}$/.test(v.hash)))throw Error('Invalid private account configuration');
 if(seed.length)await db.query(`INSERT INTO erp_people(user_id,salt,password_hash)
   SELECT * FROM unnest($1::text[],$2::text[],$3::text[]) ON CONFLICT(user_id) DO NOTHING`,
   [seed.map(v=>v.userId),seed.map(v=>v.salt),seed.map(v=>v.hash)]);
}
function describe(person){
 const result={...person};
 if(person.permissions.admission)result.productionUsers=[...catalog.values()].filter(p=>p.permissions.production).map(p=>({id:p.userId,name:p.displayName}));
 return result;
}
const cookie='__Host-mori-person';
function sessionCookie(value,maxAge){return cookie+'='+value+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+maxAge;}
function tokenOf(req){return (req.headers.cookie||'').match(/(?:^|;\s*)__Host-mori-person=([0-9a-f]{64})(?:;|$)/)?.[1];}
const invalid=()=>fail(401,'نام کاربری یا رمز عبور درست نیست.');
let inFlight=0;
async function verifyPassword(db,req,person,raw,allowPin){
 const pass=passKey(raw);
 if(!person||typeof raw!=='string'||!pass||pass.length>256)throw invalid();
 if(inFlight>=8)throw fail(429,'چند لحظه بعد دوباره تلاش کنید.');
 inFlight++;
 try{
  const result=await db.query(`UPDATE erp_people SET attempts=CASE WHEN next_window<=now() THEN 1 ELSE attempts+1 END,
   next_window=CASE WHEN next_window<=now() THEN now()+interval '10 minutes' ELSE next_window END
   WHERE user_id=$1 AND active AND (next_window<=now() OR attempts<12) RETURNING salt,password_hash`,[person.userId]);
  if(!result.rows[0])throw invalid();
  const {salt,password_hash}=result.rows[0];
  const expected=Buffer.from(password_hash,'hex');
  let primary=timingSafeEqual(await derive(pass,salt,64),expected);
  const unwrapped=withoutDirectionWrap(pass);
  if(!primary&&unwrapped&&unwrapped!==pass){
   primary=timingSafeEqual(await derive(unwrapped,salt,64),expected);
  }
  if(!primary&&!(allowPin&&/^\d{4,8}$/.test(unwrapped)&&await devicePin.verify(db,req,person.userId,password_hash,unwrapped)))throw invalid();
  await db.query('UPDATE erp_people SET attempts=0 WHERE user_id=$1',[person.userId]);
  return password_hash;
 }finally{inFlight--;}
}
async function login(db,req,res,data){
 const entered=nameKey(data.username);
 const name=entered==='sonya'?'sonia':entered;
 const person=[...catalog.values()].find(p=>p.userId===name||nameKey(p.displayName)===name);
 const password_hash=await verifyPassword(db,req,person,data.password,true);
  const token=randomBytes(32).toString('hex');
  await db.query('DELETE FROM erp_person_sessions WHERE expires_at<=now() OR token_hash=$1',[digest(tokenOf(req)||'')]);
  await db.query(`INSERT INTO erp_person_sessions(token_hash,user_id,credential_hash,expires_at)
   SELECT $1,user_id,password_hash,now()+interval '30 days' FROM erp_people WHERE user_id=$2 AND active AND password_hash=$3`,
   [digest(token),person.userId,password_hash]).then(r=>{if(!r.rowCount)throw invalid();});
  res.setHeader('Set-Cookie',[sessionCookie(token,2592000),'__Host-mori-session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0']);
  return describe(person);
}
async function authenticate(db,req){
 const token=tokenOf(req);
 if(!token)throw fail(401,'وارد حساب خود شوید.');
 const {rows}=await db.query(`SELECT p.user_id FROM erp_person_sessions s JOIN erp_people p ON p.user_id=s.user_id
 WHERE token_hash=$1 AND expires_at>now() AND p.active AND p.password_hash=s.credential_hash`,[digest(token)]);
 if(!rows[0]||!catalog.has(rows[0].user_id))throw fail(401,'دوباره وارد حساب خود شوید.');
 return catalog.get(rows[0].user_id);
}
async function logout(db,req,res){
 await db.query('DELETE FROM erp_person_sessions WHERE token_hash=$1',[digest(tokenOf(req))]);
 res.setHeader('Set-Cookie',sessionCookie('',0));
}
function display(id){return catalog.get(id)?.displayName||null;}
module.exports={schema:schema+devicePin.schema,verifyPassword,initialize,describe,login,authenticate,logout,display,directory};
