import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:5173',out=process.env.QA_OUTPUT||'docs/qa-pursuer-20261121';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];let report;
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/pursuer-gallery',route=>route.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#10191f;color:#eee"></body>'}));await page.goto(base+'/pursuer-gallery');
 report=await page.evaluate(async()=>{
  const [assets,pursuer,world,engine,combat]=await Promise.all(['/src/rendering/floor-assets.js','/src/rendering/pursuer-sprite.js','/src/rendering/pixel-world.js','/src/game/engine.js','/src/combat/pursuer.js'].map(p=>import(p)));
  try{await assets.prepareFloorAssets(0,{enemies:['pursuer']});}catch(error){throw Error(error.message+' '+JSON.stringify(pursuer.pursuerSpriteState()));}if(!pursuer.pursuerSpriteState().ready)throw Error('Pursuer atlas unavailable');
  const s=engine.newRun(47);s.key=true;const snapshots=[];
  function surface(id,w,h){const canvas=document.createElement('canvas');canvas.id=id;canvas.width=w;canvas.height=h;canvas.style.cssText='display:block;max-width:100%;height:auto;margin:0 auto';document.body.append(canvas);return canvas;}
  const gallery=surface('gallery',1200,600),c=gallery.getContext('2d');c.fillStyle='#28343d';c.fillRect(0,0,1200,600);c.font='13px monospace';
  const poses=[['idle',null,0],['walk A',null,12],['walk B',null,24],['walk C',null,36],['walk D',null,48],['windup','warning',0],['dash start','dash',0,.45],['dash stride','dash',0,.2],['cleave','cleave',0,.14],['recover','recover',0,1],['collapse','death',0,.65],['fallen','death',0,.2]];
  for(const [i,[name,phase,distance,time]] of poses.entries()){
   const x=i%4*300+145,y=Math.floor(i/4)*200+140,e={type:'pursuer',id:i,hp:10,max:10,x,y,aim:0,facing:0,attackPhase:phase,attackTime:time??.8};
   c.fillStyle='#d4d2bf';c.fillText(name,x-100,y-100);c.strokeStyle='#637079';c.beginPath();c.moveTo(x-80,y+15);c.lineTo(x+80,y+15);c.stroke();
   if(phase==='death')pursuer.drawPursuerDeath(c,{bodyType:'pursuer',x,y,face:1,t:time,duration:.75});
   else{if(distance){const probe=document.createElement('canvas').getContext('2d');e.x-=distance;pursuer.drawPursuerSprite(probe,e,0);e.x+=distance;}pursuer.drawPursuerSprite(c,e,1,false);}
  }
  const canvas=surface('arena',960,540),ctx=canvas.getContext('2d');
  window.renderPursuerArena=(reduced=false)=>{
   ctx.fillStyle='#18222a';ctx.fillRect(0,0,960,540);for(let y=45;y<500;y+=35)for(let x=25;x<935;x+=65){ctx.fillStyle=(x+y)%2?'#303d46':'#34414a';ctx.fillRect(x+1,y+1,63,33);}ctx.fillStyle='#89958c';ctx.font='14px monospace';ctx.fillText('88px Pursuer / 58px hero / 52px grunt — '+(reduced?'REDUCED':'NORMAL'),40,30);
   const hero={...s.player,type:'player',x:170,y:270},grunt={id:1,type:'chaser',x:285,y:270,hp:100,max:100};world.drawPixelActor(ctx,hero,0,s,true);world.drawPixelActor(ctx,grunt,0,s,true);
   const a={id:2,type:'pursuer',x:440,y:270,hp:800,max:800,aim:0,attackPhase:'warning',attackTime:.7,pursuerFromX:440,pursuerFromY:270,pursuerToX:650,pursuerToY:270};
   const b={id:3,type:'pursuer',x:760,y:350,hp:800,max:800,aim:-Math.PI/2,attackPhase:'cleaveWarning',attackTime:.4};
   for(const e of [a,b]){pursuer.drawPursuerSprite(ctx,e,0,reduced);pursuer.drawPursuerWarning(ctx,e,reduced);}
   snapshots.push(JSON.stringify([a,b]));
  };window.renderPursuerArena(false);
  const probe=document.createElement('canvas');probe.width=250;probe.height=180;const pc=probe.getContext('2d');pursuer.drawPursuerSprite(pc,{type:'pursuer',x:110,y:130,hp:1},0,true,true);const alpha=pc.getImageData(0,0,250,180).data;let painted=0;for(let i=3;i<alpha.length;i+=4)if(alpha[i]>64)painted++;
  if(painted<1000)throw Error('Blank/tiny pursuer');if(alpha[(5*250+5)*4+3]!==0)throw Error('Background leaked outside sprite');
  return {state:pursuer.pursuerSpriteState(),painted,bodyHeight:combat.PURSUER.height,atlasWidth:1536,atlasHeight:1024};
 });
 await page.locator('#gallery').screenshot({path:join(out,'poses.png')});await page.locator('#arena').screenshot({path:join(out,'arena-normal.png')});
 await page.evaluate(()=>window.renderPursuerArena(true));await page.locator('#arena').screenshot({path:join(out,'arena-reduced.png')});
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{document.querySelector('#gallery').style.display='none';document.querySelector('#arena').style.width='min(100vw,177.777vh)';});await page.locator('#arena').screenshot({path:join(out,'mobile-844.png')});
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(report.state.frames,12);await writeFile(join(out,'visual-report.json'),JSON.stringify({...report,errors,device:'headless Edge desktop and 844x390 viewport; not physical iPhone'},null,2));console.log(JSON.stringify(report));await context.close();
}finally{await browser.close();}
