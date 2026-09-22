import {mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href:'playwright');
const base=process.env.SPIREBOUND_URL||'http://localhost:5174',output=resolve(process.argv[2]||'artifacts/ultimate');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:960,height:540}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/ultimate-preview',route=>route.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#17212a"><canvas width="960" height="540"></canvas></body>'}));await page.goto(`${base}/ultimate-preview`);
 const result=await page.evaluate(async()=>{
  const v=await import('/ultimate-visuals.js');const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#17212a';c.fillRect(0,0,960,540);c.font='14px monospace';c.textAlign='center';
  const label=(s,x,y)=>{c.fillStyle='#d5d6bd';c.fillText(s,x,y);};label('ARROW RAIN / SYNCHRONIZED THREE-PULSE IMPACT',480,28);
  for(const [i,elapsed] of [.04,.46,.63].entries()){c.save();c.translate(160+i*320,170);c.scale(.43,.43);c.translate(-480,-270);const z={x:480,y:270,r:280,pulses:elapsed<.6?1:2,elapsed};v.drawUltimateGround(c,{arrowRain:z});v.drawArrowRain(c,z);c.restore();label(['IMPACT','DESCENT','SECOND VOLLEY'][i],160+i*320,306);}
  label('AUTO CROSSBOW / DEPLOYMENT - RECOIL - EXPIRATION',480,350);
  for(const [i,t] of [{time:18.93,clock:0},{time:17,clock:.48},{time:.6,clock:0}].entries()){c.save();c.translate(160+i*320,438);c.scale(2,2);c.translate(-480,-270);v.drawCrossbow(c,{...t,x:480,y:270,aim:-.3});c.restore();label(['DEPLOY','FIRE','FADE'][i],160+i*320,516);}
  const probe=document.createElement('canvas').getContext('2d',{willReadFrequently:true});probe.canvas.width=960;probe.canvas.height=540;
  const room=Object.freeze({arrowRain:Object.freeze({x:480,y:270,r:280,elapsed:.65,pulses:2})}),turret=Object.freeze({x:500,y:300,time:18.9,clock:.48,aim:.6});
  const before=JSON.stringify({room,turret}),draw=()=>{v.drawUltimateGround(probe,room);v.drawArrowRain(probe,room.arrowRain);v.drawCrossbow(probe,turret);};
  probe.globalAlpha=.7;const matrix=probe.getTransform().toString();draw();const first=probe.getImageData(0,0,960,540).data.toString();probe.clearRect(0,0,960,540);draw();if(first!==probe.getImageData(0,0,960,540).data.toString())throw Error('Pause animation unstable');if(probe.globalAlpha!==.7||probe.getTransform().toString()!==matrix)throw Error('Canvas state leaked');if(JSON.stringify({room,turret})!==before)throw Error('Combat state mutated');
  const times=[];for(let i=0;i<60;i++){const start=performance.now();draw();times.push(performance.now()-start);}times.sort((a,b)=>a-b);return {pauseStable:true,stateUnchanged:true,canvasRestored:true,medianDrawMs:times[30]};
 });await page.screenshot({path:join(output,'ultimate-stages.png')});
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true],[667,375,true]])for(const kind of ['burst','turret']){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),game=await context.newPage();game.on('pageerror',e=>errors.push(e.message));game.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});await game.goto(base);
  await game.evaluate(async kind=>{const {newRun,currentRoom}=await import('/engine.js'),{RunStore}=await import('/storage.js');const s=newRun(42);s.room=1;s.tutorialComplete=true;s.player.mainSkill='fire';s.player.fire=1;s.player.ultimate=1;s.player.evolutions={ultimate:kind};const r=currentRoom(s);r.seen=true;r.obstacles=[];r.enemies=[{id:0,type:'archer',x:660,y:240,hp:10000,max:10000,cd:2,balanceVersion:1}];const result=new RunStore(localStorage).write(s);if(!result.ok)throw Error('Fixture save failed');},kind);
  await game.reload();await game.locator('#continue').click();if(mobile)await game.locator('#skill').click();else await game.keyboard.press('f');await game.waitForTimeout(kind==='burst'?450:150);
  await game.screenshot({path:join(output,`${width}x${height}-${kind}.png`)});await game.locator('#pause').click();
  const saved=await game.evaluate(async()=>{const {RunStore}=await import('/storage.js');const s=new RunStore(localStorage).read().run,r=s.floors[s.floor][s.room];return {rain:r.arrowRain,turrets:r.turrets};});if(kind==='burst'&&!saved.rain||kind==='turret'&&!saved.turrets?.length)errors.push(`Ultimate failed: ${width} ${kind}`);
  await context.close();
 }
 console.log(JSON.stringify({result,errors},null,2));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
