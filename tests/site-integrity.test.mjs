import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Script,runInNewContext} from 'node:vm';
import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../dist');
const context={window:{location:{hostname:'moriyati-mint-treasury.humble-deer-9355.chatgpt.site'}},URL};
for(const name of ['auth-lookup.js','auth-records.js','collections-data.js','collection-media.js','collection-guides.js'])runInNewContext(await readFile(resolve(root,name),'utf8'),context);
const parse=context.window.MoriyatiAuth.parse;
test('Identifiers parse without treating arbitrary links as genuine products',()=>{
 assert.equal(parse('AA 0002008'),'AA0002008');assert.equal(parse('MORIYATI:AA0002008'),'AA0002008');assert.equal(parse('AA۰۰۰۲۰۰۸'),'AA0002008');
 assert.equal(parse('https://moriyati.ir/verify/AA0002008'),'AA0002008');assert.equal(parse('https://example.org/?serial=AA0002008'),null);assert.equal(parse('https://moriyati.ir'),null);assert.equal(parse('<script>'),null);
 assert.equal(context.window.MORIYATI_AUTH_REGISTRY.mode,'demonstration');assert.ok(Object.values(context.window.MORIYATI_AUTH_REGISTRY.records).every(r=>r.demo===true));
});
test('QR fallback decodes a real encoded sample',async()=>{
 const require=createRequire(import.meta.url),jsQR=require(resolve(root,'vendor/jsQR.js'));
 const matrix=JSON.parse(await readFile(new URL('./fixtures/qr-matrix.json',import.meta.url)));const size=matrix.length*3,data=new Uint8ClampedArray(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const offset=(y*size+x)*4,v=matrix[Math.floor(y/3)][Math.floor(x/3)]==='1'?0:255;data[offset]=data[offset+1]=data[offset+2]=v;data[offset+3]=255;}
 assert.equal(jsQR(data,size,size).data,'MORIYATI:AA0002008');
});
test('All approved collections have complete copy, five images and matching guides',async()=>{
 const collections=context.window.MORIYATI_COLLECTIONS,media=context.window.MORIYATI_MEDIA.collections;
 assert.equal(collections.length,7);
 for(const c of collections){assert.equal(media[c.slug].gallery.length,5,c.slug);for(const lang of ['fa','en']){assert.ok(c[lang].description.length>80);assert.ok(c[lang].paragraphs.length||c[lang].sections.length);assert.ok(context.window.MORIYATI_COLLECTION_GUIDES[c.slug][lang].checks.length>=2);}for(const image of media[c.slug].gallery)assert.ok((await stat(resolve(root,image.src))).size>1000);}
});
test('Pages have valid dependencies; home has the approved contact summary and the map stays on Contact',async()=>{
 for(const name of ['index','expertise','contact','authenticity','heritage','bulletin']){
  const html=await readFile(resolve(root,name+'.html'),'utf8');
  for(const m of html.matchAll(/(?:src|href)="([^"#?]+)(?:[^\"]*)"/g)){const path=m[1];if(!/^(?:https?:|mailto:|tel:|data:)/.test(path)&&/\.(?:js|css|webp|png|svg|woff2?)$/.test(path))await stat(resolve(root,path));}
  assert.doesNotMatch(html,/href="https?:\/\/(?:www\.)?moriyati\.ir/);
  if(!['index','contact'].includes(name))assert.doesNotMatch(html,/href="tel:|info@moriyati\.ir|بوتیک‌مال ملل/);
  if(name!=='contact')assert.doesNotMatch(html,/class="city-map"|id="mall-pin"/);
  assert.match(html,/href="bulletin\.html"/);
  assert.match(html,/href="heritage\.html"/);
  assert.match(html,/PURE FORM\.<\/span> <span>ETERNAL VALUE\./);
 }
 const contact=await readFile(resolve(root,'contact.html'),'utf8');
 assert.equal([...contact.matchAll(/class="phone-row"/g)].length,4);for(const n of [56,57,58,59])assert.match(contact,new RegExp('\\+98 990 45 000 '+n));
 for(const name of await readdir(root))if(name.endsWith('.js'))new Script(await readFile(resolve(root,name),'utf8'));
});
