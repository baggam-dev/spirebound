import {mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173';
const output=resolve(process.argv[2]||'artifacts/expanded-foundation');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  const classic=await page.evaluate(async()=>{const {newRun}=await import('/src/game/engine.js');const s=newRun(91);return {floors:s.floors.length,season:s.ranking?.seasonId};});
  if(classic.floors!==8||classic.season!=='BETA-1')throw Error('Public default campaign changed');
  await page.evaluate(async()=>{
   const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
   const s=newRun(91,{campaign:'expanded'});s.floor=9;s.room=0;s.player.x=680;s.player.y=270;s.player.hp=2;s.player.mainSkill='fire';s.player.fire=1;s.tutorialComplete=true;
   localStorage.setItem(SAVE_KEY,encodeSave(s));
  });
  await page.reload();await page.locator('#continue').click();
  await page.waitForFunction(()=>document.querySelector('#floor')?.textContent?.startsWith('10층'));
  await page.locator('#interact').getByText('샘물',{exact:false}).waitFor();
  await page.screenshot({path:join(output,`${width}x${height}-fountain.png`)});
  await page.locator('#interact').click();
  const result=await page.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY));return {hp:s.player.hp,ready:s.floors[9][0].fountainReady,stairs:s.floors[9][0].type,rooms:s.floors[9].length,ranking:s.ranking??null};});
  if(result.hp!==5||result.ready!==false||result.stairs!=='down'||result.rooms!==2||result.ranking?.seasonId!=='ASCENT-1'||result.ranking.online)throw Error(`Expanded facility/save mismatch: ${JSON.stringify(result)}`);
  await context.close();
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({classicFloors:8,classicSeason:'BETA-1',expandedFinalRooms:2,fountainOnce:true,expandedSeason:'ASCENT-1',offlineFixture:true,viewports:2,pageErrors:0}));
}finally{await browser.close();}
