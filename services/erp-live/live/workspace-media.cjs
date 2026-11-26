'use strict';
const {randomUUID,createHash}=require('node:crypto');
const schema=`
 CREATE TABLE IF NOT EXISTS erp_workspace_assets(
  id uuid PRIMARY KEY, owner_id text NOT NULL REFERENCES erp_people(user_id),
  digest text NOT NULL, mime text NOT NULL, bytes bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(owner_id,digest,mime));`;
const prefix='/api/live/workspace/assets/';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const problem=(status,message)=>Object.assign(new Error(message),{status});
const missing=()=>problem(404,'فایل پیدا نشد.');
function decode(data){
 const comma=typeof data==='string'?data.indexOf(','):-1;
 if(comma<0||comma>100)throw problem(400,'فرمت فایل معتبر نیست.');
 const header=data.slice(0,comma);
 const match=/^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64$/i.exec(header);
 if(!match)throw problem(400,'فرمت فایل معتبر نیست.');
 const mime=match[1].toLowerCase();
 const bytes=Buffer.from(data.slice(comma+1),'base64');
 if(bytes.length===0||bytes.length>8*1024*1024||bytes.toString('base64')!==data.slice(comma+1))throw problem(400,'حجم یا محتوای فایل معتبر نیست.');
 const head=bytes.subarray(0,12);
 const raster=mime==='image/jpeg'?head.subarray(0,3).toString('hex')==='ffd8ff':
  mime==='image/png'?head.subarray(0,8).toString('hex')==='89504e470d0a1a0a':
  mime==='image/webp'?head.toString('ascii',0,4)==='RIFF'&&head.toString('ascii',8,12)==='WEBP':
  mime==='image/gif'?['GIF89a','GIF87a'].includes(head.toString('ascii',0,6)):false;
 if(mime.startsWith('image/')&&!raster)throw problem(415,'عکس باید JPEG، PNG، GIF یا WebP باشد.');
 const type=raster||['application/pdf','audio/mpeg','audio/webm','audio/ogg','video/mp4','video/webm'].includes(mime)?mime:'application/octet-stream';
 return {mime:type,bytes};
}
async function put(db,owner,data){
 const {bytes,mime}=decode(data);
 const digest=createHash('sha256').update(bytes).digest('hex');
 const row=(await db.query(`INSERT INTO erp_workspace_assets(id,owner_id,digest,mime,bytes)
  VALUES($1,$2,$3,$4,$5) ON CONFLICT(owner_id,digest,mime) DO UPDATE SET digest=EXCLUDED.digest RETURNING id`,
  [randomUUID(),owner,digest,mime,bytes])).rows[0];
 return prefix+row.id;
}
function references(value){
 const assets=new Set();
 inspect(value,v=>{if(typeof v==='string'&&v.startsWith(prefix))assets.add(v);});
 return assets;
}
function inspect(value,visit){
 const pending=[value];
 while(pending.length){
  const item=pending.pop();
  if(!item||typeof item!=='object')continue;
  for(const [key,child] of Object.entries(item)){
   visit(child,item,key);
   if(child&&typeof child==='object')pending.push(child);
  }
 }
}
async function prepare(db,user,input,view){
 const accessible=references(view), referenced=new Set(),uploads=new Map();
 inspect(input,(v,parent,key)=>{
  if(typeof v!=='string')return;
  if(/^data:[^,]{1,96};base64,/.test(v)){
   if(!uploads.has(v))uploads.set(v,[]);
   uploads.get(v).push([parent,key]);
  }else if(v.startsWith(prefix)&&!accessible.has(v)){
   const id=v.slice(prefix.length);if(!uuid.test(id))throw missing();referenced.add(id);
  }
 });
 if(referenced.size){
  const owned=await db.query('SELECT id FROM erp_workspace_assets WHERE owner_id=$1 AND id=ANY($2::uuid[])',[user,[...referenced]]);
  if(owned.rows.length!==referenced.size)throw missing();
 }
 for(const [data,fields] of uploads){
  const url=await put(db,user,data);
  for(const [parent,key] of fields)parent[key]=url;
 }
 return uploads.size>0;
}
function send(res,row,publication=false){
 if(!row)throw missing();
 if(publication&&!/^image\/(jpeg|png|gif|webp)$/.test(row.mime))throw missing();
 const disposition=row.mime.startsWith('image/')||row.mime.startsWith('audio/')||row.mime.startsWith('video/')?'inline':'attachment';
 res.writeHead(200,{'Content-Type':row.mime,'Content-Length':row.bytes.length,'Content-Disposition':disposition,
  'Cache-Control':publication?'no-store':'private, no-store','X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer','Content-Security-Policy':"sandbox; default-src 'none'"});
 res.end(row.bytes);
}
async function file(db,id,user,visible,res){
 if(!uuid.test(id))throw missing();
 const row=(await db.query('SELECT owner_id,mime,bytes FROM erp_workspace_assets WHERE id=$1',[id])).rows[0];
 if(!row||(row.owner_id!==user&&!references(await visible()).has(prefix+id)))throw missing();
 send(res,row);
}
async function verify(db,params,res,json,photo){
 const serial=params.get('serial'),event=params.get('event');
 if(!serial||serial.length>128||!event||event.length>128)throw missing();
 const row=(await db.query(`SELECT COALESCE(NULLIF(p->>'serial',''),p->>'id') AS serial,p->>'title' AS title,coalesce(e->>'net',p->>'net') AS net,
  coalesce(e->>'gross',p->>'gross') AS gross,p->>'purity' AS purity,e->>'date' AS date,e->'active' AS active,
  e->>'front' AS front,e->>'back' AS back,(nullif(e->>'tag','') IS NOT NULL) AS tagged
  FROM erp_workspace w CROSS JOIN LATERAL jsonb_array_elements(w.state->'factory'->'products') p
  CROSS JOIN LATERAL jsonb_array_elements(p->'packaging') e
  WHERE w.id=1 AND COALESCE(NULLIF(p->>'serial',''),p->>'id')=$1 AND e->>'id'=$2 LIMIT 1`,[serial,event])).rows[0];
 if(!row)throw missing();
 const {front,back,tagged,...product}=row;
 function asset(value){if(typeof value!=='string'||!value.startsWith(prefix))return null;
  const id=value.slice(prefix.length);return uuid.test(id)?id:null;}
 const sides={front:asset(front),back:asset(back)};
 if(photo){
  const side=params.get('side');
  if(!product.active||!Object.hasOwn(sides,side)||!sides[side])throw missing();
  const image=(await db.query('SELECT mime,bytes FROM erp_workspace_assets WHERE id=$1',[sides[side]])).rows[0];
  return send(res,image,true);
 }
 const query=new URLSearchParams({serial,event});
 for(const side of ['front','back'])product[side]=product.active&&sides[side]?'/api/live/verify/photo?'+query+'&side='+side:null;
 product.seal=tagged?'نیازمند بررسی تگ همان بسته':'وضعیت پلمب از طریق تگ تأیید نشده است';
 json(res,200,{product});
}
module.exports={schema,prefix,put,prepare,file,verify};
