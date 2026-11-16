import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seedFactory} from '../lib/factory.ts';
import {applyFlowCommand,createFlowSeed,upgradeFactory,physicalStock,compareLot,packetFine} from '../lib/flow.ts';
const cmd=(f,type,data={},actorId='CEO')=>applyFlowCommand(f,{type:'factory/'+type,data:{...data,actorId}},'test').factory;
const receive=(extra={})=>cmd(createFlowSeed(),'receive_lot',{metal:'silver',invoice:'INV-TEST',form:'مصنوعات / ظروف',gross:1001,net:1000,claimedKnown:false,conditional:false,target:'موجودی کارخانه',...extra});
const start=(f,pid,op,weight,more={})=>cmd(f,'create_run',{packetId:pid,op,weight,vessel:'V-'+op,note:'test step',...more});
const finish=(f,rid,output,shape,more={})=>cmd(f,'finish_run',{runId:rid,output,shape,assay:0,residue:0,otherOut:0,...more});
const assay=(f,pid,result,certainty='estimated',purpose='ورودی')=>{
 f=cmd(f,'submit_assay',{packetId:pid,sample:'S-'+crypto.randomUUID(),purpose,method:'XRF',result,personId:'OP-LAB',certainty,weighed:certainty==='final'});
 return cmd(f,'approve_assay',{assayId:f.assays[0].id});
};

test('v2 migration preserves records and quantities without requiring owner accounts',()=>{
 const old=seedFactory(),migrated=upgradeFactory(old);assert.equal(migrated.version,3);assert.equal(old.version,2);
 assert.deepEqual(migrated.packets.map(p=>p.weight),old.packets.map(p=>p.weight));assert.deepEqual(migrated.lots.map(l=>l.id),old.lots.map(l=>l.id));
 const f=receive();assert.equal(f.lots[0].owner,'');assert.equal(f.packets[0].assayBasis,'unknown');assert.equal(packetFine(f.packets[0]),null);
});

test('numbered intake keeps invoice, optional declared grade and material grams separate',()=>{
 let f=receive({lotCode:'MOR-INTAKE-1'});const p=f.packets[0];assert.equal(f.lots[0].id,'MOR-INTAKE-1');assert.equal(f.lots[0].claimedKnown,false);assert.equal(p.weight,1000);
 assert.throws(()=>cmd(f,'receive_lot',{metal:'silver',invoice:'X',lotCode:'MOR-INTAKE-1',form:'ریژه',gross:100,net:100}));
 assert.throws(()=>cmd(f,'receive_lot',{metal:'silver',form:'ریژه',gross:100,net:100}));
 assert.equal(compareLot(f,f.lots[0].id).difference,null);
});

test('partial acceptance reserves only accepted material, returns the rest, with no assay invented',()=>{
 let f=receive({conditional:true});const lid=f.lots[0].id;
 f=cmd(f,'decide_lot',{lotId:lid,decision:'partial',acceptedWeight:600,note:'پذیرش جزئی با عیار نامشخص'});
 const lot=f.lots.find(l=>l.id===lid);assert.equal(lot.acceptedWeight,600);assert.equal(lot.returnedWeight,400);assert.equal(lot.decision,'partial');
 assert.equal(f.packets.filter(p=>p.state==='available'&&p.shares.some(s=>s.lotId===lid)).reduce((w,p)=>w+p.weight,0),600);
 assert.equal(f.packets.filter(p=>p.state==='returned'&&p.shares.some(s=>s.lotId===lid)).reduce((w,p)=>w+p.weight,0),400);
 assert.equal(compareLot(f,lid).exact,false);
});

test('unknown recycled intake may enter refining while final XRF is blocked before actual preparation',()=>{
 let f=receive();let pid=f.packets[0].id;
 f=start(f,pid,'melt',1000);f=finish(f,f.runs[0].id,1000,'آب‌شده');pid=f.packets[0].id;
 assert.throws(()=>assay(f,pid,999.9,'final'));
 f=start(f,pid,'acid',1000);assert.equal(f.runs[0].op,'acid');assert.equal(f.runs[0].inputBasis,'unknown');
});

