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
 const {emitInteraction,drawInteractionEffects}=await import('/interaction-visuals.js');const {drawObjectDetails}=await import('/pixel-world.js');
 document.body.innerHTML='<canvas width="1440" height="600"></canvas>';const c=document.querySelector('canvas').getContext('2d');const probe=document.createElement('canvas');probe.width=960;probe.height=540;const ctx=probe.getContext('2d',{willReadFrequently:true});
 let count=0;for(const [row,kind] of ['chest','fountain','stairs'].entries()){
 const r={type:kind==='chest'?'treasure':kind==='fountain'?'fountain':'up',used:true},s={elapsed:0};emitInteraction(s,kind,r,{x:480,y:112});
 for(const [col,time] of [0,.18,.45,1].entries()){s.elapsed=time;const before=JSON.stringify({s,r});const draw=()=>{ctx.fillStyle='#25312e';ctx.fillRect(0,0,960,540);drawObjectDetails(ctx,s,r);drawInteractionEffects(ctx,s,r);};draw();const hash=()=>{let h=0;for(const n of ctx.getImageData(400,50,160,140).data)h=(Math.imul(h,31)+n)|0;return h;};const first=hash();draw();if(first!==hash()||JSON.stringify({s,r})!==before||ctx.globalAlpha!==1)throw Error('Render state changed');c.drawImage(probe,400,50,160,140,col*360,row*200,320,170);c.fillStyle='#eee';c.font='15px monospace';c.fillText(kind+' / '+time+'s',col*360+20,row*200+190);count++;}
 }return {frames:count,pauseStable:true,stateUnchanged:true};
 });await page.screenshot({path:join(output,'interaction-stages.png')});
 for(const [width,height] of [[1280,800],[844,390],[390,844],[667,375]]){const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5174');await page.locator('#bossPractice').click();await page.locator('#practiceBoss').selectOption('king');await page.locator('#rollPractice').click();await page.locator('#launchPractice').click();await page.waitForTimeout(1500);await page.screenshot({path:join(output,`${width}x${height}.png`)});await context.close();}
 console.log(JSON.stringify({result,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
