import {mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href:'playwright');
const base=process.env.SPIREBOUND_URL||'http://localhost:5174',output=resolve(process.argv[2]||'artifacts/boss-poses');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1200,height:1120}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/boss-pose-preview',route=>route.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#17212a"><canvas width="1200" height="1120"></canvas></body>'}));await page.goto(`${base}/boss-pose-preview`);
 const report=await page.evaluate(async()=>{
  const {drawPixelActor,drawCrystalBody}=await import('/pixel-world.js'),{drawPoisonEnemy}=await import('/poison.js'),{drawUpper}=await import('/upper-visuals.js');
  const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#17212a';c.fillRect(0,0,1200,1120);c.font='15px monospace';c.textAlign='center';const label=(s,x,y)=>{c.fillStyle='#d0d9c8';c.fillText(s,x,y);};label('SPIREBOUND / BOSS ATTACK POSES',600,30);['WINDUP','ATTACK / AIR','RECOVERY'].forEach((s,i)=>label(s,350+i*310,67));
  const rows=[['WARDEN',{}],['PRISM',{variant:'prism'}],['SLIME',{variant:'slime',stage:0}],['MORDO',{variant:'king'}],['KNIGHT',{type:'starKnight',gateTitle:'Cald'}],['SNIPER',{type:'astralSniper',gateTitle:'Vera'}]];
  const probe=document.createElement('canvas').getContext('2d',{willReadFrequently:true});probe.canvas.width=960;probe.canvas.height=540;let checked=0;
  for(const [row,[name,props]] of rows.entries()){label(name,90,195+row*160);const hashes=[];
   for(let col=0;col<3;col++){const e={id:1,type:'boss',hp:7200,max:7200,x:480,y:270,...props},room={hazards:[]};
    if(row===0)Object.assign(e,col===0?{pattern:'slam',attackPhase:'warning',attackTime:.2}:col===1?{pattern:'slam',attackPhase:'leap',attackTime:.25}:{pattern:'slam',attackPhase:'recover',attackTime:.25});
    if(row===1)Object.assign(e,col===0?{prismPhase:'warning',prismTime:.2}:col===1?{prismPhase:'beam',prismTime:.3}:{prismPhase:'recover',prismTime:.8});
    if(row===2){if(col<2)room.hazards=[{owner:1,kind:'puddle',phase:col===0?'warning':'flight',time:.2,flight:.65}];else e.opening=.8;}
    if(row>=3){if(col===0)e.darkAttack={kind:row===5?'fan':'slash',time:.1,aim:.2};else if(col===1)e.darkFlash={kind:row===5?'fan':'slash',time:.12,aim:.2};else {e.opening=1;if(row===3)e.kneel=1;}}
    Object.freeze(e);const before=JSON.stringify({e,room}),draw=ctx=>{if(row===0)drawPixelActor(ctx,e,1);else if(row===1)drawCrystalBody(ctx,e,1);else if(row===2)drawPoisonEnemy(ctx,e,1,room);else drawUpper(ctx,e,1);};
    c.save();c.translate(350+col*310,195+row*160);c.scale(1.25,1.25);c.translate(-480,-270);draw(c);c.restore();
    probe.clearRect(0,0,960,540);probe.globalAlpha=.7;draw(probe);const hash=()=>{let h=0;for(const v of probe.getImageData(360,140,240,230).data)h=(Math.imul(h,31)+v)|0;return h;};const first=hash();hashes.push(first);probe.clearRect(0,0,960,540);draw(probe);if(hash()!==first)throw Error('Pose unstable while paused');if(probe.globalAlpha!==.7||probe.getTransform().toString()!=='matrix(1, 0, 0, 1, 0, 0)')throw Error('Canvas state leaked');if(JSON.stringify({e,room})!==before)throw Error('Combat state mutated');checked++;
   }if(new Set(hashes).size!==3)throw Error(`Indistinct phases: ${name}`);
  }
  label('Existing attack timing, warning geometry, damage and collision are preserved.',600,1094);return {distinctPoses:checked,pauseStable:true,stateUnchanged:true,canvasRestored:true};
 });await page.screenshot({path:join(output,'boss-pose-stages.png')});
 if(!process.env.GALLERY_ONLY)for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true],[667,375,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),game=await context.newPage();game.on('pageerror',e=>errors.push(e.message));game.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  for(const boss of width===390?['slime','king']:width===667?['prism','gate']:['warden','prism','slime','gate','king']){await game.goto(base);await game.locator('#bossPractice').click();await game.locator('#practiceBoss').selectOption(boss);await game.locator('#practiceMain').selectOption('poison');await game.locator('#rollPractice').click();await game.locator('#launchPractice').click();await game.waitForTimeout(2200);await game.screenshot({path:join(output,`${width}x${height}-${boss}.png`)});}
  await context.close();
 }
 console.log(JSON.stringify({report,errors},null,2));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
