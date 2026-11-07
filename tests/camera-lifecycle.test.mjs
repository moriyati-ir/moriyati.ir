import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source=await readFile(new URL('../dist/authenticity.js',import.meta.url),'utf8');
function deferred(){let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};}
function runtime(getUserMedia,detect=async()=>[]){
 const nodes=new Map(),events=new Map(),frames=new Map();let frameId=0,plays=0;
 function node(){return {listeners:new Map(),hidden:false,disabled:false,innerHTML:'',value:'',textContent:'',readyState:2,classList:{add(){},remove(){},contains(){return false;}},setAttribute(){},getContext:()=>({}),focus(){},scrollIntoView(){},async play(){plays++;},addEventListener(name,fn){this.listeners.set(name,fn);}};}
 const $=selector=>{if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);};
 const doc={hidden:false,documentElement:node(),querySelector:$,querySelectorAll:()=>[],addEventListener(name,fn){events.set(name,fn);}};
 class Detector {detect(){return detect();}}
 const context={document:doc,navigator:{mediaDevices:{getUserMedia}},location:{hash:''},history:{replaceState(){}},BarcodeDetector:Detector,requestAnimationFrame(fn){frames.set(++frameId,fn);return frameId;},cancelAnimationFrame(id){frames.delete(id);},addEventListener(){}};
 context.window={BarcodeDetector:Detector,MoriyatiLocale:{language:'fa'},MoriyatiAuth:{parse:s=>s},MORIYATI_AUTH_REGISTRY:{records:{}},MORIYATI_COLLECTIONS:[{slug:'celestial',name:'Celestial'}],MORIYATI_COLLECTION_GUIDES:{celestial:{fa:{checks:[]}}},MORIYATI_MEDIA:{collections:{celestial:{gallery:[{src:'sample.webp',alt:{fa:'Sample'},caption:{fa:'Sample'}}]}}}};
 runInNewContext(source,context);
 return {$,doc,frames,get plays(){return plays;},click:s=>$(s).listeners.get('click')(),hide(){doc.hidden=true;events.get('visibilitychange')();}};
}

test('Leaving while camera permission is pending stops a late stream without starting video',async()=>{
 const permission=deferred();let stopped=0;
 const app=runtime(()=>permission.promise),opening=app.click('#start-camera');
 assert.equal(app.$('#start-camera').disabled,true);
 app.hide();permission.resolve({getTracks:()=>[{stop(){stopped++;}}]});await opening;
 assert.equal(stopped,1);assert.equal(app.plays,0);assert.equal(app.$('#qr-video').srcObject,null);assert.equal(app.frames.size,0);
});

test('Closing the camera discards a detector result that arrives after cancellation',async()=>{
 const detection=deferred();let stopped=0;
 const app=runtime(async()=>({getTracks:()=>[{stop(){stopped++;}}]}),()=>detection.promise);
 await app.click('#start-camera');
 const [id,scan]=app.frames.entries().next().value;app.frames.delete(id);
 const scanning=scan(200);app.click('#stop-camera');detection.resolve([{rawValue:'AA0002008'}]);await scanning;
 assert.equal(stopped,1);assert.equal(app.$('#auth-result').innerHTML,'');assert.equal(app.frames.size,0);
 assert.match(app.$('#scanner-status').textContent,/دوربین بسته شد/);
});

test('An obsolete permission failure cannot stop a newer camera session',async()=>{
 const first=deferred();let calls=0,stopped=0;
 const active={getTracks:()=>[{stop(){stopped++;}}]};
 const app=runtime(()=>++calls===1?first.promise:Promise.resolve(active));
 const oldOpening=app.click('#start-camera');app.hide();app.doc.hidden=false;
 await app.click('#start-camera');first.reject(new Error('Old request cancelled'));await oldOpening;
 assert.equal(app.$('#qr-video').srcObject,active);assert.equal(stopped,0);assert.equal(app.frames.size,1);
});
