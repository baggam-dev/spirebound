// Run from the repository root. Uses isolated browser storage; never submits scores.
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base='https://168.107.21.43',old='http://168.107.21.43';
const browser=await chromium.launch({channel:'msedge',headless:true}); const errors=[];
try {
 const context=await browser.newContext(); const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base); await page.locator('#rank').waitFor();
 const image=page.locator('.title-art');assert.equal(await image.evaluate(img=>img.complete&&img.naturalWidth>0),true);await page.evaluate(()=>document.fonts.ready);
 if(process.argv[2])await page.screenshot({path:process.argv[2],fullPage:true});
 const assets=['index.html','upgrade.html','src/game/game.js','src/game/simulation.js','src/ui/ui.js','src/ranking/ranking-client.js','src/ranking/ranking-ui.js','src/persistence/upgrade.js','src/persistence/upgrade-transfer.js','src/rendering/room-backdrops.js','src/rendering/blink-visuals.js','src/rendering/arrow-impact-visuals.js','src/rendering/enemy-feedback.js','styles/pixel-theme.css'];
 for(const file of assets){const r=await context.request.get(base+'/'+file);assert.equal(r.status(),200);assert.equal(await r.text(),await readFile(file,'utf8'));}
 const health=await context.request.get(base+'/api/health');assert.equal((await health.json()).ok,true);
 const redirect=await context.request.get(old+'/src/game/game.js',{maxRedirects:0});assert.equal(redirect.status(),308);assert.equal(redirect.headers().location,base+'/src/game/game.js');
 await page.locator('#rank').click();await page.locator('#rankBoard').waitFor();assert.equal(await page.locator('#rankBoard[role="alert"]').count(),0);
 const session=await page.evaluate(async()=>{const r=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});return r.status;});assert.equal(session,200);
 const cookies=await context.cookies(base+'/api/');const cookie=cookies.find(c=>c.httpOnly);assert.ok(cookie);assert.equal(cookie.secure,true);
 // Simulate a valid pre-upgrade cookie locally, then verify API refresh preserves identity and secures it.
 await context.clearCookies();await context.addCookies([{...cookie,secure:false}]);
 const board=await page.evaluate(async()=>{const r=await fetch('/api/rankings?season=SPIREBOUND');const d=await r.json();return {status:r.status,valid:Array.isArray(d.entries)};});assert.deepEqual(board,{status:200,valid:true});
 const refreshed=(await context.cookies(base+'/api/')).find(c=>c.name===cookie.name);assert.equal(refreshed.value,cookie.value);assert.equal(refreshed.secure,true);
 await context.close();
 for(const existing of [false,true]){
 const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const source=await c.newPage();source.on('pageerror',e=>errors.push(e.message));
 if(existing){await source.goto(base+'/upgrade.html');await source.evaluate(()=>localStorage.setItem('spirebound.run.v1','secure run'));}
 await source.goto(old+'/');await source.locator('#transfer').waitFor();await source.evaluate(()=>{localStorage.setItem('spirebound.run.v1','old run');localStorage.setItem('spirebound.run.v1.backup','old backup');localStorage.setItem('spirebound.history','[]');localStorage.setItem('spirebound.active-tab','must not transfer');});
 const popup=source.waitForEvent('popup');await source.locator('#transfer').click();const target=await popup;target.on('pageerror',e=>errors.push(e.message));await source.getByText('옮기기가 완료되었습니다.',{exact:false}).waitFor();
 assert.equal(await target.evaluate(()=>localStorage.getItem('spirebound.run.v1')),existing?'secure run':'old run');assert.equal(await target.evaluate(()=>localStorage.getItem('spirebound.active-tab')),null);assert.equal(await source.evaluate(()=>localStorage.getItem('spirebound.run.v1')),'old run');
 assert.equal(await target.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('spirebound.http-backup.'))),true);await c.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({publicTLS:true,assetsMatch:assets.length,httpRedirect:308,rankings:true,secureHttpOnlyCookie:true,existingCookieUpgrade:true,transferNew:true,transferExisting:true,httpOriginalPreserved:true,pageErrors:0,productionRecordsSubmitted:0}));
} finally {await browser.close();}
