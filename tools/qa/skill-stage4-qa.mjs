import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173';
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
if(process.env.QA_OUTPUT)await mkdir(process.env.QA_OUTPUT,{recursive:true});
try{
 for(const [width,height,mobile] of [[1280,800,false],[390,844,true]]){
  for(const fixture of ['main','utility']){
   const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
   await page.evaluate(async kind=>{
    const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
    const s=newRun(44);s.tutorialComplete=true;s.player.level=kind==='main'?2:4;
    if(kind==='main'){s.pendingLevels=1;s.levelQueue=[2];}
    else{s.player.mainSkill='precision';s.player.precision=1;}
    localStorage.setItem(SAVE_KEY,encodeSave(s));
   },fixture);
   await page.reload();await page.locator('#continue').click();
   if(fixture==='main'){
    await page.locator('#main-precision').waitFor();assert.equal(await page.locator('.main-cards button').count(),5);
    if(process.env.QA_OUTPUT)await page.screenshot({path:join(process.env.QA_OUTPUT,`main-${mobile?'mobile':'desktop'}.png`)});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.locator('#main-precision').click();await page.waitForFunction(()=>!document.querySelector('#main-precision'));
    const main=await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload).player.mainSkill);assert.equal(main,'precision');
   }else{
    await page.locator('#utilityChoice0').waitFor();await page.locator('#utilityChoice0').click();await page.locator('#utility').waitFor({state:'visible'});
    if(process.env.QA_OUTPUT)await page.screenshot({path:join(process.env.QA_OUTPUT,`utility-${mobile?'mobile':'desktop'}.png`)});
    const bounds=await page.locator('#utility').boundingBox();assert.ok(bounds&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width&&bounds.y+bounds.height<=height);
    if(mobile)await page.locator('#utility').tap();else await page.keyboard.press('g');
    await page.waitForFunction(()=>{const raw=localStorage.getItem('spirebound.run.v1');return raw&&JSON.parse(JSON.parse(raw).payload).utilityCooldown>0;});
    const state=await page.evaluate(()=>{const s=JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload);return {name:s.player.utility,cooldown:s.utilityCooldown,focus:s.player.focusTime};});
    assert.equal(state.name,'focus');assert.ok(state.cooldown>0&&state.focus>0);
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await context.close();
  }
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({viewports:2,mainChoices:5,utilityChoice:true,keyboardAndTouch:true,save:true,pageErrors:0}));
}finally{await browser.close();}
