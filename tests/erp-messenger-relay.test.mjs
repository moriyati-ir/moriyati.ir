import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

test('authenticated relay delivers private events, acknowledges receipt and restricts edits to senders',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'erp-relay-'));
 const keys={sonia:'a'.repeat(32),ghazal:'b'.repeat(32),majid:'c'.repeat(32)};
 const proc=spawn(process.execPath,['services/messenger-relay.mjs'],{env:{...process.env,PORT:'0',MESSENGER_DB:join(dir,'relay.db'),MESSENGER_TOKENS:JSON.stringify(keys)},stdio:['ignore','pipe','pipe']});
 try{
  const ready=await Promise.race([once(proc.stdout,'data'),once(proc,'exit').then(()=>{throw Error('relay exited');}),delay(4000,null,{ref:false}).then(()=>{throw Error('relay startup timeout');})]);
  const port=Number(ready[0].toString().match(/:(\d+)/)[1]);
  const api=(actor,path,data)=>fetch('http://127.0.0.1:'+port+'/api/messenger/'+path,{method:data?'POST':'GET',headers:{authorization:'Bearer '+(keys[actor]||'wrong')},body:data?JSON.stringify(data):null});
  assert.equal((await api('bad','session')).status,401);
  assert.equal((await (await api('sonia','session')).json()).actor,'sonia');
  const message={to:'ghazal',id:'msg1',data:{kind:'text',text:'سلام'}};
  assert.equal((await api('sonia','message',message)).status,200);
  assert.equal((await api('sonia','message',message)).status,200);
  const [received]=await (await api('ghazal','events')).json();assert.equal(received.data.text,'سلام');
  assert.deepEqual(await (await api('ghazal','events?after='+received.seq)).json(),[]);
  assert.deepEqual(await (await api('majid','events')).json(),[]);
  assert.equal((await api('majid','ack',{to:'sonia',id:'msg1',state:'read'})).status,400);
  assert.equal((await api('ghazal','ack',{to:'sonia',id:'msg1',state:'read'})).status,200);
  assert.equal((await (await api('sonia','events')).json())[0].state,'read');
  assert.equal((await api('majid','change',{to:'ghazal',id:'msg1',mode:'edit',text:'x'})).status,400);
  assert.equal((await api('sonia','change',{to:'ghazal',id:'msg1',mode:'delete'})).status,200);
  assert.equal((await api('ghazal','signal',{to:'sonia',id:'call',mode:'offer',data:{type:'offer',sdp:'test'}})).status,200);
 }finally{proc.kill();if(proc.exitCode===null&&proc.signalCode===null)await once(proc,'exit');await rm(dir,{recursive:true,force:true});}
});
