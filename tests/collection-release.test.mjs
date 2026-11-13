import {readFile,readdir} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../dist');
async function walk(directory){return (await Promise.all((await readdir(directory,{withFileTypes:true})).map(e=>e.isDirectory()?walk(resolve(directory,e.name)):[resolve(directory,e.name)]))).flat();}
test('Only the approved home teaser is public; collection masters remain baked previews',async()=>{
 const policy=JSON.parse(await readFile(resolve(root,'assets/collections/release-previews.json'),'utf8'));
 assert.equal(policy.mode,'coming-soon');assert.equal(policy.clearMastersIncluded,false);assert.ok(policy.images.length>=30);
 const masters=new Set(policy.images.map(image=>image.originalSha256));
 const exceptions=policy.publicExceptions||[];
 assert.equal(exceptions.length,1);
 assert.equal(exceptions[0].path,'assets/home-works-square.webp');
 assert.equal(exceptions[0].originalSha256,policy.images.find(image=>image.path==='assets/collections/home-square.webp').originalSha256);
 for(const path of await walk(root))if(/\.(?:webp|png|jpe?g)$/i.test(path)){
  const digest=createHash('sha256').update(await readFile(path)).digest('hex');
  if(masters.has(digest))assert.ok(exceptions.some(image=>image.path===relative(root,path)&&image.originalSha256===digest),path);
 }
 for(const image of policy.images)assert.notEqual(createHash('sha256').update(await readFile(resolve(root,image.path))).digest('hex'),image.originalSha256);
 const html=await readFile(resolve(root,'index.html'),'utf8');
 assert.match(html,/src="assets\/home-works-square\.webp"/);
 const css=(await readFile(resolve(root,'v8.css'),'utf8')).split('/* Unreleased collection photography:')[1];
 assert.doesNotMatch(css,/\.portal-art/);
 assert.match(css,/\.gallery-main/);assert.match(css,/به‌زودی/);
});
