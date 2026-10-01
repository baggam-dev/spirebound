import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href:'playwright');
const base=process.env.SPIREBOUND_URL||'http://localhost:5173';
const output=process.argv[2]||'artifacts/full-frame';
const label=process.argv[3]||'current';
const scenarios=[{name:'floor1',floor:0,boss:false},{name:'maze',floor:0,boss:false},{name:'floor9',floor:8,boss:false},{name:'commander',floor:8,boss:true},{name:'demon',floor:9,boss:true}];
const viewports=[{name:'pc',width:1280,height:800,mobile:false},{name:'landscape',width:844,height:390,mobile:true},{name:'portrait',width:390,height:844,mobile:true}];
const selected=(process.env.SPIREBOUND_SCENARIOS||'').split(',').filter(Boolean);
const quantile=(values,p)=>values[Math.ceil(values.length*p)-1];
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const report=[];
try{
 for(const viewport of viewports)for(const scenario of scenarios.filter(s=>!selected.length||selected.includes(s.name))){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.mobile,hasTouch:viewport.mobile});
  await context.addInitScript(()=>{
   const native=requestAnimationFrame.bind(window);
   window.__frameQA={enabled:false,durations:[],intervals:[],last:null};
   window.requestAnimationFrame=callback=>native(timestamp=>{
    const qa=window.__frameQA,start=performance.now();
    try{return callback(timestamp);}finally{
     if(qa.enabled){qa.durations.push(performance.now()-start);if(qa.last!==null)qa.intervals.push(timestamp-qa.last);qa.last=timestamp;}
    }
   });
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.evaluate(async scenario=>{
   const {newRun}=await import('/src/game/engine.js');
   const {applyRoomShape}=await import('/src/world/room-shapes.js');
   const {encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
   const s=newRun(419,{campaign:'expanded'});
   s.floor=scenario.floor;
   s.room=s.floors[s.floor].findIndex(room=>room.type===(scenario.boss?'boss':'normal')&& (scenario.boss||room.enemies.length));
   if(s.room<0)throw Error(`Missing ${scenario.name} room`);
   if(scenario.name==='maze'){
    const room=s.floors[s.floor][s.room];room.obstacles=[];room.hasChest=false;room.tutorial=false;
    delete room.objectPosition;delete room.chestPosition;applyRoomShape(room,6);
    if(room.shape!=='maze'||room.obstacles.length<4)throw Error('Maze fixture not applied');
   }
   s.player.x=scenario.name==='maze'?120:480;s.player.y=scenario.boss?115:270;
   s.tutorialComplete=true;s.invulnerable=999;
   localStorage.setItem(SAVE_KEY,encodeSave(s));
  },scenario);
  await page.reload();
  await page.locator('#continue').click();
  await page.waitForFunction(floor=>document.querySelector('#floor')?.textContent?.startsWith(`${floor+1}층`),scenario.floor);
  if(scenario.boss){
   const interact=page.locator('#interact');
   await interact.waitFor({state:'visible'});
   await interact.click();
  }
  await page.waitForTimeout(500);
  await page.screenshot({path:join(output,`${label}-${viewport.name}-${scenario.name}.png`)});
  await page.evaluate(()=>{const q=window.__frameQA;q.enabled=true;q.durations=[];q.intervals=[];q.last=null;});
  await page.waitForFunction(()=>window.__frameQA.durations.length>=240,null,{timeout:15000});
  const result=await page.evaluate(()=>{
   const q=window.__frameQA;q.enabled=false;
   return {durations:q.durations,intervals:q.intervals,overflow:document.documentElement.scrollWidth>innerWidth,
    canvas:document.querySelector('canvas')?.getBoundingClientRect().toJSON(),viewport:{width:innerWidth,height:innerHeight},
    floor:document.querySelector('#floor')?.textContent,objective:document.querySelector('#objective')?.textContent,
    overlay:document.querySelector('#overlay')?.textContent.slice(0,100)};
  });
  assert.equal(result.overflow,false,`${viewport.name}/${scenario.name} horizontal overflow`);
  assert.deepEqual(errors,[],`${viewport.name}/${scenario.name} page errors`);
  const durations=result.durations.slice(0,240).sort((a,b)=>a-b),intervals=result.intervals.slice(0,239).sort((a,b)=>a-b);
  report.push({viewport:viewport.name,scenario:scenario.name,frames:durations.length,
   callbackMs:{p50:quantile(durations,.5),p95:quantile(durations,.95),p99:quantile(durations,.99),max:durations.at(-1)},
   intervalMs:{p50:quantile(intervals,.5),p95:quantile(intervals,.95),p99:quantile(intervals,.99),over25:intervals.filter(n=>n>25).length},
   canvas:result.canvas,viewportSize:result.viewport,floor:result.floor,objective:result.objective,overlay:result.overlay,pageErrors:errors.length});
  await context.close();
 }
 console.log(JSON.stringify({revision:label,base,report},null,2));
}finally{await browser.close();}
