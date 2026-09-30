import {mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173',output=resolve(process.argv[2]||'artifacts/demon');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[390,844,true]]){
  for(const phase of [1,2,3]){
   const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
   await page.goto(base);if(phase===1){await page.locator('#bossPractice').click();if(await page.locator('#practiceBoss option[value="demon"]').count())throw Error('Unfinished final boss is visible in public practice');}
   await page.evaluate(async phase=>{const {newRun}=await import('/src/game/engine.js'),{challengeDemon,advanceDemonPhase,tryDemonHole}=await import('/src/combat/demon.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(66,{campaign:'expanded'});s.floor=9;s.room=1;s.player.x=480;s.player.y=phase===1?115:405;s.tutorialComplete=true;if(phase>1)challengeDemon(s);const r=s.floors[9][1];if(phase>1){s.player.x=810;s.player.y=420;tryDemonHole(r,360,300,s.player);tryDemonHole(r,600,300,s.player);s.player.x=480;s.player.y=405;}for(let step=1;step<phase;step++){r.enemies.forEach(e=>e.hp=0);advanceDemonPhase(r,s.projectiles);}localStorage.setItem(SAVE_KEY,encodeSave(s));},phase);
   await page.reload();await page.locator('#continue').click();await page.waitForFunction(p=>document.querySelector('#floor')?.textContent?.startsWith('10층')&&document.querySelector('#phase')?.textContent?.includes('탐험'),phase);
   if(phase===1){await page.locator('#interact').getByText('대악마에게 도전',{exact:false}).waitFor();await page.locator('#interact').click();}
   await page.screenshot({path:join(output,`${width}x${height}-phase${phase}.png`)});
   const actual=await page.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY));return {phase:s.floors[9][1].demon.phase,holes:s.floors[9][1].obstacles.filter(o=>o.demonHole).length,ranking:s.ranking??null};});
   if(actual.phase!==phase||phase>1&&actual.holes!==2||actual.ranking?.seasonId!=='ASCENT-5'||actual.ranking.online)throw Error(JSON.stringify(actual));
   await context.close();
  }
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({viewports:2,phases:3,hiddenPractice:true,expandedSeason:'ASCENT-5',offlineFixture:true,pageErrors:0}));
}finally{await browser.close();}
