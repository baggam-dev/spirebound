import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const output=process.argv[2];await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1080}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/backdrop-preview',route=>route.fulfill({contentType:'text/html',body:'<body style="margin:0"><canvas></canvas></body>'}));await page.goto('http://localhost:5174/backdrop-preview');
 const result=await page.evaluate(async()=>{
 const {applyRoomShape}=await import('/room-shapes.js'),{drawObstacles}=await import('/terrain.js'),{drawFloorMood}=await import('/atmosphere.js'),{drawPixelActor}=await import('/pixel-world.js');
 document.body.innerHTML='<canvas width="1440" height="810"></canvas>';const c=document.querySelector('canvas').getContext('2d');
 for(let i=0;i<4;i++){c.save();c.translate(i%2*720,Math.floor(i/2)*405);c.scale(.75,.75);c.fillStyle='#26332e';c.fillRect(0,0,960,540);const r={type:'normal',x:0,y:0,obstacles:[],enemies:[]};applyRoomShape(r,i);drawFloorMood(c,{floor:0},r);drawObstacles(c,r.obstacles);drawPixelActor(c,{type:'player',x:480,y:270},0);c.fillStyle='#eee';c.font='18px monospace';c.fillText(r.shape,430,32);c.restore();}
 return {shapes:4};
 });await page.screenshot({path:join(output,'room-shapes.png')});
 for(const [width,height] of [[1280,800],[844,390],[390,844],[667,375]]){const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5174');await page.locator('#bossPractice').click();await page.locator('#practiceBoss').selectOption('king');await page.locator('#rollPractice').click();await page.locator('#launchPractice').click();await page.waitForTimeout(1500);await page.screenshot({path:join(output,`${width}x${height}.png`)});await context.close();}
 console.log(JSON.stringify({result,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
