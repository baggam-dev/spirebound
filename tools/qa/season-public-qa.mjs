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
  await page.locator('#rank').click();await page.locator('#rankBoard').getByText('현재 기록 · 등록 가능').waitFor();
  assert.equal(await page.locator('[data-season]').count(),0);
  const old=await page.evaluate(async()=>{const response=await fetch('/api/rankings?season=BETA-5');return response.status;});assert.equal(old,404);
  await page.locator('#rankBack').click();await page.locator('#start').waitFor();
  assert.equal(await page.locator('#startClassic,#startExpanded').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('spirebound.run.v1')),null);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({viewports:2,current:'SPIREBOUND',oldSeasonHttpStatus:404,visibleSeasonTabs:0,publicStartChoices:false,productionRunsStarted:0,productionRecordsSubmitted:0,pageErrors:0}));
}finally{await browser.close();}
