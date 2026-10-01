import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href:'playwright');
const base=process.env.SPIREBOUND_URL||'http://localhost:5173',output=process.argv[2]||'artifacts/visual-stage5';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 const floors=Array.from({length:10},(_,i)=>i);
 for(const [width,height,mobile] of [[1280,800,false],[390,844,true]])for(const floor of floors){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(base);
  await page.evaluate(async floor=>{
   const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
   const s=newRun(419,{campaign:'expanded'});s.floor=floor;s.room=floor===9?s.floors[floor].findIndex(r=>r.type==='down'):s.floors[floor].findIndex(r=>r.type==='normal'&&r.enemies.length);
   if(s.room<0)throw Error('Room fixture missing');s.player.x=480;s.player.y=270;s.tutorialComplete=true;
   localStorage.setItem(SAVE_KEY,encodeSave(s));
  },floor);
  await page.reload();await page.locator('#continue').click();await page.waitForFunction(f=>document.querySelector('#floor')?.textContent?.startsWith(`${f+1}층`),floor);
  await page.screenshot({path:join(output,`${width}x${height}-floor${floor+1}.png`)});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await context.close();
 }
 const gallery=await browser.newPage({viewport:{width:900,height:300}});
 await gallery.goto(base);
 await gallery.evaluate(async()=>{
  const {drawPixelActor}=await import('/src/rendering/pixel-world.js'),{drawEnemyDetails}=await import('/src/combat/brute.js');
  document.body.innerHTML='<canvas width="900" height="300"></canvas>';document.body.style='margin:0;background:#1b2022';
  const c=document.querySelector('canvas').getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#1b2022';c.fillRect(0,0,900,300);
  const samples=[['HERO',{type:'player',x:0,y:0}],['BRUTE',{type:'brute',x:0,y:0}],['RETURN BRUTE',{type:'brute',escapeDepth:1,x:0,y:0}]];
  for(const [i,[label,e]] of samples.entries()){
   c.save();c.translate(150+i*300,168);c.scale(3,3);if(e.type==='player')drawPixelActor(c,e,2);else drawEnemyDetails(c,e);c.restore();
   c.fillStyle='#c4c9be';c.font='17px monospace';c.textAlign='center';c.fillText(label,150+i*300,55);
  }
 });
 await gallery.screenshot({path:join(output,'actor-comparison.png')});await gallery.close();
 const perf=await browser.newPage();await perf.goto(base);
 const report=await perf.evaluate(async floors=>{
  const {drawStoneWalls,outerWalls}=await import('/src/rendering/stone-walls.js');
  const {drawFloorMood}=await import('/src/rendering/atmosphere.js');
  const {drawPixelActor}=await import('/src/rendering/pixel-world.js');
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const c=canvas.getContext('2d',{willReadFrequently:true});
  const hashes=[],times={};
  for(const floor of floors){
   const s=Object.freeze({floor,elapsed:2}),r=Object.freeze({x:2,y:3,type:'normal'}),walls=outerWalls;
   const draw=()=>{c.clearRect(0,0,960,540);drawFloorMood(c,s,r);drawStoneWalls(c,walls,floor);drawPixelActor(c,{type:'player',x:480,y:270},2);};
   draw();const bytes=c.getImageData(26,45,908,455).data;let hash=0;for(let i=0;i<bytes.length;i+=32)hash=(Math.imul(hash,31)+bytes[i])|0;hashes.push(hash);
   const samples=[];for(let i=0;i<120;i++){const start=performance.now();draw();samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);times[floor]={p95:+samples[113].toFixed(2),p99:+samples[118].toFixed(2)};
   if(c.globalAlpha!==1||c.getTransform().a!==1)throw Error('Canvas state leak');
  }
  return {distinctPalettes:new Set(hashes).size,times};
 },floors);
 assert.equal(report.distinctPalettes,10);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({viewports:2,floors:floors.map(i=>i+1),report,pageErrors:errors.length}));
}finally{await browser.close();}
