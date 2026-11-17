import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {media,productCatalog,upgradeWorkspaceVisuals} from '../dist/erp/visuals.mjs';

test('Replacing built-in illustrations preserves local work and uploaded photos',()=>{
  const upload='data:image/jpeg;base64,uploaded-photo';
  const workspace={tasks:[{id:'service',cover:'../assets/expertise-silver.webp',status:'done',notes:'../assets/expertise-silver.webp',stages:[{id:'inspect',cover:upload,reports:[{id:'old',image:'../assets/expertise-silver.webp',weight:321},{id:'user',image:upload,text:'ثبت شخصی'}]}]},{id:'custom-task',cover:'./photos/gold-1g.png',stages:[]}],messages:{self:[{src:upload,text:'keep'},{src:'./photos/silver-100.jpeg',text:'./photos/silver-100.jpeg'}]},financeRecords:[{amount:555,receipt:upload}]};
  const original=structuredClone(workspace);
  const seed=[{id:'service',cover:media.equipment,stages:[{id:'inspect',cover:media.equipment,reports:[{id:'old',image:media.lab}]}]}];
  const next=upgradeWorkspaceVisuals(workspace,seed);
  assert.deepEqual(workspace,original,'input and uploaded source data stay untouched');
  assert.equal(next.tasks[0].cover,media.equipment);
  assert.equal(next.tasks[0].status,'done');
  assert.equal(next.tasks[0].notes,original.tasks[0].notes,'ordinary text is not rewritten');
  assert.equal(next.tasks[0].stages[0].cover,upload);
  assert.deepEqual(next.tasks[0].stages[0].reports[1],original.tasks[0].stages[0].reports[1]);
  assert.equal(next.tasks[0].stages[0].reports[0].weight,321);
  assert.equal(next.tasks[1].cover,media.gold);
  assert.equal(next.messages.self[0].src,upload);
  assert.equal(next.messages.self[1].src,media.mint);
  assert.equal(next.messages.self[1].text,'./photos/silver-100.jpeg');
  assert.deepEqual(next.financeRecords,original.financeRecords);
  assert.deepEqual(upgradeWorkspaceVisuals(next,seed),next,'migration is idempotent');
});

test('All product and process identifiers are real bounded WebP assets',()=>{
  const images=new Set([...Object.values(media),...productCatalog.map(p=>p.image)]);
  for(const src of images){
    assert.match(src,/^\.\/visuals\/[a-z-]+\.webp$/);
    const bytes=readFileSync(new URL('../dist/erp/'+src,import.meta.url));
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert.ok(bytes.length>1000&&bytes.length<100000,`${src} must load efficiently in a mobile tile`);
  }
  assert.equal(new Set(productCatalog.map(p=>p.id)).size,productCatalog.length);
});
