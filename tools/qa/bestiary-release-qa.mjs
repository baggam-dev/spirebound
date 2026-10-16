import assert from 'node:assert/strict';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||`http://127.0.0.1:${server.address().port}`,out=process.env.QA_OUTPUT||'docs/qa-release-20261015';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('#titleBestiary').click();await page.locator('[data-monster]').first().waitFor();assert.equal(await page.locator('[data-monster]').count(),30);
  const baseline=await page.evaluate(()=>JSON.stringify({...localStorage}));
  await page.waitForFunction(()=>[...document.querySelectorAll('.bestiary-card canvas')].every(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)));
  for(const [category,count] of [['일반',9],['상층',7],['악마',5],['귀환',3],['보스',6]]){await page.locator(`[data-category="${category}"]`).click();assert.equal(await page.locator('[data-monster]').count(),count);}
  await page.locator('[data-monster="demon"]').click();assert.equal(await page.locator('[data-demon-part]').count(),6);
  for(const part of ['hand','foot','eye','nose','mouth','core']){await page.locator(`[data-demon-part="${part}"]`).click();assert.equal(await page.locator('.bestiary-detail canvas').getAttribute('data-part'),part);}
  await page.locator('[data-category="전체"]').click();await page.locator('#bestiarySearch').fill('악마 부대장');assert.equal(await page.locator('[data-monster]').count(),1);
  await page.screenshot({path:join(out,`bestiary-${width}.png`)});
  await page.locator('#bestiarySearch').fill('없는몬스터');assert.equal(await page.locator('[data-monster]').count(),0);await page.locator('[data-clear-search]').click();assert.equal(await page.locator('[data-monster]').count(),30);
  assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),baseline);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.keyboard.press('Escape');await page.locator('#titleBestiary').waitFor();await context.close();
 }
 const page=await browser.newPage({viewport:{width:1400,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/sprite-probe',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#20262c"><canvas width="1400" height="1000"></canvas>'}));await page.goto(base+'/sprite-probe');
 const result=await page.evaluate(async()=>{
  const specs=[['demon-bat','demonBat','DemonBat',4],['spike-nest','spikeNest','SpikeNest',4],['demon-soldier','demonSoldier','DemonSoldier',6],['demon-archer','demonArcher','DemonArcher',6],['demon-captain','demonCaptain','DemonCaptain',6],['strafer','strafer','Strafer',6],['ringcaster','ringcaster','Ringcaster',4],['ambusher','ambusher','Ambusher',6]];
  const c=document.querySelector('canvas').getContext('2d');let states=0;
  for(const [row,[file,type,name]] of specs.entries()){
   const m=await import(`/src/rendering/${file}-sprite.js`);if(!await m[`${type}SpriteReady`])throw Error('Not ready '+type);
   for(let col=0;col<6;col++){
    const e={id:row,type,x:100+col*210,y:100+row*115,aim:col%2?Math.PI:0};
    if(col===2){e.attackPhase='warning';e.attackTime=.4;}if(col===3||col===4){e.attackPhase=type==='demonBat'||type==='demonCaptain'||type==='ambusher'?'dash':'recover';e.attackTime=col===3?(type==='ringcaster'?2.35:type==='strafer'?1.2:.6):.2;}
    if(col===5)e.frozen=1;
    const before=JSON.stringify(e);if(!m[`draw${name}Sprite`](c,e,1,false))throw Error('Draw failed '+type);if(before!==JSON.stringify(e))throw Error('Mutation '+type);states++;
   }
  }
  return {states};
 });assert.equal(result.states,48);await page.screenshot({path:join(out,'recent-enemy-sprites.png')});
 const core=await page.evaluate(async()=>{
  const {drawDemon}=await import('/src/rendering/demon-visuals.js'),{demonCoreSpriteReady}=await import('/src/rendering/demon-core-sprite.js');if(!await demonCoreSpriteReady)throw Error('Core layers not ready');
  const c=document.querySelector('canvas').getContext('2d');c.clearRect(0,0,1400,1000);let n=0;
  for(const kind of ['coreSweepLeft','coreSweepRight','eyeRay','mouthTongue','footJump','coreBurst'])for(const stage of [0,1,2]){
   const e={type:'boss',variant:'demon',part:'core',x:230+(n%3)*460,y:150+Math.floor(n/3)*160,hp:100,max:100},a={kind,x:e.x,y:e.y,tx:e.x,ty:e.y+80,aim:Math.PI/2,time:stage===0?.4:stage===1?.45:.2,owner:'core'};
   const d={phase:3};if(stage===0)d.attack=a;else if(kind.startsWith('coreSweep'))d.sweepFlash=a;else d.coreFlash=a;
   const room={demon:d,enemies:[e],obstacles:[]},before=JSON.stringify(room);drawDemon(c,e,1,false,false,room);if(JSON.stringify(room)!==before)throw Error('Core renderer mutation');n++;
  }return n;
 });assert.equal(core,18);await page.screenshot({path:join(out,'core-motion-layers.png')});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({viewports:3,bestiary30:true,filters:true,search:true,parts6:true,storageUnchanged:true,escapeBack:true,...result,coreStates:core,pageErrors:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
