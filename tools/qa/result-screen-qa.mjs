import {mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href:'playwright');
const base=process.env.SPIREBOUND_URL||'http://localhost:5173',output=resolve(process.argv[2]||'artifacts/result-screen');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true],[667,375,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  for(const kind of ['win','death','expanded']){
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
   await page.evaluate(async kind=>{
    const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{objectPoint}=await import('/src/world/object-positions.js'),{challengeDemon}=await import('/src/combat/demon.js');
    const s=newRun(2026,{campaign:kind==='expanded'?'expanded':'classic'});s.player.mainSkill='fire';s.player.fire=1;s.player.level=3;s.pendingLevels=0;s.tutorialComplete=true;s.elapsed=1124;s.kills=127;
    s.metrics={damageTaken:7,shields:3,ultimateDamage:240,floorDamage:[1,0,2,0,3,0,0,0,0,0].slice(0,s.floors.length)};
    s.floor=0;s.room=s.floors[0].findIndex(r=>r.type==='exit');if(s.room<0)throw Error('No exit room');
    const room=s.floors[0][s.room];room.enemies=[];Object.assign(s.player,objectPoint(room));
    if(kind==='death'){s.player.hp=1;s.entryGrace=0;s.invulnerable=0;s.projectiles=[{x:s.player.x,y:s.player.y,vx:0,vy:0,life:1,enemy:true,hit:[],source:'검증용 탄환'}];}
    else{if(kind==='expanded'){s.floor=9;s.room=1;challengeDemon(s);const boss=s.floors[9][1];boss.used=true;boss.enemies=[];s.floor=0;s.room=s.floors[0].findIndex(r=>r.type==='exit');}s.key=true;}
    delete s.ranking.online;localStorage.setItem(SAVE_KEY,encodeSave(s));
   },kind);
   await page.reload();await page.locator('#continue').click();
   if(kind==='death')await page.locator('.result-loss').waitFor({timeout:8000});
   else{await page.locator('#interact').click();await page.locator('.result-win').waitFor();}
   const check=await page.evaluate(kind=>{
    const panel=document.querySelector('#overlay .panel'),root=document.querySelector('.result-screen'),box=panel.getBoundingClientRect(),buttons=[...root.querySelectorAll('button')];
    if(!root||!root.querySelector('.result-metrics')||!root.querySelector('.result-build')||!root.querySelector('.result-actions'))throw Error('Missing result hierarchy');
    if(box.left<0||box.right>innerWidth+1||document.documentElement.scrollWidth>innerWidth+1)throw Error('Horizontal overflow');
    if(!buttons.every(b=>b.getBoundingClientRect().width>=80))throw Error('Action clipped');
    if(kind==='death'&&!root.querySelector('.death-summary'))throw Error('Missing death cause');
    if(kind!=='death'&&!root.querySelector('.ranking-summary'))throw Error('Missing ranking summary');
    if(kind==='death'&&root.querySelector('.ranking-summary'))throw Error('Unexpected ranking summary');
    return {kind,width:innerWidth,height:innerHeight,scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,buttons:buttons.map(b=>b.id)};
   },kind);
   await page.screenshot({path:join(output,`${width}x${height}-${kind}.png`)});
   await page.locator('#journal').click();await page.locator('#closeJournal').click();await page.locator('.result-screen').waitFor();
   await page.locator('#again').scrollIntoViewIfNeeded();await page.screenshot({path:join(output,`${width}x${height}-${kind}-actions.png`)});
   results.push(check);await page.close();
  }
  await context.close();
 }
 console.log(JSON.stringify({results,errors},null,2));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
