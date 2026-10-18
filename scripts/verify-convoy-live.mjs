// Smoke test against a user-authorized deployed match service; never prints seat tokens.
import assert from 'node:assert/strict';
import {WebSocket} from '../server/node_modules/ws/wrapper.mjs';
const base=new URL(process.argv[2]);
assert.equal(base.protocol,'https:');
const game='https://heatwave-desert-run.stalinpusparaj47.chatgpt.site';
const native='https://appassets.androidplatform.net';
const health=await fetch(new URL('/health',base),{headers:{Origin:game}});
assert.equal(health.status,200);assert.equal(health.headers.get('access-control-allow-origin'),game);assert.equal((await health.json()).rules,1);
assert.equal((await fetch(new URL('/index.html',base))).status,404);
const url=new URL('/convoy',base);url.protocol='wss:';
const clients=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,ms=15000){const deadline=Date.now()+ms;while(Date.now()<deadline){const result=fn();if(result)return result;await delay(30)}throw Error('Live session verification timed out')}
async function connect(origin){const ws=new WebSocket(url,{origin});clients.push(ws);const messages=[];ws.on('message',b=>messages.push(JSON.parse(b)));ws.on('error',()=>{});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});return{ws,messages,send:m=>ws.send(JSON.stringify(m))}}
try{
 const a=await connect(game);a.send({type:'create',rules:1});const aw=await until(()=>a.messages.find(m=>m.type==='welcome'));
 const b=await connect(native);b.send({type:'join',rules:1,code:aw.code});const bw=await until(()=>b.messages.find(m=>m.type==='welcome'));assert.equal(bw.id,1);
 a.send({type:'ready'});b.send({type:'ready'});await until(()=>a.messages.find(m=>m.phase==='playing'));await until(()=>b.messages.find(m=>m.phase==='playing'));
 let seq=0;const inputs=setInterval(()=>{a.send({type:'input',seq:seq++,angle:0,boost:false,rescue:false});b.send({type:'input',seq:seq++,angle:Math.PI,boost:false,rescue:false})},100);
 await delay(1100);clearInterval(inputs);
 const as=a.messages.filter(m=>m.type==='state'&&m.phase==='playing');const bs=b.messages.filter(m=>m.type==='state'&&m.phase==='playing');
 const common=as.findLast(s=>bs.some(b=>b.tick===s.tick));assert.ok(common);const same=bs.find(s=>s.tick===common.tick);assert.deepEqual(common.players,same.players);assert.deepEqual(common.cops,same.cops);assert.ok(common.players.some(p=>Math.hypot(p.x-bw.state.players[p.id].x,p.y-bw.state.players[p.id].y)>30));
 b.ws.close();await until(()=>a.messages.find(m=>m.type==='state'&&m.players[1]?.connected===false));
 const re=await connect(native);re.send({type:'reconnect',rules:1,code:aw.code,token:bw.token});const rw=await until(()=>re.messages.find(m=>m.type==='welcome'));assert.equal(rw.id,1);
 console.log('PASS: deployed HTTPS health/CORS, private asset isolation, two WSS clients, ready/countdown, shared authoritative state, steering, native-origin access and token-bound reconnect');
}finally{for(const ws of clients)ws.terminate()}
