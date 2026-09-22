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
 const {emitInteraction,drawInteractionEffects}=await import('/interaction-visuals.js');
 document.body.innerHTML='<canvas width="1440" height="810"></canvas>';const c=document.querySelector('canvas').getContext('2d');const probe=document.createElement('canvas');probe.width=960;probe.height=540;const ctx=probe.getContext('2d',{willReadFrequently:true});
 const s={elapsed:0},r={};emitInteraction(s,'roomClear',r,{unlocked:true,doors:[true,true,true,true]});
 for(const [i,time] of [0,.3,.7,1].entries()){s.elapsed=time;const before=JSON.stringify(s);const draw=()=>{ctx.fillStyle='#25312e';ctx.fillRect(0,0,960,540);ctx.fillStyle='#101b1b';for(const [x,y,w,h] of [[440,0,80,35],[931,235,29,70],[440,505,80,35],[0,235,29,70]])ctx.fillRect(x,y,w,h);drawInteractionEffects(ctx,s,r);};draw();const hash=()=>{let h=0;for(const v of ctx.getImageData(0,0,960,540).data)h=(Math.imul(h,31)+v)|0;return h;};const first=hash();draw();if(first!==hash()||ctx.globalAlpha!==1||ctx.getTransform().a!==1||JSON.stringify(s)!==before)throw Error('Render state leak');c.drawImage(probe,i%2*720,Math.floor(i/2)*405,720,405);}
 return {frames:4,pauseStable:true,stateUnchanged:true};
 });await page.screenshot({path:join(output,'room-clear.png')});
 for(const [width,height] of [[1280,800],[844,390],[390,844],[667,375]]){const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5174');await page.locator('#bossPractice').click();await page.locator('#practiceBoss').selectOption('king');await page.locator('#rollPractice').click();await page.locator('#launchPractice').click();await page.waitForTimeout(1500);await page.screenshot({path:join(output,`${width}x${height}.png`)});await context.close();}
 console.log(JSON.stringify({result,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
