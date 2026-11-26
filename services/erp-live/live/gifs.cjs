'use strict';

const {createHash, randomUUID} = require('node:crypto');

const schema = `
 CREATE TABLE IF NOT EXISTS erp_personal_gifs (
  id uuid PRIMARY KEY, owner_id text NOT NULL REFERENCES erp_people(user_id),
  digest text NOT NULL, content bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, digest));
 CREATE INDEX IF NOT EXISTS erp_personal_gifs_owner ON erp_personal_gifs(owner_id, created_at DESC);`;

const prefix = 'data:image/gif;base64,';
const maxBytes = 4 * 1024 * 1024;
const problem = (status,message) => Object.assign(new Error(message),{status});

function gifBytes(value) {
  if (typeof value !== 'string' || !value.startsWith(prefix)) throw problem(400,'فایل گیف معتبر نیست.');
  const encoded = value.slice(prefix.length);
  if (encoded.length > 4 * Math.ceil(maxBytes / 3)) throw problem(413,'حداکثر حجم گیف چهار مگابایت است.');
  const bytes = Buffer.from(encoded,'base64');
  if (bytes.length > maxBytes) throw problem(413,'حداکثر حجم گیف چهار مگابایت است.');
  if (bytes.length < 14 || !['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6)) ||
      !bytes.readUInt16LE(6) || !bytes.readUInt16LE(8) || bytes.toString('base64') !== encoded) {
    throw problem(400,'فایل گیف معتبر نیست.');
  }
  return bytes;
}

async function handleGifs({req,res,pool,actor,route,json,readInput}) {
  if (req.headers['x-moriyati-user'] && req.headers['x-moriyati-user'] !== actor) {
    throw problem(409,'حساب فعال تغییر کرده است. صفحه را دوباره باز کنید.');
  }
  if (route === '/gifs' && req.method === 'GET') {
    const {rows} = await pool.query('SELECT id FROM erp_personal_gifs WHERE owner_id=$1 ORDER BY created_at DESC,id',[actor]);
    return json(res,200,{items:rows});
  }
  if (route === '/gifs' && req.method === 'POST') {
    const {gif} = await readInput(req, 4 * Math.ceil(maxBytes / 3) + 512);
    const bytes = gifBytes(gif);
    const digest = createHash('sha256').update(bytes).digest('hex');
    const result = await pool.query(`INSERT INTO erp_personal_gifs (id,owner_id,digest,content)
      VALUES ($1,$2,$3,$4) ON CONFLICT (owner_id,digest) DO UPDATE SET digest=EXCLUDED.digest
      RETURNING id`,[randomUUID(),actor,digest,bytes]);
    return json(res,200,result.rows[0]);
  }
  const item = route.match(/^\/gifs\/([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})$/i);
  if (item && req.method === 'GET') {
    const {rows} = await pool.query('SELECT content FROM erp_personal_gifs WHERE owner_id=$1 AND id=$2',[actor,item[1]]);
    if (rows.length) {
      res.writeHead(200,{'Content-Type':'image/gif','Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"});
      return res.end(rows[0].content);
    }
  }
  throw problem(404,'گیف پیدا نشد.');
}
module.exports = {schema,handleGifs,gifBytes};
