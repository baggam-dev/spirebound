import test from 'node:test';import assert from 'node:assert/strict';
import {createServer} from './server.js';
import http from 'node:http';
test('development API proxy forwards cookies and overrides claimed client IP',async()=>{
 const upstream=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({cookie:req.headers.cookie,ip:req.headers['x-real-ip'],method:req.method}));});await new Promise(resolve=>upstream.listen(0,'127.0.0.1',resolve));
 const server=createServer(process.cwd(),upstream.address().port);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const result=await fetch(`http://127.0.0.1:${server.address().port}/api/session`,{method:'POST',headers:{cookie:'test=value','x-real-ip':'spoof'},body:'{}'});assert.equal(result.status,200);assert.deepEqual(await result.json(),{cookie:'test=value',ip:'127.0.0.1',method:'POST'});}
 finally{await new Promise(resolve=>server.close(resolve));await new Promise(resolve=>upstream.close(resolve));}
});
test('server serves game modules and refuses repository files and unsupported methods',async()=>{const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;try{const page=await fetch(base);assert.equal(page.status,200);assert.equal(page.headers.get('cache-control'),'no-store');for(const path of ['/.git/config','/server.js','/storage.test.js','/docs/build-journal.md','/..%5c.git%5cconfig'])assert.equal((await fetch(base+path)).status,404);assert.equal((await fetch(base+'/simulation.js')).status,200);assert.equal((await fetch(base,{method:'POST'})).status,405);}finally{await new Promise(resolve=>server.close(resolve));}});
