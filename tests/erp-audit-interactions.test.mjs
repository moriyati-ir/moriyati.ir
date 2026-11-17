import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {reviseMessage,removeMessage,archiveFor,sourceExcerpt} from '../dist/erp/messenger.mjs';
import {qrMatrix} from '../dist/erp/product-qr.mjs';
import {makeFactoryState,transition,stockSummary,publicProduct} from '../dist/erp/factory-model.mjs';
import {normalizeTasks,canSeeNotification} from '../dist/erp/policy.mjs';
import {initialTasks} from '../dist/erp/data.mjs';
import {personalRecords} from '../dist/erp/personal.mjs';
import {setLanguage,translate} from '../dist/erp/locale.mjs';
const fresh=()=>({state:makeFactoryState(),tasks:normalizeTasks(structuredClone(initialTasks))});
const op=(w,actor,command,data)=>transition(w.state,w.tasks,actor,command,data);
const photo='data:image/png;base64,AA==';

test('Message edits and tombstones retain originals and attachments exclusively in the CEO archive',()=>{
 const archive=[],m={id:'MSG-1',self:true,text:'اولیه',kind:'image',src:photo};reviseMessage(m,'اصلاح‌شده','ghazal',archive,'self');removeMessage(m,'ghazal',archive,'self');
 assert.equal(m.deleted,true);assert.equal(m.src,undefined);assert.equal(archive[0].original.text,'اولیه');assert.equal(archive[1].original.src,photo);assert.equal(archiveFor('alireza',archive).length,2);for(const id of ['haji','behnam','nazanin','ghazal'])assert.equal(archiveFor(id,archive).length,0);
 assert.throws(()=>reviseMessage({self:false,text:'received'},'change','alireza',archive,'team'));
});
test('Selected-source notes include only the selected undeleted messages',()=>{assert.equal(sourceExcerpt([{id:'a',text:'A'},{id:'b',text:'B'},{id:'c',text:'C',deleted:true}],['b','c']),'B');});
test('Private notifications never become visible merely because an account is an HR manager',()=>{for(const id of ['alireza','behnam','haji','mehrab'])assert.equal(canSeeNotification(id,{ownerId:'ghazal',kind:'reminder'},[]),false);assert.equal(canSeeNotification('ghazal',{ownerId:'ghazal',kind:'reminder'},[]),true);});
test('Every printed package QR decodes to the exact packaging-event URL',()=>{
 const require=createRequire(import.meta.url),decode=require('../dist/vendor/jsQR.js');const value='https://moriyati-ir.github.io/moriyati.ir/erp/#/verify/MT-DEMO-001/PKG-DEMO-001',m=qrMatrix(value),scale=5,quiet=4,size=(m.length+quiet*2)*scale,rgba=new Uint8ClampedArray(size*size*4).fill(255);
 for(let y=0;y<m.length;y++)for(let x=0;x<m.length;x++)if(m[y][x])for(let yy=0;yy<scale;yy++)for(let xx=0;xx<scale;xx++){const i=(((y+quiet)*scale+yy)*size+(x+quiet)*scale+xx)*4;rgba[i]=rgba[i+1]=rgba[i+2]=0;}
 assert.equal(decode(rgba,size,size).data,value);
});
test('Only the final QC operator completes quality checks; other management approval is shipment release',()=>{const w=fresh();for(const actor of ['alireza','behnam','haji','nazanin'])assert.throws(()=>op(w,actor,'product-qc',{id:'UNIT-001',decision:'pass',weightCheck:true,surfaceCheck:true,sealCheck:true,serialCheck:true}));});
test('A passenger starts their own participation, never another person by proxy',()=>{
 const w=op(fresh(),'haji','trip-start',{vehicle:'CAR-DEMO',destination:'مسیر نمونه',role:'راننده'}),id=w.state.trips[0].id;assert.throws(()=>op(w,'haji','trip-person',{id,userId:'mehrab',decision:'join',role:'همراه'}));const joined=op(w,'mehrab','trip-person',{id,userId:'mehrab',decision:'join',role:'همراه'});assert.equal(joined.state.trips[0].participants.at(-1).userId,'mehrab');
});
test('A partial recovery consumes its source position and does not add duplicate physical mass',()=>{
 let w=op(fresh(),'alireza','recovery-create',{sourceId:'LOT-103',taskId:'silver-100',form:'مانده',place:'بازیافت',mass:'100',certainty:'unknown'}),id=w.state.recoveries[0].id;const before=stockSummary(w.state).find(x=>x.metal==='نقره').knownMass;w=op(w,'alireza','recovery-return',{id,mass:'10',metal:'نقره',purity:'999.9',complete:false});assert.equal(stockSummary(w.state).find(x=>x.metal==='نقره').knownMass,before);assert.equal(w.state.packets.find(p=>p.id===w.state.recoveries[0].sourcePacketId).mass,'90');
});
test('Packaging without a printed serial still has one permanent unit identity and a safe projection',()=>{
 const w=op(fresh(),'mehrab','package',{packetId:'LOT-106',title:'واحد بدون سریال چاپی',net:'31.1035',gross:'40',front:photo,back:photo});const p=w.state.products.at(-1),view=publicProduct(w.state,p.id,p.packaging[0].id);assert.equal(p.serial,null);assert.ok(p.id);assert.equal(view.title,p.title);assert.equal(view.taskId,undefined);assert.equal(view.location,undefined);
});
test('Each received item needs its own photo even when the receipt header has evidence',()=>{assert.throws(()=>op(fresh(),'mehrab','receive',{counterparty:'نمونه',photo,items:[{metal:'نقره',form:'شمش',gross:101,net:100,certainty:'unknown'}]}));});
test('Tool workload and actual paid HR instructions flow only to the relevant personal record',()=>{
 let w=op(fresh(),'employee','tool-use',{taskId:'silver-100',toolId:'CR-001',mass:3000});w=op(w,'employee','tool-use',{taskId:'silver-100',toolId:'CR-001',mass:3000});assert.equal(personalRecords('employee',w.state,w.tasks).work.reduce((n,r)=>n+r.processed,0),6000);assert.equal(personalRecords('ghazal',w.state,w.tasks).work.reduce((n,r)=>n+r.processed,0),0);
 w=op(w,'behnam','payroll-instruction',{userId:'ghazal',kind:'پاداش',amount:1000,reason:'خصوصی'});assert.equal(personalRecords('ghazal',w.state,w.tasks).money.length,0);assert.equal(personalRecords('ghazal',w.state,w.tasks).payments.length,1);assert.equal(personalRecords('mehrab',w.state,w.tasks).payments.length,0);
});
test('English interface copy translates full guidance without corrupting embedded Persian words',()=>{setLanguage('en');assert.equal(translate('فرم و وزن نوشته‌ها را با مرجع ارسالی بررسی می‌کنیم.'),'Review the letterforms and weights against the supplied reference.');assert.equal(translate('ارسالی'),'ارسالی');assert.equal(translate('این اقدام در اختیار این حساب نیست.'),'This action is not available to this account.');setLanguage('fa');});

test('Pending, returned and external material cannot bypass actual admission',()=>{
 const w=op(fresh(),'mehrab','receive',{counterparty:'نمونه',items:[{photo,metal:'نقره',form:'شمش',gross:101,net:100,certainty:'unknown'}]}),p=w.state.packets.at(-1);
 assert.throws(()=>op(w,'behnam','handover',{packetId:p.id,mass:10,receiver:'employee',to:'ذوب'}));
 assert.throws(()=>op(w,'mehrab','package',{packetId:p.id,title:'واحد',net:10,gross:11,front:photo,back:photo}));
 assert.throws(()=>op(fresh(),'mehrab','package',{packetId:'LOT-107',title:'واحد تکراری',serial:'OTHER',net:100,gross:110,front:photo,back:photo}));
});
