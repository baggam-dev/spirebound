import {mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href:'playwright');
const base=process.env.SPIREBOUND_URL||'http://localhost:5174',output=resolve(process.argv[2]||'artifacts/skill-growth');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/skill-growth-preview',route=>route.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#17212a"><canvas width="1440" height="900"></canvas></body>'}));await page.goto(`${base}/skill-growth-preview`);
 const report=await page.evaluate(async()=>{
  const {drawProjectile}=await import('/pixel-world.js'),{drawElementHit,elementHitEffects}=await import('/element-hit-visuals.js'),{evolutions}=await import('/evolutions.js');
  const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#17212a';c.fillRect(0,0,1440,900);c.font='15px monospace';c.textAlign='center';const label=(s,x,y)=>{c.fillStyle='#c9d6c7';c.fillText(s,x,y);};
  label('SPIREBOUND / SKILL GROWTH: TRAILS + CONTACT',720,30);['LEVEL 1','LEVEL 2','LEVEL 3','LEVEL 4','EVOLUTION A','EVOLUTION B'].forEach((s,i)=>label(s,210+i*220,69));
  const probe=document.createElement('canvas').getContext('2d',{willReadFrequently:true});probe.canvas.width=960;probe.canvas.height=540;let count=0;
  for(const [row,element] of ['fire','frost','poison','chain'].entries()){
   label(element.toUpperCase(),65,170+row*190);const signatures=[];
   for(let col=0;col<6;col++){
    const x=210+col*220,y=130+row*190,max=element==='frost'?4:3;if(col===3&&max===3){label('—',x,y+55);continue;}
    const level=col<4?col+1:max,branch=col>=4?evolutions[element][col-4].id:null,player=Object.freeze({[element]:level,evolutions:Object.freeze(branch?{[element]:branch}:{})}),b=Object.freeze({x:480,y:270,vx:420,vy:0,element,enemy:false});
    const f=Object.freeze({...elementHitEffects(player,{x:480,y:315},{x:430,y:315})[0],t:.18});
    const render=ctx=>{drawProjectile(ctx,b,1,player);drawElementHit(ctx,f);};
    c.fillStyle='#111c25';c.fillRect(x-94,y-24,188,166);c.save();c.translate(x+15,y+16);c.scale(1.7,1.7);c.translate(-480,-270);render(c);c.restore();if(branch)label(branch.toUpperCase(),x,y+150);
    const before=JSON.stringify({player,b,f});probe.clearRect(0,0,960,540);probe.globalAlpha=.7;render(probe);
    const hash=()=>{let h=2166136261;for(const v of probe.getImageData(420,240,120,130).data)h=Math.imul(h^v,16777619);return h;};const one=hash();probe.clearRect(0,0,960,540);render(probe);if(hash()!==one)throw Error('Unstable paused growth appearance');if(probe.globalAlpha!==.7||probe.getTransform().toString()!=='matrix(1, 0, 0, 1, 0, 0)')throw Error('Canvas state leaked');if(JSON.stringify({player,b,f})!==before)throw Error('Renderer mutated combat data');signatures.push(one);count++;
   }
   if(new Set(signatures).size!==signatures.length)throw Error(`Indistinguishable growth stages: ${element}`);
  }
  label('Fixed projectile core and real damage areas; evolution detail stays in trails and local hit accents.',720,883);return {distinctStages:count,pauseStable:true,stateUnchanged:true,canvasRestored:true};
 });await page.screenshot({path:join(output,'skill-growth-stages.png')});
 const branches={fire:['ember','flare'],frost:['deep','lasting'],poison:['ember','flare'],chain:['surge','web']};
 if(!process.env.GALLERY_ONLY)for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]])for(const [element,list] of Object.entries(branches))for(const branch of width===390?list.slice(0,1):list){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),game=await context.newPage();game.on('pageerror',e=>errors.push(e.message));game.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});await game.goto(base);
  await game.evaluate(async({element,branch})=>{const {newRun,currentRoom}=await import('/engine.js'),{RunStore}=await import('/storage.js');const s=newRun(42);s.room=1;s.tutorialComplete=true;s.player.mainSkill=element;s.player[element]=element==='frost'?4:3;s.player.evolutions={[element]:branch};const r=currentRoom(s);r.seen=true;r.obstacles=[];r.enemies=Array.from({length:4},(_,i)=>({id:i,type:'archer',x:600+i*55,y:230+i%2*50,hp:10000,max:10000,cd:2,balanceVersion:1}));if(!new RunStore(localStorage).write(s).ok)throw Error('Fixture save failed');},{element,branch});
  await game.reload();await game.locator('#continue').click();await game.waitForTimeout(800);await game.screenshot({path:join(output,`${width}x${height}-${element}-${branch}.png`)});await context.close();
 }
 console.log(JSON.stringify({report,errors},null,2));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
