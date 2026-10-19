'use strict';
// Procedural people, portraits and home bases. Canvas shapes only: no image downloads.
const People=(()=>{
const skins=['#f3d5bb','#e2b590','#c98f66','#a46b45','#7b4b2d','#5b3621'],hairs=['#241913','#3f281a','#6e4428','#b0814a','#cfc3ad','#161820'];
const shirts=['#3f7fb5','#b8464b','#4f8a5b','#8a5fb0','#d08a3a','#3b9ea0','#c2566f','#5d6b85'];
const fixed={Mara:{skin:'#c98f66',hair:'#241913',style:'pony',shirt:'#f36633',pants:'#2f3a4a',role:'driver'},Jun:{skin:'#e2b590',hair:'#161820',style:'short',shirt:'#e9bb43',pants:'#33415a',role:'mechanic'}};
function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function look(name,role='',seed=0){if(fixed[name])return {...fixed[name],name};const h=hash(name+':'+seed);return {name,role,skin:skins[h%6],hair:hairs[(h>>>3)%6],style:['short','long','bun','curly'][(h>>>6)%4],shirt:shirts[(h>>>9)%8],pants:['#2f3a4a','#4a3b2f','#2d4038','#3b3550'][(h>>>12)%4]}}
const homes=[
{label:'GARAGE',wall:'#b98f62',roof:'#9d5434',ridge:'#c7744a',door:'#6c6f6c',trim:'#f4d39a'},
{label:'SHELTER',wall:'#8a6a52',roof:'#e9f2f4',ridge:'#b9cad2',door:'#5a4436',trim:'#ffe2a6'},
{label:'CLINIC',wall:'#d7e1e6',roof:'#3c4a62',ridge:'#5c6f8c',door:'#4d6a7a',trim:'#6ff2ff'},
{label:'WORKSHOP',wall:'#6d5a52',roof:'#3a2f30',ridge:'#5b4744',door:'#3f3a38',trim:'#ffb35c'},
{label:'HOME',wall:'#c9b48a',roof:'#5f7f4f',ridge:'#86a56d',door:'#6b4e36',trim:'#ffe7a8'}];
const cache={};
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function glow(g,x,y,r,color,alpha){const q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,color);q.addColorStop(1,color.slice(0,7)+'00');g.save();g.globalAlpha=alpha;g.globalCompositeOperation='lighter';g.fillStyle=q;g.fillRect(x-r,y-r,r*2,r*2);g.restore()}
// Role marks keep 50 recurring helpers readable at gameplay scale.
function roleMark(g,role){
if(role==='medic'){g.fillStyle='#fff';g.fillRect(-2,-24,4,9);g.fillRect(-4.5,-21.5,9,4);g.fillStyle='#d63b3b';g.fillRect(-1,-23,2,7);g.fillRect(-3.5,-20.5,7,2)}
else if(role==='rescue volunteer'||role==='delivery driver'){g.fillStyle=role==='rescue volunteer'?'#ff8a2a':'#e6c34a';g.fillRect(-7,-26,4,13);g.fillRect(3,-26,4,13);g.fillStyle='#f4f6e8';g.fillRect(-7,-19,14,2)}
else if(role==='ferry operator'){g.fillStyle='#ff7a2f';g.fillRect(-7,-27,14,9)}
else if(role==='shelter cook'){g.fillStyle='#f4efe6';g.fillRect(-5,-22,10,10)}
else if(role==='caregiver'){g.fillStyle='#e9707f';g.fillRect(-7,-27,14,3)}}
function hat(g,role,look){
if(role==='bridge worker'){g.fillStyle='#f2c230';g.beginPath();g.arc(0,-34,7.2,Math.PI,0);g.fill();g.fillRect(-8.5,-34.5,17,2);return true}
if(role==='mechanic'||role==='delivery driver'){g.fillStyle=role==='mechanic'?'#3d5f86':'#b8463c';g.beginPath();g.arc(0,-34,6.8,Math.PI,0);g.fill();g.fillRect(-1,-35,9,2.2);return true}
return false}
// Upright figure seen in three-quarter view, feet at (x,y). mood: waiting | home | idle.
function person(g,x,y,t,lk,mood='waiting',scale=1.7){
g.save();g.translate(x,y);
if(mood==='waiting'){const p=(t*.8)%1;g.strokeStyle='#ffd173';g.globalAlpha=(1-p)*.8;g.lineWidth=2.5;g.beginPath();g.ellipse(0,0,10+p*34,(10+p*34)*.45,0,0,6.29);g.stroke();g.globalAlpha=1}
g.scale(scale,scale);
g.fillStyle='#0b121c55';g.beginPath();g.ellipse(0,0,11,4,0,0,6.29);g.fill();
const bob=mood==='home'?Math.abs(Math.sin(t*6))*2:0;g.translate(0,-bob);
g.fillStyle=lk.pants;g.fillRect(-5,-14,4,13);g.fillRect(1,-14,4,13);g.fillStyle='#1d1f24';g.fillRect(-5.5,-2,5,2.5);g.fillRect(.5,-2,5,2.5);
g.fillStyle=lk.shirt;rr(g,-7,-28,14,15,4);g.fill();roleMark(g,lk.role);
g.strokeStyle=lk.shirt;g.lineCap='round';g.lineWidth=3.6;
const wave=mood==='waiting'?-2.5+Math.sin(t*7)*.45:mood==='home'?-2.7+Math.sin(t*9)*.25:-1.5;
const arm=(sx,a,len)=>{g.beginPath();g.moveTo(sx,-25);const hx=sx+Math.cos(a)*len,hy=-25+Math.sin(a)*len;g.lineTo(hx,hy);g.stroke();g.fillStyle=lk.skin;g.beginPath();g.arc(hx,hy,2,0,6.29);g.fill();return [hx,hy]};
arm(-6,mood==='home'?-Math.PI-wave:1.9,10);const hand=arm(6,mood==='idle'?1.25:wave,11);
g.fillStyle=lk.skin;g.fillRect(-2,-31,4,4);g.beginPath();g.arc(0,-34,6.4,0,6.29);g.fill();
if(!hat(g,lk.role,lk)){g.fillStyle=lk.hair;g.beginPath();g.arc(0,-35,6.6,Math.PI*1.02,Math.PI*1.98);g.fill();
if(lk.style==='long')g.fillRect(-6.6,-36,3,9),g.fillRect(3.6,-36,3,9);else if(lk.style==='bun'){g.beginPath();g.arc(0,-42,3,0,6.29);g.fill()}else if(lk.style==='pony'){g.beginPath();g.arc(6,-33,2.6,0,6.29);g.fill()}else if(lk.style==='curly')for(let i=-1;i<=1;i++){g.beginPath();g.arc(i*4,-39.5,2.8,0,6.29);g.fill()}}
g.fillStyle='#1b1714';g.fillRect(-2.6,-34.5,1.3,1.6);g.fillRect(1.3,-34.5,1.3,1.6);
if(mood==='home'){g.strokeStyle='#5b2f25';g.lineWidth=.9;g.beginPath();g.arc(0,-32.2,1.8,.2,Math.PI-.2);g.stroke()}
g.restore();
if(mood==='waiting'){const hx=x+hand[0]*scale,hy=y+(hand[1]-bob)*scale;g.fillStyle='#fffbe8';g.beginPath();g.arc(hx,hy,1.8,0,6.29);g.fill();glow(g,hx,hy,15+Math.sin(t*9)*2,'#fff1b8',.32)}}
function tag(g,x,y,text,color='#ffd173'){g.save();g.font='bold 11px sans-serif';const w=g.measureText(text).width+16;g.fillStyle='#0f1b2bdd';rr(g,x-w/2,y-10,w,20,10);g.fill();g.strokeStyle=color;g.lineWidth=1.5;g.stroke();g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText(text,x,y+.5);g.restore()}
function crate(g,x,y,t){g.save();g.translate(x,y);g.fillStyle='#0b121c55';g.beginPath();g.ellipse(2,4,19,7,0,0,6.29);g.fill();g.fillStyle='#8a6232';g.fillRect(-16,-14,32,18);g.fillStyle='#c9944d';g.fillRect(-16,-22,32,10);g.fillStyle='#5d4022';g.fillRect(-3,-22,6,26);g.fillStyle='#fff';g.fillRect(6,-10,8,8);g.fillStyle='#d63b3b';g.fillRect(9,-9,2,6);g.fillRect(7,-7,6,2);g.restore();glow(g,x,y-10,26+Math.sin(t*5)*4,'#ffd173',.35)}
// Static building art is cached per world and lit-window count; glow and smoke stay live.
function bake(w,lit){const k=w+':'+lit;if(cache[k])return cache[k];const c=document.createElement('canvas');c.width=300;c.height=240;const g=c.getContext('2d');g.scale(2,2);g.translate(75,62);const h=homes[w];
g.fillStyle='#0b121c40';rr(g,-50,-34,108,62,6);g.fill();
g.fillStyle=h.wall;g.fillRect(-50,-8,100,30);g.fillStyle='#00000022';g.fillRect(-50,18,100,4);
g.fillStyle=h.roof;g.beginPath();g.moveTo(-56,-6);g.lineTo(-46,-42);g.lineTo(46,-42);g.lineTo(56,-6);g.closePath();g.fill();
g.strokeStyle=h.ridge;g.lineWidth=2;g.beginPath();g.moveTo(-50,-24);g.lineTo(50,-24);g.stroke();g.globalAlpha=.25;g.lineWidth=1;for(let i=-40;i<=40;i+=8){g.beginPath();g.moveTo(i*1.1,-6);g.lineTo(i,-42);g.stroke()}g.globalAlpha=1;
if(w===1){g.fillStyle='#ffffff';for(let i=-48;i<48;i+=12){g.beginPath();g.arc(i+6,-6,6,0,Math.PI);g.fill()}g.fillStyle='#6b5a4e';g.fillRect(28,-52,9,16)}
const door=w===0||w===3;g.fillStyle=h.door;if(door){g.fillRect(-18,-4,36,26);g.strokeStyle='#00000040';for(let y=0;y<22;y+=4){g.beginPath();g.moveTo(-18,y);g.lineTo(18,y);g.stroke()}}else{g.fillRect(-8,0,16,22);g.fillStyle=h.trim;g.fillRect(4,10,2,2)}
for(let i=0;i<4;i++){const x=i<2?-44+i*12:24+(i-2)*12;g.fillStyle=i<lit?'#ffd98a':'#26303d';g.fillRect(x,2,9,9);g.fillStyle='#00000030';g.fillRect(x+4,2,1,9)}
g.fillStyle='#1b2433';rr(g,-24,-50,48,13,3);g.fill();g.fillStyle=lit?h.trim:'#8a96a6';g.font='bold 9px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(h.label,0,-43.5);
if(w===0){g.fillStyle='#c64a36';g.fillRect(56,2,9,18);g.fillStyle='#f4e3c0';g.fillRect(57.5,5,6,5)}
if(w===2){g.strokeStyle=h.trim;g.lineWidth=1.5;g.strokeRect(-50,-8,100,30);g.fillStyle='#fff';g.fillRect(-45,-37,14,14);g.fillStyle='#e04646';g.fillRect(-40,-35,4,10);g.fillRect(-43,-32,10,4)}
if(w===4){for(const x of [-60,60]){g.fillStyle='#2f5b34';g.beginPath();g.arc(x,14,9,0,6.29);g.fill();g.fillStyle='#4f8a4f';g.beginPath();g.arc(x-2,11,6,0,6.29);g.fill()}}
return cache[k]=c}
// Home base drawn behind its arrival pad. lit: 0–4 windows; guests: people waiting outside.
function home(g,x,y,w,lit,t,guests=[],arriving=false){
g.save();g.fillStyle='#ffffff14';rr(g,x-58,y-40,116,80,14);g.fill();g.strokeStyle=arriving?'#74ddbe':'#ffffff30';g.lineWidth=arriving?4:2;g.setLineDash([10,8]);g.stroke();g.setLineDash([]);g.restore();
const k=1.6,bx=x,by=y+112;g.save();g.translate(bx,by);g.scale(k,k);g.drawImage(bake(w,lit),-75,-62,150,120);
const h=homes[w];glow(g,0,-6,30+(arriving?Math.sin(t*6)*6:0),h.trim+'ff',lit?.55:.2);
for(let i=0;i<lit;i++){const wx=i<2?-40+i*12:28+(i-2)*12;glow(g,wx,6,14,'#ffd98aff',.25)}
if(w===1)for(let i=0;i<3;i++){const p=(t*.35+i/3)%1;g.fillStyle='#e8eef2';g.globalAlpha=(1-p)*.5;g.beginPath();g.arc(32+p*10,-56-p*30,4+p*6,0,6.29);g.fill()}g.globalAlpha=1;
if(w===3)glow(g,Math.cos(t*4)*4-30,-46,18,'#ff9a3cff',.6);
// Supporter collection perk: string lights along the eaves.
if(typeof Progression!=='undefined'&&Progression.supporter){g.strokeStyle='#2a2522';g.lineWidth=.8;g.beginPath();g.moveTo(-54,-6);for(let i=1;i<=10;i++)g.quadraticCurveTo(-54+i*10.8-5.4,-1,-54+i*10.8,-6);g.stroke();const bulbs=['#ffd56b','#ff8fb1','#7fe0c0','#9fc4ff'];for(let i=0;i<20;i++){const bx2=-52+i*5.4,by2=-6+Math.sin((i%2)*Math.PI/2)*3.5,on=(Math.sin(t*3+i)+1)/2;g.fillStyle=bulbs[i%4];g.globalAlpha=.55+on*.45;g.beginPath();g.arc(bx2,by2,1.4,0,6.29);g.fill()}g.globalAlpha=1;glow(g,0,-4,46,'#ffd56bff',.18)}
g.restore();
guests.slice(0,3).forEach((lk,i)=>person(g,bx+[-66,58,82][i],by+44,t+i,lk,arriving?'home':'idle',1.3))}
// Bust portrait for dialogs and results. mood: worried | happy.
function portrait(lk,mood='worried',size=96,bg='#22364d'){
const c=document.createElement('canvas');c.width=c.height=size*2;c.className='story-portrait';c.setAttribute('role','img');c.setAttribute('aria-label',lk.name+' portrait');
const g=c.getContext('2d');g.scale(size/25,size/25);
const back=g.createRadialGradient(25,20,4,25,25,30);back.addColorStop(0,'#ffd9a0');back.addColorStop(.25,bg);back.addColorStop(1,'#0c1726');g.fillStyle=back;g.fillRect(0,0,50,50);
g.fillStyle=lk.shirt;g.beginPath();g.moveTo(5,50);g.quadraticCurveTo(7,36,25,35);g.quadraticCurveTo(43,36,45,50);g.fill();
if(lk.role==='rescue volunteer'||lk.role==='delivery driver'){g.fillStyle=lk.role==='rescue volunteer'?'#ff8a2a':'#e6c34a';g.fillRect(11,38,7,12);g.fillRect(32,38,7,12);g.fillStyle='#f4f6e8';g.fillRect(11,44,7,2);g.fillRect(32,44,7,2)}
if(lk.role==='ferry operator'){g.fillStyle='#ff7a2f';g.beginPath();g.moveTo(12,50);g.lineTo(16,37);g.lineTo(34,37);g.lineTo(38,50);g.fill()}
if(lk.role==='medic'){g.strokeStyle='#2a2d33';g.lineWidth=1.2;g.beginPath();g.moveTo(19,37);g.quadraticCurveTo(18,46,25,47);g.quadraticCurveTo(32,46,31,37);g.stroke();g.fillStyle='#b9c3cc';g.beginPath();g.arc(25,47,1.6,0,6.29);g.fill()}
if(lk.role==='caregiver'){g.fillStyle='#e9707f';g.fillRect(16,35,18,3.5)}
if(lk.role==='shelter cook'){g.strokeStyle='#f4efe6';g.lineWidth=2;g.beginPath();g.moveTo(19,50);g.lineTo(19,38);g.moveTo(31,50);g.lineTo(31,38);g.stroke()}
g.fillStyle=lk.skin;g.fillRect(22,29,6,7);
if(lk.style==='long'){g.fillStyle=lk.hair;g.beginPath();g.ellipse(25,24,11,14,0,0,6.29);g.fill()}
g.fillStyle=lk.skin;g.beginPath();g.ellipse(25,22,8.5,10,0,0,6.29);g.fill();g.beginPath();g.arc(16.6,23,1.8,0,6.29);g.arc(33.4,23,1.8,0,6.29);g.fill();
g.fillStyle=lk.hair;const hatOn=lk.role==='bridge worker'||lk.role==='mechanic'&&lk.name!=='Jun';
if(hatOn){g.fillStyle=lk.role==='bridge worker'?'#f2c230':'#3d5f86';g.beginPath();g.arc(25,17,9.5,Math.PI,0);g.fill();g.fillRect(14,16,22,2.6)}
else{g.beginPath();g.ellipse(25,15.5,9,5.5,0,Math.PI,0);g.fill();g.beginPath();g.moveTo(16,17);g.quadraticCurveTo(22,10,34,17);g.quadraticCurveTo(26,14,16,19);g.fill();
if(lk.style==='bun'){g.beginPath();g.arc(25,8,3.6,0,6.29);g.fill()}if(lk.style==='curly')for(let i=0;i<5;i++){g.beginPath();g.arc(17.5+i*3.8,12.5+Math.abs(2-i)*.8,3,0,6.29);g.fill()}if(lk.style==='pony'){g.beginPath();g.ellipse(34.5,22,2.6,6,.3,0,6.29);g.fill()}}
if(lk.role==='radio volunteer'){g.strokeStyle='#30343c';g.lineWidth=1.6;g.beginPath();g.arc(25,21,10,Math.PI*1.1,Math.PI*1.9);g.stroke();g.fillStyle='#30343c';g.fillRect(15,20,3,5);g.fillRect(32,20,3,5)}
const brow=mood==='worried'?1:-.4;g.strokeStyle=lk.hair==='#cfc3ad'?'#8d826f':'#2a1d16';g.lineWidth=1;g.beginPath();g.moveTo(19.5,18.6+brow*.2);g.lineTo(23,18.6-brow);g.moveTo(30.5,18.6+brow*.2);g.lineTo(27,18.6-brow);g.stroke();
g.fillStyle='#fff';g.beginPath();g.ellipse(21.3,21.6,1.9,1.4,0,0,6.29);g.ellipse(28.7,21.6,1.9,1.4,0,0,6.29);g.fill();g.fillStyle='#2b1d14';g.beginPath();g.arc(21.4,21.7,1,0,6.29);g.arc(28.8,21.7,1,0,6.29);g.fill();
if(lk.role==='teacher'){g.strokeStyle='#30343c';g.lineWidth=.8;g.beginPath();g.arc(21.3,21.7,2.7,0,6.29);g.moveTo(31.4,21.7);g.arc(28.7,21.7,2.7,0,6.29);g.moveTo(24,21.7);g.lineTo(26,21.7);g.stroke()}
g.strokeStyle='#00000030';g.beginPath();g.moveTo(25,22.5);g.lineTo(24.2,25.6);g.lineTo(25.6,25.8);g.stroke();
g.strokeStyle='#7a3b30';g.lineWidth=1.1;g.beginPath();if(mood==='happy'){g.arc(25,26.6,3.2,.25,Math.PI-.25);g.stroke();g.fillStyle='#ff8f8f33';g.beginPath();g.arc(19.5,25.5,2.2,0,6.29);g.arc(30.5,25.5,2.2,0,6.29);g.fill()}else{g.moveTo(22.6,29.2);g.quadraticCurveTo(25,28.2,27.4,29.2);g.stroke()}
return c}
return {look,person,tag,crate,home,portrait,homes};
})();
