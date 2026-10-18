import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '../server/node_modules/@electric-sql/pglite/dist/index.js';

test('crew migrations and transactions execute in PostgreSQL', async t => {
  const db = new PGlite();
  const ids = Array.from({length:10}, (_, i) => `00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
  const hash = 'a'.repeat(64), match = 'c'.repeat(32);
  const rpc = async (name, args) => (await db.query(`select public.runroad_${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as value`,args)).rows[0].value;
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);`);
    for (const id of ids) await db.query('insert into auth.users values($1)',[id]);
    for (const file of ['001_crews.sql','002_crew_membership.sql'])
      await db.exec(await readFile(new URL('../server/migrations/'+file,import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/20261018152438_runroad_invite_crew_index.sql',import.meta.url),'utf8'));
    assert.equal((await db.query("select count(*)::int as n from pg_indexes where indexname = 'runroad_crew_invites_crew'")).rows[0].n,1);
    await db.exec('set role service_role');
    let crew;
    await t.test('create is atomic and one account cannot create two crews', async () => {
      crew = await rpc('create_crew',[ids[0],'Home Drivers']);
      assert.equal(crew.members,1); assert.equal(crew.wins,0);
      await assert.rejects(rpc('create_crew',[ids[0],'Duplicate']));
      assert.equal((await db.query('select count(*)::int as n from public.runroad_crews')).rows[0].n,1);
    });
    await t.test('invite membership, eight-member cap and idempotent joins', async () => {
      await assert.rejects(rpc('invite_crew',[ids[9],hash]),/membership/);
      await rpc('invite_crew',[ids[0],hash]);
      for (const id of ids.slice(1,8)) await rpc('join_crew',[id,hash]);
      assert.equal((await rpc('get_crew',[ids[0]])).members,8);
      assert.equal((await rpc('join_crew',[ids[1],hash])).members,8);
      await assert.rejects(rpc('join_crew',[ids[8],hash]),/full/);
    });
    await t.test('one shared win per crew/match with retry deduplication', async () => {
      assert.equal(await rpc('record_crew_win',[match,ids.slice(0,2),1]),1);
      assert.equal(await rpc('record_crew_win',[match,ids.slice(0,2),1]),0);
      const state = await rpc('get_crew',[ids[1]]);
      assert.equal(state.wins,1); assert.equal(state.supplies,2); assert.equal(state.rescues,1);
      await assert.rejects(rpc('record_crew_win',['x'.repeat(32),ids.slice(0,2),1]));
    });
    await t.test('departing revokes invitations, keeps shared progress and frees a slot', async () => {
      await rpc('leave_crew',[ids[0]]);
      assert.equal(await rpc('get_crew',[ids[0]]),null);
      await assert.rejects(rpc('join_crew',[ids[8],hash]),/unavailable/);
      await rpc('invite_crew',[ids[1],hash]);
      const joined = await rpc('join_crew',[ids[8],hash]);
      assert.equal(joined.members,8); assert.equal(joined.wins,1);
      await db.query("update public.runroad_crew_invites set expires_at = now() - interval '1 hour'");
      await assert.rejects(rpc('join_crew',[ids[9],hash]),/unavailable/);
    });
    await t.test('different crews each receive one win; abandoned crews are removed', async () => {
      const other = await rpc('create_crew',[ids[9],'Second Home']);
      assert.notEqual(other.id,crew.id);
      assert.equal(await rpc('record_crew_win',['d'.repeat(32),[ids[1],ids[9]],0]),2);
      await rpc('leave_crew',[ids[9]]);
      assert.equal((await db.query('select count(*)::int as n from public.runroad_crews')).rows[0].n,1);
    });
    await t.test('browser roles cannot read tables or call privileged functions', async () => {
      for (const role of ['anon','authenticated']) {
        await db.exec(`reset role; set role ${role}`);
        await assert.rejects(db.query('select * from public.runroad_crews'),/permission/);
        await assert.rejects(rpc('get_crew',[ids[1]]),/permission/);
        await assert.rejects(rpc('record_crew_win',[match,ids.slice(0,2),1]),/permission/);
        await assert.rejects(rpc('join_crew',[ids[9],hash]),/permission/);
      }
    });
  } finally { await db.close(); }
});
