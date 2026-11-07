import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {resolve} from 'node:path';
const dist=resolve(import.meta.dirname,'../dist');
test('Removed interactive jar cannot load or request sensors from the page or its portable export',async()=>{
 for(const path of ['dist/expertise.html','exports/Moriyati-Expertise.html']){
  const html=await readFile(resolve(dist,'..',path),'utf8');
  assert.doesNotMatch(html,/granule-jar|data-granule-experience|data-enable-jar|MoriyatiGranules|DeviceOrientationEvent/);
  assert.match(html,/تولید ساچمه و پودر فلزات/);
  assert.match(html,/id="metal-canvas"/,'The existing refining process illustration stays intact');
 }
 await assert.rejects(readFile(resolve(dist,'granule-jar.js')),{code:'ENOENT'});
});

test('Circular metal engraving and individual foliage preserve valid SVG registration',async()=>{
 const ctx={window:{}};runInNewContext(await readFile(resolve(dist,'coin-geometry.js'),'utf8'),ctx);
 const coin=ctx.window.MORIYATI_COIN_GEOMETRY;
 assert.equal(coin.foliageCount,13);
 assert.equal((coin.svg.match(/data-coin-tree="\d+"/g)||[]).length,13);
 assert.equal((coin.svg.match(/<svg\b/g)||[]).length,1);
 assert.equal((coin.svg.match(/<\/svg>/g)||[]).length,1);
 const ids=new Set([...coin.svg.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
 for(const m of coin.svg.matchAll(/(?:href="#|url\(#)([^"\)]+)/g))assert.ok(ids.has(m[1]),m[1]);
 assert.match(coin.svg,/engraved-paths/);assert.doesNotMatch(coin.svg,/<ellipse[^>]*(?:rx="610"|ry="610")/);
});

test('Every tree is visible before the original final carriage stage begins',async()=>{
 const nodes=new Map();
 function layer(selector){if(!nodes.has(selector))nodes.set(selector,{style:{setProperty(){}},dataset:{},removeAttribute(){},setAttribute(){}});return nodes.get(selector);}
 const relief={querySelector:layer,dataset:{}};
 const coin={querySelector:s=>s==='img'?{alt:'coin'}:s==='.coin-engraving'?relief:layer(s),style:{setProperty(){}},innerHTML:''};
 const ctx={window:{MORIYATI_COIN_GEOMETRY:{create:()=>'',turn(){},walk(){}}},document:{querySelector:s=>s==='.medallion-tilt'?coin:null,querySelectorAll:()=>[]}};
 runInNewContext(await readFile(resolve(dist,'coin-flip.js'),'utf8'),ctx);
 runInNewContext(await readFile(resolve(dist,'enhancements.js'),'utf8'),ctx);
 const draw=build=>ctx.window.MoriMotion.draw({entry:.19+(build-.04)/.96*.81,stage:0,heritage:0,reduced:false,currentStage:0});
 const start=entry=>ctx.window.MoriMotion.draw({entry,stage:0,heritage:0,reduced:false,currentStage:0});
 const opacity=selector=>Number(layer(selector).style.opacity??0);
 start(.11);
 assert.equal(opacity('[data-coin-layer="body"]'),0,'No pavilion construction during the flip');
 assert.equal(opacity('[data-coin-carriage]'),0);
 start(.24);
 assert.ok(opacity('[data-coin-layer="body"]')>0,'Pavilion starts after the complete flip');
 assert.equal(opacity('[data-coin-layer="windows"]'),0);
 assert.equal(layer('.coin-front').style.visibility,'hidden');
 assert.equal(layer('.coin-reverse').style.visibility,'visible');
 draw(.365);
 const partial=Array.from({length:13},(_,i)=>opacity('[data-coin-tree="'+i+'"]'));
 assert.ok(partial.some(x=>x>0)&&partial.some(x=>x===0),'Foliage must arrive in successive groups');
 assert.equal(opacity('[data-coin-carriage]'),0);
 draw(.46);
 assert.equal(opacity('[data-coin-layer="trees"]'),1,'The shared hidden layer must be made visible');
 for(let i=0;i<13;i++)assert.equal(opacity('[data-coin-tree="'+i+'"]'),1);
 draw(.56);assert.equal(opacity('[data-coin-carriage]'),0);assert.equal(opacity('[data-coin-layer="ground"]'),1);
 draw(.66);assert.ok(opacity('[data-coin-carriage]')>0);
 for(let i=0;i<13;i++)assert.equal(opacity('[data-coin-tree="'+i+'"]'),1);
});

test('Newsletter uses dated image covers, independently timestamped quotes and real comparison points',async()=>{
 const ctx={window:{}};runInNewContext(await readFile(resolve(dist,'newsletter-data.js'),'utf8'),ctx);
 const data=ctx.window.MORIYATI_NEWSLETTER;
 for(const edition of data.editions){
  assert.ok(edition.cover.endsWith('.webp'));
  assert.equal(edition.iranSnapshot.length,6);
  const sourceIDs=new Set(edition.sources.map(x=>x.id));
  for(const row of edition.iranSnapshot)assert.ok(sourceIDs.has(row.sourceId));
 }
 const night=data.editions[1];assert.equal(Object.keys(night.comparison).length,3);
 assert.deepEqual([night.comparison.morning.gold,night.comparison.evening.gold],[4134.83,4100.27]);
 assert.equal(data.automaticPublication,false);
});

test('Scrolling later chapters does not dirty a completed coin scene',async()=>{
 let writes=0;
 const nodes=new Map();
 function node(selector){
  if(!nodes.has(selector))nodes.set(selector,{
   style:new Proxy({setProperty(){writes++;}},{set(target,key,value){writes++;target[key]=value;return true;}}),
   dataset:new Proxy({},{set(target,key,value){writes++;target[key]=value;return true;}}),
   setAttribute(){writes++;},removeAttribute(){writes++;}
  });
  return nodes.get(selector);
 }
 const relief={querySelector:node,dataset:{}};
 const coin={clientWidth:300,style:{setProperty(){writes++;}},innerHTML:'',querySelector:s=>s==='img'?{alt:'coin'}:s==='.coin-engraving'?relief:node(s)};
 const ctx={window:{},document:{querySelector:s=>s==='.medallion-tilt'?coin:null,querySelectorAll:()=>[]}};
 for(const file of ['coin-geometry.js','coin-flip.js','enhancements.js'])runInNewContext(await readFile(resolve(dist,file),'utf8'),ctx);
 const draw=stage=>ctx.window.MoriMotion.draw({entry:1,stage,heritage:0,reduced:false,currentStage:Math.min(3,Math.floor(stage*4))});
 draw(0);writes=0;
 for(let i=0;i<240;i++)draw(i/240);
 assert.equal(writes,0,'A finished offscreen coin must not trigger style or SVG mutations while other chapters scroll');
});
