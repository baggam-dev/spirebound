// Actual game loop with isolated fixtures. No ranking score submission.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5174',out=process.argv[2]||'docs/qa-environment-20261018/bosses';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];
try{
 for(const [width,height] of [[1280,800],[844,390]])for(const scene of (process.env.QA_BOSS_SCENES?.split(',')||['gate','king','commander','demon','demon-core'])){
  console.log('boss',width,scene);const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),p=await context.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
  await p.evaluate(async scene=>{
   const {newRun}=await import('/src/game/engine.js'),{objectPoint}=await import('/src/world/object-positions.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(31,{campaign:'expanded'});s.floor=scene==='gate'?6:scene==='king'?7:scene==='commander'?8:9;s.room=s.floors[s.floor].findIndex(r=>scene==='gate'?r.gate:r.type==='boss');const r=s.floors[s.floor][s.room],q=objectPoint(r);s.tutorialComplete=true;s.invulnerable=999;s.attack=999;s.player.x=q.x;s.player.y=q.y+35;
   if(scene==='demon-core'){const {challengeDemon,advanceDemonPhase}=await import('/src/combat/demon.js');challengeDemon(s);for(let i=0;i<2;i++){r.enemies=[];advanceDemonPhase(r,s.projectiles);}s.player.x=480;s.player.y=430;}
   localStorage.setItem(SAVE_KEY,encodeSave(s));
  },scene);await p.reload({waitUntil:'domcontentloaded',timeout:120000});await p.locator('#continue').click();
  const readiness=await p.evaluate(async()=>{const {heroSpriteReady,heroSpriteState}=await import('/src/rendering/hero-sprite.js'),u=await import('/src/rendering/upper-hall-art.js');if(!await heroSpriteReady||!await u.loadRoyalHallArt()||!await u.loadInfernalHallArt())throw Error('Art not ready');for(const file of ['mordo-phase1-sprite','mordo-phase2-sprite','mordo-phase3-sprite','commander-phase1-sprite','commander-phase2-sprite','demon-core-sprite']){const m=await import('/src/rendering/'+file+'.js');for(const [key,value] of Object.entries(m))if(key.endsWith('Ready')&&value?.then)if(!await value)throw Error('Boss art not ready '+key);}await document.fonts.ready;return heroSpriteState();});assert.equal(readiness.ready,true);
  if(['king','commander','demon'].includes(scene))await p.waitForFunction(async()=>{const {RunStore}=await import('/src/persistence/storage.js');const run=new RunStore(localStorage).read().run;if(!run)return false;const r=run.floors[run.floor][run.room];return !(r.kingPending||r.commanderPending||r.demonPending)&&r.enemies.some(e=>e.hp>0);});await p.waitForTimeout(1500);
  const state=await p.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY)),r=s.floors[s.floor][s.room];return {floor:s.floor+1,pending:!!(r.kingPending||r.commanderPending||r.demonPending),enemies:r.enemies.length,phase:r.demon?.phase??null};});assert.equal(state.pending,false);assert.ok(state.enemies>0);if(scene==='demon-core')assert.equal(state.phase,3);
  await p.keyboard.press('Escape');await writeFile(join(out,`${scene}-${width}.png`),Buffer.from(await p.locator('#game').evaluate(c=>c.toDataURL('image/png').split(',')[1]),'base64'));results.push({scene,width,...state,hero:readiness});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors},null,2));console.log(JSON.stringify({results,errors}));
}finally{await browser.close();}
