import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
const {chromium}=await import(pathToFileURL(join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href);
const base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];
try{
for(const width of [1280,844]){
 const page=await browser.newPage({viewport:{width,height:width===1280?720:390}});page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base);await page.locator('#start').waitFor();
 await page.waitForFunction(async()=>{const {titleArt:a}=await import('/src/ui/title-scene.js');return [a.night.background,a.night.tree,...a.night.hero,...a.night.leaves,...a.night.fire].every(i=>i.complete&&i.naturalWidth>0);});
 const a=await page.locator('.title-scene-canvas').evaluate(c=>c.toDataURL());await page.waitForTimeout(750);assert.notEqual(await page.locator('.title-scene-canvas').evaluate(c=>c.toDataURL()),a);
 await page.screenshot({path:join(out,`title-${width}.png`)});
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);const still=await page.locator('.title-scene-canvas').evaluate(c=>c.toDataURL());await page.waitForTimeout(450);assert.equal(await page.locator('.title-scene-canvas').evaluate(c=>c.toDataURL()),still);
 await page.locator('#titleSettings').click();await page.locator('#settingsBack').click();await page.locator('#start').waitFor();
 await page.evaluate(async()=>{const {newRun}=await import('/src/game/engine.js');const {encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const run=newRun(31,{campaign:'expanded'});run.tutorialComplete=true;localStorage.setItem(SAVE_KEY,encodeSave(run));});
 await page.reload();await page.locator('#continue').click();await page.waitForFunction(()=>document.querySelector('#overlay').innerHTML==='');assert.ok(await page.locator('#game').isVisible());
 results.push({width,assets:12,motion:true,reduced:true,settings:true,continue:true});await page.close();
}
const page=await browser.newPage();await page.route('**/title-night-*.png',r=>r.abort());await page.goto(base);await page.locator('#start').waitFor();await page.waitForTimeout(500);assert.ok(await page.locator('.title-scene-canvas').evaluate(c=>c.width>0));await page.screenshot({path:join(out,'fallback.png')});results.push({fallback:true});await page.close();assert.deepEqual(errors,[]);
await writeFile(join(out,'results.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors}));
}finally{await browser.close();}
