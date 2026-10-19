const fs=require('fs'),assert=require('assert');
for(const name of fs.readdirSync('dist').filter(n=>n.endsWith('.css'))){const css=fs.readFileSync('dist/'+name,'utf8');assert(!/<(?:html|script|!doctype)\b/i.test(css),name+' contains HTML');assert(!/\b(?:const|let)\s+\w+\s*=|use strict/.test(css),name+' contains JavaScript');assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,name+' unbalanced CSS rules')}
console.log('PASS: CSS assets contain no accidental HTML/JavaScript and have balanced rules');
