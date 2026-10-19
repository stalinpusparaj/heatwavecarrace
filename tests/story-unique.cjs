const fs=require('fs'),vm=require('vm'),assert=require('assert');
// Every authored world: 100 levels, each with its own person, situation, line, tease, sighting and dialogue.
const s={Math,player:{x:0,y:0},$:()=>({}),sound(){},C:{},P:{config:{}},globalThis:null};s.globalThis=s;vm.createContext(s);
const files=fs.readdirSync('dist').filter(f=>/^story-[a-z]+\.js$/.test(f));assert.ok(files.length>=1,'at least one authored world');
for(const f of files)vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),s);
vm.runInContext(fs.readFileSync('dist/rescue.js','utf8')+'\nthis.R=Rescue',s);
const lessons=new Set(['smoke','cable','water','radio','code','medicine','gate','crossing','landmark','verify','heat','dust','rockfall','night','cold','avalanche','ice','ash','mudslide','tide']);
let worlds=0;const everyone=new Set();
for(let w=0;w<5;w++){const book=s.RescueStories[w];if(!book)continue;worlds++;
  assert.equal(book.chapters.length,10,`world ${w}: 10 chapters`);
  const seen={name:new Set(),motive:new Set(),line:new Set(),hook:new Set(),sighting:new Set(),talk:new Set(),title:new Set(),chapter:new Set()};
  for(let l=1;l<=100;l++){const raw=book.chapters[Math.floor((l-1)/10)].levels[(l-1)%10],e=s.R.story(w,l),id=`world ${w} level ${l}`;
    assert.ok(raw,`${id}: authored`);assert.ok(lessons.has(raw.h),`${id}: safety lesson key ${raw.h}`);
    assert.ok(e.motive.includes(e.name),`${id}: situation names the person`);
    for(const t of [e.motive,e.line,e.hook,e.sighting,...e.talk,raw.t,raw.k])assert.ok(typeof t==='string'&&t.length>=3&&!/[{}]|undefined/.test(t),`${id}: text present`);
    assert.ok(e.line.length<=140&&e.motive.length<=260,`${id}: fits on a phone`);
    for(const [k,v] of [['name',e.name],['motive',e.motive],['line',e.line],['hook',e.hook],['sighting',e.sighting],['talk',e.talk.join('|')],['title',e.title]]){assert.ok(!seen[k].has(v),`${id}: duplicate ${k}: ${v}`);seen[k].add(v)}
    assert.ok(!everyone.has(e.name),`${id}: ${e.name} already appears in another world`);everyone.add(e.name);
    if(l%10===0)assert.equal(e.sighting,e.clue,`${id}: finale reveals the chapter clue`);
    if(raw.w)assert.ok(!seen.name.has(raw.w),`${id}: companion is a different person`);
  }
  for(const c of book.chapters){assert.ok(c.title&&c.arc,`world ${w}: chapter has title and arc`);assert.ok(!seen.chapter.has(c.title));seen.chapter.add(c.title)}
}
assert.equal(worlds,5,'all five worlds authored');assert.equal(everyone.size,500,'500 different people');
console.log(`PASS: ${worlds} authored world(s) × 100 levels: 500 different people; unique situations, lines, hooks, sightings, dialogue and titles; finales reveal clues; valid safety lessons`);
