// Public mode starts real online runs but never submits scores. Local mode checks sprite readiness only.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5174',online=base.startsWith('https:'),out=process.argv[2];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];
try{
 for(const [width,height] of [[1280,800],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),page=await context.newPage();
  page.setDefaultTimeout(120000);page.setDefaultNavigationTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
  console.log('viewport',width);await page.goto(base,{waitUntil:'domcontentloaded'});
  if(online){
   await page.locator('#start').click();
   await page.waitForFunction(()=>document.querySelector('#runHUD')?.hidden===false||!!document.querySelector('#rankStartRetry'));
   assert.equal(await page.locator('#rankStartRetry').count(),0,'Online start rejected');
  }else{
   await page.evaluate(async()=>{const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(31,{campaign:'expanded'});s.tutorialComplete=true;localStorage.setItem(SAVE_KEY,encodeSave(s));});
   await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();
  }
  const state=await page.evaluate(async()=>{
   const {heroSpriteReady,heroSpriteState}=await import('/src/rendering/hero-sprite.js');
   const {environmentArtReady}=await import('/src/rendering/environment-art.js');
   if(!await heroSpriteReady||!heroSpriteState().ready)throw Error('Approved hero PNG failed to load');
   if(!await environmentArtReady)throw Error('Environment PNG failed to load');
   await document.fonts.ready;
   const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js'),run=parseSave(localStorage.getItem(SAVE_KEY));
   return {hero:heroSpriteState(),online:!!run.ranking.online,rooms:run.floors.slice(0,2).map(r=>r.length),floors:run.floors.length};
  });
  assert.equal(state.hero.frames,4);assert.deepEqual(state.rooms,[5,6]);assert.equal(state.floors,10);if(online)assert.equal(state.online,true);
  await page.keyboard.press('Escape');await page.waitForTimeout(100);
  await writeFile(join(out,`hero-${width}.png`),Buffer.from(await page.locator('#game').evaluate(c=>c.toDataURL('image/png').split(',')[1]),'base64'));
  await page.screenshot({path:join(out,`screen-${width}.png`)});results.push({width,...state});await context.close();
 }
 assert.deepEqual(errors,[]);const result={base,onlineButtonStarts:online?2:0,results,errors,productionScoresSubmitted:0};await writeFile(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
