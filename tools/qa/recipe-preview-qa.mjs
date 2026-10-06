import assert from 'node:assert/strict';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173';
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.evaluate(async()=>{
   const {newRun}=await import('/src/game/engine.js');
   const {encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
   const run=newRun(47);run.tutorialComplete=true;run.player.level=4;run.player.mainSkill='fire';run.player.fire=1;run.player.utility='focus';
   run.pendingLevels=1;run.levelQueue=[4];run.choices=['repeat','power','haste'];
   localStorage.setItem(SAVE_KEY,encodeSave(run));
  });
  await page.reload();await page.locator('#continue').click();
  await page.waitForTimeout(300);
  if(!await page.locator('#u0').count())throw Error((await page.locator('body').innerText()).slice(0,1200));
  const card=await page.locator('#u0').innerText();
  assert.match(card,/선택 시 조합 완성/);assert.match(card,/속성 연사/);assert.match(card,/작은 화염 폭발/);
  assert.doesNotMatch(await page.locator('#u1').innerText(),/조합 완성/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({viewports:2,recipeExplanation:true,pageErrors:0}));
}finally{await browser.close();}
