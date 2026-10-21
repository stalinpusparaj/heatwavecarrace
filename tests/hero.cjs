const fs=require('fs'),vm=require('vm'),assert=require('assert');
// The hero layer: every rescue gets a personal call, a pickup cheer and praise, and the hero rank grows to 500.
const s={Math,setTimeout,navigator:{},C:{data:{rescueClears:{}}},globalThis:null};s.globalThis=s;vm.createContext(s);
vm.runInContext(fs.readFileSync('dist/hero.js','utf8')+'\nthis.H=Hero',s);const H=s.H;
let prev=null;
for(let w=0;w<5;w++)for(let l=1;l<=100;l++){const e={world:w,level:l,name:'Ada',site:'Old Pump',finale:l%10===0,chapter:Math.ceil(l/10),chapterTitle:'The Test'};
  const call=H.call(e),cheer=H.pickup(e,'Ada'),head=H.head(e,'Desert County');
  for(const t of [call,cheer,head])assert.ok(t&&!/[{}]|undefined/.test(t),`world ${w} level ${l}: hero text filled`);
  assert.ok(head.includes('ADA’S HERO'),'result names the hero');
  if(prev&&!e.finale&&l%10!==1)assert.notEqual(head,prev,`world ${w} level ${l}: praise differs from the level before`);prev=head}
assert.equal(H.rankOf(0).name,'Rookie Driver');assert.equal(H.rankOf(1).name,'First Responder');assert.equal(H.rankOf(500).name,'Hero of Every Road');assert.equal(H.rankOf(500).next,null);
assert.equal(H.rankOf(7).next.need,3,'7 rescues: 3 more to Road Guardian');
H.mark(9,10);assert.ok(H.last.up&&H.last.fresh,'10th rescue ranks up');H.mark(10,10);assert.ok(!H.last.up&&!H.last.fresh,'replays do not rank up');
for(let i=0;i<10;i++)s.C.data.rescueClears['0-'+(i+1)]=true;H.mark(9,10);
const foot=H.foot(10,'Desert County');assert.ok(foot.includes('NEW HERO RANK')&&foot.includes('ROAD GUARDIAN')&&foot.includes('15 more rescues to Lifeline'),'rank-up shown with progress');
console.log('PASS: hero calls, cheers and praise for all 500 rescues; ranks from Rookie Driver to Hero of Every Road');
