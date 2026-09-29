import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')));
const browser=await chromium.launch({channel:'msedge',headless:true}),base=process.env.SPIREBOUND_URL||'http://localhost:5173';let cases=0;const errors=[];
try{for(const [width,height,touch] of [[1280,800,false],[1900,900,true],[844,390,true]])for(const mode of ['click','space','selection','blocked']){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch});const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 await page.evaluate(async mode=>{const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(17);if(mode==='selection'){s.player.level=2;s.pendingLevels=1;s.levelQueue=[2];}if(mode==='blocked'){s.player.y=65;}localStorage.setItem(SAVE_KEY,encodeSave(s));},mode);
 await page.reload();await page.locator('#continue').click();if(mode==='selection')await page.locator('#main-fire').click();await page.waitForFunction(()=>document.querySelector('#overlay').childElementCount===0);
 if(mode==='space')await page.keyboard.press('Space');else if(touch)await page.locator('#dodge').tap();else await page.locator('#dodge').click();
 await page.waitForTimeout(150);
 if(mode==='blocked'){assert.match(await page.locator('#notice').textContent(),/막혀/);assert.equal(await page.locator('#dodge').isDisabled(),false);await page.keyboard.down('s');await page.waitForTimeout(120);await page.keyboard.up('s');await page.keyboard.press('Space');await page.waitForTimeout(150);}
 assert.equal(await page.locator('#dodge').isDisabled(),true,JSON.stringify({width,height,touch,mode,notice:await page.locator('#notice').textContent()}));await page.keyboard.press('Escape');await page.locator('#resume').click();assert.equal(await page.locator('#dodge').isDisabled(),true,JSON.stringify({width,height,touch,mode,notice:await page.locator('#notice').textContent()}));cases++;await ctx.close();
}assert.deepEqual(errors,[]);console.log(JSON.stringify({cases,errors}));}finally{await browser.close();}

