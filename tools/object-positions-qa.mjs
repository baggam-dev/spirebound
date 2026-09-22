import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const output=process.argv[2];await mkdir(output,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{for(const [width,height] of [[1280,800],[844,390],[390,844],[667,375]])for(const type of ['treasure','fountain']){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5174');
 await page.evaluate(async type=>{const {newRun}=await import('/engine.js'),{objectPoint}=await import('/object-positions.js'),{encodeSave,SAVE_KEY}=await import('/storage.js');const s=newRun(31);s.room=s.floors[0].findIndex(r=>r.type===type);const r=s.floors[0][s.room];r.enemies=[];r.hasChest=false;s.player.x=objectPoint(r).x;s.player.y=objectPoint(r).y+35;s.player.hp=2;r.chestReward={id:'potion'};s.tutorialComplete=true;localStorage.setItem(SAVE_KEY,encodeSave(s));},type);
 await page.reload();await page.locator('#continue').click();await page.locator('#interact').waitFor({state:'visible'});await page.screenshot({path:join(output,`${width}-${type}.png`)});await page.locator('#interact').click();
 const used=await page.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY));return s.floors[s.floor][s.room].used;});if(!used)throw Error('Object interaction missed relocated anchor');await context.close();
}console.log(JSON.stringify({interactions:8,errors}));if(errors.length)process.exitCode=1;}finally{await browser.close();}
