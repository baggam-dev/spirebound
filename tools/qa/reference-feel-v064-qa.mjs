// Explicit release QA: isolated storage, local-only fixtures, no ranking writes.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const base=process.env.BASE_URL||'http://127.0.0.1:4635',out=process.argv[2];
if(!out)throw Error('Evidence directory required');await mkdir(out,{recursive:true});
const pw=join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {chromium}=await import(pathToFileURL(join(pw,'index.mjs')).href);
const hook=`
globalThis.__presentationHold=true;
globalThis.__presentationQA={
 async setup(kind,reduced=false){
  await lease.acquire();renderTitleScene=null;
  s=newRun(77,{campaign:'expanded',bossLayoutVersion:1});
  s.floor=kind==='king'?s.floors.findIndex(rs=>rs.some(r=>r.kingPending)):1;
  s.room=s.floors[s.floor].findIndex(r=>kind==='king'?r.kingPending:r.type==='normal');
  const r=room();r.enemies=[];for(const k of ['supportEncounter','specialEncounter','pursuerEncounter','sealEngine'])delete r[k];
  if(kind==='king'){const {challengeKing}=await import('/src/combat/upper-floors.js');if(!challengeKing(s))throw Error('king setup failed');}
  Object.assign(s.player,{mainSkill:'precision',precision:1,utility:'guardian',level:10,x:480,y:300});
  s.pendingLevels=0;s.levelQueue=[];s.attack=999;s.invulnerable=999;s.tutorialComplete=true;
  resetTransient();enterRoom(s);sound.update({muted:true,reducedEffects:reduced});document.documentElement.classList.toggle('calm-effects',reduced);
  await prepareFloorAssets(s.floor,floorAssetOptions(s));preparePresentationAssets(s);bossDialogue?.skip();
  mode='play';paused=false;$('overlay').innerHTML='';s.entryGrace=0;
  return {floor:s.floor,actors:r.enemies.length};
 },
 async pose(kind){
  const r=room(),e=r.enemies[0];
  if(kind==='hero-walk'){s.player.x+=3;s.elapsed+=.05;}
  if(kind==='hero-shot'){notifyHeroShot(s.player,s.elapsed);}
  if(kind==='landing'){const q={kind:null,x:1,y:0,elapsed:.1,duration:.28};s.roll=q;advanceHeroLanding(s,r,q,.016);delete s.roll;advanceHeroLanding(s,r,q,.016);observeHeroRoll(s,s.elapsed,q);}
  if(kind.startsWith('king')){
   e.kingTransition=0;e.kneel=0;e.opening=0;e.frozen=0;e.x=510;e.y=260;
   const phase=Number(kind[4]);e.kingStage=phase;e.hp=e.max*(phase===2?.5:.2);e.resurrectionVersion=1;
   delete e.darkAttack;delete e.darkFlash;
   if(kind.endsWith('windup'))e.darkAttack={kind:'slash',step:1,time:.18,x:e.x,y:e.y,aim:0};
   if(kind.endsWith('strike')){e.darkFlash={kind:'slash',time:.12,x:e.x,y:e.y,aim:0};e.opening=.4;}
   if(kind.endsWith('cast'))e.darkAttack={kind:'fan',time:.3,x:e.x,y:e.y,aim:0};
   if(kind.endsWith('death')){const {enemyDeathEffect}=await import('/src/rendering/enemy-feedback.js');e.hp=0;const f=enemyDeathEffect(e,false,e.max*.2);fx=[f];r.enemies=[];startBossClear(s,r,f);for(let i=0;i<4;i++)advanceBossClear(s,r,.1);}
  }
  if(kind==='doors'){r.enemies=[];emitInteraction(s,'roomClear',r,{unlocked:true,doors:[true,true,true,true]});s.elapsed+=.1;}
 },
 async reward(){const r=room();resetBossClear(s);startBossClear(s,r,{king:true,x:480,y:240});s.pendingLevels=1;levelUp();return bossRewardReveal.active();},
 async entrance(){entrance.queue(s);await showEntrance();},
 async save(){const {SAVE_KEY,encodeSave}=await import('/src/persistence/storage.js');localStorage.setItem(SAVE_KEY,encodeSave(s));}
};`;
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--mute-audio']}),errors=[],reports=[];let posts=0,active;
async function open(context,{blocked=false}={}){
 const page=active=await context.newPage();page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>{if(r.request().method()==='POST'){posts++;return r.abort();}return r.fulfill({status:200,contentType:'application/json',body:'{"records":[]}'});});
 if(blocked)await page.route('**/assets/images/*.png',r=>/\/(?:reference-(?:hero|mordo|fx)|title-background-v2)/.test(r.request().url())?r.abort():r.continue());
 await page.route('**/src/game/game.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('function update(dt){','function update(dt){if(globalThis.__presentationHold)return;')+hook});});
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!globalThis.__presentationQA);await page.evaluate(async()=>{await document.fonts.ready;globalThis.__qaTitleArt=(await import('/src/ui/title-scene.js')).titleArt;globalThis.__qaFrameState=(await import('/src/rendering/reference-frame-art.js')).referenceFrameArtState;});return page;
}
try{
 for(const [w,h] of [[1280,720],[844,390],[740,360],[390,844]]){
  const cx=await browser.newContext({viewport:{width:w,height:h},isMobile:w<1000,hasTouch:w<1000}),p=await open(cx);
  await p.waitForFunction(()=>__qaTitleArt.gate.complete&&__qaTitleArt.gate.naturalWidth>0&&__qaTitleArt.hero.naturalWidth>0);
  await p.waitForTimeout(500);const layout=await p.locator('.title-menu').evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,buttons:[...e.querySelectorAll('button')].map(b=>{const q=b.getBoundingClientRect();return {id:b.id,w:q.width,h:q.height};})};});
  assert.ok(layout.x>=0&&layout.right<=w);assert.ok(layout.buttons.every(b=>b.w>=40&&b.h>=43));assert.match(await p.locator('.edition').textContent(),/0\.64/);
  await p.screenshot({path:join(out,'title-'+w+'.png')});reports.push({kind:'title',w,h,layout});
  await p.locator('#titleSettings').click();await p.locator('#calmEffects').check();await p.locator('#settingsBack').click();await p.waitForTimeout(200);
  const still=await p.locator('.title-scene-canvas').evaluate(c=>c.toDataURL());await p.waitForTimeout(250);assert.equal(await p.locator('.title-scene-canvas').evaluate(c=>c.toDataURL()),still);
  if(w===390){await cx.close();continue;}
  await p.evaluate(()=>__presentationQA.setup('hero'));
  await p.waitForFunction(()=>{const a=__qaFrameState();return a.hero&&a.heroMove&&a.heroLanding&&a.fx;});
  for(const kind of ['hero-walk','hero-shot','landing','doors']){await p.evaluate(k=>__presentationQA.pose(k),kind);await p.screenshot({path:join(out,w+'-'+kind+'.png')});reports.push({w,kind});}
  await p.evaluate(()=>__presentationQA.setup('king'));
  await p.waitForFunction(()=>Object.values(__qaFrameState()).every(Boolean));
  for(const kind of ['king2-windup','king2-strike','king2-cast','king3-windup','king3-strike','king3-cast','king3-death']){await p.evaluate(k=>__presentationQA.pose(k),kind);await p.screenshot({path:join(out,w+'-'+kind+'.png')});reports.push({w,kind});}
  assert.ok(await p.evaluate(()=>__presentationQA.reward()));await p.locator('.boss-clear-continue').click();assert.equal(await p.locator('.boss-clear-continue').count(),0);reports.push({w,kind:'reward-skip'});
  await p.evaluate(()=>__presentationQA.setup('hero'));await p.evaluate(()=>__presentationQA.entrance());await p.locator('#entranceSkip').waitFor();await p.waitForTimeout(180);await p.locator('#entranceSkip').click();await p.waitForFunction(()=>!document.querySelector('#entranceSkip'));reports.push({w,kind:'new-entrance-skip'});
  await p.evaluate(()=>__presentationQA.save());await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.waitForFunction(()=>document.querySelector('#overlay').innerHTML==='');reports.push({w,kind:'continue-saved'});
  await cx.close();
 }
 const cx=await browser.newContext({viewport:{width:1280,height:720}}),p=await open(cx,{blocked:true});await p.waitForTimeout(200);await p.screenshot({path:join(out,'title-fallback.png')});
 await p.evaluate(()=>__presentationQA.setup('king'));const unloaded=await p.evaluate(async()=>Object.values((await import('/src/rendering/reference-frame-art.js')).referenceFrameArtState()).every(v=>!v));assert.ok(unloaded);
 await p.evaluate(()=>__presentationQA.pose('king3-strike'));await p.screenshot({path:join(out,'king-fallback.png')});reports.push({kind:'all-optional-images-aborted',fallback:true});await cx.close();
 assert.deepEqual(errors,[]);assert.equal(posts,0);await writeFile(join(out,'result.json'),JSON.stringify({base,reports,errors,posts},null,2));console.log(JSON.stringify({cases:reports.length,errors,posts}));
}catch(error){await writeFile(join(out,'failure.json'),JSON.stringify({error:String(error),reports,errors,posts},null,2));if(active&&!active.isClosed())await active.screenshot({path:join(out,'failure.png')}).catch(()=>{});throw error;}finally{await browser.close();}
