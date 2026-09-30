import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'https://168.107.21.43';
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.locator('#rank').click();await page.locator('#rankBoard').getByText('BETA-1 · 진행 중').waitFor();
  await page.locator('#rankExpanded').click();await page.locator('#rankBoard').getByText('ASCENT-1 · 진행 중').waitFor();
  const seasons=await page.evaluate(async()=>{const [classic,expanded]=await Promise.all(['BETA-1','ASCENT-1'].map(async season=>{const response=await fetch('/api/rankings?season='+season);if(!response.ok)throw Error('Season fetch failed');return response.json();}));return {classic,expanded};});
  assert.equal(seasons.classic.rulesVersion,'ranking-v1');assert.equal(seasons.expanded.rulesVersion,'ranking-v2');
  assert.equal(seasons.classic.seasonId,'BETA-1');assert.equal(seasons.expanded.seasonId,'ASCENT-1');
  assert.ok(Array.isArray(seasons.classic.entries)&&Array.isArray(seasons.expanded.entries));
  await page.locator('#rankBack').click();await page.locator('#start').click();
  await page.locator('#startClassic').waitFor();await page.locator('#startExpanded').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('spirebound.run.v1')),null);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({viewports:2,seasons:['BETA-1/ranking-v1','ASCENT-1/ranking-v2'],publicStartChoices:true,productionRunsStarted:0,productionRecordsSubmitted:0,pageErrors:0}));
}finally{await browser.close();}
