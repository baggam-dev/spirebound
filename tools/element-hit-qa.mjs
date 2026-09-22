import {mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href:'playwright');
const base=process.env.SPIREBOUND_URL||'http://localhost:5174',output=resolve(process.argv[2]||'artifacts/element-hits');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
try{
 const page=await browser.newPage({viewport:{width:960,height:540}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/element-hit-preview',route=>route.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#17212a"><canvas width="960" height="540"></canvas></body>'}));await page.goto(`${base}/element-hit-preview`);
 const result=await page.evaluate(async()=>{
  const {drawElementHit,elementHitEffects}=await import('/element-hit-visuals.js'),{drawPixelActor}=await import('/pixel-world.js');
  const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#17212a';c.fillRect(0,0,960,540);c.font='14px monospace';c.textAlign='center';
  const label=(text,x,y)=>{c.fillStyle='#b6c9c8';c.fillText(text,x,y);};label('ELEMENTAL IMPACTS / CONTACT -> SCATTER -> FADE',480,26);
  for(const [col,age] of [.05,.23,.5,.78].entries())label(`${Math.round(age*100)}%`,215+col*210,54);
  for(const [row,element] of ['fire','frost','poison','chain'].entries()){
   const y=112+row*118;label(element.toUpperCase(),68,y);
   for(const [col,age] of [.05,.23,.5,.78].entries()){
    const x=215+col*210;drawPixelActor(c,{x:x+10,y:y+10,type:'chaser'},0);
    const f=elementHitEffects({[element]:1},{x,y},{x:x-50,y})[0];drawElementHit(c,{...f,t:f.duration*(1-age)});
    if(element==='chain')drawElementHit(c,{...f,toX:x+68,toY:y+8,t:f.duration*(1-age)});
   }
  }
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const probe=canvas.getContext('2d');
  const effects=Array.from({length:48},(_,i)=>elementHitEffects({[['fire','frost','poison','chain'][i%4]]:1},{x:70+i%12*72,y:90+Math.floor(i/12)*110},{x:20,y:90})[0]);
  const snapshot=()=>probe.getImageData(0,0,960,540).data.toString();const signatures=[];
  for(const element of ['fire','frost','poison','chain']){probe.clearRect(0,0,960,540);const f=Object.freeze({...elementHitEffects({[element]:1},{x:200,y:200},{x:100,y:200})[0],t:.1});
   const matrix=probe.getTransform().toString();probe.globalAlpha=.7;drawElementHit(probe,f);const one=snapshot();probe.clearRect(0,0,960,540);drawElementHit(probe,f);if(snapshot()!==one)throw Error('Unstable paused image');if(probe.globalAlpha!==.7||probe.getTransform().toString()!==matrix)throw Error('Canvas state leaked');signatures.push(one);
   probe.clearRect(0,0,960,540);drawElementHit(probe,{...f,t:0});if(probe.getImageData(0,0,960,540).data.some(v=>v!==0))throw Error('Expired hit remains visible');
  }
  if(new Set(signatures).size!==4)throw Error('Elements visually identical');
  const timings=[];for(let frame=0;frame<40;frame++){const start=performance.now();for(const f of effects)drawElementHit(probe,{...f,t:f.duration*.6});timings.push(performance.now()-start);}timings.sort((a,b)=>a-b);
  return {elementsDistinct:true,pauseStable:true,expiredCleared:true,canvasStateRestored:true,maxEffects:48,medianDrawMs:timings[20]};
 });await page.screenshot({path:join(output,'element-hit-stages.png')});
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});const game=await context.newPage();game.on('pageerror',e=>errors.push(e.message));game.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  for(const main of ['fire','frost','poison','chain']){await game.goto(base);await game.locator('#bossPractice').click();await game.locator('#practiceBoss').selectOption('slime');await game.locator('#practiceMain').selectOption(main);await game.locator('#rollPractice').click();await game.locator('#launchPractice').click();await game.waitForTimeout(1800);await game.screenshot({path:join(output,`${width}x${height}-${main}.png`)});}
  await context.close();
 }
 console.log(JSON.stringify({result,errors},null,2));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
