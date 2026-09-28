import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const output=process.argv[2];await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5173');
 await page.evaluate(async()=>{const {newRun}=await import('/engine.js'),{encodeSave,SAVE_KEY}=await import('/storage.js'),{objectPoint}=await import('/object-positions.js');const s=newRun(17);s.key=true;s.elapsed=1200;s.tutorialComplete=true;s.player.mainSkill='fire';s.player.fire=1;Object.assign(s.player,objectPoint(s.floors[0][0]));localStorage.setItem(SAVE_KEY,encodeSave(s));});
 await page.reload();await page.locator('#continue').click();await page.locator('#interact').click();await page.locator('.ranking-summary').waitFor();await page.locator('.ranking-summary').scrollIntoViewIfNeeded();await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:join(output,`ranking-${width}.png`)});
 await page.evaluate(async()=>{const el=document.querySelector('.ranking-summary'),r=el.getBoundingClientRect();if(r.left<0||r.right>innerWidth)throw Error('Score overflow');const {HISTORY_KEY}=await import('/storage.js'),rows=JSON.parse(localStorage.getItem(HISTORY_KEY));if(!rows.at(-1).ranking?.total)throw Error('Missing saved score');});
 await page.locator('#again').click();await page.locator('#records').click();await page.getByText(/탈출 점수.*로컬/).waitFor();await context.close();
}console.log(JSON.stringify({screens:3,errors}));if(errors.length)process.exitCode=1;}finally{await browser.close();}