test('refining, drying, melting, final assay and QC use actual dry output, not raw mass times 999.9',()=>{
 let f=receive({claimedKnown:true,assay:850});const lid=f.lots[0].id;
 // Incoming XRF is a confirmed estimate, with signed positive grade difference.
 f=start(f,f.packets[0].id,'melt',1000);f=finish(f,f.runs[0].id,1000,'آب‌شده',{assay:850});f=assay(f,f.packets[0].id,860);
 let c=compareLot(f,lid);assert.ok(c.difference>0);assert.equal(c.exact,false);
 // Record carrier mass; solution is three kilograms with an estimated 850 g of silver.
 f=start(f,f.packets[0].id,'acid',1000);let rid=f.runs[0].id;
 f=cmd(f,'material_move',{runId:rid,materialId:'CHEM-WATER',kind:'consume',grams:2000,note:'carrier'});
 f=finish(f,rid,3000,'محلول',{containedFine:850});assert.equal(f.packets[0].assay,0);assert.equal(packetFine(f.packets[0]),850);
 f=start(f,f.packets[0].id,'precipitate',3000);f=finish(f,f.runs[0].id,900,'رسوب',{containedFine:850,otherOut:2100,differenceNote:'carrier removed'});
 f=start(f,f.packets[0].id,'dry',900);f=finish(f,f.runs[0].id,850,'پودر خشک',{otherOut:50,differenceNote:'water removed'});
 f=start(f,f.packets[0].id,'melt',850);f=finish(f,f.runs[0].id,850,'آب‌شده');assert.equal(f.packets[0].meltedAfterRefining,true);
 f=assay(f,f.packets[0].id,999.9,'final','کنترل کیفیت');assert.equal(f.packets[0].assayBasis,'final');
 f=start(f,f.packets[0].id,'qc',850);f=finish(f,f.runs[0].id,850,'آب‌شده',{assay:999.9,quality:'pass'});
 c=compareLot(f,lid);assert.equal(c.exact,true);assert.equal(c.actual9999,850);assert.ok(Math.abs(c.factoryAssay-849.915)<1e-6);assert.ok(c.difference<0);
 assert.ok(Math.abs(c.difference-(850-1000*850/999.9))<1e-6);assert.equal(f.packets[0].confirmed,true);
});

test('ordered route supports repeated steps and independently replans a partial split without changing stock',()=>{
 let f=createFlowSeed();f=cmd(f,'update_plan',{packetId:'PKT-101-RAW',route:['melt','riegeh','melt','granulate'],priority:'high',destination:'صندوق',target:'گرانول',targetAssay:990,finish:'براق',note:'new plan'});
 f=cmd(f,'split_packet',{packetId:'PKT-101-RAW',weight:2000,route:['research','melt'],priority:'urgent',destination:'R&D',note:'separate research'});
 const next=f.packets[0],original=f.packets.find(p=>p.id==='PKT-101-RAW');assert.deepEqual(next.route,['research','melt']);assert.deepEqual(original.route,['melt','riegeh','melt','granulate']);assert.equal(original.weight+next.weight,6000);assert.equal(next.priority,'urgent');
 f=start(f,next.id,'research',1000);assert.deepEqual(f.runs[0].route,['melt']);assert.equal(f.packets.find(p=>p.id===next.id).weight,1000);
 assert.throws(()=>cmd(f,'update_plan',{packetId:next.id,route:['invented'],note:'bad'}));
});

test('splitting a solution allocates its contained-metal estimate proportionally without double counting',()=>{
 let f=createFlowSeed();const p=f.packets.find(p=>p.id==='PKT-WIP-SOLUTION');assert.equal(p.weight,18000);assert.equal(p.containedFine,680);
 f=cmd(f,'split_packet',{packetId:p.id,weight:9000,note:'split solution',route:[]});assert.equal(f.packets[0].containedFine,340);assert.equal(f.packets.find(x=>x.id===p.id).containedFine,340);
});

test('pause requires a reason and explicit resume; a paused task remains visible with its physical material',()=>{
 let f=createFlowSeed();assert.throws(()=>cmd(f,'pause_run',{runId:'RUN-AG-0007',note:''}));
 f=cmd(f,'pause_run',{runId:'RUN-AG-0007',note:'waiting for device'});assert.equal(physicalStock(f).find(r=>r.id==='RUN-AG-0007').status,'متوقف با علت');
 assert.throws(()=>finish(f,'RUN-AG-0007',3000,'آب‌شده',{assay:990}));
 f=cmd(f,'resume_run',{runId:'RUN-AG-0007',note:'device ready'});assert.equal(f.runs[0].pause,undefined);assert.ok(f.events[0].title.includes('device ready'));
});

test('internal transfer is a task; source stock and in-transit material are counted once',()=>{
 let f=createFlowSeed();const relevant=f=>physicalStock(f).filter(r=>r.lotIds.includes('LOT-AG-0102')).reduce((w,r)=>w+r.weight,0);
 assert.equal(relevant(f),6000);f=start(f,'PKT-102-RAW','transfer',2000,{destination:'صندوق'});const rid=f.runs[0].id;assert.equal(relevant(f),6000);
 f=finish(f,rid,2000,'آب‌شده',{assay:990});assert.equal(relevant(f),6000);assert.equal(f.packets[0].station,'صندوق');assert.equal(physicalStock(f).filter(r=>r.id===rid).length,0);
});

