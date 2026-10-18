// Called only with the authoritative simulation, never with a client snapshot.
// Persistence must atomically deduplicate (crew_id, match_id) before applying it.
export const GARAGE_STAGES = Object.freeze([
  Object.freeze({ wins: 0, name: 'The abandoned garage' }),
  Object.freeze({ wins: 5, name: 'Lights back on' }),
  Object.freeze({ wins: 15, name: 'Doors open' }),
  Object.freeze({ wins: 30, name: 'A place to come home' }),
]);
export function garageStage(wins) {
  if (!Number.isSafeInteger(wins) || wins < 0) throw new TypeError('Invalid wins');
  return GARAGE_STAGES.filter(stage => wins >= stage.wins).at(-1);
}
export function crewContribution(matchId, match, accountIds) {
  if (!/^[a-f0-9]{32}$/.test(matchId)) throw new TypeError('Invalid match ID');
  if (!Array.isArray(accountIds) || accountIds.length !== 2 ||
      new Set(accountIds).size !== 2 || accountIds.some(id =>
        typeof id !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id))) {
    throw new TypeError('Two authenticated accounts required');
  }
  if (match.phase !== 'won') return null;
  if (match.players.length !== 2 || !match.players.every(p => p.hp > 0 && p.connected) ||
      match.supplies.length !== 2 || !match.supplies.every(s => s.taken) ||
      !Number.isInteger(match.rescues) || match.rescues < 0 || match.rescues > 1) throw new Error('Invalid authoritative victory');
  return Object.freeze({ matchId, accountIds: Object.freeze([...accountIds]), wins: 1,
    supplies: match.supplies.length, rescues: 1 - match.rescues });
}
