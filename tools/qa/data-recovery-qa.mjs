import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {transferKeys} from '../../src/persistence/upgrade-transfer.js';

const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'https://recovery.test';
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
const file=async text=>({name:'spirebound-local-backup.json',mimeType:'application/json',buffer:Buffer.from(text)});
async function newContext(options={}){
 const context=await browser.newContext(options);
 if(!process.env.SPIREBOUND_URL)await context.route('https://recovery.test/**',async route=>{
  const file=new URL(route.request().url()).pathname.slice(1)||'index.html';
  if(!/^(?:index|upgrade)\.html$|^(?:src|styles)\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(?:js|css)$|^assets\/(?:images|fonts)\/[a-z0-9-]+\.(?:png|woff2)$/.test(file)){await route.abort();return;}
  const contentType=file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'font/woff2';
  await route.fulfill({body:await readFile(file),contentType});
 });
 return context;
}
try{
 const sourceContext=await newContext(),source=await sourceContext.newPage();
 source.on('pageerror',error=>errors.push(error.message));await source.goto(base);
 const sourceId=await source.evaluate(async()=>{
  const {newRun}=await import('/src/game/engine.js');
  const {encodeSave,SAVE_KEY,HISTORY_KEY}=await import('/src/persistence/storage.js');
  const run=newRun(917);localStorage.setItem(SAVE_KEY,encodeSave(run));
  localStorage.setItem(HISTORY_KEY,'[]');localStorage.setItem('spirebound.rank-submissions.v1','[]');
  localStorage.setItem('unrelated.private','never-export');document.cookie='qa-cookie=never-export';
  return run.runId;
 });
 await source.reload();await source.locator('#records').click();
 assert.match(await source.locator('.panel').textContent(),/온라인 순위는 서버에 남으며/);
 await source.locator('#dataBackup').click();await source.locator('#heading').getByText('기록 백업·가져오기').waitFor();
 assert.match(await source.locator('#intro').textContent(),/쿠키는 백업에 포함되지 않습니다/);
 const event=source.waitForEvent('download');await source.locator('#download').click();
 const download=await event,contents=await readFile(await download.path(),'utf8'),records=JSON.parse(contents);
 assert.equal(download.suggestedFilename(),'spirebound-local-backup.json');
 assert.deepEqual(Object.keys(records).sort(),[...transferKeys.filter(k=>k!=='spirebound.run.v1.backup'&&k!=='spirebound.run.v1.ended')].sort());
 assert.equal(contents.includes('never-export'),false);
 await sourceContext.close();

 const freshContext=await newContext(),fresh=await freshContext.newPage();
 fresh.on('pageerror',error=>errors.push(error.message));await fresh.goto(base+'/upgrade.html');
 await fresh.locator('#heading').getByText('기록 백업·가져오기').waitFor();
 await fresh.locator('#importFile').setInputFiles(await file(contents));
 assert.match(await fresh.locator('#status').textContent(),/기록 3개/);
 await fresh.locator('#play').click();await fresh.locator('#continue').waitFor();
 assert.equal(await fresh.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload).runId),sourceId);
 await freshContext.close();

 const existingContext=await newContext(),existing=await existingContext.newPage();
 existing.on('pageerror',error=>errors.push(error.message));await existing.goto(base+'/upgrade.html');
 await existing.locator('#heading').getByText('기록 백업·가져오기').waitFor();
 const existingId=await existing.evaluate(async()=>{
  const {newRun}=await import('/src/game/engine.js');
  const {encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
  const run=newRun(918);localStorage.setItem(SAVE_KEY,encodeSave(run));return run.runId;
 });
 await existing.locator('#importFile').setInputFiles(await file(contents));
 assert.match(await existing.locator('#status').textContent(),/기존 기록 1개는 유지/);
 assert.equal(await existing.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload).runId),existingId);
 assert.equal(await existing.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('spirebound.http-backup.'))),true);
 await existing.locator('#importFile').setInputFiles(await file('{"unrelated.private":"bad"}'));
 assert.match(await existing.locator('#status').textContent(),/잘못된 백업 항목/);
 assert.equal(await existing.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload).runId),existingId);
 await existingContext.close();

 const damagedContext=await newContext(),damaged=await damagedContext.newPage();
 damaged.on('pageerror',error=>errors.push(error.message));await damaged.goto(base);
 await damaged.evaluate(()=>localStorage.setItem('spirebound.run.v1','broken-save'));
 await damaged.reload();assert.match(await damaged.locator('[role="alert"]').textContent(),/원본을 보관/);
 await damaged.locator('#dataRecovery').click();await damaged.locator('#heading').getByText('기록 백업·가져오기').waitFor();
 const damagedEvent=damaged.waitForEvent('download');await damaged.locator('#download').click();
 assert.equal(JSON.parse(await readFile(await (await damagedEvent).path(),'utf8'))['spirebound.run.v1'],'broken-save');
 await damagedContext.close();
 for(const [width,height] of [[844,390],[390,844]]){
  const context=await newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));await page.goto(base);
  await page.locator('#records').tap();await page.locator('#dataBackup').tap();
  await page.locator('#heading').getByText('기록 백업·가져오기').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('#download').isVisible(),true);
  assert.equal(await page.locator('#importFile').isVisible(),true);
  await page.locator('#play').tap();await page.locator('#records').waitFor();
  await page.evaluate(()=>localStorage.setItem('spirebound.run.v1','broken-save'));
  await page.reload();await page.locator('#dataRecovery').waitFor();
  assert.equal(await page.evaluate(()=>{
   const box=document.querySelector('.title-content').getBoundingClientRect();
   return box.left>=0&&box.right<=innerWidth&&box.bottom<=innerHeight;
  }),true);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({exportedKeys:Object.keys(records).length,freshImport:true,existingPreserved:true,invalidRejected:true,damagedExport:true,mobileLayouts:2,pageErrors:0}));
}finally{await browser.close();}
