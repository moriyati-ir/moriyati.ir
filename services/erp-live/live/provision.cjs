'use strict';
const {Client}=require('pg');
const {readFileSync}=require('node:fs');
async function provision(){
 const adminUri=readFileSync(0,'utf8').trim();
 const app=new URL(process.env.DATABASE_URL);
 const admin=new URL(adminUri);
 if(app.hostname!==admin.hostname||app.pathname!==admin.pathname||app.username!=='erp_live_app'||!/^[a-f0-9]{64}$/.test(app.password))throw Error('invalid provisioning input');
 const db=new Client({connectionString:adminUri,connectionTimeoutMillis:8000});
 await db.connect();
 try{
  await db.query('BEGIN');
  const existing=await db.query("SELECT rolsuper,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname='erp_live_app'");
  if(!existing.rowCount)await db.query('CREATE ROLE erp_live_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE');
  else if(Object.values(existing.rows[0]).some(Boolean))throw Error('role conflict');
  await db.query("ALTER ROLE erp_live_app PASSWORD '"+app.password+"'");
  await db.query('CREATE SCHEMA IF NOT EXISTS erp_live AUTHORIZATION erp_live_app');
  await db.query('ALTER ROLE erp_live_app SET search_path TO erp_live');
  await db.query('COMMIT');
  console.log('ERP provisioned');
 }finally{await db.end();}
}
provision().catch(e=>{console.error('Provision failed',e.code||'invalid input');process.exitCode=1;});
