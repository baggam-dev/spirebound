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
  await page.locator('#rankExpanded').click();await page.locator('#rankBoard').getByText('ASCENT-3 · 진행 중').waitFor();
  await page.locator('#rankPrevious').click();await page.locator('#rankBoard').getByText('ASCENT-2 · 종료').waitFor();
  await page.locator('#rankArchive').click();await page.locator('#rankBoard').getByText('ASCENT-1 · 종료').waitFor();
  const seasons=await page.evaluate(async()=>{const [classic,expanded,previous,archive]=await Promise.all(['BETA-1','ASCENT-3','ASCENT-2','ASCENT-1'].map(async season=>{const response=await fetch('/api/rankings?season='+season);if(!response.ok)throw Error('Season fetch failed');return response.json();}));return {classic,expanded,previous,archive};});
  assert.equal(seasons.classic.rulesVersion,'ranking-v1');assert.equal(seasons.expanded.rulesVersion,'ranking-v4');assert.equal(seasons.previous.rulesVersion,'ranking-v3');assert.equal(seasons.archive.rulesVersion,'ranking-v2');
  assert.equal(seasons.classic.seasonId,'BETA-1');assert.equal(seasons.expanded.seasonId,'ASCENT-3');assert.equal(seasons.previous.seasonId,'ASCENT-2');assert.equal(seasons.previous.open,false);assert.equal(seasons.archive.seasonId,'ASCENT-1');assert.equal(seasons.archive.open,false);
  assert.ok(Array.isArray(seasons.classic.entries)&&Array.isArray(seasons.expanded.entries)&&Array.isArray(seasons.previous.entries)&&Array.isArray(seasons.archive.entries));
  await page.locator('#rankBack').click();await page.locator('#start').click();
  await page.locator('#startClassic').waitFor();await page.locator('#startExpanded').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('spirebound.run.v1')),null);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({viewports:2,seasons:['BETA-1/ranking-v1','ASCENT-3/ranking-v4','ASCENT-2/ranking-v3 archive','ASCENT-1/ranking-v2 archive'],publicStartChoices:true,productionRunsStarted:0,productionRecordsSubmitted:0,pageErrors:0}));
}finally{await browser.close();}
