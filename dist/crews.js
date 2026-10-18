'use strict';
// Public project key only. Accounts stay separate from local campaign saves.
const Crew=(()=>{
const AUTH='https://rajkcmbdsnxdtajchuuy.supabase.co';
const KEY='sb_publishable_Ff036mri8dV0wXMC5wR9WA_EmR1zKFF';
const MATCH='https://runroad-convoy-alpha.onrender.com';
const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const API=local?location.origin:MATCH;
const stages=[{wins:0,name:'The abandoned garage'},{wins:5,name:'Lights back on'},{wins:15,name:'Doors open'},{wins:30,name:'A place to come home'}];
let session=null,garage=null,email='',busy=false,note='',refreshing=null,invite=null,serial=0;
const el=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
async function auth(path,body,access){
  let res;
  try{res=await fetch(AUTH+'/auth/v1/'+path,{method:body?'POST':'GET',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{apikey:KEY,'Content-Type':'application/json',...(access?{Authorization:'Bearer '+access}:{})},...(body?{body:JSON.stringify(body)}:{})})}
  catch{throw Error('Sign-in is unavailable. Check your connection and try again.')}
  let data;try{data=await res.json()}catch{data={}}
  if(!res.ok){
    if(res.status===429)throw Error('Too many attempts. Wait a minute before trying again.');
    if(path==='verify')throw Error('That sign-in link is invalid, expired or already used. Request a fresh email.');
    if(path.startsWith('otp'))throw Error('Email delivery is unavailable for this address. This alpha currently supports approved test emails.');
    throw Error('Your sign-in expired. Sign in again.');
  }
  return data;
}
function verification(link){
  let u;try{u=new URL(link)}catch{throw Error('Paste the complete sign-in link from your email.')}
  const token=u.searchParams.get('token')||u.searchParams.get('token_hash'),type=u.searchParams.get('type');
  if(u.origin!==AUTH||u.pathname!=='/auth/v1/verify'||u.username||u.password||!['email','signup','magiclink'].includes(type)||!token||!/^[A-Za-z0-9_-]{32,256}$/.test(token))throw Error('Use the private RUNROAD sign-in link from your email.');
  return{token_hash:token,type};
}
function accept(data){
  if(typeof data.access_token!=='string'||typeof data.refresh_token!=='string'||!data.user?.id||!data.user?.email_confirmed_at||data.user.is_anonymous)throw Error('A verified email account is required.');
  session={access:data.access_token,refresh:data.refresh_token,expires:Date.now()+Math.min(86400,Number(data.expires_in)||3600)*1000,user:data.user};
}
async function access(){
  if(!session)return null;
  if(session.expires>Date.now()+60000)return session.access;
  if(!refreshing){const version=serial;refreshing=auth('token?grant_type=refresh_token',{refresh_token:session.refresh}).then(data=>{if(version!==serial)throw Error('Sign in again.');accept(data);return session.access}).catch(e=>{if(version===serial){session=null;garage=null}throw e}).finally(()=>{refreshing=null})}
  return refreshing;
}
async function request(path,body){
  const token=await access();if(!token)throw Error('Sign in to open your crew garage.');
  let res;
  try{res=await fetch(API+path,{method:body?'POST':'GET',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})})}
  catch{throw Error('Garage connection unavailable. The free server may need a minute to wake. Try Refresh.')}
  let data;try{data=await res.json()}catch{data={}}
  if(res.status===401){session=null;garage=null;throw Error('Sign in again to open your crew.');}
  if(res.status===404||res.status===503)throw Error('The crew service is not ready yet. Your local game and guest convoys are still available.');
  if(!res.ok)throw Error(typeof data.error==='string'?data.error:'Could not save. Try again.');
  return data;
}
function render(){
  const d=el('crewDialog');if(!d)return;
  const wins=count(garage?.wins),stage=stages.filter(s=>wins>=s.wins).at(-1),next=stages.find(s=>wins<s.wins);
  const visual=`<div class="crew-scene stage-${stage.wins}" aria-hidden="true"><div class="crew-sun"></div><div class="crew-building"><div class="crew-roof"></div><div class="crew-sign">MARA + JUN</div><div class="crew-door"></div><i></i><i></i></div><div class="crew-road"></div></div>`;
  d.innerHTML=`<button id="crewClose" class="crew-close" aria-label="Close crew garage">✕</button><div class="eyebrow">NOBODY DRIVES HOME ALONE</div><h2>YOUR PEOPLE.<br><em>YOUR PLACE.</em></h2><div class="crew-layout"><section>${visual}<p class="crew-story">“Dad never changed the lock.”<br><small>Help Mara and Jun bring the community garage back to life. Every successful crew escape brings the lights a little closer.</small></p><div class="crew-stages">${stages.slice(1).map(s=>`<div class="${wins>=s.wins?'earned':''}"><b>${wins>=s.wins?'✓':s.wins}</b><span>${s.name}<small>${s.wins} shared escapes</small></span></div>`).join('')}</div></section><section class="crew-panel">${session?garage?`<div class="eyebrow">YOUR CREW · ${count(garage.members)}/8 DRIVERS</div><h3>${esc(garage.name)}</h3><p>${esc(stage.name)}</p><div class="crew-members" aria-label="${count(garage.members)} of 8 crew places filled">${Array.from({length:8},(_,i)=>`<i class="${i<count(garage.members)?'filled':''}">${i<count(garage.members)?'◆':'+'}</i>`).join('')}</div><div class="crew-counters"><div><strong>${wins}</strong><small>ESCAPES</small></div><div><strong>${count(garage.supplies)}</strong><small>SUPPLIES</small></div><div><strong>${count(garage.rescues)}</strong><small>RESCUES</small></div></div><label for="crewProgress">${next?`${next.wins-wins} more escapes to ${esc(next.name)}`:'THE GARAGE IS HOME AGAIN'}</label><progress id="crewProgress" max="${next?.wins||30}" value="${Math.min(wins,next?.wins||30)}"></progress><button class="primary" id="crewPlay">DRIVE TOGETHER ↗</button><div class="crew-buttons"><button class="secondary" id="crewInvite">MAKE INVITE</button><button class="secondary" id="crewRefresh">REFRESH</button></div>${invite?`<label for="crewInviteCode">PRIVATE INVITE · EXPIRES IN 24 HOURS</label><input id="crewInviteCode" readonly value="${esc(invite.code)}"><button class="secondary" id="crewCopy">COPY INVITE</button>`:''}<details><summary>Leave this crew</summary><p>Other members keep their shared garage. If you are the last driver, leaving removes this crew.</p><button class="secondary" id="crewLeave">LEAVE CREW</button></details>`:`<div class="eyebrow">SIGNED IN · ${esc(session.user.email)}</div><h3>FIND YOUR PEOPLE.</h3><p>Create a home for up to eight drivers, or bring a friend's private invite.</p><form id="crewCreateForm"><label for="crewName">CREW NAME</label><input id="crewName" maxlength="24" minlength="3" required placeholder="Homebound Drivers" autocomplete="off"><button class="primary">CREATE CREW ↗</button></form><div class="crew-divider">OR JOIN YOUR FRIENDS</div><form id="crewJoinForm"><label for="crewJoinCode">PRIVATE CREW INVITE</label><input id="crewJoinCode" required minlength="32" maxlength="32" placeholder="Paste 32-character invite" autocomplete="off" spellcheck="false"><button class="secondary">JOIN CREW</button></form><button class="secondary" id="crewRefresh">REFRESH GARAGE</button>`:`<div class="eyebrow">A HOME WORTH COMING BACK TO</div><h3>YOUR CREW STARTS HERE.</h3><p>Sign in to keep your shared garage across devices. Solo and guest co-op need no account.</p><form id="crewEmailForm"><label for="crewEmail">EMAIL ADDRESS</label><input id="crewEmail" type="email" required maxlength="254" value="${esc(email)}" autocomplete="email" placeholder="you@example.com"><button class="primary">EMAIL ME A SIGN-IN LINK ↗</button></form>${`<form id="crewVerifyForm"><label for="crewOtp">PASTE THE SIGN-IN LINK FROM YOUR EMAIL</label><input id="crewOtp" type="url" autocomplete="off" spellcheck="false" required maxlength="4096" placeholder="Copy the email’s Sign in link"><button class="secondary">VERIFY & OPEN GARAGE</button></form>`}<small class="crew-alpha">Private alpha: email delivery currently requires an approved test address. On Android, copy the email’s Sign in link and paste it above. This sign-in lasts for this open tab. Your shared garage stays in the database.</small>`}<p id="crewNote" role="status">${esc(note)}</p>${session?'<button id="crewSignOut" class="crew-link">SIGN OUT ON THIS TAB</button>':''}<small class="crew-fair">Shared wins restore a cosmetic story garage. Crew membership never changes car stats or gives extra rescues.</small></section></div>`;
  el('crewClose').onclick=()=>d.close();
  el('crewEmailForm')?.addEventListener('submit',e=>{e.preventDefault();const value=el('crewEmail').value.trim();if(!value)return;run(async()=>{const ready=await fetch(API+'/health',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)}).then(r=>r.json());if(!ready.crews)throw Error('Crew sign-in is not enabled on the match server yet. Guest co-op remains available.');await auth('otp?redirect_to='+encodeURIComponent('https://heatwave-desert-run.stalinpusparaj47.chatgpt.site/'),{email:value,create_user:true});email=value;note='Check your email. Copy its Sign in link and paste it below. The link is private and works once.'})});
  el('crewVerifyForm')?.addEventListener('submit',e=>{e.preventDefault();const link=el('crewOtp').value;run(async()=>{accept(await auth('verify',verification(link))); note='Signed in. Opening your garage…';garage=(await request('/crews')).crew;note=''})});
  el('crewCreateForm')?.addEventListener('submit',e=>{e.preventDefault();const name=el('crewName').value;run(async()=>{garage=(await request('/crews/create',{name})).crew;note='The first key to your new home.'})});
  el('crewJoinForm')?.addEventListener('submit',e=>{e.preventDefault();const code=el('crewJoinCode').value.trim();run(async()=>{garage=(await request('/crews/join',{code})).crew;note='Welcome home, driver.'})});
  if(el('crewRefresh'))el('crewRefresh').onclick=()=>run(async()=>{garage=(await request('/crews')).crew;note='Garage synchronized.'});
  if(el('crewInvite'))el('crewInvite').onclick=()=>run(async()=>{invite=await request('/crews/invite',{});note='Share this private code with your friends. It replaces your previous invite.'});
  if(el('crewCopy'))el('crewCopy').onclick=()=>run(async()=>{try{await navigator.clipboard.writeText(invite.code);note='Invite copied.'}catch{note='Select and copy the private invite above.'}});
  if(el('crewPlay'))el('crewPlay').onclick=()=>{d.close();V.show()};
  if(el('crewLeave'))el('crewLeave').onclick=()=>run(async()=>{await request('/crews/leave',{});garage=invite=null;note='You left the crew.'});
  if(el('crewSignOut'))el('crewSignOut').onclick=()=>run(async()=>{const old=session;serial++;session=garage=invite=null;email='';note='Signed out on this tab.';try{await auth('logout?scope=local',{},old.access)}catch{}});
  d.querySelectorAll('button,input').forEach(n=>{if(n.id!=='crewClose')n.disabled=busy});
}
async function run(task){if(busy)return;busy=true;el('crewDialog').querySelectorAll('button,input').forEach(n=>{if(n.id!=='crewClose')n.disabled=true});try{await task()}catch(e){note=e.message}finally{busy=false;render()}}
function show(){if(typeof V!=='undefined'&&V.active)return;C.open('home');render();el('crewDialog').showModal();if(session)run(async()=>{garage=(await request('/crews')).crew;note=''})}
async function consumeLink(){
  const params=new URLSearchParams(location.hash.slice(1));
  if(!params.has('access_token'))return;
  history.replaceState(null,'',location.pathname+location.search);
  try{const token=params.get('access_token'),refresh=params.get('refresh_token');if(!token||!refresh)throw Error('Incomplete sign-in link.');const user=await auth('user',null,token);accept({access_token:token,refresh_token:refresh,expires_in:Number(params.get('expires_in'))||3600,user});show()}
  catch(e){note=e.message;show()}
}
function init(){const d=document.createElement('dialog');d.id='crewDialog';d.setAttribute('aria-label','Community crew garage');document.body.append(d);const b=document.createElement('button');b.id='crewButton';b.textContent='CREW GARAGE';b.onclick=show;document.querySelector('header .actions').prepend(b);void consumeLink()}
return{init,show,async tokenFor(endpoint){const u=new URL(endpoint);const origin=u.origin.replace(/^ws/,'http');if(origin!==MATCH&&!(local&&origin===location.origin))return null;return access()},get signedIn(){return !!session}};
})();
