/* Cached pixels replace live SVG masks and the 96-layer 3D edge. The existing
 * scroll frame calls this renderer; there is no separate animation loop. */
(() => {
 'use strict';
 const W=1254,C=627,R=610,inner=468,tau=Math.PI*2;
 const clamp=v=>Math.max(0,Math.min(1,v));
 const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
 const groups=Object.freeze([[0,5,8,12],[2,6,9,1],[3,4,7,10,11]]);
 function scene(build,reduced=false){
  const arrival=smooth(.57,.79,build);
  return {body:smooth(.04,.18,build),windows:smooth(.2,.31,build),ground:smooth(.47,.55,build),
   trees:groups.map((_,i)=>smooth(.33+i*.03,.39+i*.03,build)),
   carriage:smooth(.57,.595,build),final:smooth(.81,.87,build),
   travel:(1-arrival)*-685,energy:reduced?0:Math.sin(Math.PI*arrival)*.94,
   ring:smooth(.02,.8,build)*tau};
 }
 function context(canvas){try{return canvas?.getContext?.('2d',{alpha:true,desynchronized:true})||null;}catch(_){return null;}}
 function resolution(width,dpr=1,small=true){return Math.min(W,Math.max(512,Math.ceil(width*(small?1.3:1.83)*Math.min(dpr,2.5))));}
 function interior(ctx){ctx.beginPath();ctx.arc(C,C,inner,0,tau);ctx.clip();}
 function createReverse(canvas,{ready:notify=()=>{},failed=()=>{}}={}){
  const atlas=window.MORIYATI_COIN_ATLAS,ctx=context(canvas);
  if(!atlas||!ctx||!window.Image)return null;
  const image=new Image();image.decoding='async';
  let loaded=false,lastKey=null,lastBuild=0,lastReduced=false;
  function sprite(name,alpha=1){
   if(alpha<=0)return;
   const s=atlas.sprites[name],previous=ctx.globalAlpha;
   ctx.globalAlpha=previous*alpha;
   ctx.drawImage(image,s.x,s.y,s.width,s.height,s.dx,s.dy,s.width,s.height);
   ctx.globalAlpha=previous;
  }
  function rotated(name,angle,p,draw){
   ctx.save();ctx.translate(p[0]+1,p[1]-8);ctx.rotate(angle*Math.PI/180);ctx.translate(-p[0]-1,-p[1]+8);
   if(draw)draw();else sprite(name);ctx.restore();
  }
  function carriage(state){
   const geometry=window.MORIYATI_COIN_GEOMETRY,pose=geometry.pose(state.travel,state.energy);
   ctx.save();interior(ctx);ctx.globalAlpha=state.carriage;ctx.translate(state.travel,0);
   const leg=name=>rotated('',pose.parts[name],geometry.pivots[name],()=>{
    sprite(name+'Upper');rotated(name+'Lower',pose.bends[name],geometry.joints[name]);
   });
   leg('hindFar');leg('foreFar');ctx.save();ctx.translate(0,pose.bodyY);sprite('coach');ctx.restore();
   leg('hindNear');leg('foreNear');
   rotated('rearWheel',pose.parts.rearWheel,geometry.pivots.rearWheel);
   rotated('frontWheel',pose.parts.frontWheel,geometry.pivots.frontWheel);
   rotated('arm',pose.parts.arm,geometry.pivots.arm);
   // Same two reins, with the former grayscale/brightness material baked in.
   ctx.translate(1,-8);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(554,pose.handY);ctx.quadraticCurveTo(661,pose.controlY,815,926);ctx.strokeStyle='#8d8d8d';ctx.lineWidth=3;ctx.stroke();
   ctx.beginPath();ctx.moveTo(554,pose.handY-1);ctx.quadraticCurveTo(661,pose.controlY-1,815,925);ctx.strokeStyle='#ffffff';ctx.lineWidth=1.25;ctx.stroke();
   ctx.restore();
  }
  function draw(build,reduced=false){
   lastBuild=build;lastReduced=reduced;
   if(!loaded)return;
   const key=(build>=.87?'complete':build<=0?'waiting':build.toFixed(6))+':'+reduced;
   if(key===lastKey)return;
   lastKey=key;
   const state=scene(build,reduced),scale=canvas.width/W;
   ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,W,W);ctx.globalAlpha=1;sprite('base');
   if(state.ring>0&&state.ring<tau){
    ctx.save();ctx.beginPath();ctx.arc(C,C,R,0,tau);ctx.arc(C,C,inner,0,tau,true);ctx.clip('evenodd');
    ctx.translate(C,C);ctx.rotate(state.ring);ctx.translate(-C,-C);sprite('base');ctx.restore();
   }
   if(state.final<1){
    if(state.windows<1)sprite('body',state.body);
    sprite('windows',state.windows);
    groups.forEach((indices,i)=>{if(state.trees[i]>0)indices.forEach(index=>sprite('tree'+index,state.trees[i]));});
    sprite('ground',state.ground);
    if(state.carriage>0)carriage(state);
   }
   sprite('final',state.final);
  }
  const ready=()=>{loaded=true;draw(lastBuild,lastReduced);notify();};
  // Complete the asynchronous decode before canvas asks for its first pixels.
  image.onload=()=>{if(typeof image.decode==='function')image.decode().then(ready,failed);else ready();};
  image.onerror=failed;image.src=atlas.image;
  return {canvas,draw,get loaded(){return loaded;},resize(width,dpr,small){
   const size=resolution(width,dpr,small);
   if(canvas.width===size&&canvas.height===size)return;
   canvas.width=size;canvas.height=size;lastKey=null;draw(lastBuild,lastReduced);
  }};
 }
 function project(x,y,z,angle,width){
  const a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),depth=-x*s+z*c,p=1400*W/width,k=p/(p-depth);
  return [C+(x*c+z*s)*k,C+y*k,depth];
 }
 function createEdge(canvas,{thicknessRatio=.06,reedCount=192}={}){
  const ctx=context(canvas);if(!ctx)return null;
  let width=300,lastAngle=null;
  const half=R*thicknessRatio;
  const strips=Array.from({length:reedCount*2},(_,i)=>{
   const a=i*tau/(reedCount*2),b=(i+1)*tau/(reedCount*2),mid=(a+b)/2,tone=(180+Math.cos(mid-2.2)*36)/255;
   const rgb=(i%2?[248,244,238]:[156,149,140]).map(c=>Math.round(c*tone));
   const stops=[[0,.82],[.35,1.1],[.6,1.14],[1,.72]].map(([stop,factor])=>[stop,'rgb('+rgb.map(c=>Math.min(255,Math.round(c*factor))).join(' ')+')']);
   return {cos:Math.cos(mid),points:[[R*Math.cos(a),R*Math.sin(a),-half],[R*Math.cos(b),R*Math.sin(b),-half],[R*Math.cos(b),R*Math.sin(b),half],[R*Math.cos(a),R*Math.sin(a),half]],stops};
  });
  function draw(angle){
   if(angle===lastAngle)return;lastAngle=angle;
   const scale=canvas.width/W;ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,W,W);
   if(angle<=0||angle>=180)return;
   const radians=angle*Math.PI/180,sin=Math.sin(radians),cos=Math.cos(radians),perspective=1400*W/width;
   const projected=([x,y,z])=>{const depth=-x*sin+z*cos,k=perspective/(perspective-depth);return [C+(x*cos+z*sin)*k,C+y*k];};
   for(const strip of strips){
    if(-strip.cos*sin<=0)continue;
    const points=strip.points.map(projected);
    const light=ctx.createLinearGradient(points[0][0],points[0][1],points[3][0],points[3][1]);
    strip.stops.forEach(([stop,color])=>light.addColorStop(stop,color));
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=light;ctx.fill();
   }
  }
  return {canvas,draw,resize(value,dpr,small){
   // The thin moving sidewall needs fewer pixels than the engraved faces.
   width=value||300;const size=Math.min(resolution(width,dpr,small),small?640:W);
   if(canvas.width!==size||canvas.height!==size){canvas.width=size;canvas.height=size;}
   const angle=lastAngle??0;lastAngle=null;draw(angle);
  }};
 }
 window.MORIYATI_COIN_RENDERER=Object.freeze({scene,groups,resolution,project,createReverse,createEdge});
})();
