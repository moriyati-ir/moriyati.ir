import {readFile,mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {Script} from 'node:vm';
import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'..');
test('A production release preserves every page dependency and script order in two cache-safe bundles',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'moriyati-release-')),output=join(temp,'public');
 try{
  const result=spawnSync('python3',[join(root,'scripts/prepare-static-release.py'),'--output',output,'--liara'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const manifest=JSON.parse(result.stdout);
  assert.equal(Object.keys(manifest).length,6);
  for(const [name,page] of Object.entries(manifest)){
   const html=await readFile(join(output,name),'utf8');
   assert.equal([...html.matchAll(/<script\b[^>]*src=/g)].length,1,name);
   assert.equal([...html.matchAll(/<link\b[^>]*rel="stylesheet"/g)].length,1,name);
   for(const [extension,paths] of [['js',page.scripts],['css',page.styles]]){
    const body=await readFile(join(output,page[extension]),'utf8');
    const expected=(await Promise.all(paths.map(path=>readFile(join(root,'dist',path),'utf8')))).join(extension==='js'?'\n;\n':'\n')+'\n';
    assert.equal(body,expected,`${name}: preserve execution/cascade order`);
    assert.ok(page[extension].includes(createHash('sha256').update(body).digest('hex').slice(0,12)));
    if(extension==='js')new Script(body,{filename:page.js});
   }
   for(const m of html.matchAll(/(?:src|href)="([^"#?]+)(?:[^\"]*)"/g)){
    const path=m[1];
    if(!/^(?:https?:|mailto:|tel:|data:)/.test(path)&&/\.(?:js|css|webp|png|svg|woff2?)$/.test(path))await stat(join(output,path));
   }
  }
  const previews=JSON.parse(await readFile(join(output,'assets/collections/release-previews.json'),'utf8'));
  assert.equal(previews.mode,'coming-soon');assert.equal(previews.clearMastersIncluded,false);
  for(const image of previews.images){
   const digest=createHash('sha256').update(await readFile(join(output,image.path))).digest('hex');
   assert.notEqual(digest,image.originalSha256,'Releases must not restore the unreleased product pictures');
  }
  assert.deepEqual(JSON.parse(await readFile(join(output,'liara.json'),'utf8')),{app:'moriyati-ir',platform:'static'});
  assert.equal(await readFile(join(output,'liara_nginx.conf'),'utf8'),await readFile(join(root,'liara_nginx.conf'),'utf8'));
 }finally{await rm(temp,{recursive:true,force:true});}
});
