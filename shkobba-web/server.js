// Shkobba web server: serves the game and relays messages between the host and the guests.
// No dependencies. Run:  node server.js   (optional: PORT=3000 node server.js)
const http = require('http'), crypto = require('crypto'), fs = require('fs'), os = require('os'), path = require('path');
const PORT = +process.env.PORT || 8080;
const page = () => fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
let host = null, nextId = 1;
const clients = new Map();

function lanIp() {
  let any = null;
  for (const list of Object.values(os.networkInterfaces()))
    for (const a of list || [])
      if (a.family === 'IPv4' && !a.internal) {
        if (/^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(a.address)) return a.address;
        any = any || a.address;
      }
  return any;
}

const server = http.createServer((req, res) => {
  const plain = { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' };
  if (req.url === '/status') { res.writeHead(200, plain); return res.end(host ? '1' : '0'); }
  if (req.url === '/lan') {
    res.writeHead(200, plain);
    const h = req.headers.host || '';
    return res.end(/^(localhost|127\.|\[::1\])/.test(h) ? (lanIp() || 'localhost') + ':' + PORT : h);
  }
  if (req.url.startsWith('/favicon')) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(page());
});

function parse(c) {
  const b = c.buf;
  if (b.length < 2) return null;
  const op = b[0] & 15, masked = (b[1] & 128) !== 0;
  let len = b[1] & 127, off = 2;
  if (len === 126) { if (b.length < 4) return null; len = b.readUInt16BE(2); off = 4; }
  else if (len === 127) { if (b.length < 10) return null; len = Number(b.readBigUInt64BE(2)); off = 10; }
  const start = off + (masked ? 4 : 0), need = start + len;
  if (b.length < need) return null;
  const data = Buffer.from(b.subarray(start, need));
  if (masked) { const m = b.subarray(off, off + 4); for (let i = 0; i < data.length; i++) data[i] ^= m[i & 3]; }
  c.buf = b.subarray(need);
  return { op, data };
}
function send(c, op, buf) {
  const n = buf.length; let h;
  if (n < 126) h = Buffer.from([0x80 | op, n]);
  else if (n < 65536) { h = Buffer.alloc(4); h[0] = 0x80 | op; h[1] = 126; h.writeUInt16BE(n, 2); }
  else { h = Buffer.alloc(10); h[0] = 0x80 | op; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); }
  if (!c.sock.destroyed) c.sock.write(Buffer.concat([h, buf]));
}
const text = (c, s) => send(c, 1, Buffer.from(s, 'utf8'));

function route(c, m) {
  if (m === 'HOST') { if (!host) { host = c; c.host = true; text(c, 'OK'); } else text(c, 'BUSY'); return; }
  if (m === 'JOIN') {
    if (!host) return text(c, 'NOHOST');
    c.id = nextId++; clients.set(c.id, c);
    text(host, 'J|' + c.id); text(c, 'OK'); return;
  }
  if (c.host) {
    if (m.startsWith('B|')) { const p = m.slice(2); clients.forEach(x => text(x, p)); }
    else if (m.startsWith('S|')) {
      const i = m.indexOf('|', 2), x = i > 0 && clients.get(+m.slice(2, i));
      if (x) text(x, m.slice(i + 1));
    }
  } else if (c.id && host) text(host, 'M|' + c.id + '|' + m);
}
function drop(c) {
  if (c.gone) return; c.gone = true;
  if (c === host) { host = null; clients.forEach(x => x.sock.destroy()); clients.clear(); nextId = 1; }
  else if (c.id) { clients.delete(c.id); if (host) text(host, 'L|' + c.id); }
}

server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) return sock.destroy();
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n');
  sock.setNoDelay(true);
  const c = { sock, id: 0, host: false, buf: Buffer.alloc(0), gone: false };
  sock.on('data', d => {
    c.buf = Buffer.concat([c.buf, d]);
    let f;
    while ((f = parse(c)) !== null) {
      if (f.op === 8) return sock.end();
      if (f.op === 9) send(c, 10, f.data);
      else if (f.op === 1 || f.op === 0) route(c, f.data.toString('utf8'));
    }
  });
  sock.on('close', () => drop(c));
  sock.on('error', () => sock.destroy());
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = lanIp();
  console.log('\n  Shkobba is running!\n');
  console.log('  On this computer:      http://localhost:' + PORT);
  if (ip) console.log('  Friends on your Wi-Fi: http://' + ip + ':' + PORT);
  console.log('\n  Open it, tap "Host a game", and have your friends open the Wi-Fi address.\n');
});
