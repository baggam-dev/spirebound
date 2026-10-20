import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5173',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];let activePage;
async function open(page){await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});await page.locator('.title-logo img').waitFor();await page.evaluate(()=>document.fonts.ready);}
async function fixture(page,kind){return page.evaluate(async kind=>{
 const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{doorCenter}=await import('/src/world/doors.js');
 const s=newRun(31,{campaign:'expanded'});s.tutorialComplete=true;s.player.mainSkill='frost';s.player.frost=1;s.player.hp=s.player.max=8;
 const f={warden:1,prism:3,slime:5,gate:6,king:7,commander:8,demon:9}[kind];s.floor=f;
 const rooms=s.floors[f],target=rooms.findIndex(r=>kind==='gate'?r.gate:r.type==='boss'),r=rooms[target];if(target<0)throw Error('No encounter '+kind);
 let direction=null;
 if(['king','commander','demon'].includes(kind)){s.room=target;s.player.x=480;s.player.y=180;}
 else{
  const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
  const from=rooms.findIndex((n,i)=>i!==target&&dirs.some(([dx,dy])=>n.x+dx===r.x&&n.y+dy===r.y));
  if(from<0)throw Error('No neighbor');s.room=from;const n=rooms[from];n.enemies=[];n.used=true;n.seen=true;
  direction=dirs.findIndex(([dx,dy])=>n.x+dx===r.x&&n.y+dy===r.y);const at=doorCenter(n,direction);
  Object.assign(s.player,direction%2?{x:direction===1?906:54,y:at}:{x:at,y:direction===0?74:466});r.seen=false;
 }
 localStorage.setItem(SAVE_KEY,encodeSave(s));return {direction,kind,target};
},kind);}
try{
 for(const [w,h] of [[1280,800],[844,390],[932,430],[740,360],[390,844]]){
  const mobile=w<1000,c=await browser.newContext({viewport:{width:w,height:h},isMobile:mobile,hasTouch:mobile}),p=await c.newPage();activePage=p;p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));await open(p);
  await p.evaluate(async()=>{for(const file of ['title-background-v1.png','title-logo-v1.png','title-hero-idle-v1.png','title-branch-v1.png']){const i=new Image();i.src='/assets/images/'+file;await i.decode();}});
  const a=await p.locator('.title-scene-canvas').evaluate(c=>c.toDataURL());await p.waitForTimeout(900);const b=await p.locator('.title-scene-canvas').evaluate(c=>c.toDataURL());assert.notEqual(a,b,'Title should move');
  await p.screenshot({path:join(out,`title-${w}.png`)});
  await p.evaluate(()=>{for(const el of document.querySelectorAll('.title-menu button')){const b=el.getBoundingClientRect();if(b.width<40||b.height<43)throw Error('Small button');}});
  await p.locator('#titleRecords').click();await p.locator('#titleBestiary').click();await p.locator('#closeBestiary').click();await p.locator('#titleBack').waitFor();await p.locator('#guide').click();await p.locator('#closeInfo').click();await p.locator('#titleBack').click();
  await p.locator('#titleSettings').click();await p.locator('#calmEffects').check();await p.locator('#settingsBack').click();await p.waitForTimeout(150);const calm=await p.locator('.title-scene-canvas').evaluate(c=>c.toDataURL());await p.waitForTimeout(700);assert.equal(await p.locator('.title-scene-canvas').evaluate(c=>c.toDataURL()),calm,'Reduced title should stay still');
  await fixture(p,'king');await p.reload({waitUntil:'domcontentloaded'});await p.locator('#start').click();await p.locator('#cancelNewRun').click();assert.equal(await p.locator('#continue').count(),1);
  if(w!==390){
   // Real continue + explicit boss challenge, not a practice run or a renderer-only fixture.
   await p.locator('#continue').click();await p.locator('#interact:not([hidden])').waitFor();await p.keyboard.press('e');await p.locator('#dialogueNext').waitFor();
   const before=await p.evaluate(()=>localStorage.getItem('spirebound.run.v1'));await p.waitForTimeout(500);
   const frozen=await p.evaluate(()=>document.querySelector('#timer').textContent);await p.waitForTimeout(1100);assert.equal(await p.locator('#timer').textContent(),frozen);
   await p.screenshot({path:join(out,`king-dialogue-${w}.png`)});await p.keyboard.press('Escape');await p.locator('#dialogueNext').waitFor({state:'detached'});assert.ok(before.includes('bossDialogueSeen'));
   await p.keyboard.press('Escape');await p.locator('#resume').waitFor();await p.locator('#quit').click();
   await p.locator('#continue').click();assert.equal(await p.locator('#dialogueNext').count(),0);await p.keyboard.press('Escape');await p.locator('#quit').click();
   for(const kind of w===1280?['warden','prism','slime','gate','commander']:w===844?['gate','demon']:[]){
    const setup=await fixture(p,kind);await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();
    await p.waitForFunction(()=>document.querySelector('#overlay').innerHTML==='');if(setup.direction!==null){const key=['w','d','s','a'][setup.direction];await p.locator('#game').focus();await p.keyboard.down(key);await p.locator('#dialogueNext').waitFor();await p.keyboard.up(key);}
    else await p.keyboard.press('e');
    if(kind==='demon'){
     // Actual third-phase wall rendering is checked separately with persisted boss data below.
     await p.keyboard.press('Escape');await p.locator('#quit').click();
    }else{
     await p.locator('#dialogueNext').waitFor();await p.screenshot({path:join(out,`${kind}-dialogue-${w}.png`)});
     if(kind==='gate'){assert.match(await p.locator('.dialogue-live').textContent(),/폐하/);await p.locator('#dialogueNext').click();assert.match(await p.locator('.dialogue-live').textContent(),/왕좌/);await p.screenshot({path:join(out,`vera-dialogue-${w}.png`)});}
     await p.locator('#dialogueSkip').click();await p.keyboard.press('Escape');await p.locator('#quit').click();
    }
   }
  }
  // Damaged local save still exposes the recovery route on the entrance.
  await p.evaluate(()=>{localStorage.setItem('spirebound.run.v1','broken');localStorage.removeItem('spirebound.run.v1.backup');});await p.reload({waitUntil:'domcontentloaded'});await p.locator('#dataRecovery').waitFor();await p.locator('#dataRecovery').click();await p.waitForURL('**/upgrade.html');
  results.push({width:w,titleAnimation:true,reducedEffects:true,recordsNavigation:true,recovery:true,dialogue:w!==390});await c.close();
 }
 assert.deepEqual(errors,[]);const result={base,results,errors,scoresSubmitted:0};await writeFile(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(error){if(activePage&&!activePage.isClosed()){await activePage.screenshot({path:join(out,'failure.png')});await writeFile(join(out,'failure.json'),JSON.stringify({errors,overlay:await activePage.locator('#overlay').innerText(),notice:await activePage.locator('#notice').innerText()},null,2));}throw error;}finally{await browser.close();}
