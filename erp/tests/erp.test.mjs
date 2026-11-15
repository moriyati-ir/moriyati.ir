import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyCommand, createSeed, massBalance, fine } from '../lib/erp.ts';

const run = (s, type, data) => applyCommand(s, {type, data}, 'Test operator').state;
test('material consumption is recorded below zero and emits a warning', () => {
  const seed=createSeed();
  const result=applyCommand(seed,{type:'inventory_move',data:{materialId:'MAT-HNO3',operation:'consume',quantity:140,note:'Consumption test',batchId:'MOR-AG-0048'}});
  assert.equal(result.state.inventory.find(x=>x.id==='MAT-HNO3').quantity,-20);
  assert.equal(result.state.movements[0].delta,-140);
  assert.equal(result.state.movements[0].batchId,'MOR-AG-0048');
  assert.equal(result.state.logs[0].type,'warning');
  assert.equal(seed.inventory.find(x=>x.id==='MAT-HNO3').quantity,120);
});
test('operator owns start/end with role history; active work blocks stage movement', () => {
  let s=createSeed();
  assert.throws(()=>run(s,'advance_batch',{batchId:'MOR-AG-0048'}));
  assert.throws(()=>run(s,'start_session',{batchId:'MOR-AG-0049',operatorId:'OP-01',role:'Assistant'}));
  s=run(s,'end_session',{batchId:'MOR-AG-0048',sessionId:'S-02'});
  s=run(s,'advance_batch',{batchId:'MOR-AG-0048'});
  s=run(s,'start_session',{batchId:'MOR-AG-0048',operatorId:'OP-01',role:'Melting assistant'});
  const b=s.batches.find(x=>x.id==='MOR-AG-0048');
  assert.equal(b.stage,3);assert.equal(b.sessions.at(-1).role,'Melting assistant');
  assert.equal(b.sessions.at(-1).stage,3);assert.ok(b.sessions[1].end);
});
test('crucible replacement retires old asset and preserves cumulative history', () => {
  let s=run(createSeed(),'create_asset',{name:'Crucible 3',kind:'بوته',tag:'CR-NEW',heat:true,maxCycles:25,replaces:'EQ-CR-001',reason:'Cracked'});
  const old=s.assets.find(x=>x.id==='EQ-CR-001'), fresh=s.assets[0];
  assert.equal(old.status,'retired');assert.equal(old.grams,246000);assert.equal(old.cycles,18);
  assert.equal(fresh.replaces,old.id);assert.equal(fresh.heat,true);
  assert.throws(()=>run(s,'use_asset',{assetId:old.id,batchId:'MOR-AG-0048',grams:1000,operatorId:'OP-01'}));
  s=run(s,'use_asset',{assetId:fresh.id,batchId:'MOR-AG-0048',grams:15000,operatorId:'OP-01'});
  assert.equal(s.assets[0].cycles,1);assert.equal(s.assets[0].grams,15000);
  assert.equal(s.assetUses[0].batchId,'MOR-AG-0048');
});
test('QC balances pure metal and adds output exactly once to inventory', () => {
  let s=createSeed();
  assert.throws(()=>run(s,'finalize_batch',{batchId:'MOR-AG-0047',output:16000,outputAssay:999.9,recoverable:0}));
  s=run(s,'finalize_batch',{batchId:'MOR-AG-0047',output:15000,outputAssay:999.9,recoverable:0});
  const b=s.batches.find(x=>x.id==='MOR-AG-0047');
  assert.equal(b.stage,5);assert.equal(massBalance(b).difference,0);
  assert.equal(s.inventory.find(x=>x.id==='MAT-AG-9999').quantity,23000);
  assert.throws(()=>run(s,'finalize_batch',{batchId:b.id,output:15000,outputAssay:999.9,recoverable:0}));
  const sample=massBalance(s.batches.find(x=>x.id==='MOR-AG-0046'));
  assert.equal(sample.incoming,10049.5);assert.equal(sample.difference,2);
});
test('product serial, packaging, tag, fineness and issued quantity are enforced', () => {
  let s=createSeed();
  const d={batchId:'MOR-AG-0046',collection:'Argentum',weight:1000,assay:999.9,serial:'MOR-NEW',packaging:'PKG-NEW',nfc:'NFC-NEW',front:'',back:''};
  s=run(s,'create_product',d);
  assert.equal(s.inventory.find(x=>x.id==='MAT-AG-9999').quantity,7000);
  assert.equal(s.products[0].batchId,'MOR-AG-0046');
  for(const changed of [{serial:'MOR-NEW',packaging:'PKG-2',nfc:''},{serial:'NEW2',packaging:'PKG-NEW',nfc:''},{serial:'NEW2',packaging:'PKG-2',nfc:'NFC-NEW'},{serial:'NEW2',packaging:'PKG-2',nfc:'',assay:995},{serial:'NEW2',packaging:'PKG-2',nfc:'',weight:10000}]){
    assert.throws(()=>run(s,'create_product',{...d,...changed}));
  }
  assert.throws(()=>run(s,'create_product',{...d,serial:'DIFFERENT',packaging:'DIFFERENT',nfc:'',front:'https://example.com/tracker'}));
});
test('bad numeric input cannot corrupt production or material state', () => {
  const s=createSeed();
  for(const quantity of [NaN,Infinity,'',null,undefined,true]) assert.throws(()=>run(s,'inventory_move',{materialId:'MAT-HNO3',operation:'consume',quantity,note:'bad'}));
  assert.equal(fine(100,995),99.5);
  assert.throws(()=>run(s,'create_batch',{metal:'silver',source:'test',owner:'test',weight:100,assay:1001}));
});
