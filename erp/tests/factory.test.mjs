import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seedFactory,applyFactoryCommand,assetWork,solutionWork,lotSummary,alloyCopper,pure} from '../lib/factory.ts';
const cmd=(f,type,data={},actorId='CEO')=>applyFactoryCommand(f,{type:'factory/'+type,data:{...data,actorId}},'test').factory;
const finish=(f,runId,output,assay,shape,residue=0)=>cmd(f,'finish_run',{runId,output,assay,shape,residue,residueLocation:'میز ریژه',residueVessel:residue?'RES-TEST':'',quality:'pass'});

test('conditional utensils need preparation/assay; rejection returns the entire consignment and residues',()=>{
 let f=cmd(seedFactory(),'receive_lot',{metal:'silver',owner:'Customer test',ownership:'customer',conditional:true,isolated:true,form:'مصنوعات / ظروف',gross:8240,net:8000,assay:850,target:'پالایش مستقل',description:'',photo:''});
 const lid=f.lots[0].id,pid=f.packets[0].id;
 assert.throws(()=>cmd(f,'submit_assay',{packetId:pid,sample:'BAD-DIRECT',purpose:'ورودی',method:'Test',result:920,personId:'OP-LAB'}));
 assert.throws(()=>cmd(f,'decide_lot',{lotId:lid,decision:'accept',note:'No assay'}));
 f=cmd(f,'create_run',{packetId:pid,op:'melt',weight:8000,vessel:'ISOLATED-VESSEL',note:''});const rid=f.runs[0].id;
 f=finish(f,rid,7998,850,'آب‌شده',2);const melted=f.packets[0].id;
 f=cmd(f,'create_run',{packetId:melted,op:'riegeh',weight:7998,vessel:'ISOLATED-RIEGEH',note:''});f=finish(f,f.runs[0].id,7998,850,'ریژه');const sampled=f.packets[0].id;
 f=cmd(f,'submit_assay',{packetId:sampled,sample:'SAMPLE-TEST',purpose:'ورودی',method:'Lab test',result:920,personId:'OP-LAB'});f=cmd(f,'approve_assay',{assayId:f.assays[0].id});
 f=cmd(f,'decide_lot',{lotId:lid,decision:'return',note:'Whole consignment rejected'});
 assert.equal(f.lots.find(l=>l.id===lid).status,'returned');assert.equal(f.lots.find(l=>l.id===lid).returnedWeight,8000);
 assert.equal(f.packets.find(p=>p.id===sampled).state,'returned');assert.equal(f.residues.find(r=>r.runId===rid).state,'returned');
 assert.throws(()=>cmd(f,'create_run',{packetId:sampled,op:'acid',weight:1000,vessel:'TANK'}));
});

test('parallel 3 kg sub-batches advance independently while the rest of the consignment stays open',()=>{
 let f=seedFactory();f=cmd(f,'create_run',{packetId:'PKT-101-RAW',op:'melt',weight:3000,vessel:'MELT-SECOND',note:''});const rid=f.runs[0].id;
 f=cmd(f,'start_work',{runId:rid,personId:'OP-MELT',role:'Second concurrent job'});
 assert.equal(f.runs.find(r=>r.id==='RUN-AG-0007').sessions.filter(s=>!s.end).length,1);
 f=cmd(f,'end_work',{runId:rid,sessionId:f.runs[0].sessions[0].id});f=finish(f,rid,2999,990,'آب‌شده',1);
 const next=f.packets[0];assert.equal(next.weight,2999);
 f=cmd(f,'create_run',{packetId:next.id,op:'riegeh',weight:2999,vessel:'RIEGEH-NEXT',note:''});
 assert.ok(f.runs.some(r=>r.id==='RUN-AG-0007'&&r.state==='open'));
 assert.equal(f.packets.find(p=>p.id==='PKT-101-RAW').weight,3000);
 assert.throws(()=>cmd(f,'close_lot',{lotId:'LOT-AG-0101'}));
 assert.equal(lotSummary(f,'LOT-AG-0101').lot.status,'accepted');
});

test('same-fineness silver pooling preserves both ownership shares through partial allocation',()=>{
 let f=cmd(seedFactory(),'pool',{packetIds:['PKT-101-RAW','PKT-102-RAW']});const p=f.packets[0];
 assert.equal(p.weight,12000);assert.equal(p.shares.length,2);assert.deepEqual(p.shares.map(s=>s.weight),[6000,6000]);
 f=cmd(f,'create_run',{packetId:p.id,op:'melt',weight:3000,vessel:'SHARED-SAME-GRADE',note:''});
 assert.deepEqual(f.runs[0].shares.map(s=>s.weight),[1500,1500]);assert.equal(f.packets.find(x=>x.id===p.id).weight,9000);
 assert.deepEqual(f.packets.find(x=>x.id===p.id).originShares.map(s=>s.weight),[6000,6000]);
});

