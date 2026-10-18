'use strict';
// Bounded skill feedback: no rendering allocations, no paid boosts or energy gates.
const S=(()=>{
let charge=50,active=0,cooldown=0,chain=0,chainTime=0,drift=0,near=0,peak=0,ui=0,markClock=0,cursor=0;
const marks=Array.from({length:140},()=>({life:0,x:0,y:0,a:0}));
function reset(){charge=50;active=cooldown=chain=chainTime=drift=near=peak=ui=markClock=cursor=0;marks.forEach(m=>m.life=0)}
function init(){const button=document.createElement('button');button.id='nitro';button.setAttribute('aria-label','Activate nitro boost');button.innerHTML='<span>ϟ NITRO</span><small>SHIFT / TAP</small><i></i>';button.onclick=boost;document.body.append(button);const meter=document.createElement('div');meter.id='skillHud';meter.innerHTML='<strong>DRIVE WITH STYLE</strong><span>Drift. Dodge. Charge your escape.</span>';document.body.append(meter)}
function boost(){if(state!=='playing'||charge<40||active>0||cooldown>0)return false;charge-=40;active=1.5;cooldown=2.2;shake=2;sound(420,.25,'sawtooth',.035);toast('NITRO · MAKE YOUR ESCAPE');return true}
function event(type){chain=chainTime>0?Math.min(5,chain+1):1;chainTime=5;peak=Math.max(peak,chain);charge=Math.min(100,charge+(type==='near'?22:12));if(type==='near')near++;return Math.max(1,chain)}
function breakChain(){chain=0;chainTime=0}
function tick(dt){active=Math.max(0,active-dt);cooldown=Math.max(0,cooldown-dt);chainTime-=dt;if(chainTime<=0)chain=0;charge=Math.min(100,charge+dt*1.5);const slip=Math.abs(angleDiff(player.a,Math.atan2(player.vy,player.vx)));const drifting=slip>.22&&slip<1.25&&Math.hypot(player.vx,player.vy)>115;if(drifting){drift+=dt;charge=Math.min(100,charge+dt*8);score+=dt*18*Math.max(1,chain);markClock-=dt;if(markClock<=0){markClock=.055;const m=marks[cursor++%marks.length];m.x=player.x;m.y=player.y;m.a=player.a;m.life=4}}for(const m of marks)if(m.life>0)m.life-=dt;ui-=dt;if(ui<=0){ui=.1;const b=$('nitro'),h=$('skillHud');b.disabled=charge<40||active>0||cooldown>0;b.classList.toggle('ready',!b.disabled);b.classList.toggle('boosting',active>0);b.querySelector('i').style.width=charge+'%';b.querySelector('span').textContent=active>0?'ϟ BOOSTING':charge>=40?'ϟ NITRO READY':'ϟ '+Math.floor(charge)+'%';h.querySelector('strong').textContent=chain>1?'STYLE CHAIN ×'+chain:drifting?'DRIFT +'+Math.floor(drift*18):'MAKE YOUR ESCAPE';h.querySelector('span').textContent=chain>0?'Link wrecks & near misses · '+Math.max(0,chainTime).toFixed(1)+'s':drifting?'Drift is charging nitro':'Drift & dodge to charge nitro';}}
function draw(ctx){for(const m of marks)if(m.life>0){ctx.save();ctx.translate(m.x,m.y);ctx.rotate(m.a);ctx.globalAlpha=m.life/4*.23;ctx.fillStyle='#26363e';ctx.fillRect(-7,-13,13,3);ctx.fillRect(-7,10,13,3);ctx.restore()}}
function reward(){return Math.min(120,Math.floor(drift*2)+near*6+peak*3)}
return{init,reset,tick,draw,event,boost,breakChain,reward,get active(){return active},get speed(){return active>0?1.38:1},get charge(){return charge},get chain(){return chain}};
})();
