'use strict';
const {createHash,randomBytes,scrypt,timingSafeEqual}=require('node:crypto');
const {promisify}=require('node:util');
const derive=promisify(scrypt);
const lifetimeSeconds=30*24*3600, maxAttempts=5;
const name='__Host-mori-device';
const schema=`
 CREATE TABLE IF NOT EXISTS erp_live_device_pins(
  device_hash text PRIMARY KEY, account_id text NOT NULL,
  credential_hash text NOT NULL, pin_digest bytea NOT NULL,
  failures integer NOT NULL DEFAULT 0 CHECK(failures>=0), expires_at timestamptz NOT NULL
 );
 CREATE INDEX IF NOT EXISTS erp_live_device_pins_expiry ON erp_live_device_pins(expires_at);`;
function digest(value){return createHash('sha256').update(value).digest('hex');}
function normalized(pin){
 if(typeof pin!=='string')return '';
 return pin.trim().replace(/[۰-۹]/g,d=>d.charCodeAt(0)-1776).replace(/[٠-٩]/g,d=>d.charCodeAt(0)-1632);
}
function tokenFrom(req){
 return (req.headers.cookie||'').match(/(?:^|;\s*)__Host-mori-device=([a-f0-9]{64})(?:;|$)/)?.[1];
}
function setGrant(res,token){
 res.appendHeader('Set-Cookie',`${name}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${token?lifetimeSeconds:0}`);
}
// The random device secret is held only by the enrolled browser. The DB stores its
// lookup hash, so a leaked table alone cannot be used to guess four-digit PINs.
function pinDigest(pin,token){return derive('moriyati-device-pin-v1:'+pin,Buffer.from(token,'hex'),32);}
async function hasPin(db,req,accountId,credentialVersion){
 const token=tokenFrom(req);
 if(!token||!accountId||!credentialVersion)return false;
 const r=await db.query('SELECT 1 FROM erp_live_device_pins WHERE device_hash=$1 AND account_id=$2 AND credential_hash=$3 AND failures<$4 AND expires_at>now()',
  [digest(token),accountId,digest(credentialVersion),maxAttempts]);
 return r.rowCount===1;
}
async function enroll(db,req,res,accountId,credentialVersion,input){
 const pin=normalized(input);
 if(!/^\d{4,8}$/.test(pin))throw Object.assign(new Error('رمز کوتاه باید بین ۴ تا ۸ رقم باشد.'),{status:400});
 if(!accountId||!credentialVersion)throw Object.assign(new Error('ابتدا وارد حساب شوید.'),{status:401});
 const token=randomBytes(32).toString('hex'), hash=await pinDigest(pin,token);
 const old=tokenFrom(req);
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  await client.query('DELETE FROM erp_live_device_pins WHERE expires_at<=now() OR device_hash=$1',[old?digest(old):null]);
  await client.query("INSERT INTO erp_live_device_pins(device_hash,account_id,credential_hash,pin_digest,expires_at) VALUES($1,$2,$3,$4,now()+$5*interval '1 second')",
   [digest(token),accountId,digest(credentialVersion),hash,lifetimeSeconds]);
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 setGrant(res,token);
 return {enabled:true};
}
async function verify(db,req,accountId,credentialVersion,input){
 const token=tokenFrom(req),pin=normalized(input);
 if(!token||!accountId||!credentialVersion||!/^\d{4,8}$/.test(pin))return false;
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  const selector=[digest(token),accountId,digest(credentialVersion),maxAttempts];
  const grant=(await client.query('SELECT pin_digest FROM erp_live_device_pins WHERE device_hash=$1 AND account_id=$2 AND credential_hash=$3 AND failures<$4 AND expires_at>now() FOR UPDATE',selector)).rows[0];
  let valid=false;
  if(grant){
   valid=timingSafeEqual(grant.pin_digest,await pinDigest(pin,token));
   await client.query('UPDATE erp_live_device_pins SET failures=CASE WHEN $2 THEN 0 ELSE failures+1 END WHERE device_hash=$1',[selector[0],valid]);
  }
  await client.query('COMMIT');
  return valid;
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
async function revoke(db,req,res,accountId){
 const token=tokenFrom(req);
 if(token)await db.query('DELETE FROM erp_live_device_pins WHERE device_hash=$1 AND account_id=$2',[digest(token),accountId]);
 setGrant(res,'');return {enabled:false};
}
module.exports={schema,hasPin,enroll,verify,revoke};