test('different fineness and conditional acid work cannot be pooled',()=>{
 let f=seedFactory();f.packets.find(p=>p.id==='PKT-102-RAW').assay=995;
 assert.throws(()=>cmd(f,'pool',{packetIds:['PKT-101-RAW','PKT-102-RAW']}));
 f=seedFactory();const p=f.packets.find(p=>p.id==='PKT-103-HELD');Object.assign(p,{assay:990,confirmed:true,shape:'آب‌شده',station:'ذوب'});f.lots.find(l=>l.id==='LOT-AG-0103').status='accepted';
 assert.throws(()=>cmd(f,'pool',{packetIds:['PKT-101-RAW',p.id]}));
 assert.throws(()=>cmd(f,'create_run',{packetId:p.id,op:'acid',weight:3000,vessel:'CR-MELT-005',note:''}));
});

test('operator consumption in grams may make stock negative; receiving stock needs warehouse authority',()=>{
 let f=cmd(seedFactory(),'material_move',{materialId:'CHEM-HNO3',runId:'RUN-AG-0007',kind:'consume',grams:120001,note:'Actual use'},'OP-MELT');
 assert.equal(f.materials.find(m=>m.id==='CHEM-HNO3').grams,-1);assert.equal(f.consumption[0].runId,'RUN-AG-0007');
 assert.ok(f.events[0].title.includes('منفی'));
 assert.throws(()=>cmd(f,'material_move',{materialId:'CHEM-HNO3',runId:'',kind:'receipt',grams:1000,note:'Unauthorized'},'OP-MELT'));
 assert.throws(()=>cmd(f,'material_move',{materialId:'CHEM-HNO3',runId:'',kind:'consume',grams:10,note:'No job'}));
});

test('every remelt adds tool work without adding unique production output',()=>{
 let f=seedFactory();const originalInput=f.runs.find(r=>r.id==='RUN-AG-0007').input;
 f=cmd(f,'record_cycle',{runId:'RUN-AG-0007',assetId:'TOOL-01',solutionId:'',grams:3000,personId:'OP-MELT',reason:'Third remelt'});
 const work=assetWork(f,'TOOL-01');assert.equal(work.grams,255000);assert.equal(work.cycles,21);
 assert.equal(f.runs.find(r=>r.id==='RUN-AG-0007').input,originalInput);assert.equal(f.runs.find(r=>r.id==='RUN-AG-0007').output,undefined);
 assert.throws(()=>cmd(f,'record_cycle',{runId:'RUN-AG-0007',assetId:'TOOL-01',solutionId:'',grams:3001,personId:'OP-MELT',reason:'Too much'}));
});

test('new crucible leaves existing usable crucible active; explicit retirement queues its source serial',()=>{
 let f=cmd(seedFactory(),'create_asset',{name:'New crucible',serial:'CR-NEW-TEST',purpose:'ذوب ۵ کیلویی',heat:true,station:'ذوب',replaces:'TOOL-01'});
 assert.equal(f.assets.find(a=>a.id==='TOOL-01').state,'active');assert.equal(f.assets[0].state,'active');
 f=cmd(f,'retire_asset',{assetId:'TOOL-01',reason:'Crack',vessel:'REC-NEW',metal:'silver',grams:800});
 assert.equal(f.assets.find(a=>a.id==='TOOL-01').state,'retired');assert.equal(f.residues[0].sourceId,'CR-MELT-005');assert.equal(f.residues[0].state,'queued');
 assert.equal(assetWork(f,'TOOL-01').grams,252000);
 assert.throws(()=>cmd(f,'record_cycle',{runId:'RUN-AG-0007',assetId:'TOOL-01',solutionId:'',grams:1000,personId:'OP-MELT',reason:'Retired'}));
});

test('solution replacement closes exact work interval, queues old solution and starts a zero-count campaign',()=>{
 let f=seedFactory();assert.deepEqual(solutionWork(f,'SOL-990-01'),{cycles:13,grams:39000});
 f=cmd(f,'replace_solution',{solutionId:'SOL-990-01',recoveryVessel:'REC-SOLUTION-01',grams:25000});const newer=f.solutions[0];
 assert.equal(newer.vessel,'TANK-GRAN-990');assert.deepEqual(solutionWork(f,newer.id),{cycles:0,grams:0});
 assert.equal(f.solutions.find(s=>s.id==='SOL-990-01').state,'replaced');assert.equal(f.residues[0].sourceId,'SOL-990-01');
 assert.throws(()=>cmd(f,'record_cycle',{runId:'RUN-AG-0007',assetId:'TOOL-02',solutionId:'SOL-990-01',grams:3000,personId:'OP-MELT',reason:'Old campaign'}));
 f=cmd(f,'record_cycle',{runId:'RUN-AG-0007',assetId:'TOOL-02',solutionId:newer.id,grams:3000,personId:'OP-MELT',reason:'Fresh campaign'});
 assert.deepEqual(solutionWork(f,newer.id),{cycles:1,grams:3000});assert.deepEqual(solutionWork(f,'SOL-990-01'),{cycles:13,grams:39000});
 assert.throws(()=>cmd(f,'record_cycle',{runId:'RUN-AG-0007',assetId:'TOOL-02',solutionId:'SOL-9999-01',grams:3000,personId:'OP-MELT',reason:'Wrong grade'}));
});

