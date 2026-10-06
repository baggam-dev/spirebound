import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:'+server.address().port,output=process.argv[2];if(output)await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try {
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/api/**',route=>route.abort());await page.goto(base);
  const count=await page.evaluate(async()=>{const {newRun}=await import('/src/game/engine.js'),{enemyGuide}=await import('/src/world/expedition.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{objectPoint}=await import('/src/world/object-positions.js');const s=newRun(419,{campaign:'expanded'});s.key=true;s.player.mainSkill='frost';s.player.frost=1;s.tutorialComplete=true;s.bestiary=Object.fromEntries(Object.keys(enemyGuide).map(k=>[k,{kills:1,traits:[]}]));const r=s.floors[0][0];r.enemies=[];r.finalEscape={elapsed:36,wave:3,ready:true};Object.assign(s.player,objectPoint(r));localStorage.setItem(SAVE_KEY,encodeSave(s));return Object.keys(enemyGuide).length;});
  await page.reload();await page.locator('#continue').click();await page.locator('#interact').click();await page.locator('#journal').click();await page.locator('#closeJournal').waitFor();
  assert.equal(await page.locator('.journal-enemy').count(),count);assert.equal(await page.locator('canvas[data-part]').count(),6);
  const pixels=await page.locator('.journal-portrait').evaluateAll(cs=>cs.map(c=>{const data=c.getContext('2d').getImageData(0,0,160,160).data;let n=0,edge=0;for(let y=0;y<160;y++)for(let x=0;x<160;x++)if(data[(y*160+x)*4+3]){n++;if(x===0||y===0||x===159||y===159)edge++;}return {key:c.dataset.enemy,part:c.dataset.part,n,edge};}));
  assert.ok(pixels.every(p=>p.n>100&&p.edge===0),JSON.stringify(pixels));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('.journal-parts').scrollIntoViewIfNeeded();if(output)await page.screenshot({path:join(output,`journal-${width}.png`)});
  await page.locator('#closeJournal').click();await page.locator('#journal').waitFor();await page.locator('#journal').click();assert.equal(await page.locator('.journal-portrait').count(),count+6);
  // Old saves without a bestiary remain valid and do not reveal undiscovered enemies.
  await page.evaluate(async()=>{const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(420);delete s.bestiary;localStorage.setItem(SAVE_KEY,encodeSave(s));});await page.reload();await page.locator('#continue').click();await page.keyboard.press('Escape');await page.locator('#journal').click();assert.equal(await page.locator('.journal-portrait').count(),0);
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({viewports:3,resultJournal:true,allPortraitsVisible:true,demonParts:6,clippedPortraits:0,oldSaveWithoutBestiary:true,pageErrors:0,productionRecordsSubmitted:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
