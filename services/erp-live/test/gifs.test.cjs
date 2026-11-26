const test = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {Pool} = require('pg');
const {schema,handleGifs,gifBytes} = require('../live/gifs.cjs');

const gif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

test('personal shelf validates GIF content before persisting it',()=>{
 assert.equal(gifBytes(gif).subarray(0,6).toString(),'GIF89a');
 assert.throws(()=>gifBytes('data:image/gif;base64,eA=='),{status:400});
 assert.throws(()=>gifBytes(gif+'!'),{status:400});
 assert.throws(()=>gifBytes('data:image/png;base64,eA=='),{status:400});
});

test('personal media is append-only, retry-safe, and scoped to its authenticated employee',
 {skip:!process.env.ERP_TEST_DATABASE_URL},async t=>{
 const pool=new Pool({connectionString:process.env.ERP_TEST_DATABASE_URL});
 const db=await pool.connect();
 t.after(async()=>{try{await db.query('ROLLBACK');}finally{db.release();await pool.end();}});
 const namespace='gifs_'+randomUUID().replaceAll('-','');
 await db.query('BEGIN');
 await db.query('CREATE SCHEMA '+namespace);
 await db.query('SET LOCAL search_path TO '+namespace);
 await db.query("CREATE TABLE erp_people(user_id text PRIMARY KEY); INSERT INTO erp_people VALUES('a'),('b');"+schema);
 const run=(actor,method,route,body={})=>handleGifs({req:{method,headers:{}},res:{writeHead(){},end:data=>data},pool:db,actor,route,json:(_,status,obj)=>obj,readInput:()=>body});
 const a=await run('a','POST','/gifs',{gif}),retry=await run('a','POST','/gifs',{gif});
 const b=await run('b','POST','/gifs',{gif});
 assert.equal(retry.id,a.id);assert.notEqual(b.id,a.id);
 assert.deepEqual(await run('a','GET','/gifs'),{items:[a]});
 assert.deepEqual(await run('a','GET','/gifs/'+a.id),gifBytes(gif));
 await assert.rejects(run('b','GET','/gifs/'+a.id),{status:404});
 await assert.rejects(handleGifs({req:{method:'GET',headers:{'x-moriyati-user':'a'}},actor:'b',route:'/gifs'}),{status:409});
});
