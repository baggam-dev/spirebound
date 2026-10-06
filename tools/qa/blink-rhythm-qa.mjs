import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173',output=process.argv[2];
if(output)await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const [width,height,mobile,label] of [[1280,800,false,'pc'],[844,390,true,'mobile']]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));await page.goto(base);
  const pixels=await page.evaluate(async()=>{
   const {drawBlinkTrail}=await import('/src/rendering/blink-visuals.js');
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
   const c=canvas.getContext('2d');
   const handled=drawBlinkTrail(c,{blinkTrail:true,fromX:360,fromY:270,x:560,y:270,t:.2,duration:.3});
   const count=(x,y,w,h)=>{const data=c.getImageData(x,y,w,h).data;let lit=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)lit++;return lit;};
   return {handled,trail:count(385,260,150,20),outside:count(600,260,30,20)};
  });
  assert.equal(pixels.handled,true);assert.ok(pixels.trail>50);assert.equal(pixels.outside,0);
  await page.evaluate(async()=>{
   const {newRun}=await import('/src/game/engine.js');
   const {encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
   const run=newRun(419);run.tutorialComplete=true;run.player.x=360;run.player.y=270;
   run.floors[0][0].obstacles=[];run.floors[0][0].enemies=[];
   localStorage.setItem(SAVE_KEY,encodeSave(run));
  });
  await page.reload();await page.locator('#continue').click();
  if(output)await page.screenshot({path:join(output,`blink-before-${label}.png`)});
  await page.keyboard.down('ArrowRight');
  if(mobile)await page.locator('#dodge').tap();else await page.keyboard.press('Space');
  await page.waitForFunction(()=>document.querySelector('#dodge')?.disabled);
  await page.waitForTimeout(70);
  if(output)await page.screenshot({path:join(output,`blink-after-${label}.png`)});
  await page.keyboard.up('ArrowRight');await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({viewports:2,trailPixels:true,blinkInput:true,pageErrors:0}));
}finally{await browser.close();}
