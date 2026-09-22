import {mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href:'playwright');
const base=process.env.SPIREBOUND_URL||'http://localhost:5174',output=resolve(process.argv[2]||'artifacts/enemy-feedback');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1200,height:880}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/enemy-feedback-preview',route=>route.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#17212a"><canvas width="1200" height="880"></canvas></body>'}));await page.goto(`${base}/enemy-feedback-preview`);
 const report=await page.evaluate(async()=>{
  const {drawEnemyFeedback,enemyDeathEffect}=await import('/enemy-feedback.js'),{drawPixelActor}=await import('/pixel-world.js');
  const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#17212a';c.fillRect(0,0,1200,880);c.font='15px monospace';c.textAlign='center';const label=(s,x,y)=>{c.fillStyle='#c9d6c7';c.fillText(s,x,y);};label('SPIREBOUND / HIT REACTION & MATERIAL DISSOLVE',600,32);
  const rows=[{name:'HIT',effect:{enemyFeedback:'hit',enemyId:1,x:480,y:270,t:.28,duration:.28}},{name:'ARMOR',enemy:{type:'archer'}},{name:'CRYSTAL',enemy:{type:'boss',variant:'prism'}},{name:'SLIME',enemy:{type:'boss',variant:'slime',stage:2}},{name:'SPLIT',enemy:{type:'boss',variant:'slime',stage:1}},{name:'PETALS',enemy:{type:'flower'}},{name:'SPECTRAL',enemy:{type:'boss',variant:'king'}}];
  const probe=document.createElement('canvas').getContext('2d',{willReadFrequently:true});probe.canvas.width=960;probe.canvas.height=540;const effects=[];
  for(const [col,age] of [.07,.3,.6,.9].entries())label(`${Math.round(age*100)}%`,340+col*240,67);
  for(const [row,entry] of rows.entries()){const y=138+row*107;label(entry.name,96,y);const f=entry.effect||enemyDeathEffect({...entry.enemy,id:row,x:480,y:270,hp:0});effects.push(f);
   for(const [col,age] of [.07,.3,.6,.9].entries()){const x=340+col*240;c.save();c.translate(x,y);c.scale(1.35,1.35);c.translate(-480,-270);if(row===0)drawPixelActor(c,{type:'archer',x:480,y:270},0);drawEnemyFeedback(c,{...f,t:f.duration*(1-age)});c.restore();}
   const frozen=Object.freeze({...f,t:f.duration*.7});const before=JSON.stringify(frozen);probe.clearRect(0,0,960,540);probe.globalAlpha=.7;drawEnemyFeedback(probe,frozen);const hash=()=>{let h=0;for(const v of probe.getImageData(380,170,200,200).data)h=(Math.imul(h,31)+v)|0;return h;};const first=hash();probe.clearRect(0,0,960,540);drawEnemyFeedback(probe,frozen);if(hash()!==first)throw Error('Paused feedback changed');if(probe.globalAlpha!==.7||probe.getTransform().toString()!=='matrix(1, 0, 0, 1, 0, 0)')throw Error('Canvas state leaked');if(before!==JSON.stringify(frozen))throw Error('Feedback mutated');probe.clearRect(0,0,960,540);drawEnemyFeedback(probe,{...f,t:0});if(probe.getImageData(0,0,960,540).data.some(v=>v!==0))throw Error('Expired feedback remains');
  }
  return {styles:rows.length,pauseStable:true,expiredCleared:true,stateUnchanged:true,canvasRestored:true};
 });await page.screenshot({path:join(output,'enemy-feedback-stages.png')});
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true],[667,375,true]])for(const kind of ['armor','slime']){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),game=await context.newPage();game.on('pageerror',e=>errors.push(e.message));game.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});await game.goto(base);
  await game.evaluate(async kind=>{const {newRun,currentRoom}=await import('/engine.js'),{RunStore}=await import('/storage.js');const s=newRun(42);s.room=1;s.tutorialComplete=true;s.attack=1;s.player.level=10;s.player.mainSkill='fire';s.player.fire=1;const r=currentRoom(s);r.seen=true;r.obstacles=[];r.enemies=[{id:0,type:kind==='slime'?'boss':'archer',...(kind==='slime'?{variant:'slime',stage:2}:{}),x:620,y:240,hp:1,max:1000,cd:2,balanceVersion:1},{id:1,type:'archer',x:654,y:250,hp:1000,max:1000,cd:2,balanceVersion:1}];s.projectiles=[{x:585,y:240,vx:420,vy:0,life:1,enemy:false,hit:[],pierce:0,element:'fire'}];if(!new RunStore(localStorage).write(s).ok)throw Error('Fixture save failed');},kind);
  await game.reload();await game.locator('#continue').click();await game.waitForTimeout(120);await game.screenshot({path:join(output,`${width}x${height}-${kind}.png`)});await game.locator('#pause').click();
  const saved=await game.evaluate(async()=>{const {RunStore}=await import('/storage.js');const s=new RunStore(localStorage).read().run;return {kills:s.kills,enemies:s.floors[s.floor][s.room].enemies,serialized:JSON.stringify(s)};});if(saved.kills!==1||saved.enemies.length!==1)errors.push(`Removal/reward failure: ${width} ${kind}`);if(saved.serialized.includes('enemyFeedback'))errors.push('Feedback persisted in saved combat state');await context.close();
 }
 console.log(JSON.stringify({report,errors},null,2));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
