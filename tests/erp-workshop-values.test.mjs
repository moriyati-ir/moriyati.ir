import test from 'node:test';
import assert from 'node:assert/strict';
import {alloy,packageWarning} from '../dist/erp/workshop.mjs';

test('package plan permits exact and partial allocations, rejects excess and fractional counts',()=>{
 const plan=new URLSearchParams({weight:'5000',p1:'2',p2:'1'});
 assert.equal(packageWarning(plan),'');
 plan.set('p1','3');
 assert.equal(packageWarning(plan),'');
 plan.set('p5','2');
 assert.ok(packageWarning(plan));
 plan.set('p5','0.5');
 assert.ok(packageWarning(plan));
});

test('alloy additions conserve fine silver in both directions',()=>{
 for(const [initial,target,addition] of [[995,990,0],[990,995,999.9]]){
  const {mass}=alloy(new URLSearchParams({weight:'۵۰۰',assay:String(initial),target:String(target)}));
  assert.ok(Math.abs((500*initial+mass*addition)/(500+mass)-target)<1e-8);
 }
 assert.ok(alloy(new URLSearchParams({weight:'500',assay:'990',target:'999.9'})).error);
});
