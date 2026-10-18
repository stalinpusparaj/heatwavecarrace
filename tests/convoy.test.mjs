import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, addPlayer, ready, step, snapshot, setInput, STEP } from '../server/simulation.mjs';
const setup = () => {const m=createMatch(42);addPlayer(m);addPlayer(m);m.obstacles=[];m.spawn=10000;return m;};
const input = (p,seq,extras={}) => setInput(p,{seq,angle:null,boost:false,rescue:false,...extras});
const ticks=(m,n)=>{for(let i=0;i<n;i++)step(m)};
test('seeded layout reserves both starts, caches and exit',()=>{
  assert.deepEqual(createMatch(9).obstacles,createMatch(9).obstacles);
  for(let seed=1;seed<100;seed++){
    const m=createMatch(seed);assert.equal(m.obstacles.length,10);
    for(const o of m.obstacles)for(const p of [...m.supplies,m.exit,{x:-60,y:300},{x:60,y:300}])assert.ok(Math.hypot(o.x-p.x,o.y-p.y)>o.r+125);
  }
});
test('two real ready drivers required and third player rejected',()=>{
 const m=createMatch();addPlayer(m);ready(m,0);ticks(m,100);assert.equal(m.phase,'lobby');
 addPlayer(m);assert.throws(()=>addPlayer(m));ready(m,1);assert.equal(m.phase,'countdown');ticks(m,92);assert.equal(m.phase,'playing');
});
test('input validates sequence/types and rejects spoofed state',()=>{
 const m=setup(),p=m.players[0];assert.equal(input(p,0,{angle:0,hp:999,x:9999}),true);assert.equal(p.hp,100);assert.equal(p.x,-60);
 assert.equal(input(p,0),false);assert.equal(input(p,1,{angle:Infinity}),false);assert.equal(input(p,1,{boost:'yes'}),false);
});
test('server moves only from fresh input, stops stale/idle clients and limits boost',()=>{
 const m=setup();m.phase='playing';const p=m.players[0];input(p,1,{angle:-Math.PI/2,boost:true});step(m);assert.ok(p.y<300);assert.ok(p.charge<11);assert.ok(p.boost>1);
 ticks(m,100);assert.ok(Math.abs(p.vy)<1);input(p,2,{idle:true});const y=p.y;ticks(m,30);assert.ok(Math.abs(p.y-y)<.5);
});
test('server shares pickups and only wins with both living drivers at unlocked exit',()=>{
 const m=setup();m.phase='playing';m.players[0].x=m.supplies[0].x;m.players[0].y=m.supplies[0].y;
 m.players[1].x=m.supplies[1].x;m.players[1].y=m.supplies[1].y;step(m);assert.ok(m.supplies.every(s=>s.taken));
 Object.assign(m.players[0],m.exit);step(m);assert.equal(m.phase,'playing');Object.assign(m.players[1],m.exit);step(m);assert.equal(m.phase,'won');const score=m.score;ticks(m,50);assert.equal(m.score,score);
 const out=snapshot(m);assert.equal(out.players.length,2);assert.ok(!('input'in out.players[0]));
});
test('one shared rescue restores ally after held proximity; no remote rescue',()=>{
 const m=setup();m.phase='playing';m.players[1].hp=0;m.players[1].x=500;
 for(let i=0;i<70;i++){input(m.players[0],i,{rescue:true});step(m)}assert.equal(m.players[1].hp,0);
 m.players[0].x=m.players[1].x;m.players[0].y=m.players[1].y;
 for(let i=70;i<135;i++){input(m.players[0],i,{rescue:true});step(m)}assert.equal(m.players[1].hp,45);assert.equal(m.rescues,0);
 m.players[1].hp=0;for(let i=135;i<205;i++){input(m.players[0],i,{rescue:true});step(m)}assert.equal(m.players[1].hp,0);
});
test('collision damage and stalled/time/disconnect losses are server owned',()=>{
 const m=setup();m.phase='playing';m.obstacles=[{x:0,y:300,r:40}];Object.assign(m.players[0],{x:-60,y:300,a:0,vx:185});input(m.players[0],0,{angle:0});step(m);assert.ok(m.players[0].hp<100);
 const d=setup();d.phase='playing';d.players[0].connected=false;ticks(d,302);assert.equal(d.phase,'lost');
 const t=setup();t.phase='playing';t.time=119.99;step(t);assert.equal(t.phase,'lost');
 const s=setup();s.phase='playing';s.players[0].hp=0;ticks(s,542);assert.equal(s.phase,'lost');
 assert.equal(STEP,1/30);
});
