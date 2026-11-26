'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const handleLiveApi = require('./live/api.cjs');

const staticRoots = [
  ['/live/', path.join(__dirname, 'live', 'public')],
  ['/assets/', path.join(__dirname, 'assets')],
  ['/', path.join(__dirname, 'erp')],
];
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

async function route(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.includes('\0')) throw Error();
  } catch {
    res.writeHead(400).end();
    return;
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  if (pathname.startsWith('/api/live/')) {
    res.setHeader('Cache-Control', 'no-store');
    await handleLiveApi(req, res);
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {Allow: 'GET, HEAD'}).end();
    return;
  }
  // Keep links sent during the GitHub preview period inside the live workspace.
  const previousMount = pathname.match(/^\/(erp|preview)(?:\/(.*))?$/);
  if (previousMount) {
    const target = new URL(req.url, 'http://localhost');
    const rest = previousMount[2] || '';
    const destination = rest && !['index.html','review.html'].includes(rest) ? '/' + rest : '/';
    if (destination.startsWith('//') || /[\\\r\n]/.test(destination)) {
      res.writeHead(400).end();
      return;
    }
    res.writeHead(302, {Location:encodeURI(destination) + target.search, 'Cache-Control':'no-store'}).end();
    return;
  }
  if (pathname === '/live' || pathname === '/review.html') {
    res.writeHead(302, {Location:'/', 'Cache-Control':'no-store'}).end();
    return;
  }
  const mount = staticRoots.find(([prefix]) => pathname.startsWith(prefix));
  if (!mount) {
    res.writeHead(404).end();
    return;
  }
  const [prefix, root] = mount;
  const suffix = pathname.slice(prefix.length) || 'index.html';
  const filename = path.resolve(root, suffix);
  if (!filename.startsWith(root + path.sep)) {
    res.writeHead(404).end();
    return;
  }
  let file;
  try {
    file = await fs.promises.open(filename, 'r');
    const info = await file.stat();
    if (!info.isFile()) {
      await file.close();
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(filename)] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-cache',
    });
    if (req.method === 'HEAD') {
      await file.close();
      res.end();
      return;
    }
    const stream = file.createReadStream();
    res.on('close', () => stream.destroy());
    stream.on('error', () => res.destroy()).pipe(res);
  } catch (error) {
    if (file) await file.close().catch(() => {});
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
    res.writeHead(404).end();
  }
}

http.createServer((req, res) => {
  route(req, res).catch(() => {
    if (res.headersSent) res.destroy();
    else res.writeHead(500).end();
  });
}).listen(Number(process.env.PORT || 3000), '0.0.0.0');
