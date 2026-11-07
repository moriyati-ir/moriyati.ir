
(() => {
 'use strict';
 const status=document.querySelector('#status'),button=document.querySelector('#bake');
 const geometry=window.MORIYATI_COIN_GEOMETRY,flip=window.MORIYATI_COIN_FLIP;
 const W=1254,cache=new Map(),ns='http://www.w3.org/2000/svg';
 const material='grayscale(1) brightness(1.23) contrast(.98)';
 const source=new DOMParser().parseFromString(geometry.create('atlas',{includeRing:false}),'image/svg+xml').documentElement;
 const defs=source.querySelector('defs').outerHTML;
 const read=path=>{
  if(!cache.has(path))cache.set(path,fetch(path).then(r=>{if(!r.ok)throw Error(path);return r.blob();}).then(blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);})));return cache.get(path);
 };
 async function embedded(markup){
  const paths=[...new Set([...markup.matchAll(/href="(assets\/[^\"]+)"/g)].map(m=>m[1]))];
  for(const path of paths)markup=markup.split('href="'+path+'"').join('href="'+await read(path)+'"');
  return markup;
 }
 const svg=content=>`<svg xmlns="${ns}" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}">${content}</svg>`;
 async function paint(markup,filter='none',target){
  const url=URL.createObjectURL(new Blob([await embedded(markup)],{type:'image/svg+xml'})),image=new Image();
  try{image.src=url;await image.decode();const canvas=target||Object.assign(document.createElement('canvas'),{width:W,height:W}),ctx=canvas.getContext('2d');ctx.filter=filter;ctx.drawImage(image,0,0);ctx.filter='none';return canvas;}finally{URL.revokeObjectURL(url);}
 }
 function crop(canvas,name){
  const ctx=canvas.getContext('2d'),data=ctx.getImageData(0,0,W,W).data;
  let left=W,top=W,right=0,bottom=0;
  for(let y=0;y<W;y++)for(let x=0;x<W;x++)if(data[(y*W+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(left>right)throw Error('Empty sprite: '+name);
  left=Math.max(0,left-1);top=Math.max(0,top-1);right=Math.min(W-1,right+1);bottom=Math.min(W-1,bottom+1);
  const image=Object.assign(document.createElement('canvas'),{width:right-left+1,height:bottom-top+1});
  image.getContext('2d').drawImage(canvas,left,top,image.width,image.height,0,0,image.width,image.height);
  return {name,image,dx:left,dy:top,width:image.width,height:image.height};
 }
 function content(node){
  const copy=node.cloneNode(true);copy.removeAttribute('opacity');copy.style.opacity='1';
  return svg(defs+`<g clip-path="url(#atlas-interior)"><g transform="translate(1 -8)">${copy.outerHTML}</g></g>`);
 }
 function pack(sprites,size=2368){
  let free=[{x:0,y:0,w:size,h:size}];
  for(const sprite of [...sprites].sort((a,b)=>Math.max(b.width,b.height)-Math.max(a.width,a.height))){
   const w=sprite.width+4,h=sprite.height+4;
   const options=free.filter(r=>r.w>=w&&r.h>=h).sort((a,b)=>Math.min(a.w-w,a.h-h)-Math.min(b.w-w,b.h-h));
   if(!options.length)throw Error('Atlas too small for '+sprite.name);
   const placed={x:options[0].x,y:options[0].y,w,h};sprite.x=placed.x+2;sprite.y=placed.y+2;
   const next=[];
   for(const r of free){
    if(placed.x>=r.x+r.w||placed.x+placed.w<=r.x||placed.y>=r.y+r.h||placed.y+placed.h<=r.y){next.push(r);continue;}
    if(placed.x>r.x)next.push({x:r.x,y:r.y,w:placed.x-r.x,h:r.h});
    if(placed.x+w<r.x+r.w)next.push({x:placed.x+w,y:r.y,w:r.x+r.w-placed.x-w,h:r.h});
    if(placed.y>r.y)next.push({x:r.x,y:r.y,w:r.w,h:placed.y-r.y});
    if(placed.y+h<r.y+r.h)next.push({x:r.x,y:placed.y+h,w:r.w,h:r.y+r.h-placed.y-h});
   }
   free=next.filter((r,i)=>!next.some((other,j)=>j!==i&&(other.w*other.h>r.w*r.h||j<i)&&r.x>=other.x&&r.y>=other.y&&r.x+r.w<=other.x+other.w&&r.y+r.h<=other.y+other.h));
  }
  const canvas=Object.assign(document.createElement('canvas'),{width:size,height:size}),ctx=canvas.getContext('2d');
  sprites.forEach(s=>ctx.drawImage(s.image,s.x,s.y));return canvas;
 }
 button.onclick=async()=>{
  button.disabled=true;
  try{
   const sprites=[];
   const add=async(name,markup,filter=material)=>{status.textContent='Baking '+name;const canvas=await paint(markup,filter);sprites.push(crop(canvas,name));};
   const base=await paint(svg(defs+`<g clip-path="url(#atlas-interior)"><g transform="translate(1 -8)"><image href="${geometry.blank}" width="1254" height="1254"/></g></g>`),material);
   await paint(geometry.ringSvg,'grayscale(1) brightness(1.07)',base);sprites.push(crop(base,'base'));
   for(const name of ['body','windows','ground'])await add(name,content(source.querySelector('[data-coin-layer="'+name+'"]')));
   for(let i=0;i<13;i++)await add('tree'+i,content(source.querySelector('[data-coin-tree="'+i+'"]')));
   await add('final',content(source.querySelector('[data-coin-final]')));
   await add('coach',content(source.querySelector('[data-coin-body]')));
   for(const name of ['hindNear','hindFar','foreNear','foreFar']){
    const part=source.querySelector('[data-coin-part="'+name+'"]'),upper=part.cloneNode(true);
    upper.querySelector('[data-coin-joint]').remove();await add(name+'Upper',content(upper));
    await add(name+'Lower',content(part.querySelector('[data-coin-joint]')));
   }
   for(const name of ['rearWheel','frontWheel','arm'])await add(name,content(source.querySelector('[data-coin-part="'+name+'"]')));
   const atlas=pack(sprites);document.querySelector('#preview').append(atlas);
   const manifest={version:1,viewBox:W,atlasWidth:atlas.width,atlasHeight:atlas.height,sprites:Object.fromEntries(sprites.map(({name,x,y,dx,dy,width,height})=>[name,{x,y,dx,dy,width,height}]))};
   const output={manifest,png:atlas.toDataURL('image/png')},link=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(output)],{type:'application/json'}));
   link.href=url;link.download='moriyati-coin-atlas.json';link.textContent='Download baked atlas';document.body.append(link);
   status.textContent='Done: '+sprites.length+' sprites. '+atlas.width+' × '+atlas.height+' pixels.';
  }catch(error){status.textContent=error.stack;button.disabled=false;}
 };
})();
