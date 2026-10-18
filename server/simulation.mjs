// Authoritative Convoy Escape simulation. No client positions, HP or rewards are trusted.
export const RULES = 1;
export const STEP = 1 / 30;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const car = (id, x, y, a) => ({ id, x, y, a, vx: 0, vy: 0, hp: 100, inv: 0,
  charge: 50, boost: 0, connected: true, ready: false, missing: 0, stalled: 0,
  rescue: 0, input: { angle: null, boost: false, rescue: false, age: 10, seq: -1 } });

export function createMatch(seed = 1) {
  let rng = seed >>> 0;
  const random = () => ((rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0) / 4294967296);
  const obstacles = [];
  const reserved = [{ x: -60, y: 300 }, { x: 60, y: 300 }, { x: -410, y: -350 },
    { x: 410, y: -350 }, { x: 0, y: 530 }];
  for (let n = 0; n < 500 && obstacles.length < 10; n++) {
    const o = { x: Math.round(random() * 1160 - 580), y: Math.round(random() * 1160 - 580),
      r: Math.round(30 + random() * 25), seed: obstacles.length };
    if (reserved.some(p => distance(p, o) < o.r + 130) ||
        obstacles.some(p => distance(p, o) < p.r + o.r + 85)) continue;
    obstacles.push(o);
  }
  return { rules: RULES, seed, phase: 'lobby', tick: 0, time: 0, countdown: 0,
    reason: '', rescues: 1, players: [], obstacles,
    supplies: [{ x: -410, y: -350, taken: false }, { x: 410, y: -350, taken: false }],
    exit: { x: 0, y: 530, r: 85 }, cops: [], spawn: 0, score: 0 };
}
export function addPlayer(match) {
  if (match.phase !== 'lobby' || match.players.length >= 2) throw Error('Room is full or already racing.');
  const id = match.players.length;
  const p = car(id, id ? 60 : -60, 300, -Math.PI / 2);
  match.players.push(p);
  return p;
}
export function setInput(player, message) {
  if (!Number.isSafeInteger(message.seq) || message.seq < 0 || message.seq <= player.input.seq ||
      !(message.angle === null || Number.isFinite(message.angle) && Math.abs(message.angle) <= Math.PI) ||
      typeof message.boost !== 'boolean' || typeof message.rescue !== 'boolean') return false;
  player.input = { seq: message.seq, angle: message.angle, boost: message.boost,
    rescue: message.rescue, idle: message.idle === true, age: 0 };
  return true;
}
export function ready(match, id) {
  const p = match.players[id];
  if (!p || !p.connected || match.phase !== 'lobby') return;
  p.ready = true;
  if (match.players.length === 2 && match.players.every(p => p.ready && p.connected)) {
    match.phase = 'countdown'; match.countdown = 3;
  }
}
function hurt(p, amount) {
  if (p.hp <= 0 || p.inv > 0) return;
  p.hp = Math.max(0, p.hp - amount); p.inv = .8;
}
function move(m, p, target, speed, turn, dt, police = false) {
  p.a += Math.max(-turn * dt, Math.min(turn * dt, angleDelta(target, p.a)));
  const grip = 1 - Math.exp(-dt * 3.5);
  p.vx += (Math.cos(p.a) * speed - p.vx) * grip;
  p.vy += (Math.sin(p.a) * speed - p.vy) * grip;
  p.x += p.vx * dt; p.y += p.vy * dt;
  for (const o of m.obstacles) {
    const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy), limit = o.r + 16;
    if (d >= limit) continue;
    const nx = d ? dx / d : 1, ny = d ? dy / d : 0;
    const impact = -(p.vx * nx + p.vy * ny);
    p.x = o.x + nx * limit; p.y = o.y + ny * limit;
    p.vx += nx * (Math.max(0, impact) * 1.5 + 45);
    p.vy += ny * (Math.max(0, impact) * 1.5 + 45);
    if (impact > 70) { if (police) p.hp = 0; else hurt(p, impact > 140 ? 14 : 7); }
  }
  if (Math.abs(p.x) > 700 || Math.abs(p.y) > 700) {
    if (Math.abs(p.x) > 700) { p.x = Math.sign(p.x) * 700; p.vx *= -.7; p.a = Math.PI - p.a; }
    if (Math.abs(p.y) > 700) { p.y = Math.sign(p.y) * 700; p.vy *= -.7; p.a = -p.a; }
    if (police) p.hp = 0; else hurt(p, 8);
  }
}
function finish(m, phase, reason) { m.phase = phase; m.reason = reason; }
export function step(m, dt = STEP) {
  if (m.phase === 'won' || m.phase === 'lost') return;
  m.tick++;
  for (const p of m.players) {
    p.input.age += dt;
    if (!p.connected) p.missing += dt; else p.missing = 0;
    if (!p.connected && p.missing > 10) {
      finish(m, 'lost', 'A driver disconnected. Start a new convoy when you are both back.'); return;
    }
  }
  if (m.phase === 'lobby') return;
  if (m.phase === 'countdown') {
    if (!m.players.every(p => p.connected)) return;
    m.countdown = Math.max(0, m.countdown - dt);
    if (m.countdown <= 0) m.phase = 'playing';
    return;
  }
  m.time += dt;
  if (m.time >= 120) { finish(m, 'lost', 'Time ran out. The road home is still waiting.'); return; }
  for (const p of m.players) {
    p.inv = Math.max(0, p.inv - dt);
    p.boost = Math.max(0, p.boost - dt);
    p.charge = Math.min(100, p.charge + dt * 6);
    if (p.hp <= 0) {
      p.vx = p.vy = 0; p.stalled += dt;
      if (p.stalled >= 18) { finish(m, 'lost', 'A driver could not be rescued in time.'); return; }
      continue;
    }
    const inputLive = p.connected && p.input.age < .6 && !p.input.idle;
    if (inputLive && p.input.boost && p.charge >= 40 && p.boost <= 0) { p.charge -= 40; p.boost = 1.5; }
    const target = inputLive && p.input.angle !== null ? p.input.angle : p.a;
    const helping = inputLive && p.input.rescue && m.players.some(q => q.id !== p.id && q.hp <= 0 && distance(p,q) < 95);
    move(m, p, target, inputLive && !helping ? 185 * (p.boost > 0 ? 1.38 : 1) : 0, 3.3, dt);
    for (const supply of m.supplies) if (!supply.taken && distance(p, supply) < 48) {
      supply.taken = true; m.score += 500;
    }
  }
  // One shared rescue: hold near the stalled ally for two seconds. No purchase can replenish it.
  for (const p of m.players) if (p.hp <= 0) {
    const ally = m.players.find(q => q.id !== p.id && q.hp > 0 && q.connected &&
      q.input.age < .6 && q.input.rescue && distance(q, p) < 95);
    p.rescue = ally && m.rescues > 0 ? p.rescue + dt : 0;
    if (p.rescue >= 2) {
      p.hp = 45; p.inv = 3; p.stalled = p.rescue = 0; m.rescues--; m.score += 250;
    }
  }
  if (m.players.every(p => p.hp <= 0)) { finish(m, 'lost', 'Both cars stalled. Try the escape together again.'); return; }
  m.cops = m.cops.filter(c => c.hp > 0);
  m.spawn -= dt;
  if (m.spawn <= 0 && m.cops.length < Math.min(5, 2 + Math.floor(m.time / 25))) {
    const angle = (m.tick * 2.399963) % (Math.PI * 2);
    const c = car(100 + m.tick, Math.cos(angle) * 650, Math.sin(angle) * 650, angle + Math.PI);
    m.cops.push(c); m.spawn = 3;
  }
  for (const c of m.cops) {
    const target = m.players.filter(p => p.hp > 0).sort((a, b) => distance(a, c) - distance(b, c))[0];
    if (!target) break;
    move(m, c, Math.atan2(target.y - c.y, target.x - c.x), 125, 1.65, dt, true);
    if (c.hp <= 0) { m.score += 150; continue; }
    for (const p of m.players) if (p.hp > 0 && distance(p, c) < 33) {
      hurt(p, 9); const a = Math.atan2(c.y - p.y, c.x - p.x);
      c.x = p.x + Math.cos(a) * 36; c.y = p.y + Math.sin(a) * 36;
      c.vx += Math.cos(a) * 70; c.vy += Math.sin(a) * 70;
    }
  }
  for (let i = 0; i < m.cops.length; i++) for (let j = i + 1; j < m.cops.length; j++) {
    const a = m.cops[i], b = m.cops[j];
    if (a.hp > 0 && b.hp > 0 && distance(a, b) < 30 && Math.hypot(a.vx - b.vx, a.vy - b.vy) > 80) {
      a.hp = b.hp = 0; m.score += 300;
    }
  }
  if (m.supplies.every(s => s.taken) && m.players.every(p => p.hp > 0 && p.connected && distance(p, m.exit) < m.exit.r)) {
    m.score += Math.max(0, Math.floor(120 - m.time)) * 10;
    finish(m, 'won', 'Nobody drives home alone. Both drivers made it home.');
  }
}
export function snapshot(m) {
  const pack = p => ({ id: p.id, x: +p.x.toFixed(2), y: +p.y.toFixed(2), a: +p.a.toFixed(3),
    vx: +p.vx.toFixed(1), vy: +p.vy.toFixed(1), hp: p.hp, inv: +p.inv.toFixed(2),
    charge: +p.charge.toFixed(1), boost: +p.boost.toFixed(2), connected: p.connected,
    ready: p.ready, missing: +p.missing.toFixed(1), stalled: +p.stalled.toFixed(1), rescue: +p.rescue.toFixed(1) });
  return { rules: RULES, phase: m.phase, tick: m.tick, time: +m.time.toFixed(2),
    countdown: Math.ceil(m.countdown), reason: m.reason, rescues: m.rescues, score: m.score,
    players: m.players.map(pack), cops: m.cops.filter(c => c.hp > 0).map(pack),
    supplies: m.supplies, exit: m.exit };
}
