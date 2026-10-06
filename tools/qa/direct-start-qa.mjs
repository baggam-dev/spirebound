import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));
if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try {
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]) {
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/api/**',async route=>{const req=route.request(),body=req.postDataJSON();const data=req.url().endsWith('/runs')?{runId:body.runId,seasonId:body.seasonId,startedAt:Date.now()}:{active:true};await route.fulfill({json:data});});
  await page.goto(base);await page.locator('#start').click();
  await page.waitForFunction(()=>!!localStorage.getItem('spirebound.run.v1'));
  assert.deepEqual(await page.evaluate(()=>{const s=JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload);return [s.campaign,s.floors.length];}),['expanded',10]);
  assert.equal(await page.locator('#startClassic,#startExpanded').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.reload();await page.locator('#continue').waitFor();
  const oldId=await page.evaluate(async()=>{const {newRun}=await import('/src/game/engine.js');const {encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(123);localStorage.setItem(SAVE_KEY,encodeSave(s));return s.runId;});
  await page.reload();await page.locator('#continue').click();
  assert.deepEqual(await page.evaluate(()=>{const s=JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload);return [s.runId,s.floors.length];}),[oldId,8]);
  await page.reload();assert.match(await page.locator('#start').textContent(),/현재 저장 교체/);
  await page.locator('#start').click();await page.waitForFunction(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload).floors.length===10);
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({viewports:3,directExpandedStart:true,legacyClassicContinue:true,replacementStart:true,pageErrors:0,productionRunsStarted:0}));
} finally {await browser.close();if(server)await new Promise(r=>server.close(r));}
