import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const out=process.argv[2];if(!out)throw Error('Output directory required');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--mute-audio']}),errors=[],reports=[];
try{
 const cx=await browser.newContext(),page=await cx.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BASE_URL||'http://localhost:5173',{waitUntil:'domcontentloaded'});
 for(const reduced of [false,true]){
  const result=await page.evaluate(async reduced=>{
   const {activateAssetFiles}=await import('/src/rendering/asset-requests.js');activateAssetFiles(['sealed-remnant-parts-v1.png','king-resurrection-poses-v1.png']);
   const remnant=await import('/src/rendering/remnant-sprite.js'),king=await import('/src/rendering/resurrected-king.js');await Promise.all([remnant.remnantSpriteReady,king.resurrectedKingReady]);
   if(!remnant.remnantSpriteState().ready||!king.resurrectedKingState().ready)throw Error('new art missing');
   const {newRun}=await import('/src/game/engine.js'),{challengeDemon,advanceDemonPhase,updateDemon}=await import('/src/combat/demon.js');
   const {challengeKing,startUpperAttack}=await import('/src/combat/upper-floors.js'),{stepRun}=await import('/src/game/simulation.js');
   const {tickDemonPresentation,clearDemonPresentation}=await import('/src/rendering/demon-presentation-state.js'),{bossPose}=await import('/src/rendering/boss-poses.js');
   const {tickMordoPresentation}=await import('/src/rendering/mordo-presentation-state.js'),{remnantMotion}=await import('/src/rendering/boss-motion.js');
   const {DEMON_SWEEP,demonSweepSide}=await import('/src/combat/demon-sweep.js');
   const sheet=document.createElement('canvas');sheet.width=2240;sheet.height=1420;const c=sheet.getContext('2d');c.fillStyle='#29313a';c.fillRect(0,0,sheet.width,sheet.height);
   const rows=[],check=(ok,message)=>{if(!ok)throw Error(message);};let probes=0;
   function paint(e,room,time,row,col,label,royal=false){
    const x=160+col*320,y=165+row*280;c.fillStyle='#e4d7bf';c.font='14px monospace';c.fillText(label,x-145,y-119);c.save();c.beginPath();c.rect(col*320,row*280+50,320,230);c.clip();c.translate(x-e.x,y-e.y);
    c.globalAlpha=.7;c.lineWidth=3;c.setLineDash([2,4]);const state=()=>JSON.stringify([c.globalAlpha,c.lineWidth,c.getLineDash(),c.getTransform().toString(),c.strokeStyle,c.fillStyle,c.imageSmoothingEnabled]);
    const canvasBefore=state(),gameBefore=JSON.stringify({e,d:room.demon});
    const drawn=royal?king.drawResurrectedKing(c,e,bossPose(e),time,{reduced}):remnant.drawRemnant(c,e,time,{attack:room.demon.attack,reduced,room});check(drawn,'fallback');check(state()===canvasBefore,'Canvas state leak');check(JSON.stringify({e,d:room.demon})===gameBefore,'render mutated simulation');
    c.restore();probes++;
   }
   for(const [row,kind] of ['hand','footJump','coreSweepLeft','coreSweepRight'].entries()){
    clearDemonPresentation();const s=newRun(77,{bossLayoutVersion:1});s.floor=7;s.room=s.floors[7].findIndex(r=>r.type==='boss');challengeDemon(s);const r=s.floors[7][s.room];
    if(kind.startsWith('core')){r.enemies=[];advanceDemonPhase(r,[]);r.enemies=[];advanceDemonPhase(r,[]);}
    const owner=kind==='hand'?'hand':kind==='footJump'?'foot':'core',e=r.enemies.find(e=>e.part===owner),windup=owner==='core'?DEMON_SWEEP.windup:kind==='footJump'?1.1:.85;
    Object.assign(s.player,{x:e.x+(owner==='core'?demonSweepSide(kind)*32:0),y:e.y+60});r.demon.recovery=0;
    r.demon.attack={kind,owner,time:windup,windup:owner==='core'?windup:undefined,x:e.x,y:e.y,tx:480,ty:360,aim:Math.PI/2,...(kind==='hand'?{finger:0}:{})};
    tickDemonPresentation(r,0);const times=owner==='core'?[0,.45,.89,.91,.99,1.15,1.40]:kind==='hand'?[0,.40,.84,.86,.98,1.12,1.28]:[0,.50,.98,1.11,1.20,1.36,1.53];
    let elapsed=0,hits=[];const poses=[];
    for(const [col,time] of times.entries()){
     while(elapsed<time-1e-9){const dt=Math.min(.01,time-elapsed);updateDemon(s,r,s.player,dt,s.projectiles,(damage,source)=>hits.push({damage,source}));tickDemonPresentation(r,dt);elapsed+=dt;}
     const pose=remnantMotion(e,r,r.demon.attack,{reduced});poses.push(pose);paint(e,r,time,row,col,`${kind} ${time.toFixed(2)}s`);
    }
    if(owner==='core'){check(hits.some(h=>h.damage===6),'real sweep did not resolve');const activeIndex=demonSweepSide(kind)<0?0:1;if(!reduced)check(poses.some(p=>Math.abs(p.arms[activeIndex])>.1),'correct arm never moved');check(poses.every(p=>Math.abs(p.arms[1-activeIndex])<1e-9),'wrong arm moved');}
    rows.push({kind,hits,poses});
   }
   const s=newRun(77,{campaign:'expanded',bossLayoutVersion:1});s.floor=9;s.room=1;challengeKing(s);s.entryGrace=0;s.attack=999;s.invulnerable=999;const r=s.floors[9][1],e=r.enemies[0];e.hp=e.max*.29;e.kingStage=3;e.cd=0;startUpperAttack(e,'slash',s.player,r);
   let elapsed=0;for(const [col,time] of [0,.16,.33,.46,.65,.82,1.10].entries()){while(elapsed<time-1e-9){const dt=Math.min(.01,time-elapsed),result=stepRun(s,dt);tickMordoPresentation(r.enemies,dt,result.effects);elapsed+=dt;}paint(e,r,time,4,col,`king slash ${time.toFixed(2)}s`,true);}
   // Body-only fixtures isolate hit pose replacement from retained contact VFX.
   const state=await import('/src/rendering/mordo-presentation-state.js'),{drawUpper}=await import('/src/rendering/upper-visuals.js');
   const {kingWeaponMotion,kingLocomotionBlocked}=await import('/src/rendering/boss-motion.js');
   const {updateUpper,tickUpperState}=await import('/src/combat/upper-floors.js');
   const {locomotion}=await import('/src/rendering/locomotion.js');
   activateAssetFiles(['feedback-bosses-v1.png','mordo-phase1-reference-atlas.png','mordo-phase2-reference-atlas.png','mordo-phase3-reference-atlas.png']);
   const feedback=await import('/src/rendering/feedback-sprites.js');
   const loaded=await Promise.all([feedback.feedbackSpritesReadyFor(['bosses']),...(await Promise.all([1,2,3].map(i=>import(`/src/rendering/mordo-phase${i}-sprite.js`)))).map((m,i)=>m[`mordoPhase${i+1}SpriteReady`])]);
   check(loaded.every(Boolean),'king body assets missing');
   const body=document.createElement('canvas');body.width=960;body.height=540;const bc=body.getContext('2d'),hitCases=[];
   function bodyImage(actor){bc.clearRect(0,0,960,540);drawUpper(bc,actor,1,reduced);return body.toDataURL();}
   for(const phase of [1,2,3]){
    state.clearMordoPresentation();const actor={id:100+phase,type:'boss',variant:'king',x:480,y:240,hp:[0,1000,500,250][phase],max:1000,kingStage:phase,resurrectionVersion:1};
    const before=JSON.stringify(actor),image=bodyImage(actor);
    for(let i=0;i<30;i++){const effects=[{enemyFeedback:'hit',enemyId:actor.id,beforeRatio:.3,afterRatio:i%2?.29:.25}];state.notifyMordoHits([actor],effects);state.tickMordoPresentation([actor],.01,effects);check(state.mordoPresentationPose(actor,{reduced})===null,'hit body pose returned');}
    check(bodyImage(actor)===image,'hit changed body pixels');check(JSON.stringify(actor)===before,'hit view mutated actor');hitCases.push({phase,repeatedHits:30,bodyPixelsUnchanged:true});
   }
   const actor={id:200,type:'boss',variant:'king',x:480,y:180,hp:250,max:1000,kingStage:3,bossPressureVersion:1,guardClock:999},target={x:900,y:480},combatRoom={obstacles:[],enemies:[]};combatRoom.enemies=[actor];startUpperAttack(actor,'slash',target,combatRoom);updateUpper(actor,target,combatRoom,.32,[],()=>{});
   tickUpperState(actor,target,combatRoom,.112,[]);updateUpper(actor,target,combatRoom,.112,[],()=>{});
   const motion=kingWeaponMotion(actor,{reduced});check(actor.darkFlash.time>0,'combo fixture missed afterglow');check((motion.mix<.5?motion.from:motion.to)===1,'combo preparation hidden');check(bossPose(actor).stage==='windup','common combo preparation hidden');
   const walker={id:201,type:'boss',variant:'king',x:480,y:180,hp:1000,max:1000,kingStage:1,cd:0},walkingRoom={obstacles:[],enemies:[]};walkingRoom.enemies=[walker];locomotion(walker,0);updateUpper(walker,target,walkingRoom,.05,[],()=>{});
   check(walker.x!==480||walker.y!==180,'walking fixture never moved');check(!!walker.darkAttack,'walking fixture never attacked');check(!locomotion(walker,.05,{reduced,blocked:kingLocomotionBlocked(walker,bossPose(walker))}).moving,'attack started with walking feet');
   const growth=await import('/src/progression/growth-records.js'),{encodeSave,parseSave}=await import('/src/persistence/storage.js'),{usePotion}=await import('/src/combat/abilities.js');
   let recorded=newRun(78,{campaign:'expanded',bossLayoutVersion:1});recorded.floor=9;recorded.room=recorded.floors[9].findIndex(v=>v.type==='boss');challengeKing(recorded);const recordRoom=recorded.floors[9][recorded.room];recorded.player.hp=3;recorded.player.potions=2;
   check(usePotion(recorded),'pre-tick potion failed');growth.tickBossRecord(recorded,recordRoom,2);growth.recordBossResource(recorded,'damageTaken',1);recordRoom.enemies[0].kingStage=3;recordRoom.enemies[0].hp=recordRoom.enemies[0].max*.25;growth.tickBossRecord(recorded,recordRoom,3);growth.recordBossResource(recorded,'damageTaken',2);
   recorded=parseSave(encodeSave(recorded));const record=recorded.metrics.bossRecords[0];check(record.entry.hp===3&&record.entry.potions===2,'entry recorded after potion');check(record.seconds===5&&record.resources.damageTaken===3&&record.resources.potionsUsed===1,'resource save lost');check(JSON.stringify(record.stages.entries.map(v=>[v.stage,v.seconds,v.damageTaken]))==='[[1,2,1],[3,3,2]]','stage save lost or invented skipped stage');
   const saveBefore=JSON.stringify(recorded),markup=growth.growthRecordMarkup(recorded);check(markup.includes('교전 첫 관찰')&&markup.includes('3단계 각성'),'journal missing new records');check(JSON.stringify(recorded)===saveBefore,'journal mutated saved run');
   return {image:sheet.toDataURL().split(',')[1],probes,rows,reduced,hitCases,comboPreparationVisible:true,walkingAttackBlocked:true,recordSave:{entry:record.entry,stages:record.stages,resources:record.resources},fixtureOnly:true,invulnerableKing:true};
  },reduced);
  const {image,...report}=result;assert.equal(result.probes,35);await writeFile(join(out,`motion-${reduced}.png`),Buffer.from(image,'base64'));reports.push(report);
 }
 assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({reports,errors,balanceEvidence:false,actualDevice:false},null,2));await cx.close();
}finally{await browser.close();}
