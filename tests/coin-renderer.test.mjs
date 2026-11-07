import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'../dist');
async function runtime(){
 const images=[];
 class Image {constructor(){images.push(this);}}
 const ctx={window:{Image},Image};
 for(const file of ['coin-geometry.js','coin-atlas.js','coin-renderer.js'])runInNewContext(await readFile(resolve(root,file),'utf8'),ctx);
 return {...ctx.window,images};
}
function drawing(atlas){
 const calls=[],stack=[];
 let clears=0;
 const ctx={globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},setTransform(){},translate(){},rotate(){},beginPath(){},arc(){},clip(){},moveTo(){},quadraticCurveTo(){},stroke(){},
  clearRect(){clears++;calls.length=0;},
  drawImage(image,x,y){const name=Object.entries(atlas.sprites).find(([,s])=>s.x===x&&s.y===y)?.[0];calls.push({name,alpha:this.globalAlpha});}};
 const canvas={width:0,height:0,getContext:()=>ctx};
 return {canvas,calls,get clears(){return clears;}};
}

test('The cached artwork covers every original part without overlapping atlas cells',async()=>{
 const api=await runtime(),atlas=api.MORIYATI_COIN_ATLAS;
 assert.equal(atlas.viewBox,1254);assert.equal(Object.keys(atlas.sprites).length,30);
 const cells=Object.values(atlas.sprites);
 for(const s of cells){
  assert.ok(s.x>=2&&s.y>=2&&s.width>0&&s.height>0);
  assert.ok(s.x+s.width<=atlas.atlasWidth-2&&s.y+s.height<=atlas.atlasHeight-2);
  assert.ok(s.dx>=0&&s.dy>=0&&s.dx+s.width<=1254&&s.dy+s.height<=1254);
 }
 for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++){
  const a=cells[i],b=cells[j];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);
 }
 for(const part of ['base','body','windows','ground','final','coach','rearWheel','frontWheel','arm',...Array.from({length:13},(_,i)=>'tree'+i)])assert.ok(atlas.sprites[part],part);
 for(const limb of ['hindNear','hindFar','foreNear','foreFar'])for(const part of ['Upper','Lower'])assert.ok(atlas.sprites[limb+part]);
 const bytes=await readFile(resolve(root,atlas.image));
 assert.ok(bytes.length<2_000_000,'A single bounded texture replaces the live masked image stack');
 assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
});

test('Canvas construction keeps all 13 trees ahead of the articulated carriage',async()=>{
 const api=await runtime(),renderer=api.MORIYATI_COIN_RENDERER,draw=drawing(api.MORIYATI_COIN_ATLAS);
 const scene=renderer.createReverse(draw.canvas);scene.resize(300,3,true);api.images[0].onload();
 scene.draw(.24);assert.ok(draw.calls.some(c=>c.name==='body'&&c.alpha>0));assert.ok(!draw.calls.some(c=>c.name.startsWith('tree')||c.name==='coach'));
 scene.draw(.365);const partial=draw.calls.filter(c=>c.name.startsWith('tree'));
 assert.ok(partial.length>0&&partial.length<13);assert.ok(!draw.calls.some(c=>c.name==='coach'));
 scene.draw(.56);assert.equal(draw.calls.filter(c=>c.name.startsWith('tree')&&c.alpha===1).length,13);assert.ok(!draw.calls.some(c=>c.name==='coach'));
 scene.draw(.67);assert.ok(draw.calls.find(c=>c.name==='coach')?.alpha>0);
 for(const limb of ['hindNear','hindFar','foreNear','foreFar'])assert.ok(draw.calls.some(c=>c.name===limb+'Upper')&&draw.calls.some(c=>c.name===limb+'Lower'));
 scene.draw(1);assert.deepEqual(draw.calls.map(c=>c.name),['base','final']);
 const count=draw.clears;for(let i=0;i<240;i++)scene.draw(.9+i/2400);assert.equal(draw.clears,count,'A completed scene must not repaint on later scroll frames');
 scene.draw(.365);assert.ok(!draw.calls.some(c=>c.name==='coach'),'Reverse scrolling restores the earlier tree construction');
});

