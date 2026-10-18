import { CrewError } from './crew-store.mjs';
const routes = new Map([
  ['/crews', 'GET'], ['/crews/create', 'POST'], ['/crews/invite', 'POST'],
  ['/crews/join', 'POST'], ['/crews/leave', 'POST'],
]);
function readBody(req) {
  return new Promise((resolve, reject) => {
    let bytes = 0, chunks = [], finished = false;
    const finish = (err, value) => {
      if (finished) return; finished = true; clearTimeout(timer);
      req.off('data', data); req.off('end', end); req.off('aborted', aborted);
      if (err) { req.resume(); reject(err); } else resolve(value);
    };
    const data = chunk => {
      bytes += chunk.length;
      if (bytes > 512) finish(new CrewError(413, 'Request is too large.'));
      else chunks.push(chunk);
    };
    const end = () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
        if (!body || Array.isArray(body) || typeof body !== 'object') throw Error();
        finish(null, body);
      } catch { finish(new CrewError(400, 'Invalid request.')); }
    };
    const aborted = () => finish(new CrewError(400, 'Request interrupted.'));
    const timer = setTimeout(() => finish(new CrewError(408, 'Request timed out.')), 5000);
    req.on('data', data); req.once('end', end); req.once('aborted', aborted);
  });
}
// Optional HTTP module. Without a configured store, the existing match server exposes no crew API.
export function createCrewApi({ store, origins, now = Date.now }) {
  const limits = new Map();
  return async function crewApi(req, res) {
    if (!req.url.startsWith('/crews')) return false;
    const origin = req.headers.origin;
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
    const send = (status, value) => {
      if (res.destroyed) return;
      res.writeHead(status, { ...headers, ...(status >= 400 ? { Connection: 'close' } : {}) });
      res.end(JSON.stringify(value));
    };
    if (!origins.includes(origin)) { send(403, { error: 'Game origin not allowed.' }); return true; }
    headers['Access-Control-Allow-Origin'] = origin;
    if (!routes.has(req.url)) { send(404, { error: 'Unknown garage route.' }); return true; }
    if (req.method === 'OPTIONS') {
      headers['Access-Control-Allow-Methods'] = routes.get(req.url);
      headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
      send(204); return true;
    }
    if (routes.get(req.url) !== req.method) { send(405, { error: 'Method not allowed.' }); return true; }
    const time = now(), address = req.socket.remoteAddress;
    for (const [key, value] of limits) if (value.until <= time) limits.delete(key);
    let limit = limits.get(address);
    if (!limit) {
      if (limits.size >= 1000) { send(429,{ error: 'Garage is busy. Try later.' }); return true; }
      limits.set(address, limit = { until: time + 60000, count: 0 });
    }
    if (++limit.count > 20) { headers['Retry-After'] = '60'; send(429, { error: 'Try again in a minute.' }); return true; }
    try {
      const bearer = req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_.-]{1,8192})$/);
      if (!bearer) throw new CrewError(401, 'Sign in to open your crew.');
      if (req.method === 'POST' && req.headers['content-type']?.split(';')[0].trim() !== 'application/json')
        throw new CrewError(415, 'Send JSON to the garage.');
      const account = await store.authenticate(bearer[1]);
      const body = req.method === 'POST' ? await readBody(req) : {};
      const allowedKeys = req.url === '/crews/create' ? ['name'] : req.url === '/crews/join' ? ['code'] : [];
      if (Object.keys(body).some(key => !allowedKeys.includes(key))) throw new CrewError(400, 'Invalid request fields.');
      let result;
      if (req.url === '/crews') result = { crew: await store.get(account) };
      else if (req.url === '/crews/create') result = { crew: await store.create(account, body.name) };
      else if (req.url === '/crews/join') result = { crew: await store.join(account, body.code) };
      else if (req.url === '/crews/invite') result = await store.invite(account);
      else result = await store.leave(account);
      send(200, result);
    } catch (error) {
      send(error instanceof CrewError ? error.status : 503,
        { error: error instanceof CrewError ? error.message : 'Garage is temporarily unavailable. Try again.' });
    }
    return true;
  };
}
