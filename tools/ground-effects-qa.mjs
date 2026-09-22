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
 const {drawGroundField,drawAuraField,drawBurst}=await import('/ground-visuals.js');document.body.innerHTML='<canvas width="1440" height="900"></canvas>';const c=document.querySelector('canvas').getContext('2d',{willReadFrequently:true});const kinds=['fire','gas','warning','hostile','blast','aura','shield','burst'];
 for(let i=0;i<8;i++){const x=180+i%4*360,y=180+Math.floor(i/4)*420;c.fillStyle='#25312e';c.fillRect(i%4*360,Math.floor(i/4)*420,360,420);const z=Object.freeze({x,y,r:85,time:.3});if(i<5)drawGroundField(c,z,kinds[i],.4);else if(i<7)drawAuraField(c,z,85,.4,i===6);else drawBurst(c,{...z,t:.4,color:'#f1a17c',groundBurst:true});c.fillStyle='#eee';c.font='20px monospace';c.textAlign='center';c.fillText(kinds[i],x,y+130);if(c.globalAlpha!==1||c.getTransform().a!==1)throw Error('Canvas state leak');}
 return {variants:8};
 });await page.screenshot({path:join(output,'ground-effects.png')});
 for(const [width,height] of [[1280,800],[844,390],[390,844],[667,375]]){const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5174');await page.locator('#bossPractice').click();await page.locator('#practiceBoss').selectOption('king');await page.locator('#rollPractice').click();await page.locator('#launchPractice').click();await page.waitForTimeout(1500);await page.screenshot({path:join(output,`${width}x${height}.png`)});await context.close();}
 console.log(JSON.stringify({result,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
