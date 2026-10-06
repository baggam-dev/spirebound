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
  await page.locator('#rank').click();await page.locator('#rankBoard').getByText('BETA-5 · 진행 중').waitFor();
  await page.locator('[data-season="ASCENT-7"]').click();await page.locator('#rankBoard').getByText('ASCENT-7 · 진행 중').waitFor();
  await page.locator('[data-season="BETA-4"]').click();await page.locator('#rankBoard').getByText('BETA-4 · 종료').waitFor();
  await page.locator('[data-season="ASCENT-6"]').click();await page.locator('#rankBoard').getByText('ASCENT-6 · 종료').waitFor();
  assert.equal(await page.locator('[data-season]').count(),12);
  await page.locator('#rankBack').click();await page.locator('#start').click();
  await page.locator('#startClassic').waitFor();await page.locator('#startExpanded').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('spirebound.run.v1')),null);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({viewports:2,current:['BETA-5','ASCENT-7'],readOnly:['BETA-4','ASCENT-6'],visibleSeasons:12,publicStartChoices:true,productionRunsStarted:0,productionRecordsSubmitted:0,pageErrors:0}));
}finally{await browser.close();}
