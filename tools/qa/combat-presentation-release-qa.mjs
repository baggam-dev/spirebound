// Prepared only. Execute after an explicit deployment instruction.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const base=process.env.BASE_URL||'http://127.0.0.1:4633',out=process.argv[2];
if(!out)throw Error('Provide an evidence directory');
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname)&&!process.argv.includes('--allow-public'))throw Error('Public QA requires --allow-public');
const pw=process.env.PLAYWRIGHT_PATH||join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {chromium}=await import(pathToFileURL(join(pw,'index.mjs')).href);
const hook=`
const castQA=await import('/src/rendering/hero-cast-state.js');
const castArtQA=await import('/src/rendering/hero-cast-art.js');
const hitArtQA=await import('/src/rendering/enemy-hit-art.js');
const hitStateQA=await import('/src/rendering/ordinary-presentation-state.js');
const damageQA=await import('/src/combat/critical.js');
globalThis.__presentationHold=true;
globalThis.__presentationQA={
 async load(id){
  await lease.acquire();stop('pause');renderTitleScene=null;
  const ordinary=e=>e.type==='archer'&&!e.elite&&!e.gateTitle&&!e.roamingElite&&!e.summoned;
  let selected;
  for(let seed=1;seed<=40;seed++){s=newRun(seed);selected=s.floors.slice(1,4).flatMap((rooms,i)=>rooms.map((r,index)=>({r,floor:i+1,index}))).find(({r})=>r.type==='normal'&&!r.footprint&&!r.tutorial&&!r.gate&&!r.hasChest&&!r.supportEncounter&&r.enemies.some(ordinary));if(selected)break;}
  if(!selected)throw Error('No safe fixture room in 40 seeds');s.floor=selected.floor;s.room=selected.index;s.tutorialComplete=true;
  const source=room().enemies.find(ordinary);
  if(!source)throw Error('No ordinary archer fixture');
  let e=structuredClone(source);Object.assign(e,{x:550,y:270,hp:5000,max:5000,cd:999});delete e.attackPhase;const template=structuredClone(e);
  Object.assign(s.player,{utility:id,level:6,mainSkill:'precision',precision:1,max:10,hp:8,critChance:0});
  const r=room();r.obstacles=[];r.enemies=[e];s.invulnerable=999;s.attack=999;
  resetTransient();enterRoom(s);Object.assign(s.player,{x:480,y:270});
  // Entry planners can replace the original slot with a support actor. Restore
  // the chosen original archer only inside this isolated presentation fixture.
  e=structuredClone(template);r.enemies=[e];
  await prepareFloorAssets(s.floor,floorAssetOptions(s));if(!save())throw Error(saveError);resume();
 },
 step(dt,count=1){for(let i=0;i<count;i++){globalThis.__presentationHold=false;try{update(dt);}finally{globalThis.__presentationHold=true;}}},
 focus(){canvas.focus();},
 incoming(){s.projectiles=Array.from({length:3},()=>({x:s.player.x-35,y:s.player.y,vx:500,vy:0,life:1,hit:[],enemy:true,damage:9}));},
 async previewTarget(type){
  const source=s.floors.flatMap(r=>r).flatMap(r=>r.enemies||[]).find(e=>e.type===type&&!e.elite&&!e.gateTitle&&!e.summoned);
  if(!source)throw Error('Missing preview actor '+type);
  room().enemies=[{...structuredClone(source),x:550,y:270,hp:5000,max:5000,cd:999}];fx=[];resetOrdinaryPresentation([room()]);s.elapsed+=.02;
  await prepareFloorAssets(s.floor,floorAssetOptions(s));preparePresentationAssets(s);
 },
 previewHit(moving){
  const e=room().enemies[0],before=new Map([[e,e.hp]]);if(moving)e.x+=3;s.elapsed+=.035;
  damageQA.applyPlayerDamage(s,e,10,{source:'arrow',visualOrigin:{x:e.x+40,y:e.y}});
  const effects=enemyHitEffects(before,[e]);fx=mergeEnemyFeedback(fx,effects);notifyOrdinaryHits(room(),effects,damageQA.drainDamageResults(s));tickOrdinaryPresentation(room(),.035);
 },
 async nativePreview(moving){
  const {drawGruntSprite}=await import('/src/rendering/grunt-sprite.js'),e=room().enemies[0],c=document.createElement('canvas');c.width=480;c.height=340;const g=c.getContext('2d');
  g.fillStyle='#20292b';g.fillRect(0,0,c.width,c.height);g.fillStyle='#eee0bb';g.font='12px monospace';g.fillText(e.type+' / native + 3x / '+(moving?'walking':'standing'),12,18);
  const p={face:1,moving,walk:1,step:1,recoil:0};
  for(const [x,y,scale,actor] of [[60,92,1,structuredClone(e)],[155,92,1,e],[325,235,3,e]]){g.save();g.translate(x,y);g.scale(scale,scale);drawGruntSprite(g,actor,p,s);g.restore();}
  return {png:c.toDataURL('image/png'),pose:hitStateQA.ordinaryPose(e)};
 },
 patch(values){if('hp' in values)s.player.hp=values.hp;if('cooldown' in values)s.utilityCooldown=values.cooldown;if(values.noEnemies)room().enemies=[];},
 state(){if(!s)return {mode,paused,cast:null};return {mode,paused,elapsed:s.elapsed,hp:s.player.hp,cooldown:s.utilityCooldown,galeCharges:s.player.galeCharges,roll:!!s.roll,cast:castQA.heroCastPose(s.player,s.elapsed,{reduced:sound.settings.reducedEffects}),art:castArtQA.heroCastArtState(),hitArt:hitArtQA.enemyHitArtState(),guide:utilityGuide(s,{paused}),fx:fx.map(f=>({kind:f.utilityFx,contact:!!f.utilityContact})),enemies:room().enemies.map(e=>({id:e.id,hp:e.hp}))};}
};`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];let active,posts=0;
const ids=['focus','firstAid','guardian','frostWave','thunderSigil','galeVeil'];
async function flush(p){await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function snap(p){await flush(p);return p.evaluate(()=>__presentationQA.state());}
async function load(p,id){await p.evaluate(id=>__presentationQA.load(id),id);await p.waitForFunction(()=>__presentationQA.state().mode==='play');await p.evaluate(()=>__presentationQA.focus());await flush(p);}
async function key(p,key){await p.evaluate(()=>__presentationQA.focus());await p.keyboard.press(key);await flush(p);}
async function cast(p,cfg){if(cfg.touch){await p.locator('#utility').tap();await flush(p);}else await key(p,'g');}
async function step(p,dt,count=1){await p.evaluate(({dt,count})=>__presentationQA.step(dt,count),{dt,count});await flush(p);}
async function open(cfg){
 const c=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},isMobile:cfg.touch,hasTouch:cfg.touch,ignoreHTTPSErrors:true}),p=await c.newPage();active=p;p.setDefaultTimeout(60000);
 p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/api/**',r=>{if(r.request().method()==='POST'){posts++;return r.abort();}return r.continue();});
 if(cfg.fail)await p.route(/\/(hero-utility-(casts|upper)-v1|enemy-hit-reactions-v1)\.png(?:\?.*)?$/,r=>r.abort());
 await p.route('**/src/game/game.js',async r=>{
  const response=await r.fetch(),body=await response.text(),needle='function update(dt){';
  assert.equal(body.split(needle).length,2,'Expected one real update entry point');
  await r.fulfill({response,body:body.replace(needle,needle+'if(globalThis.__presentationHold)return;')+hook});
 });
 await p.addInitScript(reduced=>localStorage.setItem('spirebound.settings.v1',JSON.stringify({muted:true,volume:0,reducedEffects:reduced})),cfg.reduced);
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!globalThis.__presentationQA);return {c,p};
}
async function caseRun(cfg){
 console.log('presentation',cfg.name);const {c,p}=await open(cfg),caseResults=[];
 try{
  for(const moving of [false,true])for(const id of ids){
   await load(p,id);
   if(!cfg.fail)await p.waitForFunction(()=>{const v=__presentationQA.state();return v.art.body&&v.art.upper&&v.hitArt.types.length===3;});
   if(moving)await p.keyboard.down('ArrowRight');
   const before=await snap(p);await cast(p,cfg);await step(p,.02,4);const during=await snap(p);
   assert.equal(during.cast?.id,id);assert.ok(during.cooldown>0);
   if(id==='focus')assert.equal(during.hp,before.hp-1);else assert.equal(during.hp,before.hp);
   if(id==='frostWave'){assert.ok(during.enemies[0].hp<before.enemies[0].hp);assert.ok(during.fx.some(f=>f.kind==='frostContact'));}
   if(!moving||['guardian','frostWave'].includes(id))await p.screenshot({path:join(out,cfg.name+'-'+id+(moving?'-walk':'-stand')+'.png')});
   await p.keyboard.up('ArrowRight');await step(p,.02,20);assert.equal((await snap(p)).cast,null);
   if(id==='thunderSigil'){
    await step(p,.02,12);const landed=await snap(p);assert.ok(landed.fx.some(f=>f.kind==='thunderSigil'));
    assert.equal(landed.fx.some(f=>f.kind==='sigilContact'),landed.enemies[0].hp<before.enemies[0].hp);
   }
   caseResults.push({id,moving,successfulCast:true,expiredWithoutReplay:true});
  }
  await load(p,'guardian');await cast(p,cfg);await key(p,' ');await step(p,.02);assert.equal((await snap(p)).cast,null);
  await load(p,'guardian');await cast(p,cfg);await key(p,'Escape');assert.equal((await snap(p)).cast,null);
  await p.locator('#resume').click();assert.equal((await snap(p)).cast,null);
  await load(p,'guardian');await cast(p,cfg);assert.notEqual((await snap(p)).cast,null);
  await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.waitForFunction(()=>globalThis.__presentationQA?.state().mode==='play');
  assert.equal((await snap(p)).cast,null);assert.equal((await snap(p)).guide.name,'성역의 구체');
  await load(p,'focus');await p.evaluate(()=>__presentationQA.patch({hp:1}));await flush(p);
  assert.equal(await p.locator('#utility').isDisabled(),true);assert.match(await p.locator('#utility').getAttribute('aria-label'),/1하트/);
  const before=await snap(p);await key(p,'g');const after=await snap(p);assert.equal(after.hp,before.hp);assert.equal(after.cooldown,0);assert.equal(after.cast,null);
  await load(p,'thunderSigil');await p.evaluate(()=>__presentationQA.patch({noEnemies:true}));await flush(p);
  assert.equal((await snap(p)).guide.code,'target');assert.match(await p.locator('#utility').getAttribute('aria-label'),/지상 적/);
  await load(p,'galeVeil');await cast(p,cfg);await p.evaluate(()=>__presentationQA.incoming());await step(p,.05);
  const wind=await snap(p);assert.equal(wind.galeCharges,0);assert.equal(wind.fx.filter(f=>f.kind==='galeBreak').length,2);assert.match(wind.guide.active,/탄 소거 소진/);
  await p.locator('#bag').click();await p.locator('.build-window').waitFor();
  await p.locator('[data-build-entry="active:galeVeil"]').click();assert.match(await p.locator('.build-detail').innerText(),/반사탄/);assert.match(await p.locator('.build-detail').innerText(),/탄 소거 소진/);
  await p.locator('.build-detail').evaluate(e=>{e.scrollTop=e.scrollHeight;});
  await p.screenshot({path:join(out,cfg.name+'-guide.png')});
  if(cfg.fail){const v=await snap(p);assert.equal(v.art.body,false);assert.equal(v.art.upper,false);assert.equal(v.hitArt.types.length,0);}
  results.push({name:cfg.name,casts:caseResults,rollAndPauseCancel:true,reloadWithoutCastReplay:true,guideFailuresAndBuild:true,assetFailure:cfg.fail});
 }catch(error){
  await p.screenshot({path:join(out,cfg.name+'-failure.png')}).catch(()=>{});
  await writeFile(join(out,cfg.name+'-failure.json'),JSON.stringify({error:String(error),completed:caseResults,state:await snap(p).catch(()=>null)},null,2));throw error;
 }finally{await c.close();}
}
// Runs the real view clocks in the browser with dense hit events. It intentionally
// isolates AI: this is not a complete Velkar battle or a natural player build.
async function reactionCase(){
 const {c,p}=await open({name:'reaction',width:844,height:390,touch:true,reduced:false,fail:false});
 try{
  const report=await p.evaluate(async()=>{
   const normal=await import('/src/rendering/ordinary-presentation-state.js'),velkar=await import('/src/rendering/velkar-presentation-state.js');
   const rows=[];
   for(const kind of ['archer','commander']){
    const e={id:7,type:kind==='commander'?'boss':'archer',variant:kind==='commander'?'commander':undefined,hp:100,max:100,x:400,y:200,commander:{phase:1}},r={seen:true,enemies:[e]},hit=[{enemyFeedback:'hit',enemyId:7,beforeRatio:1,afterRatio:.96}];
    const notify=()=>kind==='commander'?velkar.notifyVelkarHits([e],hit):normal.notifyOrdinaryHits(r,hit);
    const tick=(dt,effects)=>kind==='commander'?velkar.tickVelkarPresentation([e],dt,effects):normal.tickOrdinaryPresentation(r,dt,effects);
    const pose=()=>kind==='commander'?velkar.velkarPresentationPose(e):normal.ordinaryPose(e);
    if(kind==='commander')velkar.clearVelkarPresentation();else normal.resetOrdinaryPresentation([r]);
    notify();if(!pose())throw Error(kind+' first hit missing');tick(.2,[]);
    for(let i=0;i<7;i++){tick(.1,hit);if(pose())throw Error(kind+' flinch repeated before one second');}
    tick(.099,hit);if(pose())throw Error(kind+' early boundary');tick(.002,[]);if(pose())throw Error(kind+' queued replay');
    notify();if(!pose())throw Error(kind+' cooldown extended by suppressed hits');rows.push({kind,oneSecond:true,noQueue:true});
   }return rows;
  });results.push({name:'reaction-clocks',report});
 }finally{await c.close();}
}
async function artCase(){
 const {c,p}=await open({name:'native-art',width:844,height:390,touch:true,reduced:false,fail:false});
 try{
  await load(p,'guardian');await p.waitForFunction(()=>__presentationQA.state().hitArt.types.length===3);
  for(const type of ['chaser','archer','brute'])for(const moving of [false,true]){
   await p.evaluate(type=>__presentationQA.previewTarget(type),type);await flush(p);await p.evaluate(moving=>__presentationQA.previewHit(moving),moving);await flush(p);
   const preview=await p.evaluate(moving=>__presentationQA.nativePreview(moving),moving);assert.equal(preview.pose?.kind,'hit');
   await writeFile(join(out,type+(moving?'-walk':'-stand')+'-native.png'),Buffer.from(preview.png.split(',')[1],'base64'));
   await p.screenshot({path:join(out,type+(moving?'-walk':'-stand')+'-world.png')});
  }results.push({name:'native-art',types:3,poses:6});
 }finally{await c.close();}
}
try{
 const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7),cases=[{name:'pc',width:1280,height:720,touch:false,reduced:false,fail:false},{name:'mobile',width:844,height:390,touch:true,reduced:false,fail:false},{name:'small-reduced',width:740,height:360,touch:true,reduced:true,fail:false},{name:'mobile-art-fail',width:844,height:390,touch:true,reduced:false,fail:true}];
 if(only&&!cases.some(c=>c.name===only)&&!['native-art','reaction-clocks'].includes(only))throw Error('Unknown case '+only);
 for(const cfg of cases.filter(c=>!only||c.name===only))await caseRun(cfg);
 if(!only||only==='reaction-clocks')await reactionCase();if(!only||only==='native-art')await artCase();assert.deepEqual(errors,[]);assert.equal(posts,0);
 await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors,apiPosts:posts},null,2));console.log(JSON.stringify({groups:results.length,errors,apiPosts:posts}));
}catch(error){
 await writeFile(join(out,'failure.json'),JSON.stringify({error:String(error),completed:results,errors,apiPosts:posts},null,2));
 if(active&&!active.isClosed())await active.screenshot({path:join(out,'failure.png')}).catch(()=>{});throw error;
}finally{await browser.close();}
