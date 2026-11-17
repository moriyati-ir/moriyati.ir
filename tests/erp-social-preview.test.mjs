import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTaskDraft,periodRecords,chartBuckets,total,parseNumber} from '../dist/erp/core.mjs';
import {workRecords,moneyRecords,referenceDate} from '../dist/erp/data.mjs';

test('Other requires a description without imposing metal fields on general work',()=>{
 assert.match(validateTaskDraft({type:'general',preset:'other',title:'Custom task',description:'  '}),/توضیح/);
 assert.equal(validateTaskDraft({type:'general',preset:'other',title:'Custom task',description:'Inspect a machine'}),'');
 assert.match(validateTaskDraft({type:'production',preset:'other',title:'Custom product',description:'Prototype',quantity:1.5,weight:150}),/صحیح/);
});

test('Persian numeric entries retain decimal grams',()=>{
 assert.equal(parseNumber('۳٬۰۰۰٫۱۲۵'),3000.125);
 assert.equal(parseNumber('٣١.١٠٣٥'),31.1035);
});

test('chart buckets preserve the exact period total for work and payments',()=>{
 for(const range of ['week','month','quarter','half','all']){
  const work=periodRecords(workRecords,range,referenceDate);
  assert.ok(Math.abs(total(chartBuckets(workRecords,'hours',range,referenceDate),'value')-total(work,'hours'))<.15);
  const payments=periodRecords(moneyRecords,range,referenceDate).filter(r=>r.kind==='salary');
  assert.equal(total(chartBuckets(moneyRecords,'amount',range,referenceDate,'salary'),'value'),total(payments,'amount'));
 }
});

test('period selection includes the end day and excludes future records',()=>{
 const records=[{date:'2026-11-10'},{date:'2026-11-11'},{date:'2026-11-17'},{date:'2026-11-18'}];
 assert.deepEqual(periodRecords(records,'week',referenceDate).map(r=>r.date),['2026-11-11','2026-11-17']);
});
