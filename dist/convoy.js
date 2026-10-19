'use strict';
// Private, real-time alpha. The server owns simulation; the client sends steering only.
const V=(()=>{
const DEFAULT_SERVER='wss://runroad-convoy-alpha.onrender.com/convoy';
let socket=null,active=false,id=0,room='',token='',endpoint='',latest=null,previous=null;
let received=0,raf=null,sendAt=0,paintAt=0,hudAt=0,seq=0,boost=false,rescue=false;
let crewAccess=null;
let closing=false,retryTimer=null,retryUntil=0,finished=false,started=false,warming=false,attempt=0,warmAbort=null;
const $v=id=>document.getElementById(id);
function status(text){$v('convoyStatus').textContent=text}
function send(data){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(data))}
function validateEndpoint(value){
  const u=new URL(value);
  if(u.username||u.password||u.hash||u.search)throw Error('Use a WebSocket URL without credentials or query parameters.');
  if(u.protocol!=='wss:'&&!(u.protocol==='ws:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname)))throw Error('Use wss:// for a remote server, or ws://localhost for local testing.');
  return u.href;
}
function show(){
  if(active)return;
  const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  $v('convoyEndpoint').value=local?`${location.protocol==='https:'?'wss':'ws'}://${location.host}/convoy`:DEFAULT_SERVER;
  $v('convoyCode').value='';
  status('Create a room and send its code to one friend. Both drivers must tap Ready. The free server may take about a minute to wake.');
  $v('convoyDialog').showModal();
}
async function connect(type){
  if(warming||socket&&socket.readyState<2)return;
  const request=++attempt;
  try{
    endpoint=validateEndpoint($v('convoyEndpoint').value.trim());
    room=$v('convoyCode').value.trim().toUpperCase();
    if(type==='join'&&!/^[0-9A-F]{8}$/.test(room))throw Error('Enter your friend’s eight-character room code.');
    closing=false;finished=false;started=false;seq=0;latest=previous=null;token='';retryUntil=0;
    warming=true;$v('convoyCreate').disabled=$v('convoyJoin').disabled=true;
    crewAccess=typeof Crew!=='undefined'?await Crew.tokenFor(endpoint):null;
    await warmServer(endpoint,request);
    if(request!==attempt)return;
    openSocket(type);status('Server ready · connecting both drivers…');
  }catch(e){if(request===attempt)status(e.message)}
  finally{if(request===attempt){warming=false;$v('convoyCreate').disabled=$v('convoyJoin').disabled=false}}
}
async function warmServer(value,request){
  const health=new URL(value);health.protocol=health.protocol==='wss:'?'https:':'http:';health.pathname='/health';
  const began=performance.now();
  while(request===attempt&&performance.now()-began<90000){
    status('Waking the free match server… '+Math.floor((performance.now()-began)/1000)+'s. The first connection can take about a minute.');
    const controller=new AbortController();warmAbort=controller;const timer=setTimeout(()=>controller.abort(),7000);
    try{
      const response=await fetch(health.href,{signal:controller.signal,credentials:'omit',cache:'no-store'});
      if(response.ok){const data=await response.json();if(data.status==='ok'){
        if(data.rules!==1)throw Error('VERSION_MISMATCH');return;
      }}
    }catch(e){if(e.message==='VERSION_MISMATCH')throw Error('Server version mismatch. Reload the game or update the server.');}
    finally{clearTimeout(timer);if(warmAbort===controller)warmAbort=null}
    if(request!==attempt)return;
    await new Promise(resolve=>setTimeout(resolve,2000));
  }
  if(request===attempt)throw Error('Server did not wake up. Check its deployment, allowed game origin and free-tier limits, then try again.');
}
function openSocket(type){
  const ws=new WebSocket(endpoint);socket=ws;
  const timer=setTimeout(()=>{if(ws.readyState!==WebSocket.OPEN){ws.close();status('Could not reach that server. Check its address and hosting status.')}},8000);
  ws.onopen=()=>{clearTimeout(timer);send({type,rules:1,code:room,token,...(crewAccess&&type!=='reconnect'?{accessToken:crewAccess}:{})})};
  ws.onmessage=e=>{
    try{
      if(e.data.length>20000)throw Error('Invalid server response.');
      const msg=JSON.parse(e.data);
      if(msg.type==='error'){status(msg.message);if(!active){closing=true;ws.close()}return}
      if(msg.type==='welcome'){
        if(msg.rules!==1)throw Error('Version mismatch. Reload the game.');
        id=msg.id;room=msg.code;token=msg.token;$v('convoyCode').value=room;
        if(!active)enter(msg);else{retryUntil=0;status('Reconnected. Your teammate is still here.');}
        receive(msg.state);return;
      }
      if(msg.type==='state'&&active)receive(msg);
    }catch{status('The match server returned an unsupported response.');closing=true;ws.close()}
  };
  ws.onerror=()=>{status('Connection unavailable. The match server must allow this game origin and use a valid TLS certificate.')};
  ws.onclose=()=>{
    clearTimeout(timer);if(socket!==ws||closing||finished)return;
    if(active&&token){
      if(!retryUntil)retryUntil=performance.now()+9000;
      if(performance.now()<retryUntil){status('Connection lost · trying to reconnect. Your car is slowing down.');retryTimer=setTimeout(()=>openSocket('reconnect'),700);}
      else finish(false,'Connection expired. Return to the garage and create a new convoy.');
    }else status('Connection closed. Check the server address, then create or join again.');
  };
}
function enter(msg){if(typeof Intro!=='undefined')Intro.leave();
  if(rafId!==null){cancelAnimationFrame(rafId);rafId=null}R.leave();R.configure('HW1-0-1');R.hideResults();active=true;finished=false;
  resize();C.close();S.reset();G.reset();initAudio();if(audio)audio.resume();
  obstacles.splice(0,obstacles.length,...msg.obstacles);G.invalidate();
  player={...msg.state.players[id]};cops=[];score=elapsed=0;wanted=1;cam={x:player.x,y:player.y};
  state='playing';pool.forEach(p=>p.life=0);$('menu').hidden=true;$('over').hidden=true;
  $('joystick').style.display='none';document.body.classList.add('playing','convoy-playing');
  $v('convoyDialog').close();$v('convoyLobby').hidden=false;$v('convoyRoomLabel').textContent=room;
  $v('convoyReady').disabled=false;$v('convoyReady').textContent='READY TO DRIVE';
  $v('convoyRescue').hidden=false;sendAt=paintAt=hudAt=0;received=performance.now();
  cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
}
function receive(s){
  if(!Array.isArray(s.players)||s.players.length>2||!s.players[id])return;
  previous=latest||s;latest=s;if(s.phase==='playing'&&previous.phase==='playing'){for(const driver of s.players){const before=previous.players.find(p=>p.id===driver.id);if(before&&before.hp<=0&&driver.hp>0){toast(driver.id===id?'YOUR FRIEND CAME BACK':'FRIEND RESCUED');sound(740,.2)}}}received=performance.now();
  const partner=s.players[1-id];
  if(s.phase==='lobby'){
    $v('convoyLobbyText').textContent=partner?`Driver ${id+1}: ${s.players[id].ready?'ready':'waiting'} · Driver ${2-id}: ${partner.ready?'ready':'waiting'}`:'Waiting for your friend. Send them this code and the same server address.';
  }else if(s.phase==='countdown')$v('convoyLobbyText').textContent=`Jun: “Stay together.” Leaving in ${s.countdown}…`;
  else if(s.phase==='playing'){started=true;$v('convoyLobby').hidden=true;}
  if(s.phase==='won'||s.phase==='lost'){finish(s.phase==='won',s.reason);crewReward(s.crewReward)}
}
function steering(){
  if(document.hidden||$('over').hidden===false)return null;
  if(pointer&&Math.hypot(stick.x,stick.y)>9)return Math.atan2(stick.y,stick.x);
  const x=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0);
  const y=(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0);
  return x||y?Math.atan2(y,x):null;
}
function interpolate(a,b,f){if(!a)return{...b};return{...b,x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,a:a.a+angleDiff(b.a,a.a)*f}}
function frame(t){
  if(!active)return;raf=requestAnimationFrame(frame);
  if(t-sendAt>=1000/15&&socket?.readyState===WebSocket.OPEN){
    const paused=!$('over').hidden||document.hidden;
    send({type:'input',seq:seq++,angle:steering(),boost:!paused&&boost,rescue:!paused&&(rescue||!!keys.r),idle:paused});boost=false;sendAt=t;
  }
  if(!latest||document.hidden)return;
  const f=Math.min(1,(t-received)/(1000/15));
  player=interpolate(previous?.players.find(p=>p.id===id),latest.players[id],f);
  cops=latest.cops.map(c=>interpolate(previous?.cops.find(p=>p.id===c.id),c,f));
  score=latest.score;elapsed=latest.time;wanted=Math.min(5,1+Math.floor(elapsed/25));
  const dt=1/60;cam.x+=(player.x+player.vx*.3-cam.x)*.12;cam.y+=(player.y+player.vy*.3-cam.y)*.12;
  if(t-paintAt>=1000/P.config.fps-.5){const begin=performance.now();G.tick(dt);render();P.observe(t-paintAt||16,performance.now()-begin,true);paintAt=t;}
  if(t-hudAt>=150){hud();drawHud();hudAt=t;}
}
function drawHud(){
  if(!latest)return;
  const ally=latest.players[1-id],collected=latest.supplies.filter(s=>s.taken).length;
  $('missionHud').hidden=finished||!started;
  const me=latest.players[id];
  const goal=ally&&ally.hp<=0?ally:collected===2?latest.exit:latest.supplies.filter(s=>!s.taken).sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y))[0];
  const bearing=goal?Math.atan2(goal.y-me.y,goal.x-me.x)*180/Math.PI+90:0;
  $('missionHud').innerHTML=`<div><b>CONVOY ${room} · DRIVER ${id+1}</b><span>${ally&&ally.hp<=0?'RETURN TO YOUR FRIEND · Hold RESCUE within 95m':collected<2?`SUPPLIES ${collected}/2 · Bring them home`:'BOTH DRIVERS → GREEN EXIT'}</span></div>${goal?`<div class="navigation-hint"><b style="transform:rotate(${bearing}deg)">↑</b><small>${Math.round(Math.hypot(goal.x-me.x,goal.y-me.y))}m</small></div>`:''}<strong>${Math.max(0,Math.ceil(120-latest.time))}s</strong>`;
  $('nitro').disabled=me.charge<40||me.boost>0||me.hp<=0;
  $('nitro').classList.toggle('ready',!$('nitro').disabled);
  $('nitro').querySelector('span').textContent=me.boost>0?'ϟ BOOSTING':me.charge>=40?'ϟ NITRO READY':'ϟ '+Math.floor(me.charge)+'%';
  $('nitro').querySelector('i').style.width=me.charge+'%';
  $('skillHud').querySelector('strong').textContent=ally?(ally.hp<=0?'ALLY STALLED · RESCUE':`ALLY · ${Math.round(Math.hypot(ally.x-me.x,ally.y-me.y))}m`):'WAITING FOR DRIVER 2';
  $('skillHud').querySelector('span').textContent=retryUntil?'Reconnecting…':ally&&!ally.connected?`Ally reconnecting · ${Math.max(0,10-ally.missing).toFixed(0)}s`:me.hp<=0?`You stalled · rescue in ${Math.max(0,18-me.stalled).toFixed(0)}s`:`${latest.rescues} shared rescue · hold near ally`;
  $v('convoyRescue').disabled=!latest.rescues||me.hp<=0||!ally||ally.hp>0; $v('convoyRescue').textContent=ally&&ally.hp<=0?`HOLD RESCUE · ${Math.round(ally.rescue/2*100)}%`:'ALLY SAFE';
}
function drawWorld(g){
  if(!active||!latest)return;
  for(const s of latest.supplies)if(!s.taken){g.fillStyle='#f2bd4d';g.fillRect(s.x-17,s.y-17,34,34);g.strokeStyle='#fff7c2';g.lineWidth=3;g.strokeRect(s.x-17,s.y-17,34,34);g.fillStyle='#293c40';g.font='bold 11px sans-serif';g.textAlign='center';g.fillText('SUPPLY',s.x,s.y+4)}
  const e=latest.exit;g.save();g.strokeStyle=latest.supplies.every(s=>s.taken)?'#80ffb5':'#8caaa2';g.lineWidth=5;g.beginPath();g.arc(e.x,e.y,e.r,0,TAU);g.stroke();g.fillStyle='#7cffad22';g.fill();g.fillStyle='#e4ffe9';g.font='bold 14px sans-serif';g.textAlign='center';g.fillText('HOME / BOTH CARS',e.x,e.y);g.restore();
  const b=latest.players[1-id];if(!b)return;
  const f=Math.min(1,(performance.now()-received)/(1000/15));const p=interpolate(previous?.players[1-id],b,f);
  g.save();g.globalAlpha=b.connected?1:.45;vehicle(p,true);g.strokeStyle=b.hp>0?'#7bffe1':'#ff7464';g.lineWidth=3;g.beginPath();g.arc(p.x,p.y,31,0,TAU);g.stroke();g.fillStyle=b.hp>0?'#b5ffef':'#ffb1a5';g.font='bold 12px sans-serif';g.textAlign='center';g.fillText(b.hp>0?'YOUR TEAMMATE':`RESCUE ${(b.rescue/2*100).toFixed(0)}%`,p.x,p.y-42);g.restore();
}
function crewReward(value){
  if(!finished||!latest||latest.phase!=='won')return;
  const text={pending:'Crew progress is saving… Keep this page open.',saved:'Crew escape saved. Refresh your crew garage to see shared progress.',checked:'Result confirmed. Open your crew garage to see shared progress.',failed:'Crew progress could not be saved. The escape is complete, but no saved reward is confirmed.',guest:'Guest escape. Both drivers must sign in for crew progress.'}[value]||'';
  $('summary').textContent=latest.reason+' '+text+' No campaign credits or paid rewards.';
}
function finish(won,reason){
  if(finished)return;finished=true;cancelAnimationFrame(raf);raf=null;
  if(engineGain)engineGain.gain.value=0;
  state='over';$('over').hidden=false;$('overTag').textContent='CONVOY ESCAPE · PRIVATE ALPHA';
  $('overTitle').textContent=won?'HOME. TOGETHER.':'ONE MORE ROAD.';
  $('finalScore').textContent=(latest?.score||0).toLocaleString();$('summary').textContent=reason+' No campaign credits or paid rewards.';
  $('resume').hidden=true;$('again').hidden=false;$('again').textContent='BACK TO GARAGE';$('again').onclick=()=>C.open('home');
  $v('convoyLobby').hidden=true;$v('convoyRescue').hidden=true;$('missionHud').hidden=true;
}
function pauseLive(){
  if(!active||finished)return;rescue=boost=false;Object.keys(keys).forEach(k=>keys[k]=false);pointer=null;stick={x:0,y:0};$('joystick').style.display='none';
  if(!$('over').hidden){$('over').hidden=true;return}
  $('over').hidden=false;$('overTag').textContent='LIVE MATCH CONTINUES';$('overTitle').textContent='TAKE A BREATHER';$('finalScore').textContent='';
  $('summary').textContent='Your car stops, but your teammate and the server keep driving. Return within 10 seconds after a lost connection.';
  $('again').hidden=true;$('resume').hidden=false;
}
function leave(){
  if(!active&&!socket)return;closing=true;clearTimeout(retryTimer);cancelAnimationFrame(raf);raf=null;
  send({type:'leave'});socket?.close();socket=null;active=false;latest=previous=null;token='';
  R.leave();crewAccess=null;rescue=boost=false;document.body.classList.remove('convoy-playing');
  $v('convoyLobby').hidden=true;$v('convoyRescue').hidden=true;
}
function init(){
  const button=$('rivalsButton');button.textContent='↗ PLAY WITH FRIENDS';button.onclick=show;
  const d=document.createElement('dialog');d.id='convoyDialog';d.innerHTML=`<form method="dialog"><button aria-label="Close Convoy Escape" class="convoy-close">✕</button></form><div class="eyebrow">NOBODY DRIVES HOME ALONE</div><h2>CONVOY <em>ESCAPE.</em></h2><p>Two real drivers. Two supply caches. One way home.<br>Distract pursuit and hold RESCUE near a stalled friend.</p><details class="convoy-connection"><summary>Connection settings</summary><label for="convoyEndpoint">MATCH SERVER</label><input id="convoyEndpoint" placeholder="wss://your-match-server/convoy" spellcheck="false" type="url"></details><label for="convoyCode">FRIEND’S ROOM CODE</label><input id="convoyCode" placeholder="Eight characters" maxlength="8" autocomplete="off"><div class="convoy-buttons"><button id="convoyCreate" class="primary">CREATE ROOM ↗</button><button id="convoyJoin" class="secondary">JOIN FRIEND</button></div><p id="convoyStatus" role="status"></p><button id="convoyCrew" class="secondary">COMMUNITY CREW GARAGE ↗</button><button id="convoyGhost" class="secondary">RIVAL ROUTES · RECORDED GHOSTS ↗</button><small>Live co-op on our free match server. Equal starter cars; no purchases or campaign rewards. Ghost challenges remain available offline.</small>`;document.body.append(d);
  const lobby=document.createElement('section');lobby.id='convoyLobby';lobby.hidden=true;lobby.innerHTML='<small>PRIVATE ROOM · SEND THIS CODE</small><strong id="convoyRoomLabel"></strong><p id="convoyLobbyText"></p><button id="convoyReady" class="primary">READY TO DRIVE</button><button id="convoyLeave" class="secondary">LEAVE CONVOY</button>';document.body.append(lobby);
  const r=document.createElement('button');r.id='convoyRescue';r.hidden=true;r.textContent='HOLD TO RESCUE';r.onpointerdown=e=>{r.setPointerCapture(e.pointerId);rescue=true};r.onpointerup=r.onpointercancel=()=>{rescue=false};document.body.append(r);
  d.addEventListener('close',()=>{if(!active){attempt++;warming=false;warmAbort?.abort();$v('convoyCreate').disabled=$v('convoyJoin').disabled=false;closing=true;socket?.close();socket=null}});
  $('convoyCreate').onclick=()=>connect('create');$('convoyJoin').onclick=()=>connect('join');
  $('convoyCrew').onclick=()=>{d.close();Crew.show()};$('convoyGhost').onclick=()=>{d.close();R.show()};$('convoyReady').onclick=()=>{send({type:'ready'});$('convoyReady').disabled=true;$('convoyReady').textContent='WAITING FOR YOUR FRIEND'};
  $('convoyLeave').onclick=()=>C.open('home');
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){rescue=boost=false;send({type:'input',seq:seq++,angle:null,boost:false,rescue:false,idle:true})}});
}
return{init,show,leave,drawWorld,pause:pauseLive,get active(){return active},boost(){if(active&&!finished){boost=true;return true}return false},validateEndpoint};
})();
