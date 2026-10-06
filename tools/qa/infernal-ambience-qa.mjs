import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:'+server.address().port,output=process.argv[2];if(output)await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],timings=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await context.route('**/api/**',route=>route.abort());await page.goto(base);
  const isolated=await page.evaluate(async()=>{
   const {drawInfernalAmbience}=await import('/src/rendering/infernal-ambience.js'),{drawStoneWalls,outerWalls}=await import('/src/rendering/stone-walls.js');const obstacles=[{x:280,y:170,w:160,h:40,type:'wall'}],state=JSON.stringify(obstacles);
   const render=(floor,time,reduced)=>{const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const c=canvas.getContext('2d');drawInfernalAmbience(c,obstacles,floor,time,reduced);if(c.globalAlpha!==1)throw Error('Context leaked');return canvas;};
   const normal=render(8,0,false),pixels=normal.getContext('2d').getImageData(0,0,960,540).data;let outside=0,n=0;const walls=[...outerWalls,...obstacles];for(let y=0;y<540;y++)for(let x=0;x<960;x++)if(pixels[(y*960+x)*4+3]){n++;if(!walls.some(o=>x>=o.x&&x<o.x+o.w&&y>=o.y&&y<o.y+o.h))outside++;}
   const blank=document.createElement('canvas');blank.width=960;blank.height=540;
   const skipped=render(7,0,false).toDataURL()===blank.toDataURL(),calm=render(8,0,true).toDataURL()===blank.toDataURL(),animated=normal.toDataURL()!==render(8,1.4,false).toDataURL(),floorsDistinct=normal.toDataURL()!==render(9,0,false).toDataURL();
   const c=normal.getContext('2d'),times=[];for(let i=0;i<240;i++){c.clearRect(0,0,960,540);const start=performance.now();drawStoneWalls(c,obstacles,8);drawInfernalAmbience(c,obstacles,8,i/60,false);times.push(performance.now()-start);}times.sort((a,b)=>a-b);
   return {outside,n,skipped,calm,animated,floorsDistinct,statePreserved:state===JSON.stringify(obstacles),p95:times[228],p99:times[237]};
  });assert.equal(isolated.outside,0);assert.ok(isolated.n>100);for(const key of ['skipped','calm','animated','floorsDistinct','statePreserved'])assert.equal(isolated[key],true);timings.push({width,...isolated});
  for(const floor of [8,9])for(const boss of [false,true]){
   await page.goto(base);
   await page.evaluate(async({floor,boss})=>{const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{challengeCommander}=await import('/src/combat/commander.js'),{challengeDemon}=await import('/src/combat/demon.js');const s=newRun(419,{campaign:'expanded'});s.floor=floor;s.room=s.floors[floor].findIndex(r=>boss?r.type==='boss':r.type!=='boss');if(s.room<0)throw Error('No fixture room');const r=s.floors[floor][s.room];if(!boss&&!r.obstacles.some(o=>o.type==='wall'))r.obstacles.push({x:280,y:170,w:160,h:40,type:'wall'});s.player.mainSkill='frost';s.player.frost=4;s.player.hp=s.player.max=99;s.player.x=480;s.player.y=435;s.invulnerable=99;s.tutorialComplete=true;if(boss){r.enemies=[];if(floor===8)challengeCommander(s);else challengeDemon(s);}localStorage.setItem(SAVE_KEY,encodeSave(s));}, {floor,boss});
   await page.reload();await page.locator('#continue').click();await page.keyboard.press('Escape');await page.locator('#journal').waitFor();assert.equal(await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload).floor),floor);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.evaluate(()=>{document.querySelector('#overlay').style.visibility='hidden';});if(output)await page.screenshot({path:join(output,`infernal-${floor+1}-${boss?'boss':'room'}-${width}.png`)});
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({scenes:12,wallClip:true,reducedEffects:true,earlierFloorsUnchanged:true,animated:true,statePreserved:true,timings,pageErrors:0,productionRecordsSubmitted:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