test('The lightweight edge retains physical thickness through a 180 degree flip',async()=>{
 const renderer=(await runtime()).MORIYATI_COIN_RENDERER;
 const width=300,half=610*.06,near=renderer.project(0,0,half,90,width),far=renderer.project(0,0,-half,90,width);
 assert.ok(Math.abs((near[0]-far[0])/1254*width-2*610/1254*width*.06)<.01);
 for(const angle of [0,30,90,150,180])for(const x of [-610,0,610])assert.ok(renderer.project(x,0,half,angle,width).every(Number.isFinite));
 assert.equal(renderer.resolution(300,3,true),975);assert.equal(renderer.resolution(700,3,false),1254);
 assert.equal(renderer.createReverse({getContext:()=>null}),null,'Unsupported canvas must leave the SVG fallback available');
 const polygons=[];let points;
 const ctx={setTransform(){},clearRect(){polygons.length=0;},createLinearGradient(){return {addColorStop(){}};},beginPath(){points=[];},moveTo(x,y){points.push([x,y]);},lineTo(x,y){points.push([x,y]);},closePath(){},fill(){polygons.push(points);}};
 const canvas={width:0,height:0,getContext:()=>ctx},edge=renderer.createEdge(canvas);
 edge.resize(width,3,true);
 assert.equal(canvas.width,640,'Only the narrow moving edge uses the smaller mobile surface');
 for(const angle of [30,90,150]){
  edge.draw(angle);assert.equal(polygons.length,192);
  const first=renderer.project(610*Math.cos(Math.PI/2),610,-half,angle,width);
  assert.ok(Math.abs(polygons[0][0][0]-first[0])<1e-8&&Math.abs(polygons[0][0][1]-first[1])<1e-8,'The faster projection must retain the original physical silhouette');
 }
});

test('Atlas decoding completes before the first paint and retains the pending scroll pose',async()=>{
 const api=await runtime(),draw=drawing(api.MORIYATI_COIN_ATLAS);let resolve,failed=0;
 const scene=api.MORIYATI_COIN_RENDERER.createReverse(draw.canvas,{failed(){failed++;}});
 scene.resize(300,3,true);scene.draw(.56);
 api.images[0].decode=()=>new Promise(done=>{resolve=done;});api.images[0].onload();
 assert.equal(scene.loaded,false);assert.equal(draw.calls.length,0);
 resolve();await Promise.resolve();
 assert.equal(scene.loaded,true);assert.equal(draw.calls.filter(c=>c.name.startsWith('tree')).length,13);assert.equal(failed,0);
 const next=drawing(api.MORIYATI_COIN_ATLAS);
 api.MORIYATI_COIN_RENDERER.createReverse(next.canvas,{failed(){failed++;}});
 api.images[1].decode=()=>Promise.reject(new Error('Decode failed'));api.images[1].onload();await Promise.resolve();
 assert.equal(failed,1,'A decoder failure must leave the existing fallback reachable');
});

test('A texture load failure restores the original SVG instead of leaving an empty reverse',async()=>{
 let fail,events=0;
 const nodes=new Map(),node=selector=>{
  if(!nodes.has(selector))nodes.set(selector,{style:{setProperty(){}},dataset:{},querySelector:node,append(){},innerHTML:''});
  return nodes.get(selector);
 };
 const canvasRenderer={resize(){},draw(){}};
 const ctx={window:{MORIYATI_COIN_ATLAS:{},MORIYATI_COIN_RENDERER:{createReverse(canvas,options){fail=options.failed;return canvasRenderer;},createEdge(canvas){return {canvas,resize(){},draw(){}};}},dispatchEvent(){events++;}},Event:class{}};
 runInNewContext(await readFile(resolve(root,'coin-geometry.js'),'utf8'),ctx);
 runInNewContext(await readFile(resolve(root,'coin-flip.js'),'utf8'),ctx);
 const coin={clientWidth:300,innerHTML:'',querySelector:node},geometry=ctx.window.MORIYATI_COIN_GEOMETRY;
 const rig=ctx.window.MORIYATI_COIN_FLIP.mount(coin,geometry.create('fallback',{includeRing:false}),'coin');
 assert.equal(rig.renderer,canvasRenderer);
 fail();assert.equal(rig.renderer,null);assert.equal(rig.revision,1);assert.equal(events,1);
 assert.ok(node('.coin-reverse').innerHTML.includes('data-coin-tree="12"'));
 rig.draw(.94,false);assert.equal(node('.coin-reverse').style.visibility,'visible');
});
