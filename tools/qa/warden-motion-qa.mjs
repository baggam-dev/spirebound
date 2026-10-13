import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'msedge',headless:true});
await mkdir('docs/qa-warden-motion-release',{recursive:true});
try{
 const probe=async page=>{await page.route('**/pose-probe',r=>r.fulfill({contentType:'text/html',body:'<canvas width="1000" height="250"></canvas>'}));await page.goto(base+'/pose-probe');};
 const page=await browser.newPage({viewport:{width:1000,height:250}});await probe(page);
 const result=await page.evaluate(async()=>{const m=await import('/src/rendering/warden-motion.js');if(!await m.wardenMotionReady)throw Error('Motion load');const c=document.querySelector('canvas').getContext('2d'),images=[];for(const [i,stage] of ['idle','idle','windup','strike','recover'].entries()){const p={moving:i===1,walk:Math.PI/2},attack={stage},before=JSON.stringify([p,attack]);const local=document.createElement('canvas');local.width=180;local.height=220;const q=local.getContext('2d');q.translate(90,170);m.drawWardenMotion(q,p,attack);if(before!==JSON.stringify([p,attack]))throw Error('State mutation');images.push(local.toDataURL());c.drawImage(local,i*200,0);}return {ready:m.wardenMotionState().ready,distinct:new Set(images.slice(0,4)).size,recoverIdle:images[4]===images[0]};});assert.deepEqual(result,{ready:true,distinct:4,recoverIdle:true});await page.screenshot({path:'docs/qa-warden-motion-release/poses.png'});
 const failed=await browser.newPage();await failed.route('**/warden-motion-atlas.png',r=>r.abort());await probe(failed);assert.equal(await failed.evaluate(async()=>{const w=await import('/src/rendering/warden-sprite.js'),m=await import('/src/rendering/warden-motion.js');if(await m.wardenMotionReady)throw Error('Failure missed');if(!await w.wardenSpriteReady)throw Error('Original lost');const c=document.querySelector('canvas').getContext('2d');c.translate(100,170);return w.drawWardenSprite(c,{type:'boss'},{face:1},{stage:'idle'})&&c.getImageData(0,0,200,250).data.some((n,i)=>i%4===3&&n);}),true);console.log(JSON.stringify({result,originalFallback:true}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
