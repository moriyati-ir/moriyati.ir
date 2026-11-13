import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../dist');
async function walk(directory){return (await Promise.all((await readdir(directory,{withFileTypes:true})).map(e=>e.isDirectory()?walk(resolve(directory,e.name)):[resolve(directory,e.name)]))).flat();}
test('Public files contain baked previews and no original collection image bytes',async()=>{
 const policy=JSON.parse(await readFile(resolve(root,'assets/collections/release-previews.json'),'utf8'));
 assert.equal(policy.mode,'coming-soon');assert.equal(policy.clearMastersIncluded,false);assert.ok(policy.images.length>=30);
 const masters=new Set(policy.images.map(image=>image.originalSha256));
 for(const path of await walk(root))if(/\.(?:webp|png|jpe?g)$/i.test(path))assert.ok(!masters.has(createHash('sha256').update(await readFile(path)).digest('hex')),path);
 for(const image of policy.images)assert.notEqual(createHash('sha256').update(await readFile(resolve(root,image.path))).digest('hex'),image.originalSha256);
});
