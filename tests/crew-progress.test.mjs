import test from 'node:test';
import assert from 'node:assert/strict';
import { crewContribution, garageStage } from '../server/crew-progress.mjs';
const id = 'a'.repeat(32);
const accounts = ['00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'];
const victory = () => ({ phase: 'won', players: [{hp:45,connected:true},{hp:100,connected:true}], supplies: [{taken:true},{taken:true}], rescues:0 });
test('only a completed server victory generates a contribution', () => {
  for (const phase of ['lobby','countdown','playing','lost'])
    assert.equal(crewContribution(id,{...victory(),phase},accounts),null);
  assert.deepEqual(crewContribution(id,victory(),accounts),{matchId:id,accountIds:accounts,wins:1,supplies:2,rescues:1});
});
test('rejects duplicate identities, invalid match IDs and inconsistent victories', () => {
  assert.throws(()=>crewContribution(id,victory(),[accounts[0],accounts[0]]));
  assert.throws(()=>crewContribution('ROOMCODE',victory(),accounts));
  const m = victory(); m.players[0].hp = 0;
  assert.throws(()=>crewContribution(id,m,accounts));
  const n = victory(); n.supplies[0].taken = false;
  assert.throws(()=>crewContribution(id,n,accounts));
});
test('garage stages advance at earned thresholds without paid stats', () => {
  assert.equal(garageStage(4).wins,0); assert.equal(garageStage(5).wins,5);
  assert.equal(garageStage(14).wins,5); assert.equal(garageStage(15).wins,15);
  assert.equal(garageStage(30).wins,30); assert.equal(garageStage(100).wins,30);
  assert.throws(()=>garageStage(-1)); assert.throws(()=>garageStage(NaN));
});