test('group recovery retains every source serial and does not invent individual yields or ownership',()=>{
 let f=cmd(seedFactory(),'start_recovery',{sourceIds:['REC-CR-000','REC-TABLE-01'],note:'Measured group'}),rid=f.recoveries[0].id;
 f=cmd(f,'finish_recovery',{recoveryId:rid,output:100,assay:999.9,note:'Actual laboratory result'});
 const recovered=f.recoveries[0];assert.equal(pure(recovered.output,recovered.assay),99.99);assert.deepEqual(recovered.sourceIds,['REC-CR-000','REC-TABLE-01']);
 assert.equal(recovered.allocations,undefined);assert.equal(recovered.packetId,undefined);assert.equal(f.residues.find(r=>r.id==='REC-CR-000').state,'recovered');
 assert.throws(()=>cmd(f,'allocate_recovery',{recoveryId:rid,allocations:[]}));
 f=cmd(f,'allocate_recovery',{recoveryId:rid,allocations:[],owner:'Explicit customer',ownership:'customer'});assert.equal(f.lots[0].ownership,'customer');assert.equal(f.lots[0].owner,'Explicit customer');assert.ok(f.recoveries[0].packetId);assert.equal(f.packets[0].confirmed,false);assert.equal(f.packets[0].station,'آزمایشگاه');
});

test('independent conditional recovery cannot be combined with another owner or another independent consignment',()=>{
 const f=seedFactory();f.residues.push({id:'ISOLATED-RES',sourceType:'station',sourceId:'ISO',label:'Isolated',station:'فیلتر',vessel:'ISO-BOX',metal:'silver',grams:20,assay:null,shares:[{lotId:'LOT-AG-0103',owner:'مالک نمونه ج',weight:20}],runId:'',state:'queued',created:new Date().toISOString()});
 assert.throws(()=>cmd(f,'start_recovery',{sourceIds:['ISOLATED-RES','REC-CR-000'],note:''}));
 const other={...f.lots.find(l=>l.id==='LOT-AG-0103'),id:'OTHER-ISOLATED'};f.lots.push(other);f.residues.push({...f.residues.at(-1),id:'ISOLATED-RES-2',shares:[{lotId:other.id,owner:other.owner,weight:20}]});
 assert.throws(()=>cmd(f,'start_recovery',{sourceIds:['ISOLATED-RES','ISOLATED-RES-2'],note:''}));
});

test('market trip clock is independent from factory attendance',()=>{
 let f=seedFactory();const before=structuredClone(f.attendance);f=cmd(f,'start_trip',{personId:'MARKET',destination:'Market',purpose:'Procurement'});const trip=f.trips[0];
 assert.deepEqual(f.attendance,before);f=cmd(f,'end_trip',{tripId:trip.id,report:'Completed'});assert.deepEqual(f.attendance,before);assert.ok(f.trips[0].end);
 assert.throws(()=>cmd(f,'start_trip',{personId:'CHAIR',destination:'Market',purpose:'Duplicate'}));
});

test('master settings belong to CEO; chairman retains operational access but cannot edit ERP',()=>{
 let f=seedFactory();assert.throws(()=>cmd(f,'update_settings',{accent:'#123456',background:'#eeeeee',font:'Tahoma'},'CHAIR'));
 f=cmd(f,'update_settings',{accent:'#123456',background:'#eeeeee',font:'Tahoma'});assert.equal(f.settings.accent,'#123456');
 f=cmd(f,'create_material',{name:'Test material',category:'پودر مصرفی',grams:100,minimum:10},'CHAIR');assert.equal(f.materials[0].grams,100);
 assert.throws(()=>cmd(f,'receive_lot',{metal:'silver',net:100,gross:100,assay:990,owner:'Test',form:'آب‌شده',target:'Test'},'CAFE-01'));
});

