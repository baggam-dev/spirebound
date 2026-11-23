// Explicit deployment QA, isolated local storage, no score submissions.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const out=process.argv[2],base=process.env.BASE_URL||'http://127.0.0.1:4633';
if(!out)throw Error('Evidence directory required');await mkdir(out,{recursive:true});
const pw=process.env.PLAYWRIGHT_PATH||join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {chromium}=await import(pathToFileURL(join(pw,'index.mjs')).href);
const hook=`
globalThis.__feedbackHold=true;
globalThis.__feedbackQA={
 async load(kind,reduced){
  await lease.acquire();renderTitleScene=null;
  const {remnantSeal}=await import('/src/world/remnant-hunt.js');
  s=newRun(77,{campaign:'expanded',bossLayoutVersion:1});s.attack=999;s.invulnerable=999;
  if(kind==='whole'||kind==='split'){
   s.floor=7;for(const index of remnantSeal(s).rooms){s.room=index;room().enemies.forEach(e=>e.hp=0);stepRun(s,.01);}
   s.room=s.floors[7].findIndex(r=>r.remnantSeal);const {challengeDemon}=await import('/src/combat/demon.js');if(!challengeDemon(s))throw Error('remnant challenge failed');
   if(kind==='split'){room().enemies.forEach(e=>e.hp=0);stepRun(s,.01);}
  }else if(kind==='shadow'){
   s=newRun(47);s.key=true;s.tutorialComplete=true;room().enemies=[];startFinalEscape(s,room());const {tickFinalEscape}=await import('/src/world/final-escape.js');tickFinalEscape(s,room(),42);
  }else{ s.floor=2;s.room=s.floors[2].findIndex(r=>r.type==='normal');room().enemies=kind==='redesign'?[{id:0,type:'brute',x:380,y:270,hp:1000,max:1000,cd:9,balanceVersion:1},{id:1,type:'demonBat',x:620,y:270,hp:100,max:100,cd:9,balanceVersion:1}]:[]; }
  if(kind==='redesign')for(const key of ['supportEncounter','specialEncounter','pursuerEncounter','sealEngine'])delete room()[key];
  Object.assign(s.player,{mainSkill:'precision',precision:1,level:10,xp:0});s.pendingLevels=0;s.levelQueue=[];s.attack=999;s.invulnerable=999;s.tutorialComplete=true;
  resetTransient();enterRoom(s);sound.update({muted:true,reducedEffects:reduced});await prepareFloorAssets(s.floor,floorAssetOptions(s));preparePresentationAssets(s);
  bossDialogue?.skip();mode='play';paused=false;$('overlay').innerHTML='';s.entryGrace=0;
  if(kind==='whole'||kind==='split'){for(let i=0;i<75;i++)stepRun(s,1/60);}
  if(kind==='redesign'){const a=await import('/src/rendering/brute-walk.js'),b=await import('/src/rendering/demon-bat-sprite.js');const ready=await Promise.race([a.bruteRedesignPromise,new Promise((_,reject)=>setTimeout(()=>reject(Error('redesign art timeout: '+room().enemies.map(e=>e.type))),15000))]);if(!ready||!await b.demonBatSpriteReady||a.bruteRedesignState().frames!==12)throw Error('redesign art not ready');}
  const {validateRun}=await import('/src/persistence/storage.js');validateRun(s);return {kind,actors:room().enemies.length,stage:room().remnantBattle?.stage};
 },
 async ui(kind){
  if(kind==='roulette'){delete s.player.utility;s.utilityDraft={version:1,offers:['focus','frostWave','thunderSigil'],winner:'frostWave',status:'revealed'};const {utilityRouletteMarkup}=await import('/src/ui/utility-roulette.js');panel(utilityRouletteMarkup(s));$('overlay').firstElementChild.classList.add('utility-panel');}
  else{room().relicOffers=['crackedCrown','phoenixReliquary','resolveEmblem'];panel(relicSelectionMarkup(s,room()));$('overlay').firstElementChild.classList.add('relic-panel');}
  return true;
 },
 open(){const {enemies}=room(),before=enemies.length;return import('/src/world/final-escape.js').then(({tickFinalEscape})=>{tickFinalEscape(s,room(),10);return {before,after:room().enemies.length,ready:room().finalEscape.ready,can:canEscape(s)};});},
 roundtrip(){const {encodeSave,parseSave}=globalThis.__feedbackStorage;const before=encodeSave(s),copy=parseSave(before);return {floor:copy.floor,actors:copy.floors[copy.floor][copy.room].enemies.length};}
};
globalThis.__feedbackStorage=await import('/src/persistence/storage.js');
`;
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--mute-audio']}),errors=[],reports=[];let posts=0,active;
try{
 for(const cfg of [{name:'pc',width:1280,height:720,reduced:false},{name:'mobile',width:844,height:390,reduced:false},{name:'small-reduced',width:740,height:360,reduced:true}]){
  const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},isMobile:cfg.width<1000,hasTouch:cfg.width<1000});const page=active=await context.newPage();page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',route=>{if(route.request().method()==='POST'){posts++;return route.abort();}return route.fulfill({status:200,contentType:'application/json',body:'{"records":[]}'});});
  await page.route('**/src/game/game.js',async route=>{const response=await route.fetch(),body=await response.text();await route.fulfill({response,body:body.replace('function update(dt){','function update(dt){if(globalThis.__feedbackHold)return;')+hook});});
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!globalThis.__feedbackStorage);
  for(const kind of process.argv.includes('--only-art')?['redesign']:['whole','split','shadow','redesign']){const state=await page.evaluate(([kind,reduced])=>__feedbackQA.load(kind,reduced),[kind,cfg.reduced]);assert.equal(state.actors,kind==='whole'?1:kind==='split'?5:kind==='redesign'?2:15);await page.waitForTimeout(200);await page.screenshot({path:join(out,cfg.name+'-'+kind+'.png')});const saved=await page.evaluate(()=>__feedbackQA.roundtrip());assert.equal(saved.actors,state.actors);reports.push({viewport:cfg.name,...state});if(kind==='shadow'){const opened=await page.evaluate(()=>__feedbackQA.open());assert.ok(opened.ready&&opened.can);assert.equal(opened.before,opened.after);}}
  if(process.argv.includes('--only-art')){await context.close();continue;}
  await page.evaluate(reduced=>__feedbackQA.load('ui',reduced),cfg.reduced);
  for(const kind of ['roulette','relic']){await page.evaluate(kind=>__feedbackQA.ui(kind),kind);await page.waitForTimeout(150);await page.screenshot({path:join(out,cfg.name+'-'+kind+'.png')});const layout=await page.locator('#overlay .panel').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,width:e.getBoundingClientRect().width}));assert.ok(layout.width<=cfg.width);assert.ok(layout.scroll<=layout.height+2,kind+' outer panel scroll');if(kind==='relic'){assert.equal(await page.locator('.relic-select .relic-description').count(),0);assert.equal(await page.locator('.relic-description').count(),3);}reports.push({viewport:cfg.name,kind,layout});}
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.equal(posts,0);await writeFile(join(out,'result.json'),JSON.stringify({base,reports,errors,posts},null,2));console.log(JSON.stringify({cases:reports.length,errors,posts}));
}catch(e){await writeFile(join(out,'failure.json'),JSON.stringify({error:String(e),reports,errors,posts},null,2));if(active&&!active.isClosed())await active.screenshot({path:join(out,'failure.png')}).catch(()=>{});throw e;}finally{await browser.close();}
