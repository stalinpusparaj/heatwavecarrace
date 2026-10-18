import { createHash, randomBytes } from 'node:crypto';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export class CrewError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const hash = token => createHash('sha256').update(token).digest('hex');
// Credentials remain inside this server-only closure. Never pass raw provider errors to clients.
export function createCrewStore({ url, secretKey, fetchImpl = fetch }) {
  const base = new URL(url);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash ||
      base.pathname !== '/' || !secretKey) throw new Error('Invalid crew database configuration');
  async function request(route, options, auth) {
    let res;
    try {
      res = await fetchImpl(new URL(route, base), { ...options, redirect: 'error',
        headers: { apikey: secretKey, ...(auth ? { Authorization: `Bearer ${auth}` } : {}), 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(7000) });
    } catch { throw new CrewError(503, 'Garage is temporarily unavailable. Try again.'); }
    if (!res.ok) {
      if (route === '/auth/v1/user' && [401,403].includes(res.status))
        throw new CrewError(401, 'Sign in again to open your crew.');
      // Only whitelisted domain errors are surfaced; no SQL, identifiers or provider diagnostics.
      let body; try { body = await res.json(); } catch {}
      if (body?.code === '23505') throw new CrewError(409, 'Leave your current crew first.');
      if (body?.code === 'P0001' && ['Crew is full','Invite unavailable','Crew membership required','Invalid crew name'].includes(body.message))
        throw new CrewError(409, body.message);
      throw new CrewError(503, 'Garage is temporarily unavailable. Try again.');
    }
    try { return await res.json(); } catch { throw new CrewError(503, 'Invalid garage response. Try again.'); }
  }
  const rpc = (name, body) => request(`/rest/v1/rpc/runroad_${name}`, { method: 'POST', body: JSON.stringify(body) });
  function account(id) { if (!UUID.test(id)) throw new CrewError(401, 'Sign in to open your crew.'); }
  return {
    async authenticate(token) {
      if (typeof token !== 'string' || token.length > 8192 || !/^[A-Za-z0-9_.-]+$/.test(token))
        throw new CrewError(401, 'Sign in to open your crew.');
      const user = await request('/auth/v1/user', { method: 'GET' }, token);
      account(user?.id);
      // Guest accounts cannot reserve crew slots or earn persistent rewards.
      if (user.is_anonymous || !user.email_confirmed_at) throw new CrewError(403, 'Verify your email before joining a crew.');
      return user.id;
    },
    async get(id) { account(id); return rpc('get_crew', { p_account: id }); },
    async create(id, name) {
      account(id);
      if (typeof name !== 'string' || !/^[\p{L}\p{N} '\-]{3,24}$/u.test(name.trim()))
        throw new CrewError(400, 'Use 3–24 letters, numbers, spaces, apostrophes or hyphens.');
      return rpc('create_crew', { p_account: id, p_name: name.trim() });
    },
    async invite(id) {
      account(id); const code = randomBytes(16).toString('hex');
      const expiresAt = await rpc('invite_crew', { p_account: id, p_hash: hash(code) });
      return { code, expiresAt };
    },
    async join(id, code) {
      account(id);
      if (typeof code !== 'string' || !/^[a-f0-9]{32}$/i.test(code)) throw new CrewError(400, 'Enter a valid crew invite.');
      return rpc('join_crew', { p_account: id, p_hash: hash(code.toLowerCase()) });
    },
    async leave(id) { account(id); await rpc('leave_crew', { p_account: id }); return { left: true }; },
  };
}
