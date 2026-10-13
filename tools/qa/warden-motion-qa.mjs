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
 const extended=await page.evaluate(async()=>{
  const w=await import('/src/rendering/warden-sprite.js'),walk=await import('/src/rendering/warden-walk.js'),r=await import('/src/rendering/warden-recover.js');await w.wardenSpriteReady;
  if(!walk.wardenWalkState().ready||!r.wardenRecoverState().ready)throw Error('New atlas load');
  const c=document.querySelector('canvas').getContext('2d');c.clearRect(0,0,1000,250);const local=document.createElement('canvas');local.width=180;local.height=220;const q=local.getContext('2d');q.translate(90,170);
  const render=(e,p,a)=>{q.clearRect(-90,-170,180,220);const before=JSON.stringify([e,p,a]);w.drawWardenSprite(q,e,p,a);if(before!==JSON.stringify([e,p,a]))throw Error('Actor changed');return local.toDataURL();},walking=[],attacking=[],recovering=[];
  for(let i=0;i<4;i++){walking.push(render({type:'boss'},{moving:true,face:1,walk:i*Math.PI/2},{stage:'idle'}));attacking.push(render({type:'boss'},{moving:true,face:1,walk:i*Math.PI/2},{stage:'windup'}));}
  for(const [i,time] of [.6,.35,.18,.06,0].entries()){recovering.push(render({type:'boss',pattern:'slam',attackPhase:'recover',attackTime:time},{face:1},{stage:'recover'}));c.drawImage(local,i*200,0);}
  const idle=render({type:'boss'},{face:1},{stage:'idle'});return {walking:new Set(walking).size,recovering:new Set(recovering.slice(0,3)).size,attackStable:new Set(attacking).size===1,endsIdle:recovering[4]===idle};
 });assert.deepEqual(extended,{walking:4,recovering:3,attackStable:true,endsIdle:true});await page.screenshot({path:'docs/qa-warden-motion-release/recovery.png'});
 for(const asset of ['warden-motion','warden-walk','warden-recover']){
  const failed=await browser.newPage();await failed.route(`**/${asset}-atlas.png`,r=>r.abort());await probe(failed);assert.equal(await failed.evaluate(async asset=>{const w=await import('/src/rendering/warden-sprite.js'),m=await import(`/src/rendering/${asset}.js`),name=asset==='warden-motion'?'wardenMotionReady':asset==='warden-walk'?'wardenWalkReady':'wardenRecoverReady';if(await m[name])throw Error('Failure missed');if(!await w.wardenSpriteReady)throw Error('Original lost');const c=document.querySelector('canvas').getContext('2d');c.translate(100,170);return w.drawWardenSprite(c,{type:'boss',pattern:'slam',attackPhase:'recover',attackTime:.35},{face:1,moving:true,walk:1},{stage:asset==='warden-recover'?'recover':'idle'})&&c.getImageData(0,0,200,250).data.some((n,i)=>i%4===3&&n);},asset),true);await failed.close();
 }console.log(JSON.stringify({result,extended,originalFallback:true,fallbacks:3}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