test('role model is limited to twenty accounts',()=>{
 let f=seedFactory();while(f.people.length<20)f=cmd(f,'save_person',{name:'Test '+f.people.length,role:'Operator',departments:['ذوب'],permissions:['تولید']});
 assert.equal(f.people.length,20);assert.throws(()=>cmd(f,'save_person',{name:'Over limit',role:'Operator',departments:['ذوب'],permissions:['تولید']}));
});

test('product serial, packaging, tag, grade and actual free weight remain controlled with full ownership genealogy',()=>{
 let f=seedFactory();const data={packetId:'PKT-100-FINAL',collection:'Argentum',weight:1000,serial:'SERIAL-NEW',packaging:'PACK-NEW',tag:'TAG-NEW',front:'',back:''};
 f=cmd(f,'register_product',data);assert.equal(f.products[0].shares[0].lotId,'LOT-AG-0100');assert.equal(f.packets.find(p=>p.id==='PKT-100-FINAL').weight,2998);
 for(const delta of [{serial:'SERIAL-NEW',packaging:'P2',tag:''},{serial:'S2',packaging:'PACK-NEW',tag:''},{serial:'S2',packaging:'P2',tag:'TAG-NEW'},{serial:'S2',packaging:'P2',tag:'',weight:5000},{serial:'S2',packaging:'P2',tag:'',collection:'Celestial'}])assert.throws(()=>cmd(f,'register_product',{...data,...delta}));
 assert.equal(f.packets.find(p=>p.id==='PKT-100-FINAL').originShares[0].weight,3998);
});

test('gold granules cannot be released as a final product',()=>{
 const f=seedFactory();f.packets.find(p=>p.id==='PKT-101-RAW').metal='gold';f.packets.find(p=>p.id==='PKT-101-RAW').shape='ساچمه';
 assert.throws(()=>cmd(f,'create_run',{packetId:'PKT-101-RAW',op:'qc',weight:1000,vessel:'QC-DESK',note:''}));
});

test('assay revision keeps prior result and the new approved fineness',()=>{
 let f=seedFactory();for(const [sample,result]of [['REV-1',990],['REV-2',991]]){f=cmd(f,'submit_assay',{packetId:'PKT-101-RAW',sample,purpose:'ورودی',method:'Test',result,personId:'OP-LAB'});f=cmd(f,'approve_assay',{assayId:f.assays[0].id});}
 assert.equal(f.assays.find(a=>a.sample==='REV-1').status,'superseded');assert.ok(f.assays.find(a=>a.sample==='REV-2').supersedes);assert.equal(f.packets.find(p=>p.id==='PKT-101-RAW').assay,991);
});

test('alloy helper preserves fine silver algebra; output/stock/QC are separate measured records',()=>{
 assert.equal(alloyCopper(3000,999.9,990),30);assert.equal(pure(3030,990),pure(3000,999.9));assert.throws(()=>alloyCopper(3000,990,995));
});

test('invalid grams and impossible pure-metal outputs are rejected without changing input state',()=>{
 const f=seedFactory();for(const grams of [NaN,Infinity,'',null,true,-1])assert.throws(()=>cmd(f,'material_move',{materialId:'CHEM-HNO3',runId:'RUN-AG-0007',kind:'consume',grams,note:'bad'}));
 const ready=cmd(f,'end_work',{runId:'RUN-AG-0007',sessionId:'WORK-01'});assert.throws(()=>finish(ready,'RUN-AG-0007',3000,999.9,'آب‌شده'));
 assert.equal(f.runs.find(r=>r.id==='RUN-AG-0007').state,'open');assert.equal(f.materials[0].grams,120000);
});

test('granulation, QC and serialised Investment product form one owner-preserving route',()=>{
 let f=cmd(seedFactory(),'create_run',{packetId:'PKT-101-RAW',op:'granulate',weight:3000,vessel:'GRAN-ROUTE',note:'Approved incoming grade'});
 const granId=f.runs[0].id;f=finish(f,granId,2999,990,'ساچمه',1);const gran=f.packets[0];assert.equal(gran.confirmed,true);assert.equal(gran.final,false);
 f=cmd(f,'create_run',{packetId:gran.id,op:'qc',weight:2999,vessel:'QC-ROUTE',note:''});f=finish(f,f.runs[0].id,2999,990,'ساچمه');const final=f.packets[0];assert.equal(final.final,true);
 f=cmd(f,'register_product',{packetId:final.id,collection:'Investment',weight:100,serial:'INV-TEST-100',packaging:'INV-PACK-100',tag:'',front:'',back:''});
 assert.equal(f.products[0].shares[0].lotId,'LOT-AG-0101');assert.equal(f.products[0].weight,100);assert.equal(f.products[0].assay,990);
 assert.equal(f.packets.find(p=>p.id===final.id).weight,2899);assert.equal(f.runs.find(r=>r.id==='RUN-AG-0007').state,'open');
});
