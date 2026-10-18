import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../dist/crews.js',import.meta.url),'utf8');
const session=()=>({access_token:'ACCESS_TEST_ONLY',refresh_token:'REFRESH_TEST_ONLY',expires_in:3600,user:{id:'id',email_confirmed_at:'yes',email:'driver@example.test'}});
function setup(fetch){const context={URL,AbortSignal,Date,location:{hostname:'game.example',origin:'https://game.example'},document:{getElementById:()=>null},fetch};vm.createContext(context);vm.runInContext(source.replace('return{init,show,async tokenFor','return{testAccept:accept,testAuth:auth,testRequest:request,testVerification:verification,init,show,async tokenFor'),context);return vm.runInContext('Crew',context);}
test('crew tokens are restricted to the trusted match server',async()=>{
  const api=setup(()=>{throw Error('unexpected network')});api.testAccept(session());
  assert.equal(await api.tokenFor('wss://runroad-convoy-alpha.onrender.com/convoy'),'ACCESS_TEST_ONLY');
  assert.equal(await api.tokenFor('wss://custom.example/convoy'),null);
  assert.equal(await api.tokenFor('wss://runroad-convoy-alpha.onrender.com.evil.test/convoy'),null);
});
test('refresh is single-flight and uses only the public project key',async()=>{
  let calls=0;const api=setup(async(url,opts)=>{calls++;assert.equal(url,'https://rajkcmbdsnxdtajchuuy.supabase.co/auth/v1/token?grant_type=refresh_token');assert.equal(opts.credentials,'omit');assert.match(opts.headers.apikey,/^sb_publishable_/);assert.equal(JSON.parse(opts.body).refresh_token,'REFRESH_TEST_ONLY');await new Promise(r=>setTimeout(r,5));return {ok:true,json:async()=>({...session(),access_token:'NEW_ACCESS'})};});
  api.testAccept({...session(),expires_in:-1});
  const tokens=await Promise.all([api.tokenFor('wss://runroad-convoy-alpha.onrender.com/convoy'),api.tokenFor('wss://runroad-convoy-alpha.onrender.com/convoy')]);
  assert.deepEqual(tokens,['NEW_ACCESS','NEW_ACCESS']);assert.equal(calls,1);
});
test('invalid sessions are rejected and database unavailability never returns success',async()=>{
  const api=setup(async()=>({ok:false,status:503,json:async()=>({error:'internal password'})}));
  assert.throws(()=>api.testAccept({...session(),user:{id:'id',is_anonymous:true}}));
  api.testAccept(session());await assert.rejects(api.testRequest('/crews'),/not ready/);
  await assert.rejects(api.testAuth('verify',{email:'driver@example.test',token:'123456'}),/invalid, expired/);
});

test('pasted email links are restricted to the project verification endpoint',()=>{
  const api=setup(()=>{}),hash='a'.repeat(64);
  const result=api.testVerification('https://rajkcmbdsnxdtajchuuy.supabase.co/auth/v1/verify?token='+hash+'&type=magiclink');
  assert.equal(result.token_hash,hash);assert.equal(result.type,'magiclink');
  for(const url of ['https://other.example/auth/v1/verify?token='+hash+'&type=magiclink', 'javascript:alert(1)', 'https://rajkcmbdsnxdtajchuuy.supabase.co/auth/v1/verify?token='+hash+'&type=recovery'])assert.throws(()=>api.testVerification(url));
});
