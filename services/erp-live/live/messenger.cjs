'use strict';
const named = require('./named-auth.cjs');
const schema = `
 CREATE TABLE IF NOT EXISTS erp_chat_groups (
  id text PRIMARY KEY, admin_id text NOT NULL REFERENCES erp_people(user_id), name text NOT NULL, members text[] NOT NULL);
 CREATE TABLE IF NOT EXISTS erp_chat_events (
  seq bigserial PRIMARY KEY, event_type text NOT NULL, sender text NOT NULL REFERENCES erp_people(user_id),
  target text NOT NULL, audience text[] NOT NULL, message_id text, data jsonb NOT NULL,
  at timestamptz NOT NULL DEFAULT now());
 CREATE INDEX IF NOT EXISTS erp_chat_audience ON erp_chat_events USING gin (audience);
 CREATE UNIQUE INDEX IF NOT EXISTS erp_chat_message_key ON erp_chat_events(sender,message_id) WHERE event_type='message';
 CREATE UNIQUE INDEX IF NOT EXISTS erp_chat_receipt_key ON erp_chat_events(sender,target,message_id,(data->>'state')) WHERE event_type='ack';`;
const invalid = () => Object.assign(new Error('درخواست مسنجر معتبر نیست.'), {status:400});
const denied = () => Object.assign(new Error('دسترسی به این گفتگو ندارید.'), {status:403});
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);
function text(value, max) {
 if (typeof value !== 'string' || value.length > max) throw invalid();
 return value;
}
function attachment(value) {
 if (!value || !['image','video','audio','file'].includes(value.kind)) throw invalid();
 const src = text(value.src, 12 * 1024 * 1024);
 // Only data attachments. No remote/pseudo URLs are ever forwarded to a recipient.
 const comma = src.indexOf(',');
 const header = src.slice(0, comma);
 if (comma < 5 || comma > 150 || !/^data:(?:[a-z0-9.+-]+\/[a-z0-9.+-]+)?(?:;codecs=[a-z0-9.,_-]+)?;base64$/i.test(header) ||
     !/^[A-Za-z0-9+/]*={0,2}$/.test(src.slice(comma+1))) throw invalid();
 if (value.kind !== 'file' && !header.toLowerCase().startsWith('data:'+value.kind+'/')) throw invalid();
 return {kind:value.kind,src,fileName:text(value.fileName||'',500)};
}
function message(value) {
 if (!value || typeof value !== 'object') throw invalid();
 const kind = value.kind || 'text', out = {kind, text:text(value.text||'',32000)};
 if (kind === 'text') { if (!out.text.trim()) throw invalid(); }
 else if (kind === 'album') {
  if (!Array.isArray(value.attachments) || !value.attachments.length || value.attachments.length > 30) throw invalid();
  out.attachments = value.attachments.map(attachment);
 } else Object.assign(out,attachment(value));
 if (value.reply?.id && validId(value.reply.id)) out.reply = {id:value.reply.id,text:text(value.reply.text||'',32000)};
 if (value.forwarded === true) out.forwarded = true;
 if (['listen','review','think','happy'].includes(value.beMood)) out.beMood = value.beMood;
 return out;
}
const mediaPrefix='/api/live/messenger/media/';
function references(data,sender,id) {
 const url=index=>mediaPrefix+encodeURIComponent(sender)+'/'+encodeURIComponent(id)+'/'+index;
 if(data.kind==='album')return {...data,attachments:data.attachments.map((file,index)=>({...file,src:url(index)}))};
 return data.src?{...data,src:url(0)}:data;
}
async function resolveMedia(db,person,pathname) {
 const parts=pathname.slice(mediaPrefix.length).split('/'),[sender,id,rawIndex]=parts;
 if(parts.length!==3||!validId(sender)||!validId(id)||!/^\d{1,2}$/.test(rawIndex))throw invalid();
 const index=Number(rawIndex);
 const result=await db.query(`SELECT CASE WHEN data->>'kind'='album' THEN data->'attachments'->$4::int ELSE CASE WHEN $4::int=0 THEN data ELSE null END END AS media
   FROM erp_chat_events e WHERE event_type='message' AND sender=$1 AND message_id=$2 AND $3=ANY(audience)
   AND NOT EXISTS(SELECT 1 FROM erp_chat_events c WHERE c.event_type='change' AND c.sender=e.sender AND c.message_id=e.message_id AND c.data->>'mode'='delete')`,[sender,id,person.userId,index]);
 const file=result.rows[0]?.media;
 if(!file?.src)throw Object.assign(new Error('فایل در دسترس نیست.'),{status:404});
 return file;
}
async function media(db,person,pathname,res) {
 const file=await resolveMedia(db,person,pathname),comma=file.src.indexOf(',');
 const type=file.src.substring(5,comma).split(';')[0];
 const inline=/^(?:image\/(?:png|jpeg|webp|gif|avif)|video\/(?:webm|mp4|quicktime)|audio\/(?:mpeg|mp4|ogg|wav|webm|aac))$/i.test(type);
 const bytes=Buffer.from(file.src.slice(comma+1),'base64');
 res.writeHead(200,{'Content-Type':inline?type:'application/octet-stream','Content-Length':bytes.length,
  'Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'; sandbox",
  'X-Content-Type-Options':'nosniff','Content-Disposition':inline?'inline':'attachment'});
 res.end(bytes);
}
async function normalizeMessage(db,actor,raw) {
 if(!raw||typeof raw!=='object'||(raw.kind==='album'&&(!Array.isArray(raw.attachments)||raw.attachments.length>30)))throw invalid();
 async function resolve(file) {
  if(!file?.src?.startsWith?.(mediaPrefix))return file;
  const original=await resolveMedia(db,{userId:actor},file.src);
  return {...file,src:original.src};
 }
 const value=raw.kind==='album'&&Array.isArray(raw.attachments)?{...raw,attachments:await Promise.all(raw.attachments.map(resolve))}:await resolve(raw);
 return message(value);
}
async function transaction(pool, run) {
 const db = await pool.connect();
 try {
  await db.query('BEGIN');
  // A cursor may advance only through committed events, including concurrent sends.
  await db.query('SELECT pg_advisory_xact_lock(439923191)');
  const result = await run(db);
  await db.query('COMMIT'); return result;
 } catch (error) { await db.query('ROLLBACK'); throw error; }
 finally { db.release(); }
}
async function writeEvent(db, type, actor, to, audience, id, data) {
 const result = await db.query(`INSERT INTO erp_chat_events(event_type,sender,target,audience,message_id,data)
 VALUES($1,$2,$3,$4,$5,$6) RETURNING at`, [type,actor,to,[...new Set(audience)],id,data]);
 return {at: result.rows[0].at};
}
async function activePeople(db, ids) {
 const {rows} = await db.query('SELECT user_id FROM erp_people WHERE active AND user_id=ANY($1::text[])',[ids]);
 const directory = await named.directory();
 if (rows.length !== ids.length || ids.some(id=>!directory.has(id))) throw invalid();
}
async function memberList(db, actor, to) {
 if (!validId(to) || actor===to) throw invalid();
 if (!to.startsWith('GROUP-')) { await activePeople(db,[to]); return [actor,to]; }
 const {rows} = await db.query('SELECT members FROM erp_chat_groups WHERE id=$1 AND $2=ANY(members)',[to,actor]);
 if (!rows.length) throw denied();
 return rows[0].members;
}
async function group(db,actor,data) {
 const id=data.id,name=text(data.name,120).trim();
 if (!validId(id) || !id.startsWith('GROUP-') || !name || !Array.isArray(data.members) || data.members.length>50) throw invalid();
 const members=[...new Set([actor,...data.members])].sort();
 if (members.some(id=>!validId(id))) throw invalid();
 const current = (await db.query('SELECT admin_id,name,members FROM erp_chat_groups WHERE id=$1',[id])).rows[0];
 if (current && current.admin_id!==actor) throw denied();
 await activePeople(db,members);
 const directory=await named.directory();
 const level=directory.get(actor).level;
 if(members.some(id=>directory.get(id).level!==level)) throw denied();
 if (current && current.name===name && current.members.join()===members.join()) return {ok:true};
 await db.query(`INSERT INTO erp_chat_groups(id,admin_id,name,members) VALUES($1,$2,$3,$4)
 ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,members=EXCLUDED.members`,[id,actor,name,members]);
 await writeEvent(db,'group',actor,id,members,null,{id,name,members,group:true,admin:actor});
 const removed=(current?.members||[]).filter(member=>!members.includes(member));
 if(removed.length)await writeEvent(db,'leave',actor,id,removed,null,{});
 return {ok:true};
}
async function send(db,actor,input) {
 if (!validId(input.id) || !validId(input.to)) throw invalid();
 const data=await normalizeMessage(db,actor,input.data);
 const existing=await db.query(`SELECT at,target=$3 AND data=$4::jsonb AS same FROM erp_chat_events
 WHERE event_type='message' AND sender=$1 AND message_id=$2`,[actor,input.id,input.to,data]);
 if(existing.rows.length){
  if(!existing.rows[0].same)throw Object.assign(new Error('شناسهٔ پیام تکراری است.'),{status:409});
  return {at:existing.rows[0].at,data:references(data,actor,input.id)};
 }
 const members=await memberList(db,actor,input.to);
 const result=await writeEvent(db,'message',actor,input.to,members,input.id,data);
 return {...result,data:references(data,actor,input.id)};
}
async function route({db,req,pathname,person,readInput,problem}) {
 const op=pathname.slice('/api/live/messenger/'.length), actor=person.userId;
 if(req.headers['x-erp-actor'] && req.headers['x-erp-actor']!==actor)throw denied();
 if(req.method==='GET' && op==='session')return {actor,iceServers:[]};
 if(req.method==='GET' && op==='events'){
  const cursor=new URL(req.url,'http://localhost').searchParams.get('after')||'0';
  if(!/^\d{1,17}$/.test(cursor))throw invalid();
  const {rows}=await db.query(`SELECT seq,event_type AS type,sender AS "from",target AS "to",message_id AS id,data,at
   FROM erp_chat_events WHERE audience @> ARRAY[$1]::text[] AND seq>$2
   AND (event_type<>'signal' OR at>now()-interval '1 minute') ORDER BY seq LIMIT 1`,[actor,cursor]);
  return rows.map(row=>row.type==='message'?{...row,data:references(row.data,row.from,row.id)}:['ack','change','signal'].includes(row.type)?{...row,...row.data}:row);
 }
 if(req.method!=='POST'||!['group','message','change','ack','signal'].includes(op))throw problem(404,'مسیر پیدا نشد.');
 const data=await readInput(req,16*1024*1024);
 return transaction(db,async client=>{
  if(op==='group')return group(client,actor,data);
  if(op==='message')return send(client,actor,data);
  if(!validId(data.id)||!validId(data.to))throw invalid();
  if(op==='signal'){
   if(data.to.startsWith('GROUP-')||!['offer','answer','hangup'].includes(data.mode))throw invalid();
   await memberList(client,actor,data.to);
   const payload={mode:data.mode};
   if(data.mode!=='hangup'){
    if(data.data?.type!==data.mode)throw invalid();
    payload.data={type:data.mode,sdp:text(data.data.sdp,128000)};
   }
   return writeEvent(client,op,actor,data.to,[data.to],data.id,payload);
  }
  const sender=op==='ack'?data.to:actor;
  const original=(await client.query(`SELECT target,audience FROM erp_chat_events
   WHERE event_type='message' AND sender=$1 AND message_id=$2 AND $3=ANY(audience)`,[sender,data.id,actor])).rows[0];
  if(!original)throw denied();
  if(op==='change'){
   if(original.target!==data.to||!['delete','edit'].includes(data.mode))throw denied();
   const payload={mode:data.mode};
   if(data.mode==='edit'){payload.text=text(data.text,32000).trim();if(!payload.text)throw invalid();}
   return writeEvent(client,op,actor,data.to,original.audience,data.id,payload);
  }
  if(actor===sender||!['read','delivered'].includes(data.state))throw invalid();
  const duplicate=await client.query(`SELECT at FROM erp_chat_events WHERE event_type='ack' AND sender=$1 AND target=$2 AND message_id=$3 AND data->>'state'=$4`,[actor,sender,data.id,data.state]);
  if(duplicate.rows.length)return duplicate.rows[0];
  return writeEvent(client,op,actor,sender,[sender],data.id,{state:data.state,thread:original.target});
 });
}
module.exports={schema,route,message,media};
