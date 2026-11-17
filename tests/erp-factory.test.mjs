import test from 'node:test';
import assert from 'node:assert/strict';
import {makeFactoryState,transition,packetFine,physicalPackets,stockSummary,publicProduct,canSettlePayment,accountBalance,today,startBlockers} from '../dist/erp/factory-model.mjs';
import {normalizeTasks,canViewTask,canSeeNotification,canEmergencyCode,capabilities} from '../dist/erp/policy.mjs';
import {initialTasks} from '../dist/erp/data.mjs';
import {parseNumber,fa,grams,periodRecords,chartBuckets,total} from '../dist/erp/core.mjs';
import {renderFactory,canOpenFactory} from '../dist/erp/factory-ui.mjs';
const photo='data:image/jpeg;base64,cGhvdG8=';
const fresh=()=>({state:makeFactoryState(),tasks:normalizeTasks(structuredClone(initialTasks))});
const command=(w,actor,type,data)=>transition(w.state,w.tasks,actor,type,data);

test('Task and notification access requires accepted active membership, not a missing mine flag',()=>{
 const t=normalizeTasks([{id:'outside',type:'general',status:'active',stages:[],members:[{userId:'artour',state:'accepted',active:true}]}])[0];
 assert.equal(canViewTask('employee',t),false);assert.equal(canViewTask('nazanin',t),false);
 assert.equal(canSeeNotification('employee',{task:t.id,kind:'mention'},[t]),false);
 assert.equal(canViewTask('artour',t),true);t.members[0].active=false;assert.equal(canViewTask('artour',t),false);
 assert.equal(canViewTask('haji',{...t,domain:'hr',creatorId:'haji'}),false);
 assert.equal(capabilities.production('majid'),false);
});
test('A product draft creates the selected route and a mass target has no invented piece count',()=>{
 const w=fresh();const r=command(w,'alireza','task-create',{preset:'granules',type:'production',title:'ساچمه',weight:'31.1035',targetKind:'mass',path:'granules',endStage:'XRF',ownerId:'employee'});
 const t=r.tasks.find(t=>t.id===r.result);assert.deepEqual(t.stages.map(s=>s.name),['تحویل','ذوب','تنظیم عیار','گرانول','XRF']);assert.equal(t.quantity,null);assert.equal(t.weight,31.1035);assert.equal(t.status,'waiting');assert.equal(canViewTask('employee',t),false);
 const accepted=transition(r.state,r.tasks,'employee','invitation',{taskId:t.id,decision:'accept'});assert.equal(canViewTask('employee',accepted.tasks.find(t=>t.id===r.result)),true);
});
test('A staff request never grants proposed teammates access before manager approval and individual acceptance',()=>{
 const w=fresh(),r=command(w,'employee','task-create',{preset:'other',type:'general',title:'کار پیشنهادی',description:'آزمایش',path:'general',team:['ghazal'],responsibilities:{ghazal:'بررسی'}}),t=r.tasks[0];
 assert.equal(t.status,'requested');assert.equal(t.members.length,0);assert.equal(canViewTask('ghazal',t),false);
 assert.throws(()=>transition(r.state,r.tasks,'employee','approve-task',{taskId:t.id,decision:'approve',reason:'بررسی'}));
 const a=transition(r.state,r.tasks,'behnam','approve-task',{taskId:t.id,decision:'approve',reason:'تأیید',ownerId:'employee'});
 assert.equal(a.tasks[0].members.find(m=>m.userId==='ghazal').state,'invited');assert.equal(canViewTask('ghazal',a.tasks[0]),false);
});
test('Unknown is not zero and scale precision is not silently forced to three decimals',()=>{
 assert.ok(Number.isNaN(parseNumber('')));assert.equal(fa(null),'—');assert.equal(grams(null),'نامشخص');assert.equal(grams('31.103500'),'۳۱٫۱۰۳۵۰۰');assert.equal(packetFine({mass:'500',purity:null,certainty:'unknown'}),null);
});
test('All-history charts retain old records and daily/yearly filters are real',()=>{
 const records=[{date:'1999-01-01',value:3},{date:'2026-01-01',value:5},{date:'2026-11-17',value:7},{date:'2026-11-18',value:99}],end=new Date('2026-11-17T12:00:00Z');
 assert.equal(total(periodRecords(records,'all',end),'value'),15);assert.equal(total(chartBuckets(records,'value','all',end),'value'),15);
 assert.equal(periodRecords(records,'day',end).length,1);assert.equal(periodRecords(records,'year',end).length,2);
});
test('Multi-item receiving does not auto-create production and supports partial admission',()=>{
 const w=fresh(),r=command(w,'haji','receive',{counterparty:'نمونه',photo,items:[{photo,metal:'نقره',form:'ظروف',gross:'1001',net:'1000',certainty:'unknown'}]});
 assert.equal(r.tasks.length,w.tasks.length);const id=r.state.receipts[0].items[0];assert.equal(r.state.packets.find(p=>p.id===id).place,'پذیرش');
 const a=transition(r.state,r.tasks,'mehrab','admit',{packetId:id,accepted:'600',returned:'100'}),children=a.state.packets.filter(p=>p.parentId===id);
 assert.equal(a.state.packets.find(p=>p.id===id).mass,'300');assert.equal(children.find(p=>p.state==='available').mass,'600');assert.equal(children.find(p=>p.state==='returned').place,'خارج کارخانه');assert.equal(packetFine(children[0]),null);
 assert.throws(()=>command(w,'haji','receive',{counterparty:'نمونه',items:[{metal:'نقره',form:'ظروف',net:1,gross:1}]}));
});
test('Reservations protect other work; custody moves exactly once after a distinct receiver confirms',()=>{
 let r=command(fresh(),'alireza','reserve',{taskId:'gold-1',packetId:'LOT-105',mass:60});
 assert.throws(()=>transition(r.state,r.tasks,'haji','handover',{packetId:'LOT-105',taskId:'silver-100',mass:70,receiver:'employee',to:'ذوب'}));
 r=transition(r.state,r.tasks,'haji','handover',{packetId:'LOT-105',taskId:'gold-1',mass:60,receiver:'employee',to:'ذوب'});const id=r.state.handovers[0].id;
 assert.equal(r.state.packets.find(p=>p.id==='LOT-105').mass,'100');assert.throws(()=>transition(r.state,r.tasks,'haji','handover-confirm',{id,decision:'receive'}));
 const received=transition(r.state,r.tasks,'employee','handover-confirm',{id,decision:'receive'});assert.equal(received.state.packets.find(p=>p.id==='LOT-105').mass,'40');assert.equal(received.state.packets.filter(p=>p.parentId==='LOT-105')[0].mass,'60');assert.throws(()=>transition(received.state,received.tasks,'employee','handover-confirm',{id,decision:'receive'}));
 assert.equal(startBlockers(received.state,received.tasks.find(t=>t.id==='gold-1'),received.tasks).length,0);
});
test('An unrelated limited cashier cannot request a transfer by guessing a vault packet ID',()=>{
 assert.throws(()=>command(fresh(),'majid','handover',{packetId:'LOT-101',mass:1,receiver:'employee',to:'ذوب'}));
});
test('Dependency cycles are rejected, prerequisite delivery is separate from automatic start',()=>{
 const w=fresh(),[a,b,c]=w.tasks;a.dependencies=[b.id];b.dependencies=[c.id];assert.throws(()=>command(w,'alireza','task-dependency',{taskId:c.id,dependencyId:a.id,reason:'پیوند'}));
 b.status='done';b.resultAccepted=false;assert.ok(startBlockers(w.state,a,w.tasks).some(x=>x.includes('پیش‌نیاز')));
 const delivered=command(w,'alireza','task-result',{taskId:a.id,dependencyId:b.id});assert.equal(delivered.tasks.find(t=>t.id===a.id).status,a.status);assert.equal(delivered.tasks.find(t=>t.id===b.id).resultAccepted,true);
});
test('Owner edits running work with a reason; only an authorized manager can reopen closed work',()=>{
 const w=fresh();assert.throws(()=>command(w,'employee','task-edit',{taskId:'silver-100',title:'تغییر'}));
 const r=command(w,'employee','task-edit',{taskId:'silver-100',title:'تغییر',reason:'اصلاح برنامه',weight:'3000',quantity:'30'});assert.equal(r.tasks[0].history.at(-1).actor,'employee');
 const t=r.tasks[0];t.status='done';assert.throws(()=>transition(r.state,r.tasks,'employee','task-reopen',{taskId:t.id,reason:'اصلاح'}));const reopened=transition(r.state,r.tasks,'behnam','task-reopen',{taskId:t.id,reason:'اصلاح مستند'});assert.equal(reopened.tasks[0].status,'waiting');
});
test('Intermediate reports preserve unknown measurements, actual author, raw digits and open parallel stages',()=>{
 const w=command(fresh(),'employee','work-start',{taskId:'silver-100'}),stage=w.tasks[0].stages.at(-1),r=command(w,'employee','report',{taskId:'silver-100',stageId:stage.id,title:'میانی',output:'31.103500',certainty:'estimated',kind:'complete',photos:[]});
 const actual=r.tasks[0].stages.at(-1).reports.at(-1);assert.equal(actual.inputWeight,null);assert.equal(actual.rawWeights.output,'31.103500');assert.equal(actual.authorId,'employee');assert.ok(actual.date.includes('T'));assert.equal(r.tasks[0].stages.at(-1).done,false);
});
test('Packaging report requires two images and both distinct weights; final loss owner is enforced',()=>{
 const w=command(fresh(),'employee','work-start',{taskId:'silver-100'}),t=w.tasks.find(t=>t.id==='silver-100');t.stages.push({id:'pack',name:'بسته‌بندی',reports:[]});
 assert.throws(()=>command(w,'employee','report',{taskId:t.id,stageId:'pack',title:'بسته',output:'100',gross:'110',photos:[photo]}));
 assert.throws(()=>command(w,'alireza','report',{taskId:t.id,stageId:t.stages[0].id,title:'کسر',finalLoss:'1'}));
});
test('XRF needs daily activation and both photos, then each result and own correction need no extra approval',()=>{
 let r=command(fresh(),'ghazal','assay-request',{}),id=r.state.assaySessions.at(-1).id;
 assert.throws(()=>transition(r.state,r.tasks,'ghazal','assay-result',{taskId:'silver-100',purity:999,samplePhoto:photo,analysisPhoto:photo}));
 r=transition(r.state,r.tasks,'haji','assay-activate',{id});assert.equal(r.state.assaySessions.at(-1).day,today());
 assert.throws(()=>transition(r.state,r.tasks,'ghazal','assay-result',{taskId:'silver-100',purity:999,samplePhoto:photo}));
 r=transition(r.state,r.tasks,'ghazal','assay-result',{taskId:'silver-100',purity:999,samplePhoto:photo,analysisPhoto:photo});assert.equal(r.state.assays[0].purity,999);assert.ok(r.notice.includes('تصمیم ادامه'));
 const corrected=transition(r.state,r.tasks,'ghazal','assay-correct',{id:r.result,purity:'999.9',reason:'خطای ورود'});assert.equal(corrected.state.assays[0].revisions.length,1);assert.throws(()=>transition(corrected.state,corrected.tasks,'mehrab','assay-correct',{id:r.result,purity:995,reason:'تغییر'}));
});
test('Actual consumption over recorded stock warns but is preserved; own correction restores the difference',()=>{
 let r=command(fresh(),'employee','consume',{taskId:'silver-100',supplyId:'gloves',quantity:12});assert.equal(r.state.supplies.find(x=>x.id==='gloves').stock,-2);assert.ok(r.notice.includes('ثبت شد'));
 r=transition(r.state,r.tasks,'employee','consume-correct',{id:r.state.consumptions[0].id,quantity:11,reason:'اصلاح شمارش'});assert.equal(r.state.supplies.find(x=>x.id==='gloves').stock,-1);
});
test('Remelting 3000 grams twice gives a crucible 6000 grams workload without duplicating product mass',()=>{
 const w=fresh();let r=command(w,'employee','tool-use',{taskId:'silver-100',toolId:'CR-001',mass:3000});r=transition(r.state,r.tasks,'employee','tool-use',{taskId:'silver-100',toolId:'CR-001',mass:3000});assert.equal(r.state.tools[0].workload,6000);assert.deepEqual(r.state.packets,w.state.packets);
});
test('Solution top-up preserves a cycle, replacement closes it and starts a new numbered cycle',()=>{
 let r=command(fresh(),'ghazal','solution-add',{id:'SOL-01',mass:500});assert.equal(r.state.solutions.length,1);assert.equal(r.state.solutions[0].cycle,1);
 r=transition(r.state,r.tasks,'ghazal','solution-replace',{id:'SOL-01',reason:'تعویض'});assert.equal(r.state.solutions.length,2);assert.equal(r.state.solutions[0].state,'closed');assert.equal(r.state.solutions[1].cycle,2);
});
test('Recovery output is credited once per event, supports partial returns and preserves its source link',()=>{
 let r=command(fresh(),'alireza','recovery-create',{sourceId:'LOT-103',taskId:'silver-100',form:'فیلتر',place:'بازیافت',mass:100,fineEstimate:'',certainty:'unknown'}),id=r.state.recoveries[0].id;
 assert.equal(r.state.recoveries[0].fineEstimate,null);assert.ok(r.state.recoveries[0].sourcePacketId);
 r=transition(r.state,r.tasks,'alireza','recovery-return',{id,mass:10,purity:999,operationId:'once',complete:false});assert.equal(r.state.recoveries[0].state,'processing');assert.throws(()=>transition(r.state,r.tasks,'alireza','recovery-return',{id,mass:10,operationId:'once'}));
 r=transition(r.state,r.tasks,'alireza','recovery-return',{id,mass:5,complete:true});assert.equal(r.state.recoveries[0].returnedMass,15);assert.equal(r.state.recoveries[0].outputs.length,2);assert.equal(r.state.recoveries[0].state,'returned');
});
test('Invalidating external packaging never adds stock; old package query remains invalid after return and repackaging',()=>{
 const w=fresh(),p=w.state.products[0];p.location='outside';w.state.packets.find(x=>x.id===p.packetId).place='خارج کارخانه';const before=stockSummary(w.state)[0].knownMass;
 let r=command(w,'haji','package-void',{id:p.id,net:100,photo,reason:'تعویض بسته'});assert.equal(r.state.products[0].serial,p.serial);assert.equal(stockSummary(r.state)[0].knownMass,before);assert.equal(publicProduct(r.state,p.serial,'PKG-DEMO-001').active,false);
 assert.throws(()=>transition(r.state,r.tasks,'haji','package',{serial:p.serial,packetId:p.packetId,net:100,gross:110,front:photo,back:photo}));
 r=transition(r.state,r.tasks,'mehrab','product-return',{id:p.id,mass:100,photo,reason:'دریافت واقعی'});assert.equal(r.state.products[0].location,'factory');
 r=transition(r.state,r.tasks,'haji','package',{serial:p.serial,packetId:p.packetId,net:100,gross:111,front:photo,back:photo});assert.equal(r.state.products[0].packaging.length,2);assert.equal(publicProduct(r.state,p.serial,'PKG-DEMO-001').active,false);assert.equal(publicProduct(r.state,p.serial,r.state.products[0].packaging[1].id).active,true);
});
test('Payment ceilings are unset by default; receipt upload is not a payment and payment debits only once',()=>{
 let w=fresh(),p=w.state.payments[0];assert.equal(canSettlePayment(w.state,'nazanin',p),false);
 let r=command(w,'nazanin','payment-receipt',{id:p.id,receipt:photo});assert.equal(r.state.payments[0].paid,false);assert.equal(r.state.journal.length,0);
 assert.throws(()=>transition(r.state,r.tasks,'haji','finance-limit',{amount:100,scope:'همه'}));
 r=transition(r.state,r.tasks,'behnam','finance-limit',{amount:100,scope:'هزینه عادی'});assert.equal(canSettlePayment(r.state,'nazanin',r.state.payments[0]),false);
 r=transition(r.state,r.tasks,'alireza','payment-approve',{id:p.id});r=transition(r.state,r.tasks,'nazanin','payment-record',{id:p.id,accountId:'bank',reference:'DEMO'});assert.equal(r.state.journal.length,1);assert.throws(()=>transition(r.state,r.tasks,'nazanin','payment-record',{id:p.id,accountId:'bank',reference:'DEMO'}));assert.equal(accountBalance(r.state,'bank'),null);
});
test('Expense without receipt can be finalized by Nazanin with an explanation, without extra manager approval',()=>{
 let r=command(fresh(),'employee','expense',{name:'نمونه',title:'خرید ابزار',lines:[{title:'ابزار',quantity:2,unitPrice:500}],noReceiptReason:'فیش موجود نیست'}),id=r.state.expenses[0].id;
 assert.equal(r.state.expenses[0].amount,1000);assert.throws(()=>transition(r.state,r.tasks,'employee','expense-finalize',{id}));r=transition(r.state,r.tasks,'nazanin','expense-finalize',{id});assert.equal(r.state.expenses[0].state,'finalized');
});
test('Petty cash needs Behnam approval, finance funding and purchaser receipt as three separate events',()=>{
 let r=command(fresh(),'majid','cash-request',{amount:5000,reason:'خرید'}),id=r.state.cashRequests[0].id;
 assert.throws(()=>transition(r.state,r.tasks,'nazanin','cash-fund',{id,reference:'x'}));assert.throws(()=>transition(r.state,r.tasks,'haji','cash-approve',{id,decision:'approve'}));
 r=transition(r.state,r.tasks,'behnam','cash-approve',{id,decision:'approve'});r=transition(r.state,r.tasks,'nazanin','invitation',{taskId:r.state.cashRequests.at(-1).fundingTaskId,decision:'accept'});r=transition(r.state,r.tasks,'nazanin','cash-fund',{id,reference:'DEMO'});assert.equal(r.state.cashRequests[0].state,'funded');r=transition(r.state,r.tasks,'majid','cash-receive',{id});assert.equal(r.state.cashRequests[0].state,'received');
});
test('HR stays private and finance receives only a minimal personnel instruction',()=>{
 const w=fresh();assert.throws(()=>command(w,'haji','hr-dossier',{userId:'ghazal',note:'secret',reason:'ثبت'}));assert.equal(canOpenFactory('personnel','haji'),false);assert.equal(canOpenFactory('personnel','nazanin'),false);
 const r=command(w,'behnam','payroll-instruction',{userId:'ghazal',kind:'وام',reason:'SECRET_PRIVATE_REASON',amount:5000});assert.equal(r.state.payments.at(-1).name,'غزل');assert.equal(JSON.stringify(r.state.payments.at(-1)).includes('SECRET_PRIVATE_REASON'),false);
 const html=renderFactory('finance',{state:r.state,tasks:r.tasks,actor:'nazanin',baseUrl:''});assert.equal(html.includes('SECRET_PRIVATE_REASON'),false);assert.equal(html.includes('5000'),false);assert.ok(html.includes('غزل'));
});
test('Emergency issuers, protected target accounts and offline external freeze enforce their actual boundaries',()=>{
 for(const issuer of ['alireza','behnam']){assert.equal(canEmergencyCode(issuer,'ghazal'),true);assert.equal(canEmergencyCode(issuer,'alireza'),false);assert.equal(canEmergencyCode(issuer,'haji'),false);}assert.equal(canEmergencyCode('haji','ghazal'),false);
 let r=command(fresh(),'alireza','sync-preview',{location:'outside',sync:'catching-up'});assert.throws(()=>transition(r.state,r.tasks,'employee','cash-request',{amount:1,reason:'x'}));r=transition(r.state,r.tasks,'alireza','sync-preview',{location:'outside',sync:'complete'});assert.ok(r.state.connection.lastSync);
});
