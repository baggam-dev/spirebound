import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173';
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));await page.goto(base);
  assert.equal(await page.locator('.panel').evaluate(node=>document.activeElement===node),true);
  if(!mobile){
   await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'titleSettings');
   await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'start');
   await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'titleSettings');
   await page.keyboard.press('Space');await page.locator('#settingsBack').waitFor();
   await page.keyboard.press('Escape');await page.locator('#titleSettings').waitFor();
   await page.locator('#start').click();await page.locator('#cancelStart').waitFor();
   await page.keyboard.press('Escape');await page.locator('#titleSettings').waitFor();
  }else{
   await page.locator('#titleSettings').tap();await page.locator('#settingsBack').waitFor();
   await page.locator('#settingsBack').tap();await page.locator('#titleSettings').waitFor();
  }
  const warningLabels=await page.evaluate(async()=>{
   const {drawUpperGround}=await import('/src/rendering/upper-visuals.js');
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const context=canvas.getContext('2d'),labels=[];
   const original=context.fillText.bind(context);context.fillText=(value,...rest)=>{labels.push(value);return original(value,...rest);};
   drawUpperGround(context,{type:'boss',variant:'king',x:480,y:270,darkAttack:{kind:'judgment',axis:'vertical',step:0,time:.5}},0);
   return labels;
  });
  assert.equal(warningLabels.some(label=>label.includes('!! 2♥')),true);
  await page.evaluate(async()=>{
   const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
   const run=newRun(892);run.tutorialComplete=true;run.player.mainSkill='fire';run.player.fire=1;
   run.player.x=480;run.player.y=270;run.floors[0][0].obstacles=[];
   localStorage.setItem(SAVE_KEY,encodeSave(run));
  });
  await page.reload();await page.locator('#continue').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'game');
  if(mobile){
   await page.locator('#mobileMenu').tap();assert.equal(await page.locator('#mobileMenu').getAttribute('aria-expanded'),'true');
   await page.locator('#mobileMenu').focus();await page.keyboard.press('Escape');assert.equal(await page.locator('#mobileMenu').getAttribute('aria-expanded'),'false');
   await page.locator('#mobileMenu').tap();
   await page.locator('#settings').tap();await page.locator('#settingsBack').tap();
   await page.locator('#resume').tap();
  }
  else{await page.keyboard.press('Escape');await page.locator('#resume').focus();await page.keyboard.press('Space');}
  assert.equal(await page.locator('#overlay').evaluate(node=>node.innerHTML),'');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'game');
  assert.equal(await page.locator('#dodge').isDisabled(),false);
  if(mobile)await page.locator('#dodge').tap();else await page.keyboard.press('Space');
  await page.waitForFunction(()=>document.querySelector('#dodge')?.disabled);
  results.push({width,height,mobile,modalFocus:true,keyboardOrTouchResume:true,blinkInput:true,visualWarning:true});await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({results,pageErrors:errors.length}));
}finally{await browser.close();}
