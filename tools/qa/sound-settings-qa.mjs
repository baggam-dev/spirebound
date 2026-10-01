import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173',output=process.argv[2]||'artifacts/sound-settings';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));await page.goto(base);
  await page.locator('#titleSettings').click();
  await page.locator('#soundMute').click();
  await page.locator('#soundVolume').fill('30');
  await page.locator('#calmEffects').check();
  assert.equal(await page.locator('#soundMute').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#soundValue').textContent(),'30%');
  assert.equal(await page.locator('html').evaluate(node=>node.classList.contains('calm-effects')),true);
  await page.screenshot({path:join(output,`${width}x${height}-settings.png`)});
  await page.reload();await page.locator('#titleSettings').click();
  assert.equal(await page.locator('#soundMute').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#soundVolume').inputValue(),'30');
  assert.equal(await page.locator('#calmEffects').isChecked(),true);
  await page.locator('#soundMute').click();assert.equal(await page.locator('#soundMute').getAttribute('aria-pressed'),'false');
  await page.locator('#settingsBack').click();
  await page.evaluate(async()=>{
   const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
   const run=newRun(456);run.tutorialComplete=true;run.player.mainSkill='fire';run.player.fire=1;
   localStorage.setItem(SAVE_KEY,encodeSave(run));
  });
  await page.reload();await page.locator('#continue').click();
  await page.locator('#pause').click();await page.locator('#pauseSettings').click();
  assert.equal(await page.locator('#soundMute').getAttribute('aria-pressed'),'false');
  await page.locator('#settingsBack').click();await page.locator('#resume').click();
  assert.equal(await page.locator('#overlay').evaluate(node=>node.innerHTML),'');
  results.push({width,height,settingsPersisted:true,pauseResume:true});await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({results,pageErrors:errors.length}));
}finally{await browser.close();}
