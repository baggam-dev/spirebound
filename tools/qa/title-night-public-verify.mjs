import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const out='docs/qa-title-night-20261124/public';await mkdir(out,{recursive:true});
const files=execFileSync('git',['diff-tree','--no-commit-id','--name-only','-r','ef46951'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(p=>/^(src\/|styles\/|assets\/|index.html$)/.test(p));
for(const p of files){const response=await fetch('https://168.107.21.43/'+p+'?verify=night065');assert.equal(response.status,200,p);assert.deepEqual(Buffer.from(await response.arrayBuffer()),await readFile(p),p);}
await writeFile(out+'/files.json',JSON.stringify({version:'0.65.0-prebeta',files,matched:files.length},null,2));console.log('Matched '+files.length+' public runtime files');
