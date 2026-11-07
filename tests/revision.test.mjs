import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const dist=resolve(import.meta.dirname,'../dist');

test('Approved Persian heritage copy remains exact in source and in the published page',async()=>{
 const data=JSON.parse(await readFile(resolve(dist,'heritage-copy.json'),'utf8'));
 assert.match(JSON.stringify(data.fa),/حاج محمدحسین مهربان/);
 const approvedCopy=JSON.stringify(data.fa).replaceAll('حاج محمدحسین مهربان','محمدحسین مهربان');
 assert.equal(createHash('sha256').update(approvedCopy).digest('hex'),'4365b1291dac2f63a3fa7747ec2a2b813aa01bc718fe146e32e9e6fa33c5d24a');
 const html=await readFile(resolve(dist,'heritage.html'),'utf8');
 const groups=[['intro',data.fa.intro],...data.fa.sections.map(s=>[s.id,s.paragraphs])];
 let count=0;
 for(const [key,paragraphs] of groups)for(const [i,text] of paragraphs.entries()){
  const match=html.match(new RegExp('<p[^>]+data-approved-paragraph="'+key+'-'+i+'"[^>]*>([\\s\\S]*?)</p>'));
  assert.ok(match,key+'-'+i);
  assert.equal(match[1].replace(/<\/?strong>/g,''),text,key+'-'+i);count++;
 }
 assert.equal([...html.matchAll(/data-approved-paragraph=/g)].length,count);
 assert.doesNotMatch(html,/تاج|ساخت دستی|۱۴۰۳/);
});

