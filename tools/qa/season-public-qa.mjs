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
  await page.locator('#rank').click();await page.locator('#rankBoard').getByText('BETA-4 · 진행 중').waitFor();
  await page.locator('[data-season="ASCENT-6"]').click();await page.locator('#rankBoard').getByText('ASCENT-6 · 진행 중').waitFor();
  await page.locator('[data-season="BETA-3"]').click();await page.locator('#rankBoard').getByText('BETA-3 · 종료').waitFor();
  await page.locator('[data-season="ASCENT-5"]').click();await page.locator('#rankBoard').getByText('ASCENT-5 · 종료').waitFor();
  await page.locator('[data-season="BETA-2"]').click();await page.locator('#rankBoard').getByText('BETA-2 · 종료').waitFor();
  await page.locator('[data-season="ASCENT-4"]').click();await page.locator('#rankBoard').getByText('ASCENT-4 · 종료').waitFor();
  await page.locator('[data-season="ASCENT-3"]').click();await page.locator('#rankBoard').getByText('ASCENT-3 · 종료').waitFor();
  await page.locator('[data-season="ASCENT-2"]').click();await page.locator('#rankBoard').getByText('ASCENT-2 · 종료').waitFor();
  await page.locator('[data-season="ASCENT-1"]').click();await page.locator('#rankBoard').getByText('ASCENT-1 · 종료').waitFor();
  await page.locator('[data-season="BETA-1"]').click();await page.locator('#rankBoard').getByText('BETA-1 · 종료').waitFor();
  const seasons=await page.evaluate(async()=>Promise.all(['BETA-4','ASCENT-6','BETA-3','ASCENT-5','BETA-2','ASCENT-4','BETA-1','ASCENT-3','ASCENT-2','ASCENT-1'].map(async season=>{const response=await fetch('/api/rankings?season='+season);if(!response.ok)throw Error('Season fetch failed');return response.json();})));
  for(const [i,expected] of ['ranking-v9','ranking-v10','ranking-v7','ranking-v8','ranking-v5','ranking-v6','ranking-v1','ranking-v4','ranking-v3','ranking-v2'].entries()){assert.equal(seasons[i].rulesVersion,expected);assert.equal(seasons[i].open,i<2);assert.ok(Array.isArray(seasons[i].entries));}
  await page.locator('#rankBack').click();await page.locator('#start').click();
  await page.locator('#startClassic').waitFor();await page.locator('#startExpanded').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('spirebound.run.v1')),null);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({viewports:2,seasons:['BETA-4/ranking-v9','ASCENT-6/ranking-v10','BETA-3/ranking-v7 archive','ASCENT-5/ranking-v8 archive','BETA-2/ranking-v5 archive','ASCENT-4/ranking-v6 archive','BETA-1/ranking-v1 archive','ASCENT-3/ranking-v4 archive','ASCENT-2/ranking-v3 archive','ASCENT-1/ranking-v2 archive'],publicStartChoices:true,productionRunsStarted:0,productionRecordsSubmitted:0,pageErrors:0}));
}finally{await browser.close();}
