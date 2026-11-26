'use strict';

const {createHash,randomUUID}=require('node:crypto');
const stages=new Set(['melt','refine','polish','mint','pack']);
const schema=`
 CREATE TABLE IF NOT EXISTS erp_live_work_events (
  receipt_id uuid NOT NULL REFERENCES erp_live_receipts(id), version int NOT NULL CHECK(version>0),
  id uuid NOT NULL UNIQUE, request_id uuid NOT NULL, payload_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), actor text NOT NULL CHECK(actor IN ('manager','staff')),
  kind text NOT NULL CHECK(kind IN ('start','record','complete')), stage text NOT NULL,
  note text NOT NULL, output_mass numeric(19,6), residual_mass numeric(19,6), unreconciled_mass numeric(21,6),
  output_purity numeric(8,4), available_mass numeric(19,6) NOT NULL,
  current_purity numeric(8,4), custody text NOT NULL, operator text,
  PRIMARY KEY(receipt_id,version), UNIQUE(receipt_id,actor,request_id));`;
const fields=`version,id,created_at AS "createdAt",actor,kind,stage,note,output_mass AS "outputMass",
 residual_mass AS "residualMass",unreconciled_mass AS "unreconciledMass",output_purity AS "outputPurity",
 available_mass AS "availableMass",current_purity AS "currentPurity",custody,operator`;
const failure=(status,message)=>Object.assign(new Error(message),{status});
function quantity(value){
 if(typeof value!=='string'&&typeof value!=='number')throw failure(400,'هر دو وزن خروجی و باقیمانده باید اندازه‌گیری و وارد شوند.');
 const text=String(value).trim();
 if(!/^\d{1,13}(\.\d{1,6})?$/.test(text))throw failure(400,'وزن باید نامنفی و حداکثر شش رقم اعشار باشد.');
 return text;
}
function micros(text){
 const [whole,fraction='']=text.split('.');
 return BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0'));
}
function decimal(mass){
 const abs=mass<0n?-mass:mass;
 return (mass<0n?'-':'')+String(abs/1000000n)+'.'+String(abs%1000000n).padStart(6,'0');
}
function eventInput(data,uuid){
 if(!uuid.test(data.requestId)||!Number.isSafeInteger(data.version)||data.version<0||!['start','record','complete'].includes(data.kind))throw failure(400,'نوع، نسخه یا شناسهٔ عملیات معتبر نیست.');
 const note=data.note==null?'':typeof data.note==='string'?data.note.trim():null;
 if(note===null||note.length>2000||(data.kind==='record'&&!note))throw failure(400,'یادداشت عملیات را بررسی کنید.');
 const input={requestId:data.requestId,version:data.version,kind:data.kind,note};
 if(data.kind==='start'){
  if(!stages.has(data.stage))throw failure(400,'فرایند را انتخاب کنید.');
  input.stage=data.stage;
 }
 if(data.kind==='complete'){
  input.outputMass=quantity(data.outputMass);input.residualMass=quantity(data.residualMass);
  input.outputPurity=data.outputPurity==null||data.outputPurity===''?null:String(data.outputPurity).trim();
  if(input.outputPurity!==null&&(!/^\d{1,4}(\.\d{1,4})?$/.test(input.outputPurity)||Number(input.outputPurity)>1000))throw failure(400,'عیار ثبت‌شده باید بین صفر و هزار باشد.');
 }
 return input;
}

function current(receipt,last){
 return last?{version:last.version,state:last.operator?'active':'ready',stage:last.operator?last.stage:null,
  operator:last.operator,custody:last.custody,availableMass:last.availableMass,currentPurity:last.currentPurity}
 :{version:0,state:'ready',stage:null,operator:null,custody:'behnam',availableMass:receipt.mass,currentPurity:receipt.purity};
}
async function read(client,receiptId){
 // One SQL snapshot includes both the immutable intake and the entire ordered history.
 const result=await client.query(`SELECT r.mass,r.purity,e.* FROM erp_live_receipts r
  LEFT JOIN LATERAL (SELECT ${fields} FROM erp_live_work_events WHERE receipt_id=r.id ORDER BY version) e ON true
  WHERE r.id=$1 ORDER BY e.version`,[receiptId]);
 if(!result.rowCount)throw failure(404,'رسید پیدا نشد.');
 const first=result.rows[0];
 const events=first.version===null?[]:result.rows.map(({mass,purity,...e})=>e);
 return {workflow:current(first,events.at(-1)),events};
}
async function write(pool,id,actor,input){
 const client=await pool.connect();
 const hash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
 try{
  await client.query('BEGIN');
  const receipt=(await client.query('SELECT mass,purity FROM erp_live_receipts WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(!receipt)throw failure(404,'رسید پیدا نشد.');
  const replay=(await client.query('SELECT payload_hash FROM erp_live_work_events WHERE receipt_id=$1 AND actor=$2 AND request_id=$3',[id,actor,input.requestId])).rows[0];
  if(replay){
   if(replay.payload_hash!==hash)throw failure(409,'با این شناسه قبلاً عملیات متفاوتی ثبت شده است.');
  }else{
   const last=(await client.query(`SELECT ${fields} FROM erp_live_work_events WHERE receipt_id=$1 ORDER BY version DESC LIMIT 1`,[id])).rows[0];
   const state=current(receipt,last);
   if(state.version!==input.version)throw failure(409,'شخص دیگری این رسید را به‌روز کرده است. دوباره باز کنید.');
   const starting=input.kind==='start',completing=input.kind==='complete';
   if(starting?state.state!=='ready':state.state!=='active')throw failure(409,'وضعیت فعلی رسید با این عملیات سازگار نیست.');
   if(actor!=='manager'&&(starting?!['behnam',actor].includes(state.custody):state.operator!==actor))throw failure(403,'این عملیات به مسئول دیگری سپرده شده است.');
   if(starting&&micros(state.availableMass)===0n)throw failure(409,'برای شروع، وزن قابل پردازش لازم است.');
   const delta=completing?micros(state.availableMass)-micros(input.outputMass)-micros(input.residualMass):null;
   if(delta!==null&&delta!==0n&&!input.note)throw failure(400,'اختلاف وزن وجود دارد. دلیل یا وضعیت بررسی آن را درج کنید.');
   const custody=starting?actor:state.custody;
   await client.query(`INSERT INTO erp_live_work_events(receipt_id,version,id,request_id,payload_hash,actor,kind,stage,note,
    output_mass,residual_mass,unreconciled_mass,output_purity,available_mass,current_purity,custody,operator)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [id,state.version+1,randomUUID(),input.requestId,hash,actor,input.kind,starting?input.stage:state.stage,input.note,
     input.outputMass??null,input.residualMass??null,delta===null?null:decimal(delta),input.outputPurity??null,
     completing?input.outputMass:state.availableMass,completing?input.outputPurity:state.currentPurity,custody,
     completing?null:starting?actor:state.operator]);
  }
  const data=await read(client,id);
  await client.query('COMMIT');
  return data;
 }catch(error){
  await client.query('ROLLBACK');throw error;
 }finally{client.release();}
}
module.exports={schema,read,write,eventInput};
