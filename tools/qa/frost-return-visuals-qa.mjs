import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:'+server.address().port,output=process.argv[2];if(output)await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try {
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/baseline/src/**',async route=>{const path=new URL(route.request().url()).pathname.replace('/baseline/','');const file=path==='src/rendering/pixel-world.js'?'.tmp/frost-return/baseline-pixel-world.js':path==='src/combat/infernal-enemies.js'?'.tmp/frost-return/baseline-infernal.js':path;await route.fulfill({body:await readFile(file),contentType:'text/javascript'});});
  await context.route('**/api/**',route=>route.abort());await page.goto(base);
  const report=await page.evaluate(async()=>{
   const {drawProjectile}=await import('/src/rendering/pixel-world.js'),{drawProjectile:before}=await import('/baseline/src/rendering/pixel-world.js'),{drawInfernal,infernalTypes}=await import('/src/combat/infernal-enemies.js'),{drawInfernal:beforeEnemy}=await import('/baseline/src/combat/infernal-enemies.js');
   const {newRun,enrage}=await import('/src/game/engine.js'),{encodeSave,parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');
   const make=(fn,e)=>{const canvas=document.createElement('canvas');canvas.width=160;canvas.height=160;canvas.style='width:160px;height:160px;display:inline-block;position:static;';const c=canvas.getContext('2d'),fill=c.fillRect.bind(c);let maxDrawAlpha=0;c.fillRect=(...args)=>{maxDrawAlpha=Math.max(maxDrawAlpha,c.globalAlpha);return fill(...args);};fn(c,e,0,{});canvas.dataset.drawAlpha=String(maxDrawAlpha);if(c.globalAlpha!==1)throw Error('Context alpha leaked');return canvas;};
   const scan=canvas=>{const a=canvas.getContext('2d').getImageData(0,0,160,160).data;let minX=160,maxX=0,minY=160,maxY=0,alpha=0,n=0;for(let y=0;y<160;y++)for(let x=0;x<160;x++)if(a[(y*160+x)*4+3]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);alpha=Math.max(alpha,a[(y*160+x)*4+3]);n++;}return {width:maxX-minX+1,height:maxY-minY+1,alpha,n};};
   const sample={x:80,y:80,vx:480,vy:0,enemy:false,frostShard:true,element:'frost',life:2,shardSize:1.5};const old=make(before,sample),current=make(drawProjectile,sample),oldBounds=scan(old),newBounds=scan(current);if(JSON.stringify(sample)!==JSON.stringify({x:80,y:80,vx:480,vy:0,enemy:false,frostShard:true,element:'frost',life:2,shardSize:1.5}))throw Error('Projectile mutated');
   const regular={...sample,frostShard:false};if(make(before,regular).toDataURL()!==make(drawProjectile,regular).toDataURL())throw Error('Normal frost changed');const enemy={...regular,enemy:true,frostArrow:true};if(make(before,enemy).toDataURL()!==make(drawProjectile,enemy).toDataURL())throw Error('Enemy frost changed');
   const gallery=document.createElement('div');gallery.id='visualQA';gallery.style='position:fixed;inset:0;z-index:9999;overflow:auto;background:#11171f;color:#decfa4;padding:12px;font:14px monospace';const title=document.createElement('p');title.textContent='서리 파편 이전 / 현재 · 일반 / 폭주';gallery.append(title);
   for(const [label,c] of [['파편 이전',old],['파편 현재',current]]){const row=document.createElement('div');row.style='display:inline-block;text-align:center';const p=document.createElement('p');p.textContent=label;row.append(p,c);gallery.append(row);}
   const differences=[];
   for(const type of infernalTypes){const e={type,x:80,y:80,hp:100,max:100},normal=make(drawInfernal,e),rage=make(drawInfernal,{...e,escapeDepth:2});if(normal.toDataURL()!==make(beforeEnemy,e).toDataURL())throw Error('Normal enemy changed '+type);if(normal.toDataURL()===rage.toDataURL())throw Error('Missing rage '+type);differences.push(type);const row=document.createElement('div');row.style='display:inline-block;width:340px';row.textContent=type;row.append(normal,rage);gallery.append(row);}
   document.body.append(gallery);
   const s=newRun(417,{campaign:'expanded'});enrage(s);s.floor=8;s.room=s.floors[8].findIndex(r=>r.enemies.length&&r.type!=='boss');s.player.mainSkill='frost';s.player.frost=4;s.player.hp=s.player.max=99;s.invulnerable=10;s.tutorialComplete=true;const restored=parseSave(encodeSave(s));if(restored.floors[8][s.room].enemies.some(e=>!e.escapeDepth))throw Error('Missing return marker');localStorage.setItem(SAVE_KEY,encodeSave(s));
   return {oldBounds,newBounds,differences,drawAlpha:Number(current.dataset.drawAlpha)};
  });
  assert.ok(Math.abs(report.newBounds.width/report.oldBounds.width-.5)<.1,JSON.stringify(report));assert.ok(Math.abs(report.newBounds.height/report.oldBounds.height-.5)<.15,JSON.stringify(report));assert.equal(report.drawAlpha,.75);assert.equal(report.differences.length,5);
  if(output)await page.screenshot({path:join(output,`comparison-${width}.png`)});
  await page.reload();await page.locator('#continue').click();await page.waitForTimeout(250);await page.keyboard.press('Escape');await page.locator('#journal').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({viewports:3,shardSizeRatio:.5,shardOpacity:.75,regularArrowsUnchanged:true,normalInfernalUnchanged:true,rageTypes:5,returnSaveResume:true,pageErrors:0,productionRecordsSubmitted:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
