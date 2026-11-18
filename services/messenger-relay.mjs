import http from 'node:http';
import {createHash,timingSafeEqual} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

// Serve behind the ERP's HTTPS reverse proxy at /api/messenger/.
const users=new Map(Object.entries(JSON.parse(process.env.MESSENGER_TOKENS||'{}')));
if(!users.size||[...users.values()].some(v=>typeof v!=='string'||v.length<32)||new Set(users.values()).size!==users.size)throw Error('Set distinct MESSENGER_TOKENS of at least 32 characters per account.');
const hash=v=>createHash('sha256').update(v).digest();
const auth=[...users].map(([id,token])=>[id,hash(token)]);
const db=new DatabaseSync(process.env.MESSENGER_DB||'messenger.sqlite');
db.exec(`PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY, recipient TEXT, body TEXT);
 CREATE INDEX IF NOT EXISTS inbox ON events(recipient,seq);
 CREATE TABLE IF NOT EXISTS messages(sender TEXT,id TEXT,recipient TEXT,created TEXT,delivery INTEGER DEFAULT 0,PRIMARY KEY(sender,id));`);
const event=db.prepare('INSERT INTO events(recipient,body) VALUES(?,?)');
const enqueue=(to,data)=>event.run(to,JSON.stringify(data));
function media(item){
 if(!item||!['audio','video','image','file'].includes(item.kind)||typeof item.src!=='string'||!/^data:[\w.+/-]+(?:;[\w=.+-]+)*;base64,[a-zA-Z0-9+/=\r\n]+$/.test(item.src))throw Error('Invalid attachment');
 return {kind:item.kind,src:item.src,fileName:String(item.fileName||'file').slice(0,200)};
}
function payload(raw){
 if(!raw||!['text','file','audio','video','image','album'].includes(raw.kind))throw Error('Invalid message');
 const clean={kind:raw.kind,text:String(raw.text||'').slice(0,32000)};
 if(raw.kind==='album'){if(!Array.isArray(raw.attachments)||raw.attachments.length>20)throw Error('Invalid album');clean.attachments=raw.attachments.map(media);}
 else if(raw.kind!=='text')Object.assign(clean,media(raw));
 if(raw.reply)clean.reply={id:String(raw.reply.id||'').slice(0,100),text:String(raw.reply.text||'').slice(0,1000)};
 return clean;
}
const server=http.createServer(async(req,res)=>{
 const send=(status,data)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));};
 try{
 const token=(req.headers.authorization||'').replace(/^Bearer /,''),actor=auth.find(([,v])=>timingSafeEqual(v,hash(token)))?.[0];
 if(!actor)return send(401,{error:'Authentication required'});
 const url=new URL(req.url,'http://localhost'),route=url.pathname.replace(/^\/api\/messenger\//,'');
 if(req.method==='GET'&&route==='session')return send(200,{actor,iceServers:JSON.parse(process.env.MESSENGER_ICE||'[]')});
 if(req.method==='GET'&&route==='events'){
  const after=Number(url.searchParams.get('after')||0);
  if(!Number.isSafeInteger(after)||after<0)return send(400,{error:'Invalid cursor'});
  const rows=db.prepare('SELECT seq,body FROM events WHERE recipient=? AND seq>? ORDER BY seq LIMIT 1').all(actor,after);
  return send(200,rows.map(r=>({seq:r.seq,...JSON.parse(r.body)})));
 }
 if(req.method!=='POST'||!['message','ack','signal','change'].includes(route))return send(404,{});
 let size=0,parts=[];for await(const chunk of req){size+=chunk.length;if(size>12*1024*1024)return send(413,{error:'Attachment too large'});parts.push(chunk);}
 const body=JSON.parse(Buffer.concat(parts).toString()),{to,id}=body;
 if(to===actor||!users.has(to)||typeof id!=='string'||!/^[\w-]{1,100}$/.test(id))return send(400,{error:'Invalid recipient or identifier'});
 const at=new Date().toISOString();
 db.exec('BEGIN IMMEDIATE');try{
 if(route==='message'){
  const data=payload(body.data),prior=db.prepare('SELECT recipient,created FROM messages WHERE sender=? AND id=?').get(actor,id);
  if(prior&&prior.recipient!==to)throw Error('Identifier conflict');
  if(!prior){db.prepare('INSERT INTO messages(sender,id,recipient,created) VALUES(?,?,?,?)').run(actor,id,to,at);enqueue(to,{type:'message',from:actor,id,data,at});}
 }else if(route==='change'){
  const message=db.prepare('SELECT recipient FROM messages WHERE sender=? AND id=?').get(actor,id);
  if(message?.recipient!==to||!['edit','delete'].includes(body.mode))throw Error('Unknown message');
  const text=String(body.text||'').trim().slice(0,32000);if(body.mode==='edit'&&!text)throw Error('Empty edit');
  enqueue(to,{type:'change',mode:body.mode,from:actor,id,at,text:body.mode==='edit'?text:''});
 }else if(route==='ack'){
  const level=({delivered:1,read:2})[body.state];if(!level)throw Error('Invalid receipt');
  const message=db.prepare('SELECT delivery FROM messages WHERE sender=? AND id=? AND recipient=?').get(to,id,actor);
  if(!message)throw Error('Unknown message');
  if(message.delivery<level){db.prepare('UPDATE messages SET delivery=? WHERE sender=? AND id=?').run(level,to,id);enqueue(to,{type:'ack',from:actor,id,state:body.state,at});}
 }else{
  if(!['offer','answer','candidate','hangup'].includes(body.mode)||size>100000)throw Error('Invalid signal');
  enqueue(to,{type:'signal',from:actor,id,mode:body.mode,data:body.data,at});
 }
 db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 send(200,{at});
 }catch{send(400,{error:'Invalid request'});}
});
server.listen(Number(process.env.PORT||8081),process.env.MESSENGER_HOST||'127.0.0.1',()=>console.log('Messenger listening on :'+server.address().port));
