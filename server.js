const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT      = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'escala_data.json');

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ scheduleData: {}, usersData: [] }, null, 2));
}

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch(e) { return { scheduleData: {}, usersData: [] }; }
}

function writeData(obj) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, code, obj) {
  cors(res);
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end',  () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }
  if (req.method === 'GET' && url === '/') {
    cors(res); res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('Escala Country API - OK'); return;
  }
  if (req.method === 'GET' && url === '/api/data') { json(res, 200, readData()); return; }
  if (req.method === 'POST' && url === '/api/schedule') {
    try { const body = await readBody(req); const store = readData(); store.scheduleData = body.scheduleData; writeData(store); json(res, 200, { ok: true }); }
    catch(e) { json(res, 400, { ok: false, error: e.message }); }
    return;
  }
  if (req.method === 'POST' && url === '/api/users') {
    try { const body = await readBody(req); const store = readData(); store.usersData = body.usersData; writeData(store); json(res, 200, { ok: true }); }
    catch(e) { json(res, 400, { ok: false, error: e.message }); }
    return;
  }
  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => { console.log(`Escala Country API rodando na porta ${PORT}`); });
