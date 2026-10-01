import {mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href:'playwright');
const base=process.env.SPIREBOUND_URL||'http://localhost:5173',output=resolve(process.argv[2]||'artifacts/element-shots');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/element-shot-preview',route=>route.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#17212a"><canvas width="960" height="540"></canvas></body>'}));
 await page.goto(`${base}/element-shot-preview`);
 const result=await page.evaluate(async()=>{
  const {drawElementNock}=await import('/src/rendering/skill-visuals.js');
  const {drawProjectile}=await import('/src/rendering/pixel-world.js');
  const {drawElementHit,elementHitEffects}=await import('/src/rendering/element-hit-visuals.js');
  const c=document.querySelector('canvas').getContext('2d'),elements=['fire','frost','poison','chain'];
  c.imageSmoothingEnabled=false;c.fillStyle='#17212a';c.fillRect(0,0,960,540);c.font='15px monospace';c.textAlign='center';
  const label=(s,x,y)=>{c.fillStyle='#b9c6bf';c.fillText(s,x,y);};
  label('ELEMENT ARROWS / NOCK · FLIGHT · CONTACT',480,30);
  ['NOCK','FLIGHT','CONTACT'].forEach((stage,i)=>label(stage,255+i*255,65));
  const samples=[];
  for(const [row,element] of elements.entries()){
   const y=110+row*112;label(element.toUpperCase(),70,y+12);
   for(const [stage,x] of ['nock','flight','contact'].map((s,i)=>[s,255+i*255])){
    if(stage==='contact'){const hit=elementHitEffects({[element]:2},{x,y},{x:x-30,y})[0];drawElementHit(c,{...hit,t:hit.duration*.7});}
    else{c.save();c.translate(x,y);c.scale(3,3);
     if(stage==='nock'){c.fillStyle='#a88962';c.fillRect(-12,-1,24,2);drawElementNock(c,element,.9);}
     else drawProjectile(c,{x:0,y:0,vx:420,vy:0,element},.2,{[element]:2});
     c.restore();}
    const pixels=c.getImageData(x-42,y-32,84,64).data;
    let colored=0,hash=2166136261;
    for(let i=0;i<pixels.length;i+=4){const [r,g,b]=pixels.slice(i,i+3);if(Math.abs(r-23)+Math.abs(g-33)+Math.abs(b-42)>48)colored++;hash=Math.imul(hash^(r<<16|g<<8|b),16777619);}
    if(colored<10)throw Error(`${element} ${stage} missing pixels`);
    samples.push({element,stage,colored,hash:hash>>>0});
   }
  }
  for(const stage of ['nock','flight','contact'])if(new Set(samples.filter(s=>s.stage===stage).map(s=>s.hash)).size!==4)throw Error(`${stage} elemental forms identical`);
  const probe=document.createElement('canvas').getContext('2d');probe.canvas.width=120;probe.canvas.height=80;probe.globalAlpha=.65;const matrix=probe.getTransform().toString();
  drawElementNock(probe,'fire',.5);drawProjectile(probe,{x:40,y:40,vx:420,vy:0,element:'frost'},.2,{frost:2});
  const hit=elementHitEffects({poison:1},{x:60,y:40},{x:30,y:40})[0];drawElementHit(probe,hit);
  if(probe.globalAlpha!==.65||probe.getTransform().toString()!==matrix)throw Error('Canvas state leaked');
  return {samples,canvasStateRestored:true};
 });
 await page.screenshot({path:join(output,'element-shot-stages.png')});
 console.log(JSON.stringify({result,errors},null,2));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
