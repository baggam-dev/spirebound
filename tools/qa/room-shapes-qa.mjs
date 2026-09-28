import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5174';
const output=process.argv[2];await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1620}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/backdrop-preview',route=>route.fulfill({contentType:'text/html',body:'<body style="margin:0"><canvas></canvas></body>'}));await page.goto(base+'/backdrop-preview');
 const result=await page.evaluate(async()=>{
 const {applyRoomShape,roomShapeNames}=await import('/src/world/room-shapes.js'),{drawObstacles,safeSpawn}=await import('/src/world/terrain.js'),{drawFloorMood}=await import('/src/rendering/atmosphere.js'),{drawPixelActor}=await import('/src/rendering/pixel-world.js');
 document.body.innerHTML='<canvas width="1440" height="1620"></canvas>';const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#18241f';c.fillRect(0,0,1440,1620);
 for(let i=0;i<roomShapeNames.length;i++){c.save();c.translate(i%2*720,Math.floor(i/2)*405);c.scale(.75,.75);c.fillStyle='#26332e';c.fillRect(0,0,960,540);const r={type:'normal',x:0,y:0,obstacles:[],enemies:[]};applyRoomShape(r,i);drawFloorMood(c,{floor:0},r);drawObstacles(c,r.obstacles);const actor={type:'player',x:480,y:300};safeSpawn(actor,r.obstacles,18);drawPixelActor(c,actor,0);c.fillStyle='#eee';c.font='18px monospace';c.fillText(r.shape,430,32);c.restore();}
 return {shapes:roomShapeNames.length};
 });await page.screenshot({path:join(output,'room-shapes.png')});
 for(const [width,height] of [[1280,800],[844,390],[390,844],[667,375]])for(const shape of [4,5,6]){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 await page.evaluate(async choice=>{
  const {newRun}=await import('/src/game/engine.js'),{applyRoomShape}=await import('/src/world/room-shapes.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
  const s=newRun(17);s.room=2;s.tutorialComplete=true;s.player.x=120;s.player.y=270;const r=s.floors[0][2];r.type='normal';r.hasChest=false;r.obstacles=[];delete r.objectPosition;delete r.chestPosition;applyRoomShape(r,choice);localStorage.setItem(SAVE_KEY,encodeSave(s));
 },shape);
 await page.reload();await page.locator('#continue').click();await page.waitForTimeout(600);await page.screenshot({path:join(output,`${width}x${height}-${shape}.png`)});await context.close();
 }
 console.log(JSON.stringify({result,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
