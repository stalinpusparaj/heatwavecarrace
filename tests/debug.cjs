const fs=require('fs'),vm=require('vm'),assert=require('assert');
const sandbox={canvas:{width:494,height:606}};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('dist/debug.js','utf8').replace('return{init,observe,frame,','return{stats,init,observe,frame,')+'\nthis.debug=Debug',sandbox);
let r=sandbox.debug.stats([{frame:8,render:0,work:.1,paint:false},{frame:9,render:.4,work:.6,paint:true},{frame:60,render:.6,work:.8,paint:true}]);
assert.equal(r.samples,3);assert.equal(r.painted,2);assert.equal(r.longFrames,1);assert.equal(r.renderMean,.5);assert.equal(r.canvas,'494×606');assert.equal(r.frameMean,77/3);
r=sandbox.debug.stats([]);for(const k of ['frameMean','renderMean','renderP95','workMean','frameP95'])assert.equal(r[k],0);
assert.equal(sandbox.debug.pixel,false);assert.equal(sandbox.debug.running,false);
console.log('PASS: opt-in diagnostics, render-only averages, rAF intervals, long-frame counts and empty sample handling');
