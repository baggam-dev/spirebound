import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base=process.env.BASE_URL||'https://168.107.21.43',out=process.argv[2];await mkdir(out,{recursive:true});
const files=execFileSync('git',['ls-files','src','styles','assets','index.html','upgrade.html'],{encoding:'utf8'}).trim().split(/\r?\n/),results=[],queue=[...files];
const hash=b=>createHash('sha256').update(b).digest('hex');
async function get(path){const r=await fetch(base+'/'+path+'?qa='+Date.now(),{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(path+' HTTP '+r.status);return Buffer.from(await r.arrayBuffer());}
await Promise.all(Array.from({length:4},async()=>{while(queue.length){const path=queue.shift(),local=await readFile(path),remote=await get(path);if(hash(local)!==hash(remote))throw Error('Public content mismatch '+path);results.push({path,sha256:hash(remote)});}}));
const health=JSON.parse((await get('api/health')).toString());
await writeFile(out+'/result.json',JSON.stringify({base,files:results.length,health,results},null,2));console.log(JSON.stringify({files:results.length,health}));
