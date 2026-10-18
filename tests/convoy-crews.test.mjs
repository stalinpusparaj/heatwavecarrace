import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from '../server/node_modules/ws/wrapper.mjs';
import { createConvoyServer } from '../server/index.mjs';
const origin='https://game.example';
const ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(fn){for(let i=0;i<150;i++){const v=fn();if(v)return v;await delay(20)}throw Error('Timed out');}
async function client(url){const ws=new WebSocket(url,{origin});const messages=[];ws.on('message',d=>messages.push(JSON.parse(d)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});return {ws,messages,send:data=>ws.send(JSON.stringify(data))};}

test('authenticated escape retries saving, captures terminal evidence and confirms only after acknowledgement',async()=>{
  let offset=0,records=[];
  const app=createConvoyServer({origins:[origin],now:()=>performance.now()+offset,crewStore:{
    authenticate:async token=>{if(!['a'.repeat(1200),'b'.repeat(1200)].includes(token))throw Error('PROVIDER_SECRET_TEST_ONLY');return token[0]==='a'?ids[0]:ids[1];},
    recordWin:async(matchId,match,accounts)=>{records.push({matchId,match,accounts});if(records.length===1)throw Error('offline');return 1;},
  }});
  await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const url=`ws://127.0.0.1:${app.server.address().port}/convoy`;
  const sockets=[];
  try{
    const bad=await client(url);sockets.push(bad.ws);bad.send({type:'create',rules:1,accessToken:'expired'});
    const error=await wait(()=>bad.messages.find(m=>m.type==='error'));assert.ok(!error.message.includes('PROVIDER_SECRET'));assert.equal(app.rooms.size,0);bad.ws.close();
    const a=await client(url);sockets.push(a.ws);a.send({type:'create',rules:1,accessToken:'a'.repeat(1200)});
    const welcome=await wait(()=>a.messages.find(m=>m.type==='welcome'));assert.equal(welcome.crewSignedIn,true);
    const duplicate=await client(url);sockets.push(duplicate.ws);duplicate.send({type:'join',rules:1,code:welcome.code,accessToken:'a'.repeat(1200)});
    assert.match((await wait(()=>duplicate.messages.find(m=>m.type==='error'))).message,/different account/);duplicate.ws.close();
    const b=await client(url);sockets.push(b.ws);b.send({type:'join',rules:1,code:welcome.code,accessToken:'b'.repeat(1200)});
    await wait(()=>b.messages.find(m=>m.type==='welcome'));
    a.send({type:'ready'});b.send({type:'ready'});const room=app.rooms.get(welcome.code);
    await wait(()=>room.match.phase==='countdown');room.match.countdown=.01;
    await wait(()=>room.match.phase==='playing');
    room.match.supplies.forEach(s=>s.taken=true);room.match.cops=[];room.match.spawn=10000;
    room.match.players.forEach(p=>Object.assign(p,{x:0,y:530,vx:0,vy:0,input:{...p.input,age:10}}));
    const pending=await wait(()=>a.messages.find(m=>m.phase==='won'&&m.crewReward==='pending'));assert.ok(pending);
    await wait(()=>records.length===1);b.ws.close();await wait(()=>!room.match.players[1].connected);
    offset+=6000;
    const saved=await wait(()=>a.messages.find(m=>m.crewReward==='saved'));
    assert.equal(saved.phase,'won');assert.equal(records.length,2);
    assert.match(records[0].matchId,/^[a-f0-9]{32}$/);assert.equal(records[0].matchId,records[1].matchId);
    assert.deepEqual(records[1].accounts,ids);assert.ok(records[1].match.players.every(p=>p.connected));
    assert.ok(!JSON.stringify(saved).includes(ids[0]));
    await delay(100);assert.equal(records.length,2);
  }finally{sockets.forEach(ws=>ws.terminate());await app.close();}
});

test('guest escape creates no persistent crew award',async()=>{
  let awards=0;
  const app=createConvoyServer({origins:[origin],crewStore:{recordWin:async()=>{awards++;return 1;}}});
  await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const url=`ws://127.0.0.1:${app.server.address().port}/convoy`;
  const sockets=[];
  try{
    const a=await client(url);sockets.push(a.ws);a.send({type:'create',rules:1});const w=await wait(()=>a.messages.find(m=>m.type==='welcome'));assert.equal(w.crewSignedIn,false);
    const b=await client(url);sockets.push(b.ws);b.send({type:'join',rules:1,code:w.code});await wait(()=>b.messages.find(m=>m.type==='welcome'));
    const room=app.rooms.get(w.code);room.match.phase='won';
    await wait(()=>a.messages.find(m=>m.phase==='won'));assert.equal(awards,0);
  }finally{sockets.forEach(ws=>ws.terminate());await app.close();}
});
