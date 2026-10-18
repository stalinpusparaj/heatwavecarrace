import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomInt } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createMatch, addPlayer, setInput, ready, step, snapshot, RULES, STEP } from './simulation.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
export function createConvoyServer({ origins = [], maxRooms = 64, now = () => performance.now() } = {}) {
  const rooms = new Map(), addresses = new Map();
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ status: 'ok', rules: RULES })); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    try {
      const route = decodeURIComponent(new URL(req.url, 'http://local').pathname);
      const file = path.resolve(root, '.' + (route === '/' ? '/index.html' : route));
      if (!file.startsWith(root) || route.includes('\0')) throw Error();
      const bytes = await readFile(file);
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024, perMessageDeflate: false });
  server.on('upgrade', (req, socket, head) => {
    const origin = req.headers.origin;
    const hostOrigin = `http://${req.headers.host}`;
    if (req.url !== '/convoy' || !origin || !(origins.includes(origin) || origins.length === 0 && origin === hostOrigin)) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
    }
    const address = req.socket.remoteAddress;
    if ((addresses.get(address) || 0) >= 8) { socket.end('HTTP/1.1 429 Too Many Requests\r\n\r\n'); return; }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  });
  const send = (ws, data) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > 65536) { ws.terminate(); return; }
    ws.send(JSON.stringify(data));
  };
  wss.on('connection', (ws, req) => {
    const address = req.socket.remoteAddress;
    addresses.set(address, (addresses.get(address) || 0) + 1);
    let room, slot, messages = 0, rateStart = now(), bound = false;
    ws.alive = true;
    ws.on('pong', () => { ws.alive = true; });
    ws.on('error', () => {});
    ws.on('message', data => {
      try {
        if (now() - rateStart > 1000) { rateStart = now(); messages = 0; }
        if (++messages > 25) { ws.close(1008, 'Too many messages'); return; }
        const msg = JSON.parse(data.toString());
        if (!msg || Array.isArray(msg)) throw Error('Invalid message.');
        if (!bound) {
          if (msg.rules !== RULES) throw Error('Game version mismatch. Reload both games.');
          if (msg.type === 'create') {
            if (rooms.size >= maxRooms) throw Error('Server is full. Try again later.');
            let code;
            do { code = randomBytes(4).toString('hex').toUpperCase(); } while (rooms.has(code));
            room = { code, match: createMatch(randomInt(1, 4294967295)), seats: [], created: now(), ended: 0 };
            rooms.set(code, room); slot = addPlayer(room.match).id;
          } else if (msg.type === 'join' && /^[A-F0-9]{8}$/.test(msg.code)) {
            room = rooms.get(msg.code);
            if (!room || room.match.phase !== 'lobby' || room.seats.length >= 2) throw Error('Room not found, full or already started.');
            slot = addPlayer(room.match).id;
          } else if (msg.type === 'reconnect' && /^[A-F0-9]{8}$/.test(msg.code) && typeof msg.token === 'string') {
            room = rooms.get(msg.code);
            slot = room?.seats.findIndex(s => s.token === msg.token);
            if (!room || slot === undefined || slot < 0 || room.match.phase === 'lost' || room.match.phase === 'won' || room.match.players[slot].missing > 10) throw Error('Reconnect expired. Create another convoy.');
            room.seats[slot].ws?.close(1000, 'Reconnected elsewhere');
          } else throw Error('Create or join a room first.');
          const seat = room.seats[slot] || { token: randomBytes(24).toString('hex') };
          seat.ws = ws; room.seats[slot] = seat; room.match.players[slot].connected = true;
          room.match.players[slot].missing = 0;
          bound = true;
          send(ws, { type: 'welcome', rules: RULES, code: room.code, id: slot, token: seat.token,
            obstacles: room.match.obstacles, state: snapshot(room.match) });
          return;
        }
        if (room.seats[slot].ws !== ws) return;
        const p = room.match.players[slot];
        if (msg.type === 'ready') ready(room.match, slot);
        else if (msg.type === 'input') { if (!setInput(p, msg)) throw Error('Invalid or stale input.'); }
        else if (msg.type === 'leave') { ws.close(1000, 'Left convoy'); }
        else throw Error('Unknown message.');
      } catch (e) { send(ws, { type: 'error', message: e.message || 'Invalid message.' }); }
    });
    ws.on('close', () => {
      addresses.set(address, Math.max(0, (addresses.get(address) || 1) - 1));
      if (!addresses.get(address)) addresses.delete(address);
      if (room && bound && room.seats[slot]?.ws === ws) {
        room.seats[slot].ws = null; room.match.players[slot].connected = false;
        room.match.players[slot].input.age = 10;
      }
    });
    const authenticateTimer = setTimeout(() => { if (!bound) ws.close(1008, 'Join timeout'); }, 10000);
    authenticateTimer.unref(); ws.on('close', () => clearTimeout(authenticateTimer));
  });
  let last = now(), accumulator = 0, broadcast = 0;
  const timer = setInterval(() => {
    const current = now(); accumulator += Math.min(.25, (current - last) / 1000); last = current;
    while (accumulator >= STEP) {
      for (const room of rooms.values()) step(room.match);
      accumulator -= STEP;
    }
    if (current - broadcast < 1000 / 15) return;
    broadcast = current;
    for (const [code, room] of rooms) {
      if (['won', 'lost'].includes(room.match.phase) && !room.ended) room.ended = current;
      if (current - room.created > 600000 || room.ended && current - room.ended > 30000) {
        for (const seat of room.seats) seat.ws?.close(1000, 'Room expired');
        rooms.delete(code); continue;
      }
      const state = { type: 'state', ...snapshot(room.match) };
      for (const seat of room.seats) if (seat.ws) send(seat.ws, state);
    }
  }, 1000 / 30);
  const heartbeat = setInterval(() => { for (const ws of wss.clients) {
    if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping();
  } }, 5000);
  const close = async () => { clearInterval(timer); clearInterval(heartbeat);
    for (const ws of wss.clients) ws.terminate();
    await new Promise(resolve => wss.close(resolve));
    await new Promise(resolve => server.close(resolve));
  };
  return { server, rooms, close };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4180), host = process.env.HOST || '127.0.0.1';
  const app = createConvoyServer({ origins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean) });
  app.server.listen(port, host, () => console.log(`RUNROAD Convoy Escape: http://${host}:${port}`));
  process.on('SIGTERM', () => app.close()); process.on('SIGINT', () => app.close());
}
