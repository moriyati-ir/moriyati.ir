import assert from 'node:assert/strict';
import test from 'node:test';
import {fileManager} from '../dist/erp/moriyati-files.mjs';

test('live file manager opens the signed-in drive, lists and uploads without browser storage', async t => {
 const section={innerHTML:''}, origin='https://erp.example.test';
 const actor='sonia';
 const calls=[],errors=[],entries=[];
 const setup=(key,value)=>{const old=Object.getOwnPropertyDescriptor(globalThis,key);
  Object.defineProperty(globalThis,key,{configurable:true,value});
  t.after(()=>old?Object.defineProperty(globalThis,key,old):delete globalThis[key]);
 };
 setup('location',{origin});
 setup('document',{querySelector:s=>s.startsWith('meta')?{content:'live'}:s==='.moriyati-files'?section:null,addEventListener(){}});
 setup('localStorage',{getItem(){throw Error('browser storage accessed');},setItem(){throw Error('browser storage accessed');}});
 setup('fetch',async (url,opts)=>{
  assert.equal(url.origin,origin);assert.equal(opts.headers['X-Moriyati-Actor'],actor);
  assert.equal(opts.credentials,'same-origin');calls.push(url.pathname);
  const op=url.pathname.split('/').at(-1);
  if(op==='upload'){
   assert.equal(opts.method,'POST');assert.equal(await opts.body.text(),'example');
   const path=url.searchParams.get('path');entries.push({name:path,path,dir:false});
  }
  return Response.json(op==='marks'?{recent:[],shared:[],favorites:[]}:op==='list'?{entries}: {ok:true});
 });
 const drive=fileManager({actor:()=>actor,tr:(_,en)=>en,modal(){},toast:e=>errors.push(e),esc:String});
 assert.match(drive.render(),/Moriyati Files/);
 drive.action('dir',origin+'/api/live/files/tree/');
 await new Promise(r=>setImmediate(r));
 assert.match(section.innerHTML,/Upload file/);
 assert.doesNotMatch(section.innerHTML,/Connect to file server|Workshop samples/);
 await drive.upload({files:[new File(['example'],'f#1.pdf',{type:'application/pdf'})]});
 assert.match(section.innerHTML,/f#1.pdf/);
 assert.ok(calls.includes('/api/live/files/upload'));assert.deepEqual(errors,[]);
});
