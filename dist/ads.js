'use strict';
// Opt-in rewarded ads. Only the Android app exposes the native ad bridge; the web build shows no ad buttons.
// A reward is granted once, and only after the SDK's earned-reward callback for the matching token.
const Ads=(()=>{
let ready=false,privacy=false,pending=null,seq=0;const listeners=new Set();
const bridge=()=>typeof window!=='undefined'?window.RunroadAds:null;
function notify(){listeners.forEach(f=>f())}
function receive(raw){let m;try{m=JSON.parse(raw)}catch{return}
if(m.type==='ads'){ready=!!m.ready;privacy=!!m.privacy;notify();return}
if(m.type!=='ad'||!pending||m.token!==pending.token)return;
if(m.event==='reward'&&!pending.earned){pending.earned=true;pending.onReward()}
else if(m.event==='closed'||m.event==='unavailable'){const p=pending;pending=null;p.onClose(p.earned);notify()}}
function init(){const b=bridge();if(!b)return;b.onmessage=e=>receive(e.data);b.postMessage(JSON.stringify({type:'state'}))}
function show(onReward,onClose){const b=bridge();if(!b||!ready||pending)return false;pending={token:'r'+Date.now().toString(36)+(++seq),earned:false,onReward,onClose};ready=false;b.postMessage(JSON.stringify({type:'show',token:pending.token}));return true}
function privacyChoices(){bridge()?.postMessage(JSON.stringify({type:'privacy'}))}
return{init,show,privacyChoices,watch:f=>{listeners.add(f);return()=>listeners.delete(f)},get ready(){return ready},get privacy(){return privacy},get available(){return !!bridge()}};
})();
