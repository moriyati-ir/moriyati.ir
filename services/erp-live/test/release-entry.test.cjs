const test = require('node:test');
const assert = require('node:assert/strict');
const {execFileSync, spawn} = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {once} = require('node:events');

test('Liara serves the full live workspace on the domain and common bookmarks', async t => {
  const root = path.resolve(__dirname, '../../..');
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'moriyati-release-'));
  t.after(() => fs.rm(tmp, {recursive:true, force:true}));
  const dest = path.join(tmp, 'app.zip');
  execFileSync('python3', [path.join(root, 'scripts/package-erp-live.py'), dest]);
  execFileSync('python3', ['-m', 'zipfile', '-e', dest, tmp]);
  const child = spawn(process.execPath, ['-e', [
    "const http = require('node:http');",
    'const listen = http.Server.prototype.listen;',
    'http.Server.prototype.listen = function() {',
    "  return listen.call(this, 0, '127.0.0.1', () => process.stdout.write(String(this.address().port)));",
    '};',
    "require('./server.cjs');"
  ].join('\n')], {cwd:tmp, env:{...process.env, NODE_PATH:path.join(root,'services/erp-live/node_modules')}, stdio:['ignore','pipe','inherit']});
  t.after(async () => {if (child.exitCode === null) {const exit=once(child,'exit'); child.kill(); await exit;}});
  const ready = await Promise.race([
    once(child.stdout, 'data'),
    once(child, 'exit').then(() => {throw new Error('Packaged server exited before listening');})
  ]);
  const origin = 'http://127.0.0.1:' + ready[0].toString();
  for (const route of ['/', '/erp/', '/preview/', '/index.html?device=phone']) {
    const reply = await fetch(origin + route);
    assert.equal(reply.status, 200);
    const html = await reply.text();
    assert.match(html, /name="moriyati-environment" content="live"/);
    assert.match(html, /type="module" src="\.\/app\.mjs/);
    assert.doesNotMatch(html, /Workspace Preview|\/live\/live\.js/);
  }
  const preview = await fs.readFile(path.join(root,'dist/erp/index.html'), 'utf8');
  assert.doesNotMatch(preview, /name="moriyati-environment" content="live"/);
  for (const asset of ['/app.mjs','/live-workspace.mjs','/app.css','/assets/Vazirmatn.woff2','/visuals/process/receive.webp']) {
    const reply = await fetch(origin + asset);
    assert.equal(reply.status, 200, asset);
  }
});
