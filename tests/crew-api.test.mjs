import test from 'node:test';
import assert from 'node:assert/strict';
import { createCrewStore, CrewError } from '../server/crew-store.mjs';
import { createConvoyServer } from '../server/index.mjs';
const id = '00000000-0000-4000-8000-000000000001';
const origin = 'https://game.example';
const json = (body, status=200) => new Response(JSON.stringify(body),{status});

test('database adapter verifies identity with Auth and hashes invite codes before storage', async () => {
  const calls = [];
  const store = createCrewStore({url:'https://database.example',secretKey:'sb_secret_TEST_ONLY',fetchImpl:async (url,opts) => {
    calls.push({url:String(url),...opts});
    if (url.pathname === '/auth/v1/user') return json({id,email_confirmed_at:'2026-01-01',is_anonymous:false});
    if (url.pathname.endsWith('invite_crew')) return json('2026-10-19T00:00:00Z');
    return json({name:'Home Drivers'});
  }});
  assert.equal(await store.authenticate('user.jwt.token'),id);
  assert.equal(calls[0].headers.Authorization,'Bearer user.jwt.token');
  const invite = await store.invite(id);
  assert.match(invite.code,/^[a-f0-9]{32}$/);
  assert.equal(calls[1].headers.Authorization,undefined);
  const payload = JSON.parse(calls[1].body);
  assert.match(payload.p_hash,/^[a-f0-9]{64}$/); assert.ok(!calls[1].body.includes(invite.code));
  await store.join(id,invite.code.toUpperCase());
  assert.equal(JSON.parse(calls[2].body).p_hash,payload.p_hash);
  await assert.rejects(store.create(id,'<script>'),e=>e.status===400);
  await assert.rejects(store.authenticate('bad token'),e=>e.status===401);
});

test('adapter rejects unverified/guest accounts and sanitizes provider errors', async () => {
  for (const user of [{id,is_anonymous:true,email_confirmed_at:'x'},{id},{id:'not-a-uuid',email_confirmed_at:'x'}]) {
    const store=createCrewStore({url:'https://database.example',secretKey:'TEST_ONLY',fetchImpl:async()=>json(user)});
    await assert.rejects(store.authenticate('token'),e=>[401,403].includes(e.status));
  }
  const store = createCrewStore({url:'https://database.example',secretKey:'TEST_ONLY',fetchImpl:async()=>json({message:'DATABASE_PASSWORD_TEST_ONLY'},500)});
  await assert.rejects(store.get(id),e=>e.status===503 && !e.message.includes('PASSWORD'));
  assert.throws(()=>createCrewStore({url:'http://database.example',secretKey:'TEST_ONLY'}));
  assert.throws(()=>createCrewStore({url:'https://database.example/path',secretKey:'TEST_ONLY'}));
});

test('crew HTTP routes bind verified identity, reject spoofing, enforce origin and body limits',async () => {
  const calls=[];
  const store={
    authenticate:async token=>{if(token!=='valid.token')throw new CrewError(401,'Sign in again.');return id;},
    get:async account=>{calls.push(['get',account]);return {name:'Home Drivers',members:2};},
    create:async (account,name)=>{calls.push(['create',account,name]);return {name};},
    join:async (account,code)=>{calls.push(['join',account,code]);return {name:'Joined'};},
    invite:async()=>({code:'a'.repeat(32)}),leave:async()=>({left:true}),
  };
  const app=createConvoyServer({origins:[origin],serveGame:false,crewStore:store});
  await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${app.server.address().port}`;
  const request=(route, options={})=>fetch(base+route,{...options,headers:{Origin:origin,Authorization:'Bearer valid.token','Content-Type':'application/json',...options.headers}});
  try {
    const preflight=await request('/crews/create',{method:'OPTIONS'});
    assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-headers'),'Authorization, Content-Type');
    const a=await request('/crews');assert.equal(a.status,200);assert.equal(a.headers.get('cache-control'),'no-store');
    assert.equal(a.headers.get('access-control-allow-origin'),origin);assert.equal((await a.json()).crew.members,2);
    assert.deepEqual(calls[0],['get',id]);
    assert.equal((await request('/crews/create',{method:'POST',body:JSON.stringify({name:'Home Drivers'})})).status,200);
    assert.deepEqual(calls[1],['create',id,'Home Drivers']);
    assert.equal((await request('/crews/create',{method:'POST',body:JSON.stringify({name:'Spoof',account_id:'other'})})).status,400);
    assert.equal(calls.length,2);
    assert.equal((await request('/crews/join',{method:'POST',body:JSON.stringify({code:'x'.repeat(600)})})).status,413);
    assert.equal((await request('/crews/create',{method:'POST',body:'null'})).status,400);
    assert.equal((await request('/crews',{headers:{Authorization:'Bearer expired'}})).status,401);
    const bad=await request('/crews',{headers:{Origin:'https://foreign.example'}});
    assert.equal(bad.status,403);assert.equal(bad.headers.get('access-control-allow-origin'),null);
    assert.equal((await request('/crews?account_id=other')).status,404);
    assert.equal((await request('/crews',{method:'DELETE'})).status,405);
    assert.equal((await request('/index.html')).status,404);
  } finally {await app.close();}
});

test('crew routes are absent without configuration; configured routes rate-limit auth attempts',async () => {
  const off=createConvoyServer({serveGame:false});await new Promise(r=>off.server.listen(0,'127.0.0.1',r));
  try {assert.equal((await fetch(`http://127.0.0.1:${off.server.address().port}/crews`)).status,404);}finally{await off.close();}
  let checks=0;
  const app=createConvoyServer({origins:[origin],serveGame:false,crewStore:{authenticate:async()=>{checks++;throw new CrewError(401,'Sign in.');}}});
  await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
  try {
    for(let i=0;i<21;i++){
      const res=await fetch(`http://127.0.0.1:${app.server.address().port}/crews`,{headers:{Origin:origin,Authorization:'Bearer test'}});
      assert.equal(res.status,i<20?401:429);await res.text();
    }
    assert.equal(checks,20);
  } finally {await app.close();}
});
