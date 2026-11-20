// Isolated real Canvas/asset/simulation probes; not gameplay balance evidence.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const out=process.argv[2],base=process.env.BASE_URL||'http://127.0.0.1:5173';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),reports=[],errors=[];
try{for(const width of [1280,844])for(const reduced of [false,true]){
 const cx=await browser.newContext({viewport:{width,height:width===1280?900:390},isMobile:width===844,hasTouch:width===844}),p=await cx.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/__combat-followup',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#222a33"></body>'}));await p.goto(base+'/__combat-followup');
 const result=await p.evaluate(async({width,reduced})=>{
  const {prepareFloorAssets}=await import('/src/rendering/floor-assets.js');await prepareFloorAssets(0);
  const {newRun,currentRoom}=await import('/src/game/engine.js'),{stepRun}=await import('/src/game/simulation.js'),{castRoll}=await import('/src/combat/roll.js');
  const hero=await import('/src/rendering/pixel-world.js'),{drawRollHero,dashArtState}=await import('/src/rendering/companion-roll-art.js');
  const {readableEffects,drawCombatLabels}=await import('/src/combat/combat-readability.js'),{elementHitEffects,limitElementHits,drawElementHit}=await import('/src/rendering/element-hit-visuals.js');
  const {limitArrowImpacts,drawArrowImpact}=await import('/src/rendering/arrow-impact-visuals.js'),{mergeEnemyFeedback,drawBossHealthLoss}=await import('/src/rendering/enemy-feedback.js');
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=900;const c=canvas.getContext('2d');c.fillStyle='#222a33';c.fillRect(0,0,1280,900);c.fillStyle='#eee';c.font='15px monospace';c.fillText(`ROLL / BLADE / SWIFT — ${width} reduced=${reduced}`,20,24);
  const check=(ok,message)=>{if(!ok)throw Error(message);};check(dashArtState().ready,'dash atlas not ready');let probes=0;
  for(const [row,kind] of [null,'slash','swift'].entries()){
   const s=newRun(42),r=currentRoom(s);r.obstacles=[];r.enemies=[];s.player.x=480;s.player.y=300;s.player.evolutions={rollMastery:kind};s.entryGrace=0;check(castRoll(s,{x:-1,y:0}),'roll did not start');const duration=s.roll.duration;
   for(const [col,fraction] of [0,.25,.5,.75,1].entries()){
    const q=s.roll;if(col)stepRun(s,duration*.25);const baseline=hero.observeHeroRoll(s,s.elapsed,q),before=JSON.stringify(s);c.save();c.translate(128+col*250-s.player.x,140+row*160-s.player.y);
    if(!drawRollHero(c,s))hero.drawPixelActor(c,{...s.player,type:'player'},s.elapsed,s,reduced);c.restore();check(JSON.stringify(s)===before,'renderer mutated run');
    if(col===4){check(!s.roll,'roll did not finish');check(baseline.face===-1&&baseline.walk===0,'roll recovery baseline');}probes++;
   }
   hero.notifyHeroShot(s.player,s.elapsed);check(hero.heroShotFacing(s.player,s.elapsed,{vx:-420})===-1,'release facing');check(hero.heroShotFacing(s.player,s.elapsed+.1)===-1,'facing lost after contact');hero.clearHeroShots(s.player);
  }
  const primary=elementHitEffects({frost:3},{x:350,y:130},{x:300,y:130}),shards=Array.from({length:60},(_,i)=>({...primary[0],small:true,x:400+i%12*24,y:100+Math.floor(i/12)*25}));
  const precision={arrowImpact:true,precision:true,x:250,y:130,t:.16,duration:.2,angle:0},ordinary=Array.from({length:30},(_,i)=>({arrowImpact:true,x:80+i%10*24,y:100+Math.floor(i/10)*24,t:.16,duration:.2,angle:0}));
  const all=limitArrowImpacts(limitElementHits([...primary,...shards,precision,...ordinary])),visible=readableEffects(all,width===844,reduced);
  check(visible.includes(primary[0])&&visible.includes(precision),'direct or precision contact lost');check(all.filter(f=>f.hitElement).length===48,'element global cap');check(all.filter(f=>f.arrowImpact).length===24,'arrow global cap');
  if(width===844||reduced)check(visible.filter(f=>!f.precision).length<=16,'compact budget exceeded');
  c.save();c.translate(0,500);for(const f of visible){if(drawElementHit(c,f,reduced))continue;drawArrowImpact(c,f,reduced);}
  drawCombatLabels(c,[{text:'약점!',precisionBurst:true,x:860,y:286,t:1,color:'#ffe6ad'},{text:'정수 +1',essencePickup:true,x:860,y:200,t:1,color:'#d7edaf'}],width===844);
  const hit={enemyFeedback:'hit',enemyId:1,boss:true,beforeRatio:1,afterRatio:.9,t:.12,duration:.28},newHit={...hit,beforeRatio:.9,afterRatio:.6,t:.28},merged=mergeEnemyFeedback([hit],[newHit]);check(merged[0].afterRatio===.6&&merged[0].t===.12,'health range/lifetime');drawBossHealthLoss(c,merged,{id:1});c.restore();
  return {image:canvas.toDataURL().split(',')[1],width,reduced,probes,visible:visible.length,fixtureOnly:true,actualDevice:false};
 },{width,reduced});
 await writeFile(join(out,`gallery-${width}-${reduced}.png`),Buffer.from(result.image,'base64'));delete result.image;reports.push(result);await cx.close();
}assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({base,reports,errors},null,2));console.log(JSON.stringify({cases:reports.length,probes:reports.reduce((n,r)=>n+r.probes,0),errors}));}finally{await browser.close();}
