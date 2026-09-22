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
  const {drawFloorMood,floorNames}=await import('/atmosphere.js');const {drawWorldDetails}=await import('/pixel-world.js');
  document.body.innerHTML='<canvas width="1440" height="1080"></canvas>';document.body.style='margin:0';const c=document.querySelector('canvas').getContext('2d');
  const probe=document.createElement('canvas');probe.width=960;probe.height=540;const p=probe.getContext('2d',{willReadFrequently:true});const hashes=[];
  for(let floor=0;floor<8;floor++){
   const s=Object.freeze({floor,elapsed:1}),r=Object.freeze({x:2,y:3,type:floor%2?'shrine':'normal'});const before=JSON.stringify({s,r});
   const draw=()=>{p.fillStyle='#252e2d';p.fillRect(0,0,960,540);drawFloorMood(p,s,r);drawWorldDetails(p,s,r);};
   draw();const hash=()=>{let h=0;for(const n of p.getImageData(0,0,960,540).data)h=(Math.imul(h,31)+n)|0;return h;};const a=hash();draw();if(hash()!==a)throw Error('Unstable backdrop');if(before!==JSON.stringify({s,r})||p.globalAlpha!==1||p.getTransform().a!==1)throw Error('State leak');hashes.push(a);
   const x=floor%2*720,y=Math.floor(floor/2)*270;c.drawImage(probe,x,y,720,270);c.fillStyle='#e1dcc3';c.font='15px monospace';c.fillText((floor+1)+'F '+floorNames[floor],x+25,y+24);
  }if(new Set(hashes).size!==8)throw Error('Identical floors');return {distinctFloors:8,stable:true,stateUnchanged:true};
 });await page.screenshot({path:join(output,'floors.png')});
 for(const [width,height] of [[1280,800],[844,390],[390,844],[667,375]]){const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5174');await page.locator('#bossPractice').click();await page.locator('#practiceBoss').selectOption('king');await page.locator('#rollPractice').click();await page.locator('#launchPractice').click();await page.waitForTimeout(1500);await page.screenshot({path:join(output,`${width}x${height}.png`)});await context.close();}
 console.log(JSON.stringify({result,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