test('The carriage has independent walking joints, wheels, arm and reins, and returns to its original pose',async()=>{
 const context={window:{}};runInNewContext(await readFile(resolve(dist,'coin-geometry.js'),'utf8'),context);
 const rig=context.window.MORIYATI_COIN_GEOMETRY;
 assert.deepEqual(Array.from(rig.viewBox),[0,0,1254,1254]);
 for(const layer of ['body','windows','trees','ground'])assert.ok(rig.svg.includes('data-coin-layer="'+layer+'"'));
 const attrs=new Map();
 const root={querySelector(selector){return{setAttribute(name,value){attrs.set(selector+':'+name,value);}};}};
 rig.walk(root,{travel:-237,energy:.9});
 const wheels=['rearWheel','frontWheel'].map(k=>attrs.get('[data-coin-part="'+k+'"]:transform'));
 assert.notEqual(wheels[0],wheels[1]);
 for(const name of ['hindNear','hindFar','foreNear','foreFar']){
  assert.match(attrs.get('[data-coin-part="'+name+'"]:transform'),/^rotate\(/);
  assert.ok(!attrs.get('[data-coin-joint="'+name+'"]:transform').startsWith('rotate(0.000 '));
 }
 assert.ok(!attrs.get('[data-coin-part="arm"]:transform').startsWith('rotate(0.000 '));
 assert.match(attrs.get('[data-coin-rein="light"]:d'),/^M554 /);
 rig.walk(root,{travel:0,energy:0});
 for(const name of ['hindNear','hindFar','foreNear','foreFar','rearWheel','frontWheel','arm'])assert.match(attrs.get('[data-coin-part="'+name+'"]:transform'),/^rotate\(0\.000 /);
 rig.turn(root,360);for(const value of attrs.values())assert.doesNotMatch(value,/NaN|Infinity/);
});

test('Newsletter editions contain sourced bilingual archive reporting without automatic publication',async()=>{
 const js=await readFile(resolve(dist,'newsletter.js'),'utf8'),ctx={window:{}};
 runInNewContext(await readFile(resolve(dist,'newsletter-data.js'),'utf8'),ctx);
 const data=ctx.window.MORIYATI_NEWSLETTER;
 assert.equal(data.mode,'archive');assert.equal(data.automaticPublication,false);
 assert.deepEqual(Array.from(data.editions,e=>e.time),['11:00','23:00']);
 for(const e of data.editions){
  assert.equal(e.date,'2026-11-05');
  for(const lang of ['fa','en']){
   for(const key of ['global','iran'])assert.ok(e[lang][key].length>=3);
   const paragraphs=[...e[lang].global,...e[lang].iran];
   assert.ok(paragraphs.flatMap(s=>s.paragraphs).join(' ').split(/\s+/).length>350);
   for(const story of paragraphs)for(const id of story.sourceIds)assert.ok(e.sources.some(source=>source.id===id));
  }
  for(const source of e.sources)assert.ok(source.url.startsWith('https://'));
 }
 assert.match(js,/mode:'archive',automaticPublication:false/);
 assert.doesNotMatch(js,/fetch\(|setInterval\(|XMLHttpRequest|WebSocket/);
 assert.equal(data.editorialNotes,undefined);
});

test('The rotating rim and all clipped scene stages share one true circular centre',async()=>{
 const context={window:{}};runInNewContext(await readFile(resolve(dist,'coin-geometry.js'),'utf8'),context);
 const coin=context.window.MORIYATI_COIN_GEOMETRY;
 assert.deepEqual(Array.from(coin.ringPivot),[627,627]);
 assert.equal(coin.innerRadius,468);assert.equal(coin.outerRadius,610);
 assert.ok(coin.svg.includes('<circle cx="627" cy="627" r="468"/>'));
 assert.ok(coin.svg.includes('transform="translate(1 -8)"'));
 assert.doesNotMatch(coin.svg,/body-under-driver|windows-clean|trees-clean/);
 const attrs=new Map(),root={querySelector(s){return{setAttribute(k,v){attrs.set(k,v);}};}};
 for(let angle=0;angle<=360;angle+=15){coin.turn(root,angle);assert.equal(attrs.get('transform'),'rotate('+angle+' 627 627)');}
 const rim=await readFile(resolve(dist,'assets/motion/v7/annulus-circular.svg'),'utf8');
 assert.doesNotMatch(rim,/<ellipse/);
 assert.ok(rim.includes('<circle cx="627" cy="627" r="610"'));
 for(const layer of ['pavilion-base-complete','pavilion-detailed-complete','pavilion-foliage-complete'])assert.ok(coin.svg.includes(layer+'.webp'));
});

test('Retailer distances rank locations correctly and sample phone numbers cannot dial',async()=>{
 const handlers={},ctx={window:{},document:{documentElement:{lang:'fa'},querySelectorAll:()=>[],addEventListener:(name,fn)=>{handlers[name]=fn;}},addEventListener(){},Intl};
 runInNewContext(await readFile(resolve(dist,'dealers-data.js'),'utf8'),ctx);
 runInNewContext(await readFile(resolve(dist,'dealers.js'),'utf8'),ctx);
 const api=ctx.window.MoriyatiDealers,data=ctx.window.MORIYATI_DEALERS;
 assert.equal(data.length,8);assert.equal(data.filter(x=>x.sample).length,7);
 assert.ok(data.filter(x=>x.sample).every(x=>x.tel===null));
 assert.equal(api.distanceKm(data[0],data[0]),0);
 const esfahan=data.find(x=>x.id==='isfahan');
 assert.ok(api.distanceKm(data[0],esfahan)>340&&api.distanceKm(data[0],esfahan)<355);
 assert.equal(api.rank({lat:35.7909,lon:51.4210})[0].id,'tehran');
 assert.equal(api.rank(esfahan)[0].id,'isfahan');
 assert.equal(data[0].distance,undefined);
 const js=await readFile(resolve(dist,'dealers.js'),'utf8');
 assert.doesNotMatch(js,/fetch\(|localStorage|sessionStorage|setInterval/);
 assert.match(js,/getCurrentPosition/);
});

test('Retailer directory mounts all cities, requests location only on click and handles refusal',async()=>{
 const buttons={},select={addEventListener(){},value:''};
 const root={isConnected:true,innerHTML:'',querySelector(selector){return selector==='[data-city]'?select:{addEventListener(type,fn){buttons[type]=fn;}};}};
 let calls=0,fail,success;
 const ctx={window:{},document:{documentElement:{lang:'fa'},querySelectorAll:()=>[root],addEventListener(){}},navigator:{geolocation:{getCurrentPosition(ok,no,options){calls++;success=ok;fail=no;assert.equal(options.timeout,8000);}}},addEventListener(){},Intl};
 runInNewContext(await readFile(resolve(dist,'dealers-data.js'),'utf8'),ctx);
 runInNewContext(await readFile(resolve(dist,'dealers.js'),'utf8'),ctx);
 assert.equal(calls,0);assert.equal((root.innerHTML.match(/data-dealer=/g)||[]).length,8);
 buttons.click();assert.equal(calls,1);fail({code:1});
 assert.ok(root.innerHTML.includes('شهر خود را از فهرست انتخاب کنید.'));
 buttons.click();success({coords:{latitude:35.7911,longitude:51.4208}});
 assert.ok(root.innerHTML.includes('is-nearest'));assert.ok(root.innerHTML.indexOf('data-dealer="tehran"')<root.innerHTML.indexOf('data-dealer="isfahan"'));
});
