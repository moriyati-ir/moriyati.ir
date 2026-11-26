'use strict';

const maxBytes = 24 * 1024 * 1024;
const schema = `
CREATE TABLE IF NOT EXISTS erp_person_files (
 owner_id text NOT NULL REFERENCES erp_people(user_id),
 path text NOT NULL,
 parent text NOT NULL,
 name text NOT NULL,
 is_dir boolean NOT NULL,
 content bytea,
 mime text,
 favorite boolean NOT NULL DEFAULT false,
 shared boolean NOT NULL DEFAULT false,
 opened_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(owner_id, path),
 CHECK(is_dir = (content IS NULL)),
 CHECK(octet_length(content) <= ${maxBytes})
);
CREATE INDEX IF NOT EXISTS erp_person_files_folder ON erp_person_files(owner_id, parent);
`;
const problem = (status, message) => Object.assign(new Error(message), {status});
const missing = () => problem(404, 'فایل یا پوشه پیدا نشد.');
const conflict = () => problem(409, 'این نام قبلاً در پوشه ثبت شده است.');

function filePath(input, allowRoot = false) {
 if (typeof input !== 'string') throw problem(400, 'مسیر فایل معتبر نیست.');
 const path = input.normalize('NFC');
 if (allowRoot && path === '') return {path, parent:'', name:''};
 const parts = path.split('/');
 if (Buffer.byteLength(path) > 1400 || parts.length > 30 || parts.some(name =>
  !name.trim() || name === '.' || name === '..' || Buffer.byteLength(name) > 240 ||
  /[\\\x00-\x1f\x7f]/u.test(name))) throw problem(400, 'نام فایل یا پوشه معتبر نیست.');
 return {path, name:parts.at(-1), parent:parts.slice(0, -1).join('/')};
}
async function readFile(req) {
 if (Number(req.headers['content-length']) > maxBytes) throw problem(413, 'حداکثر اندازهٔ فایل ۲۴ مگابایت است.');
 let size = 0;
 const chunks = [];
 for await (const chunk of req) {
  size += chunk.length;
  if (size > maxBytes) throw problem(413, 'حداکثر اندازهٔ فایل ۲۴ مگابایت است.');
  chunks.push(chunk);
 }
 return Buffer.concat(chunks, size);
}
async function checkFolder(db, owner, path) {
 if (path === '') return;
 const result = await db.query('SELECT 1 FROM erp_person_files WHERE owner_id=$1 AND path=$2 AND is_dir', [owner,path]);
 if (!result.rowCount) throw missing();
}
const fields = 'path, name, is_dir AS dir';
async function handle(db, req, res, person, pathname, json, readInput) {
 const owner = person.userId;
 if (req.headers['x-moriyati-actor'] !== owner) throw problem(403, 'حساب فعال تغییر کرده است. فایل‌ها را دوباره باز کنید.');
 const search = new URL(req.url, 'http://localhost').searchParams;
 const op = pathname.slice('/api/live/files/'.length);
 if (req.method === 'GET' && op === 'list') {
  const {path} = filePath(search.get('path'), true);
  await checkFolder(db, owner, path);
  const result = await db.query(`SELECT ${fields} FROM erp_person_files WHERE owner_id=$1 AND parent=$2 ORDER BY is_dir DESC, name`, [owner,path]);
  return json(res, 200, {entries:result.rows});
 }
 if (req.method === 'GET' && op === 'marks') {
  const selects = [
   ['favorites', 'favorite', 'name'],
   ['recent', 'opened_at IS NOT NULL', 'opened_at DESC'],
   ['shared', 'shared', 'created_at DESC']
  ];
  const out = {};
  for (const [key, predicate, order] of selects) {
   out[key] = (await db.query(`SELECT ${fields} FROM erp_person_files WHERE owner_id=$1 AND ${predicate} ORDER BY ${order} LIMIT 100`, [owner])).rows;
  }
  return json(res, 200, out);
 }
 if (req.method === 'GET' && op === 'content') {
  const {path} = filePath(search.get('path'));
  const result = await db.query(`UPDATE erp_person_files SET opened_at=now() WHERE owner_id=$1 AND path=$2 AND NOT is_dir RETURNING name,mime,content`, [owner,path]);
  const entry = result.rows[0];
  if (!entry) throw missing();
  res.writeHead(200, {
   'Content-Type':entry.mime, 'Content-Length':entry.content.length, 'Cache-Control':'private, no-store',
   'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(entry.name).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16)),
   'Content-Security-Policy':"sandbox; default-src 'none'", 'X-Content-Type-Options':'nosniff'
  });
  return res.end(entry.content);
 }
 if (req.method !== 'POST') throw missing();
 if (op === 'favorite') {
  const {path} = filePath((await readInput(req)).path);
  const result = await db.query('UPDATE erp_person_files SET favorite=NOT favorite WHERE owner_id=$1 AND path=$2 AND is_dir', [owner,path]);
  if (!result.rowCount) throw missing();
  return json(res, 200, {ok:true});
 }
 if (op === 'upload' || op === 'mkdir') {
  const dir = op === 'mkdir';
  const {path, parent, name} = filePath(dir ? (await readInput(req)).path : search.get('path'));
  await checkFolder(db, owner, parent);
  const content = dir ? null : await readFile(req);
  const type = String(req.headers['content-type'] || '').split(';')[0];
  const mime = !dir && /^[\w.+-]+\/[\w.+-]+$/.test(type) ? type.slice(0,120) : 'application/octet-stream';
  const result = await db.query(`INSERT INTO erp_person_files(owner_id,path,parent,name,is_dir,content,mime,shared)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(owner_id,path) DO NOTHING`,
   [owner,path,parent,name,dir,content,mime,!dir && search.get('shared') === '1']);
  if (!result.rowCount) throw conflict();
  return json(res, 201, {ok:true});
 }
 if (op === 'move') {
  const input = await readInput(req);
  const source = filePath(input.path), target = filePath(input.to);
  await checkFolder(db, owner, target.parent);
  try {
   const result = await db.query('UPDATE erp_person_files SET path=$3,parent=$4,name=$5 WHERE owner_id=$1 AND path=$2 AND NOT is_dir',
    [owner,source.path,target.path,target.parent,target.name]);
   if (!result.rowCount) throw missing();
  } catch (error) {
   if (error.code === '23505') throw conflict();
   throw error;
  }
  return json(res, 200, {ok:true});
 }
 throw missing();
}
module.exports = {schema, handle, filePath, maxBytes};
