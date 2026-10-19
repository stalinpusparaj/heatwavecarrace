'use strict';
const P=(()=>{
const nav=typeof navigator==='undefined'?{}:navigator;
const weak=(nav.deviceMemory&&nav.deviceMemory<=2)||(nav.hardwareConcurrency&&nav.hardwareConcurrency<=4)||nav.connection?.saveData;
const strong=nav.deviceMemory>=8&&nav.hardwareConcurrency>=8;
const mobile=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches;
const ceiling=weak?1:2,initial=weak?0:mobile?1:strong?2:1;
const profiles=[{name:'Eco',fps:30,dpr:1,pixels:600000,terrain:768,particles:32,marks:40,fx:.35,detail:.35,hud:.25},{name:'Balanced',fps:60,dpr:1.5,pixels:1200000,terrain:1024,particles:64,marks:80,fx:.65,detail:.65,hud:.16},{name:'High',fps:60,dpr:2,pixels:2000000,terrain:1536,particles:110,marks:140,fx:1,detail:1,hud:.1}];
let mode='auto',tier=initial,slow=0,fast=0,warmup=120,work=0,gap=16.7,count=0,paints=0,windowMs=0,actualFps=0,listener=null;
try{const stored=localStorage.getItem('heatwave-quality');if(['auto','eco','balanced','high'].includes(stored))mode=stored}catch{}
if(mode!=='auto')tier={eco:0,balanced:1,high:2}[mode];
const current=()=>profiles[tier];
function apply(next){tier=next;slow=fast=0;warmup=90;if(typeof document!=='undefined'){document.body.dataset.quality=String(tier);document.body.dataset.graphics=mode}if(listener)listener()}
function setMode(next){if(!['auto','eco','balanced','high'].includes(next))return;mode=next;try{localStorage.setItem('heatwave-quality',mode)}catch{}apply(mode==='auto'?initial:{eco:0,balanced:1,high:2}[mode])}
function init(){const select=document.createElement('select');select.id='graphics';select.setAttribute('aria-label','Graphics quality');select.innerHTML='<option value="auto">Auto</option><option value="eco">Eco · 30 FPS</option><option value="balanced">Balanced · 60 FPS</option><option value="high">High · 60 FPS</option>';select.value=mode;select.onchange=()=>setMode(select.value);document.querySelector('.actions').prepend(select);document.body.dataset.quality=String(tier);document.body.dataset.graphics=mode;}
function pixelRatio(w,h,deviceRatio){return Math.min(deviceRatio||1,current().dpr,Math.sqrt(current().pixels/Math.max(1,w*h)))}
function reset(){slow=fast=count=paints=windowMs=0;warmup=120;work=0;gap=16.7;}
function observe(deltaMs,workMs,painted){if(deltaMs>100||deltaMs<=0)return;gap=gap*.97+deltaMs*.03;if(painted)work=work*.94+workMs*.06;windowMs+=deltaMs;paints+=painted?1:0;if(windowMs>=1000){actualFps=Math.round(paints*1000/windowMs);paints=windowMs=0}if(mode!=='auto'||warmup-->0)return;const overloaded=gap>24||work>(tier===0?23:14);slow=overloaded?slow+1:Math.max(0,slow-2);fast=gap<18.5&&work<6?fast+1:0;if(slow>=100&&tier>0)apply(tier-1);else if(fast>=900&&tier<ceiling)apply(tier+1);count++;}
function text(el,value){if(el.textContent!==value)el.textContent=value}
return{init,setMode,pixelRatio,reset,observe,text,onChange(fn){listener=fn},get mode(){return mode},get tier(){return tier},get config(){return current()},get fps(){return actualFps},get metrics(){return{mode,tier,renderMs:work,frameMs:gap,fps:actualFps}}};
})();
