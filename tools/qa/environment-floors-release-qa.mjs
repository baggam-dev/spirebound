// Isolated preview/saves only; never submits a ranking score.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5174',out=process.argv[2]||'docs/qa-environment-20261018/local';
const modules=[
 {path:'guard-hall-art',load:'loadGuardHallArt',ready:'guardHallLoaded',details:'drawGuardHallDetails',floors:[1],png:'guard-hall-atlas-v1.png'},
 {path:'archive-art',load:'loadArchiveArt',ready:'archiveLoaded',details:'drawArchiveDetails',floors:[2],png:'archive-atlas-v1.png'},
 {path:'prism-hall-art',load:'loadPrismHallArt',ready:'prismHallLoaded',details:'drawPrismHallDetails',floors:[3],png:'prism-hall-atlas-v1.png'},
 {path:'infested-hall-art',load:'loadInfestedHallArt',ready:'infestedHallLoaded',details:'drawInfestedHallDetails',floors:[4,5],png:'infested-hall-atlas-v1.png'},
 {path:'upper-hall-art',load:'loadRoyalHallArt',ready:'royalHallLoaded',details:'drawRoyalHallDetails',floors:[6,7],png:'royal-hall-atlas-v1.png'},
 {path:'upper-hall-art',load:'loadInfernalHallArt',ready:'infernalHallLoaded',details:'drawInfernalHallDetails',floors:[8,9],png:'infernal-hall-atlas-v1.png'}
];
const gameFloors=process.env.QA_ENV_FLOORS?process.env.QA_ENV_FLOORS.split(',').map(n=>Number(n)-1):modules.flatMap(m=>m.floors);
assert.ok(gameFloors.length&&gameFloors.every(n=>Number.isInteger(n)&&modules.some(m=>m.floors.includes(n))),'QA_ENV_FLOORS must list floors 2..10');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],result={base};
try{
 const context=await browser.newContext(),page=await context.newPage();page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/environment-preview',r=>r.fulfill({contentType:'text/html',body:'<canvas width="960" height="540"></canvas>'}));await page.goto(base+'/environment-preview');
 result.render=await page.evaluate(async modules=>{
  const arts=await Promise.all(modules.map(async m=>({...m,art:await import('/src/rendering/'+m.path+'.js')})));
  for(const m of arts){if(m.art[m.ready]())throw Error('Not lazy: '+m.path);if(!await m.art[m.load]()||!m.art[m.ready]())throw Error('Atlas not ready: '+m.path);}
  const {newRun}=await import('/src/game/engine.js'),{drawFloorMood}=await import('/src/rendering/atmosphere.js'),{drawWorldDetails,drawObjectDetails,drawDoorFrame}=await import('/src/rendering/pixel-world.js'),{drawObstacles}=await import('/src/world/terrain.js'),{drawStoneWalls,outerWalls}=await import('/src/rendering/stone-walls.js'),{drawEnvironmentTorches}=await import('/src/rendering/environment-ambience.js'),{doorFramePoint}=await import('/src/world/doors.js');
  if(!await(await import('/src/rendering/environment-art.js')).environmentArtReady)throw Error('Shared facilities not ready');
  const c=document.querySelector('canvas').getContext('2d',{willReadFrequently:true}),s=newRun(31,{campaign:'expanded'}),scenes=[],gallery=document.createElement('canvas');gallery.width=1920;gallery.height=modules.flatMap(m=>m.floors).length*540;const g=gallery.getContext('2d');
  const hash=()=>{let h=0;for(const v of c.getImageData(0,0,960,540).data)h=(Math.imul(h,31)+v)|0;return h;};
  const draw=(r,reduced)=>{c.clearRect(0,0,960,540);drawFloorMood(c,s,r);drawStoneWalls(c,outerWalls,s.floor);drawWorldDetails(c,s,r,reduced);for(let d=0;d<4;d++){const p=doorFramePoint(r,d);drawDoorFrame(c,p.x,p.y,d%2,d%2===0,s.floor);}drawObstacles(c,r.obstacles,s.floor);for(const m of arts)m.art[m.details](c,s,r,reduced);drawEnvironmentTorches(c,s,r,reduced);drawObjectDetails(c,s,r,reduced);};
  let row=0;
  for(const floor of modules.flatMap(m=>m.floors)){
   s.floor=floor;let rooms=0;
   for(const r of s.floors[floor]){const before=JSON.stringify(s);draw(r,false);if(JSON.stringify(s)!==before)throw Error('Render mutated run '+floor);rooms++;}
   // Same room identity across floor switches exercises both cache keys.
   const r={...s.floors[floor].find(r=>r.type==='normal'),type:'normal',obstacles:[{x:220,y:170,w:75,h:55,type:'bookshelf'},{x:650,y:170,w:75,h:55,type:'table'},{x:220,y:360,w:75,h:55,type:'rock'},{x:650,y:360,w:75,h:55,type:'bones'}]},before=JSON.stringify(s);
   s.elapsed=4;draw(r,false);const h=hash();draw(r,false);if(hash()!==h)throw Error('Paused frame differs '+floor);g.drawImage(c.canvas,0,row*540);
   s.elapsed=6;draw(r,true);const calm=hash();s.elapsed=12;draw(r,true);if(hash()!==calm)throw Error('Reduced effects animate '+floor);
   s.elapsed=7;draw(r,false);const active=hash();s.elapsed=9;draw(r,false);if(hash()===active)throw Error('No ambience animation '+floor);
   const other=floor>=4?(floor%2?floor-1:floor+1):floor;s.floor=other;draw(r,false);s.floor=floor;s.elapsed=4;draw(r,false);if(hash()!==h)throw Error('Floor cache contaminated '+floor);
   if(c.globalAlpha!==1||c.getTransform().a!==1||c.getTransform().e!==0)throw Error('Canvas state leaked '+floor);
   const boss={...r,type:'boss',hasChest:false,obstacles:[]};draw(boss,false);g.drawImage(c.canvas,960,row*540);row++;
   scenes.push({floor:floor+1,rooms,paused:true,reducedStatic:true,animation:true,cacheRestored:true,stateUnchanged:true,canvasRestored:true});
  }
  document.body.replaceChildren(gallery);return {atlases:arts.length,scenes,gallery:gallery.toDataURL('image/png').split(',')[1]};
 },modules);
 await writeFile(join(out,'floor-gallery.png'),Buffer.from(result.render.gallery,'base64'));delete result.render.gallery;
 result.assets=[];
 for(const m of modules){const r=await page.request.get(base+'/assets/images/'+m.png);assert.equal(r.status(),200);assert.ok((await r.body()).equals(await readFile('assets/images/'+m.png)));result.assets.push(m.png);}
 await context.close();
 result.fallback=[];
 for(const m of modules){const cx=await browser.newContext(),p=await cx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.route('**/'+m.png,r=>r.abort());await p.route('**/environment-preview',r=>r.fulfill({contentType:'text/html',body:'<canvas width="960" height="540"></canvas>'}));await p.goto(base+'/environment-preview');const ok=await p.evaluate(async m=>{const a=await import('/src/rendering/'+m.path+'.js');if(await a[m.load]()||a[m.ready]())return false;const {newRun}=await import('/src/game/engine.js'),{drawFloorMood}=await import('/src/rendering/atmosphere.js'),{drawObstacles}=await import('/src/world/terrain.js');const s=newRun(19,{campaign:'expanded'});s.floor=m.floors[0];const r=s.floors[s.floor][1],before=JSON.stringify(s),c=document.querySelector('canvas').getContext('2d');drawFloorMood(c,s,r);drawObstacles(c,r.obstacles,s.floor);return before===JSON.stringify(s)&&c.globalAlpha===1;},m);assert.equal(ok,true);result.fallback.push(m.path);await cx.close();}
 result.game=[];
 for(const [width,height] of [[1280,800],[844,390]])for(const floor of gameFloors){
  console.log('game',width,'floor',floor+1);const cx=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),p=await cx.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
  await p.evaluate(async floor=>{const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(31,{campaign:'expanded'});s.floor=floor;s.room=s.floors[floor].findIndex(r=>r.type==='normal');if(s.room<0)s.room=0;s.tutorialComplete=true;s.player.x=480;s.player.y=300;s.invulnerable=100;localStorage.setItem(SAVE_KEY,encodeSave(s));},floor);
  await p.reload({waitUntil:'domcontentloaded',timeout:120000});await p.locator('#continue').click();const m=modules.find(m=>m.floors.includes(floor));const hero=await p.evaluate(async m=>{const h=await import('/src/rendering/hero-sprite.js');if(!await h.heroSpriteReady)throw Error('Hero not ready');const a=await import('/src/rendering/'+m.path+'.js');if(!await a[m.load]()||!a[m.ready]())throw Error('Environment not ready');await document.fonts.ready;return h.heroSpriteState();},m);assert.equal(hero.ready,true);await p.waitForTimeout(200);await p.keyboard.press('Escape');await writeFile(join(out,`floor-${floor+1}-${width}.png`),Buffer.from(await p.locator('#game').evaluate(c=>c.toDataURL('image/png').split(',')[1]),'base64'));result.game.push({floor:floor+1,width,hero});await cx.close();
 }
 result.errors=errors;assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
