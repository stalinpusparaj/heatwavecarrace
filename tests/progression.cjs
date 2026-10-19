const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const stored={};let clock='2026-10-19T10:00:00Z',wallet=0;
class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock]))}static now(){return new Date(clock).valueOf()}}
const context={Date:ClockDate,console,localStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v},C:{awardCredits:n=>{wallet+=n;return true}},R:{active:false},V:{active:false},state:'hub',window:{}};
vm.createContext(context);vm.runInContext(fs.readFileSync('dist/progression.js','utf8'),context);const p=vm.runInContext('Progression',context);
const stats={seconds:90,kills:8,near:6,drift:20,peak:5,perfects:3,hull:.9};
p.begin();const first=p.finish(true,stats);assert.equal(first.xp,p.data.xp);assert.equal(first.chips,p.data.chips);assert.ok(p.data.badges.includes('first'));const xp=p.data.xp;p.finish(true,stats);assert.equal(p.data.xp,xp,'same run rewarded twice');
p.begin();p.finish(true,stats);const ids=[...p.view('journal').matchAll(/data-contract="([a-z]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,3);
for(const id of ids){assert.equal(p.claim(id),true);const previous=wallet;assert.equal(p.claim(id),false);assert.equal(wallet,previous)}
assert.ok(wallet>0);assert.equal(p.claim('not-a-contract'),false);
const claimedXp=p.data.xp;context.R.active=true;p.begin();assert.equal(p.finish(true,stats),null);assert.equal(p.data.xp,claimedXp);context.R.active=false;context.V.active=true;p.begin();assert.equal(p.finish(true,stats),null);context.V.active=false;
p.begin();assert.equal(p.finish(false,{...stats,seconds:1}),null);assert.equal(p.data.xp,claimedXp,'restart farming');
assert.equal(p.equip('violet'),false);assert.equal(p.equip('paid_supporter'),false);assert.equal(p.buy('coast'),false);
for(let i=0;i<20;i++){p.begin();p.finish(true,stats)}
assert.ok(p.data.owned.includes('signal'));const chips=p.data.chips;assert.ok(chips>=160);assert.equal(p.buy('coast'),true);assert.equal(p.data.chips,chips-160);assert.equal(p.buy('coast'),false);assert.equal(p.data.equipped,'coast');
clock='2026-10-20T10:00:00Z';p.view('journal');assert.equal(p.data.day,'2026-10-20');assert.equal(p.data.claimed.length,0);assert.equal(p.claim(ids[0]),false);
clock='2026-10-19T10:00:00Z';p.view('journal');assert.equal(p.data.day,'2026-10-20','clock rollback resets contracts');
const reloaded={...context};vm.createContext(reloaded);vm.runInContext(fs.readFileSync('dist/progression.js','utf8'),reloaded);const q=vm.runInContext('Progression',reloaded);assert.equal(q.data.xp,p.data.xp);assert.equal(q.data.equipped,'coast');assert.deepEqual(Object.keys(stored),['runroad-passport-v1']);
assert.ok(p.view('journal').includes('data-contract-play'));assert.ok(!p.view('style').includes('BUY NOW'));assert.ok(p.view('style').includes('not on sale'));
console.log('PASS: once-only run/contract rewards, earned XP and cosmetics, badge totals, anti-restart farming, mode isolation, UTC rotation/clock rollback, local persistence and unavailable checkout');
