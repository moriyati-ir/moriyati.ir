'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const {randomUUID} = require('node:crypto');
const {Readable} = require('node:stream');
const {filePath, handle, schema, maxBytes} = require('../live/person-files.cjs');

test('file paths preserve Persian and special URL characters and reject ambiguous paths', () => {
 assert.deepEqual(filePath('آزمایش/تصویر #۱?.jpg'), {parent:'آزمایش', name:'تصویر #۱?.jpg', path:'آزمایش/تصویر #۱?.jpg'});
 for (const path of [null, '/x', 'folder/../x', 'a//b', 'folder/', '\0', 'a\\x']) assert.throws(()=>filePath(path));
 assert.throws(()=>filePath('x'.repeat(241)));
 assert.equal(filePath('', true).path, '');
});

test('PostgreSQL files, folders, recents, and bookmarks are private to their named employee', {skip:!process.env.ERP_TEST_DATABASE_URL}, async t => {
 const {Pool} = require('pg');
 const uri = process.env.ERP_TEST_DATABASE_URL;
 const namespace = 'erp_drive_' + randomUUID().replaceAll('-','');
 const admin = new Pool({connectionString:uri});
 await admin.query('CREATE SCHEMA '+namespace);
 const db = new Pool({connectionString:uri, options:'-c search_path='+namespace});
 t.after(async () => {await db.end();try {await admin.query('DROP SCHEMA '+namespace+' CASCADE');}finally{await admin.end();}});
 await db.query('CREATE TABLE erp_people(user_id text PRIMARY KEY)');
 await db.query("INSERT INTO erp_people VALUES ('sonia'),('sima')");
 await db.query(schema);
 async function call(op, user, {method='GET', data, params={}, file, headers={}}={}) {
  const req = Readable.from(file ? [file] : []);
  req.url='/api/live/files/'+op+'?'+new URLSearchParams(params);
  req.method=method; req.headers={'x-moriyati-actor':user,...headers};
  const res={writeHead(status, head){this.status=status;this.head=head;},end(bytes){this.bytes=bytes;}};
  await handle(db,req,res,{userId:user},'/api/live/files/'+op,(r,status,body)=>Object.assign(r,{status,body}),async()=>data);
  return res;
 }
 const mkdir=(u,path)=>call('mkdir',u,{method:'POST',data:{path}});
 const list=(u,path)=>call('list',u,{params:{path}});
 const content=(u,path)=>call('content',u,{params:{path}});
 const send=(u,path,bytes)=>call('upload',u,{method:'POST',params:{path,shared:'1'},file:bytes,headers:{'content-type':'text/plain'}});
 await mkdir('sonia','آزمایش');
 const bytes=Buffer.from('نمونه');
 await send('sonia','آزمایش/pic#1',bytes);
 await assert.rejects(send('sonia','آزمایش/pic#1',Buffer.from('other')), {status:409});
 assert.deepEqual((await list('sonia','آزمایش')).body.entries,[{path:'آزمایش/pic#1',name:'pic#1',dir:false}]);
 assert.deepEqual((await list('sima','')).body.entries,[]);
 await assert.rejects(content('sima','آزمایش/pic#1'),{status:404});
 await assert.rejects(send('sima','آزمایش/x',bytes),{status:404});
 await assert.rejects(call('list','sima',{params:{path:''},headers:{'x-moriyati-actor':'sonia'}}),{status:403});
 const downloaded=await content('sonia','آزمایش/pic#1');
 assert.deepEqual(downloaded.bytes,bytes);
 assert.match(downloaded.head['Content-Disposition'],/^attachment;/);
 await call('favorite','sonia',{method:'POST',data:{path:'آزمایش'}});
 await call('move','sonia',{method:'POST',data:{path:'آزمایش/pic#1',to:'pic#1'}});
 await assert.rejects(content('sonia','آزمایش/pic#1'),{status:404});
 const {body:marks}=await call('marks','sonia');
 assert.deepEqual(marks.favorites.map(x=>x.path),['آزمایش']);
 assert.deepEqual(marks.shared.map(x=>x.path),['pic#1']);
 assert.deepEqual(marks.recent.map(x=>x.path),['pic#1']);
 assert.deepEqual((await call('marks','sima')).body,{favorites:[],recent:[],shared:[]});
 await assert.rejects(call('upload','sonia',{method:'POST',params:{path:'large'},headers:{'content-length':String(maxBytes+1)}}),{status:413});
 const concurrent=await Promise.allSettled([send('sonia','new',bytes),send('sonia','new',bytes)]);
 assert.equal(concurrent.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(concurrent.find(x=>x.status==='rejected').reason.status,409);
});
