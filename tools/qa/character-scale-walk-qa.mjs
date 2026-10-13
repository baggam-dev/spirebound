import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));
if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/scale-probe',r=>r.fulfill({contentType:'text/html',body:'<canvas width="200" height="200"></canvas>'}));
 await page.goto(base+'/scale-probe');
 const result=await page.evaluate(async()=>{
  const h=await import('/src/rendering/hero-sprite.js'),g=await import('/src/rendering/grunt-sprite.js'),w=await import('/src/rendering/warden-sprite.js'),walk=await import('/src/rendering/chaser-walk.js'),archer=await import('/src/rendering/archer-walk.js');
  if(!(await Promise.all([h.heroSpriteReady,g.gruntSpriteReady,w.wardenSpriteReady,walk.chaserWalkReady,archer.archerWalkReady])).every(Boolean))throw Error('Atlas load failed');
  const c=document.querySelector('canvas').getContext('2d'),e={type:'chaser',x:0,y:0},p={face:1,moving:true,walk:0};c.translate(100,100);
  const original=JSON.stringify(e),images=[];
  for(let i=0;i<4;i++){c.clearRect(-100,-100,200,200);p.walk=i*Math.PI/2;g.drawGruntSprite(c,e,p,null);images.push(c.canvas.toDataURL());}
  p.moving=false;const idle=walk.drawChaserWalk(c,p);p.moving=true;
  const archerFrames=[],aimFrames=[],enemy={type:'archer',x:0,y:0},snapshot=JSON.stringify(enemy);
  for(let i=0;i<4;i++){c.clearRect(-100,-100,200,200);p.walk=i*Math.PI/2;g.drawGruntSprite(c,enemy,p,null);archerFrames.push(c.canvas.toDataURL());c.clearRect(-100,-100,200,200);g.drawGruntSprite(c,{...enemy,attackPhase:'warning',patternAim:0},p,null);aimFrames.push(c.canvas.toDataURL());}
  return {hero:h.heroSpriteState().bodyHeight,grunt:g.gruntSpriteState().bodyHeight,brute:g.gruntSpriteState().bruteHeight,warden:w.wardenSpriteState().bodyHeight,frames:walk.chaserWalkState().frames,distinct:new Set(images).size,idle,unchanged:JSON.stringify(e)===original&&JSON.stringify(enemy)===snapshot,archerFrames:archer.archerWalkState().frames,archerDistinct:new Set(archerFrames).size,aimStable:new Set(aimFrames).size===1};
 });assert.deepEqual(result,{hero:56,grunt:50,brute:64,warden:76,frames:4,distinct:4,idle:false,unchanged:true,archerFrames:4,archerDistinct:4,aimStable:true});
 await page.close();
 const fallback=await browser.newPage();await fallback.route('**/chaser-walk-atlas.png',r=>r.abort());await fallback.route('**/scale-probe',r=>r.fulfill({contentType:'text/html',body:'<canvas width="200" height="200"></canvas>'}));await fallback.goto(base+'/scale-probe');
 assert.equal(await fallback.evaluate(async()=>{const walk=await import('/src/rendering/chaser-walk.js'),g=await import('/src/rendering/grunt-sprite.js');await g.gruntSpriteReady;if(await walk.chaserWalkReady)throw Error('Failure not detected');const c=document.querySelector('canvas').getContext('2d');c.translate(100,100);g.drawGruntSprite(c,{type:'chaser',x:0,y:0},{face:1,moving:true,walk:0},null);return c.getImageData(0,0,200,200).data.some((n,i)=>i%4===3&&n);}),true);
 await fallback.close();
 const failedArcher=await browser.newPage();await failedArcher.route('**/archer-walk-atlas.png',r=>r.abort());await failedArcher.route('**/scale-probe',r=>r.fulfill({contentType:'text/html',body:'<canvas width="200" height="200"></canvas>'}));await failedArcher.goto(base+'/scale-probe');assert.equal(await failedArcher.evaluate(async()=>{const a=await import('/src/rendering/archer-walk.js'),g=await import('/src/rendering/grunt-sprite.js');if(await a.archerWalkReady)throw Error('Archer failure not detected');await g.gruntSpriteReady;const c=document.querySelector('canvas').getContext('2d');c.translate(100,100);g.drawGruntSprite(c,{type:'archer',x:0,y:0},{moving:true,walk:0,face:1},null);return c.getImageData(0,0,200,200).data.some((n,i)=>i%4===3&&n);}),true);await failedArcher.close();
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result,walkFailureFallback:true,archerFailureFallback:true,pageErrors:0,productionRecordsSubmitted:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