test('material discrepancy is unresolved with a responsible person, never silently permanent fine-metal loss',()=>{
 let f=start(createFlowSeed(),'PKT-102-RAW','melt',1000),rid=f.runs[0].id;
 assert.throws(()=>finish(f,rid,999,'آب‌شده',{assay:990}));
 f=finish(f,rid,999,'آب‌شده',{assay:990,differenceNote:'check table and vessel',accountablePerson:'Operator'});
 assert.equal(f.runs[0].difference,1);assert.equal(f.runs[0].accountablePerson,'Operator');assert.ok(f.events[0].title.includes('افت فلز خالص خودکار اعلام نشد'));
});

test('partial residue return reduces the original vessel and creates a new source-linked stock identity',()=>{
 let f=createFlowSeed();f=cmd(f,'return_residue',{residueId:'REC-CR-000',weight:50,shape:'آب‌شده',destination:'ذوب',note:'partial recovery'});
 assert.equal(f.residues.find(r=>r.id==='REC-CR-000').grams,800);assert.equal(f.packets[0].weight,50);assert.deepEqual(f.packets[0].parents,['REC-CR-000']);
 assert.equal(f.lots[0].owner,'');assert.equal(f.packets[0].assayBasis,'unknown');
 assert.throws(()=>cmd(f,'return_residue',{residueId:'REC-CR-000',weight:801,shape:'آب‌شده',destination:'ذوب',note:'too much'}));
});

test('joint recovery returns a physical group identity, never fictional ownership or per-source yield',()=>{
 let f=cmd(createFlowSeed(),'start_recovery',{sourceIds:['REC-CR-000','REC-TABLE-01'],note:'group'}),rid=f.recoveries[0].id;
 f=cmd(f,'finish_recovery',{recoveryId:rid,output:100,assay:999.9,note:'measured output'});
 assert.equal(physicalStock(f).filter(r=>r.kind==='recovery'&&r.id===rid).length,1);
 f=cmd(f,'allocate_recovery',{recoveryId:rid});assert.equal(f.packets[0].weight,100);assert.equal(f.recoveries[0].allocations,undefined);assert.equal(f.lots[0].owner,'');
 assert.equal(physicalStock(f).filter(r=>r.kind==='recovery'&&r.id===rid).length,0);assert.deepEqual(f.packets[0].parents,[rid]);
});

test('unknown fluid grade does not turn measured solution grams into precise fine-metal stock',()=>{
 const f=createFlowSeed(),rows=physicalStock(f);assert.equal(rows.find(r=>r.id==='PKT-WIP-CHLORIDE').fine,null);
 const solution=rows.find(r=>r.id==='PKT-WIP-SOLUTION');assert.equal(solution.weight,18000);assert.equal(solution.fine,680);assert.equal(solution.basis,'estimated');
});

test('financial ownership is absent from new intake and permission cannot be bypassed by new flow commands',()=>{
 const f=receive();assert.equal(f.lots[0].owner,'');assert.throws(()=>cmd(f,'update_plan',{packetId:f.packets[0].id,route:[],note:'no permission'},'CAFE-01'));
 assert.throws(()=>cmd(f,'submit_assay',{packetId:'PKT-101-RAW',sample:'X',purpose:'ورودی',method:'XRF',result:990},'CAFE-01'));
});

test('unresolved material difference blocks final certainty and is resolved only by an explicit disposition',()=>{
 let f=start(createFlowSeed(),'PKT-102-RAW','melt',1000),rid=f.runs[0].id;
 f=finish(f,rid,999,'آب‌شده',{assay:990,differenceNote:'missing at table',accountablePerson:'Operator'});
 assert.equal(compareLot(f,'LOT-AG-0102').unresolved,true);
 f=cmd(f,'resolve_difference',{runId:rid,grams:0.6,disposition:'found',station:'میز ریژه',vessel:'FOUND-BOX',note:'found 0.6 g'});
 assert.equal(f.runs.find(r=>r.id===rid).differenceRemaining,0.4);assert.equal(f.residues[0].grams,0.6);
 f=cmd(f,'resolve_difference',{runId:rid,grams:0.4,disposition:'nonmetal',note:'verified nonmetal material'});
 assert.equal(f.runs.find(r=>r.id===rid).differenceRemaining,0);assert.equal(compareLot(f,'LOT-AG-0102').unresolved,false);
 assert.throws(()=>cmd(f,'resolve_difference',{runId:rid,grams:0.1,disposition:'confirmed',note:'duplicate'}));
});
