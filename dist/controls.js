'use strict';
// Optional solo brake. Competitive modes retain their original input/physics rules.
const Controls=(()=>{
let held=false;
function allowed(){return !(typeof R!=='undefined'&&R.active)&&!(typeof V!=='undefined'&&V.active)}
function factor(){return allowed()&&(held||keys.b||keys.B)?0:1}
function sync(){const b=document.getElementById('brake');if(b)b.disabled=!allowed();const map=document.getElementById('routeMap');if(!map)return;map.hidden=!allowed()||state!=='playing';if(map.hidden)return;const g=map.getContext('2d');g.clearRect(0,0,88,88);g.fillStyle='#182c3b';g.fillRect(0,0,88,88);const xy=v=>44+v/1450*80;g.fillStyle='#8f8065';for(const o of obstacles){g.beginPath();g.arc(xy(o.x),xy(o.y),Math.max(1.5,o.r/1450*80),0,Math.PI*2);g.fill()}let goal=null;if(typeof Intro!=='undefined'&&Intro.active)goal=Intro.testState.target;else if(typeof Rescue!=='undefined'&&Rescue.active&&Rescue.phase!=='objective')goal=Rescue.phase==='return'?Rescue.home:Rescue.targets.find(p=>!p.taken);else{const layout=C.auditLayout();if(C.mission().type==='route')goal=layout.points[layout.checkpoint];else{let nearest=Infinity;for(const p of layout.points)if(!p.taken){const d=Math.hypot(p.x-player.x,p.y-player.y);if(d<nearest){nearest=d;goal=p}}}}if(goal){g.strokeStyle='#77dfbe';g.beginPath();g.moveTo(xy(player.x),xy(player.y));g.lineTo(xy(goal.x),xy(goal.y));g.stroke();g.fillStyle='#ffe1a3';g.fillRect(xy(goal.x)-3,xy(goal.y)-3,6,6)}g.save();g.translate(xy(player.x),xy(player.y));g.rotate(player.a);g.fillStyle='#fff';g.beginPath();g.moveTo(5,0);g.lineTo(-3,-3);g.lineTo(-3,3);g.closePath();g.fill();g.restore()}

function release(){held=false;const b=document.getElementById('brake');if(b)b.classList.remove('held')}
function init(){const b=document.createElement('button');b.id='brake';b.textContent='HOLD BRAKE';b.setAttribute('aria-label','Hold to brake in solo missions');b.onpointerdown=e=>{if(state!=='playing'||!allowed())return;held=true;b.classList.add('held');b.setPointerCapture(e.pointerId);e.preventDefault()};b.onpointerup=b.onpointercancel=b.onlostpointercapture=release;document.body.append(b);const s=document.createElement('aside');s.id='boardingStatus';s.hidden=true;s.setAttribute('role','status');document.body.append(s);const map=document.createElement('canvas');map.id='routeMap';map.width=map.height=88;map.hidden=true;map.setAttribute('aria-label','Route map: white arrow is your car, amber square is the destination');document.body.append(map);addEventListener('blur',release);
// Result and pause screens hide the in-run HUD so nothing overlaps the card.
const over=document.getElementById('over');if(over&&typeof MutationObserver==='function'){const sync=()=>document.body.classList.toggle('overlay-open',!over.hidden);new MutationObserver(sync).observe(over,{attributes:true,attributeFilter:['hidden']});sync()}document.addEventListener('visibilitychange',release)}
// Solo-only player handling: quicker grip and steering, a firmer brake, and extra drift charge to offset the reduced slip.
function braking(){return held||keys.b||keys.B}
function grip(){return !allowed()?3.5:braking()?9:6}
function turn(){return !allowed()?1:braking()?1.6:1.25}
function driftCharge(){return allowed()?1.5:1}
return{init,factor,release,sync,grip,turn,driftCharge};
})();
