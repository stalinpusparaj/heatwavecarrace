import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from '../server/node_modules/ws/wrapper.mjs';
import { createConvoyServer } from '../server/index.mjs';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const waitFor=async(fn)=>{for(let i=0;i<150;i++){const result=fn();if(result)return result;await delay(20)}throw Error('Timed out waiting for match message');};
async function client(url,origin){const ws=new WebSocket(url,{origin});const messages=[];ws.on('message',b=>messages.push(JSON.parse(b)));ws.on('error',()=>{});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});return{ws,messages,send:m=>ws.send(JSON.stringify(m))};}
test('two sockets share room, countdown, input, reconnect identity and authoritative win',async()=>{
 const app=createConvoyServer({origins:['http://test.local']});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 const url=`ws://127.0.0.1:${app.server.address().port}/convoy`;const all=[];
 try{
  const a=await client(url,'http://test.local');all.push(a.ws);a.send({type:'create',rules:1});const aw=await waitFor(()=>a.messages.find(m=>m.type==='welcome'));
  const b=await client(url,'http://test.local');all.push(b.ws);b.send({type:'join',rules:1,code:aw.code});const bw=await waitFor(()=>b.messages.find(m=>m.type==='welcome'));assert.equal(bw.id,1);assert.notEqual(aw.token,bw.token);
  const c=await client(url,'http://test.local');all.push(c.ws);c.send({type:'join',rules:1,code:aw.code});assert.match((await waitFor(()=>c.messages.find(m=>m.type==='error'))).message,/full/);
  a.send({type:'ready'});b.send({type:'ready'});await waitFor(()=>a.messages.find(m=>m.phase==='countdown'));
  const room=app.rooms.get(aw.code);room.match.countdown=.01;await waitFor(()=>b.messages.find(m=>m.phase==='playing'));
  a.send({type:'input',seq:0,angle:0,boost:false,rescue:false,x:9999,hp:999});await delay(100);assert.ok(room.match.players[0].x<0);assert.equal(room.match.players[0].hp,100);
  b.ws.close();await waitFor(()=>!room.match.players[1].connected);
  const re=await client(url,'http://test.local');all.push(re.ws);re.send({type:'reconnect',rules:1,code:aw.code,token:bw.token});const rew=await waitFor(()=>re.messages.find(m=>m.type==='welcome'));assert.equal(rew.id,1);assert.equal(rew.token,bw.token);
  // Controlled fixture exercises networked completion, not client authority over results.
  room.match.supplies.forEach(s=>s.taken=true);room.match.cops=[];room.match.spawn=10000;
  room.match.players.forEach(p=>Object.assign(p,{x:0,y:530,vx:0,vy:0,input:{...p.input,age:10}}));
  const wonA=await waitFor(()=>a.messages.find(m=>m.phase==='won'));const wonB=await waitFor(()=>re.messages.find(m=>m.phase==='won'));assert.equal(wonA.score,wonB.score);assert.equal(wonA.reason,wonB.reason);
  assert.ok(JSON.stringify(wonA).length<10000);
 }finally{all.forEach(s=>s.terminate());await app.close()}
});
test('rejects foreign origins and incompatible protocol',async()=>{
 const app=createConvoyServer({origins:['http://allowed.local']});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 const url=`ws://127.0.0.1:${app.server.address().port}/convoy`;
 try{await assert.rejects(client(url,'http://evil.local'),/403/);const c=await client(url,'http://allowed.local');c.send({type:'create',rules:99});assert.match((await waitFor(()=>c.messages.find(m=>m.type==='error'))).message,/version/);c.ws.terminate()}finally{await app.close()}
});
