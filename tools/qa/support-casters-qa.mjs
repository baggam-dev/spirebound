import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:5173',out=process.env.QA_OUTPUT||'docs/qa-support-casters-20261121';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/support-gallery',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#17212a"></body>'}));await page.goto(base+'/support-gallery');
 const report=await page.evaluate(async()=>{
  const [assets,sprites,world,engine]=await Promise.all(['/src/rendering/floor-assets.js','/src/rendering/support-sprites.js','/src/rendering/pixel-world.js','/src/game/engine.js'].map(p=>import(p)));
  try{await assets.prepareFloorAssets(0,{enemies:['ossuarySummoner','choirCantor','ossuaryMinion']});}catch(error){throw Error(error.message+' '+JSON.stringify(sprites.supportSpriteState()));}
  function surface(id,w,h){const canvas=document.createElement('canvas');canvas.id=id;canvas.width=w;canvas.height=h;canvas.style.cssText='display:block;max-width:100%;height:auto;margin:0 auto';document.body.append(canvas);return canvas;}
  const gallery=surface('gallery',1200,1440),c=gallery.getContext('2d');c.fillStyle='#28343d';c.fillRect(0,0,gallery.width,gallery.height);c.font='13px monospace';
  const types=['ossuarySummoner','choirCantor','ossuaryMinion'];let tile=0;
  for(const type of types){const minion=type==='ossuaryMinion',poses=minion?[['idle',null,0],['walkA',null,9],['walkB',null,18],['windup','minionWarning',0,.3],['strike','minionStrike',0,.1],['recover','minionRecover',0,.4],['collapse','death',0,.7],['fallen','death',0,.2]]:[['idle',null,0],['walkA',null,9],['walkB',null,18],['prepare','supportCast',0,.9],['chant','supportCast',0,.3],['release','supportRelease',0,.1],['recover','supportRecover',0,.3],['collapse','death',0,.7],['fallen','death',0,.2]];
   for(const [name,phase,distance,time] of poses){const x=tile%4*300,y=Math.floor(tile/4)*160;tile++;c.fillStyle='#ded7bd';c.fillText(type+' / '+name,x+7,y+17);c.save();c.translate(x+150,y+130);c.scale(1.5,1.5);const e={id:tile,type,x:0,y:0,hp:100,max:100,aim:0,facing:0,attackPhase:phase,attackTime:time??.8};if(phase==='death'){const duration=minion?.45:.65;sprites.drawSupportDeath(c,{bodyType:type,x:0,y:0,face:1,t:duration*time,duration});}else{if(distance){const scratch=document.createElement('canvas').getContext('2d');e.x=-distance;sprites.drawSupportSprite(scratch,e,0);e.x=0;}sprites.drawSupportSprite(c,e,1,false);}c.restore();}
  }
  const summonCanvas=surface('summon',960,540),healCanvas=surface('heal',960,540),run=engine.newRun(47),painted={};
  window.renderSupport=(reduced=false)=>{
   for(const [canvas,type] of [[summonCanvas,'ossuarySummoner'],[healCanvas,'choirCantor']]){
    const ctx=canvas.getContext('2d');ctx.fillStyle='#18222a';ctx.fillRect(0,0,960,540);for(let y=45;y<500;y+=35)for(let x=25;x<935;x+=65){ctx.fillStyle='#34414a';ctx.fillRect(x+1,y+1,63,33);}ctx.fillStyle='#d7d4bd';ctx.font='14px monospace';ctx.fillText(type+' — '+(reduced?'REDUCED':'NORMAL'),35,28);
    const hero={...run.player,type:'player',x:180,y:320},e={id:0,type,x:540,y:280,hp:100,max:100,attackPhase:'supportCast',attackTime:.3,supportCastHp:100,aim:Math.PI},ally={id:1,type:'chaser',x:740,y:290,hp:30,max:100};
    const minion={id:2,type:'ossuaryMinion',x:440,y:380,hp:50,max:50,attackPhase:'minionWarning',attackTime:.2,aim:Math.PI};const room={enemies:[e,ally,...(type==='ossuarySummoner'?[minion]:[])],obstacles:[]};if(type==='ossuarySummoner')e.supportSpawn={x:640,y:330};else e.supportTarget=1;e.aim=type==='ossuarySummoner'?Math.atan2(e.supportSpawn.y-e.y,e.supportSpawn.x-e.x):Math.atan2(ally.y-e.y,ally.x-e.x);
    const before=JSON.stringify(room);world.drawPixelActor(ctx,hero,0,run,true);world.drawPixelActor(ctx,ally,0,run,true);for(const actor of room.enemies.filter(n=>n!==ally))sprites.drawSupportSprite(ctx,actor,0,reduced);for(const actor of room.enemies)sprites.drawSupportEffects(ctx,actor,room,reduced);if(JSON.stringify(room)!==before)throw Error('Render mutated combat');
   }
  };window.renderSupport(false);
  for(const type of types){const probe=document.createElement('canvas');probe.width=250;probe.height=180;const p=probe.getContext('2d');sprites.drawSupportSprite(p,{type,x:120,y:130,hp:1},0,true,true);const pixels=p.getImageData(0,0,250,180).data;let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>64)count++;if(count<500||pixels[(5*250+5)*4+3]!==0)throw Error('Blank/opaque background '+type);painted[type]=count;}
  return {state:sprites.supportSpriteState(),painted,poseTiles:tile,stateUnchanged:true};
 });
 await page.locator('#gallery').screenshot({path:join(out,'poses.png')});for(const key of ['summon','heal'])await page.locator('#'+key).screenshot({path:join(out,key+'-normal.png')});await page.evaluate(()=>window.renderSupport(true));for(const key of ['summon','heal'])await page.locator('#'+key).screenshot({path:join(out,key+'-reduced.png')});
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{document.querySelector('#gallery').style.display='none';for(const id of ['summon','heal'])document.querySelector('#'+id).style.width='min(100vw,177.777vh)';});for(const key of ['summon','heal'])await page.locator('#'+key).screenshot({path:join(out,key+'-mobile-844.png')});
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(report.state.ready,true);assert.equal(report.poseTiles,26);await writeFile(join(out,'visual-report.json'),JSON.stringify({...report,errors,device:'headless Edge desktop and 844x390 viewport, not physical device'},null,2));console.log(JSON.stringify(report));await context.close();
}finally{await browser.close();}
