import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {resolve} from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const dist=resolve(import.meta.dirname,'../dist');
const ctx={window:{}};
runInNewContext(await readFile(resolve(dist,'coin-flip.js'),'utf8'),ctx);
runInNewContext(await readFile(resolve(dist,'coin-geometry.js'),'utf8'),ctx);
const flip=ctx.window.MORIYATI_COIN_FLIP;
const reverse=ctx.window.MORIYATI_COIN_GEOMETRY;

test('The front completely turns away before the original reverse construction starts',()=>{
  for(const progress of [0,.01,.04,.09,.14,.189,.19]){
    const state=flip.sequence(progress);
    assert.equal(state.buildEntry,0,'Reverse construction must wait for a complete flip');
    assert.ok(state.angle>=0&&state.angle<=180);
  }
  assert.equal(flip.sequence(0).face,'front');
  assert.equal(flip.sequence(.19).angle,180);
  assert.equal(flip.sequence(.19).face,'reverse');
  assert.ok(flip.sequence(.2).buildEntry>.04);
  assert.equal(flip.sequence(1).buildEntry,1);
  assert.equal(flip.sequence(1).angle,180);
  // Reversing the scroll is deterministic: no timer, completion latch or delay.
  flip.sequence(1);
  assert.equal(flip.sequence(0).angle,0);
  assert.equal(flip.sequence(0).buildEntry,0);
  for(const progress of [0,.3,1])assert.equal(flip.sequence(progress,true).angle,0);
});

test('Both faces have one round boundary, centre and diameter; the obsolete lion is absent',()=>{
  assert.equal(flip.radius,reverse.outerRadius);
  assert.equal(flip.center,reverse.ringPivot[0]);
  assert.equal(flip.diameter,reverse.viewBox[2]);
  const art=flip.createFront('test-coin');
  assert.match(art,/<circle cx="627" cy="627" r="610"\/>/);
  assert.match(art,/viewBox="0 0 1254 1254"/);
  assert.doesNotMatch(reverse.svg,/data-coin-lion|medallion-lion-emboss/);
  const edge=flip.createEdge();
  assert.equal((edge.match(/class="coin-edge-segment"/g)||[]).length,flip.edgeSegments);
  assert.doesNotMatch(edge,/NaN|Infinity/);
});

test('The approved ISFAHAN front artwork is used in both the animated rig and fallback',async()=>{
  const asset=await readFile(resolve(dist,flip.front));
  assert.equal(createHash('sha256').update(asset).digest('hex'),'e583401e261c32eaa5e80e429b9a2776b411598dc63ca742802d10c0fc193c81');
  const html=await readFile(resolve(dist,'index.html'),'utf8');
  assert.match(html,/src="assets\/motion\/v16\/moriyati-lion-front-isfahan\.webp"/);
  assert.ok(html.indexOf('src="coin-flip.js"')<html.indexOf('src="enhancements.js"'));
});

test('Both faces expose matching reeded shoulders connected to the same scaled edge',()=>{
  assert.ok(flip.thicknessMm>=2);
  const front=flip.createFront('front-check');
  const back=flip.prepareReverse(reverse.create('reverse-check',{includeRing:false}),'back-check');
  for(const art of [front,back]){
    assert.equal((art.match(/data-coin-reeded-rim=/g)||[]).length,1);
    assert.match(art,new RegExp('data-reed-count="'+flip.reedCount+'"'));
    const ids=new Set([...art.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
    for(const m of art.matchAll(/(?:href="#|url\(#)([^"\)]+)/g))assert.ok(ids.has(m[1]),m[1]);
    assert.equal((art.match(/<svg\b/g)||[]).length,(art.match(/<\/svg>/g)||[]).length);
  }
  assert.match(back,/coin-ring-texture/);
  assert.doesNotMatch(back,/<feComponentTransfer|<feColorMatrix/);
  assert.doesNotMatch(back,/data-coin-ring=|coin-ring-assembly/);
  assert.match(reverse.ringSvg,/engraved-paths/);
  assert.match(reverse.ringSvg,/<circle cx="627" cy="627" r="610"/);
  assert.equal((flip.createEdge().match(/data-edge-reeds="2"/g)||[]).length*2,flip.reedCount);
});

test('Edge thickness follows the coin diameter through resize without another scroll loop',()=>{
  let resize,observed;
  const properties=new Map();
  const nodes=new Map();
  const node=selector=>{
    if(!nodes.has(selector))nodes.set(selector,{style:{setProperty(k,v){properties.set(k,v);}},dataset:{}});
    return nodes.get(selector);
  };
  const coin={clientWidth:300,querySelector:node,innerHTML:''};
  ctx.window.ResizeObserver=class{constructor(callback){resize=callback;}observe(target){observed=target;}};
  const rig=flip.mount(coin,reverse.create('size-check'),'test coin');
  assert.equal(observed,coin);
  const first=Number.parseFloat(properties.get('--coin-thickness'));
  assert.ok(Math.abs(first/(300*2*flip.radius/flip.diameter)-flip.thicknessRatio)<.00001);
  coin.clientWidth=600;resize();
  assert.ok(Math.abs(Number.parseFloat(properties.get('--coin-thickness'))-first*2)<.002);
  rig.draw(.101,false);
  assert.match(node('.coin-turntable').style.transform,/rotateY\(90\.0000deg\)/);
  assert.ok(Number(properties.get('--coin-shadow-scale'))<=flip.thicknessRatio,'The side view must not leave a full circular shadow behind the edge');
  rig.draw(0,false);
  assert.equal(Number(properties.get('--coin-shadow-scale')),1);
  assert.equal(node('.coin-front').style.visibility,'visible');
  rig.draw(.9,false);
  assert.equal(node('.coin-front').style.visibility,'hidden');
  assert.equal(node('.coin-reverse').style.visibility,'visible');
});
