import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:5173',out=process.env.QA_OUTPUT||'docs/qa-skill-release-20261016';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],report={views:[],gallery:null,combat:[],fallback:false};
try{
 for(const mobile of [false,true])for(const kind of ['main','support']){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.evaluate(async kind=>{const {newRun}=await import('/src/game/engine.js'),{SAVE_KEY,encodeSave}=await import('/src/persistence/storage.js');const s=newRun(145);s.tutorialComplete=true;s.pendingLevels=1;
    if(kind==='main'){s.player.level=2;s.levelQueue=[2];}else{Object.assign(s.player,{level:7,mainSkill:'fire',fire:2,utility:'focus'});s.levelQueue=[7];s.choices=['blastTip','emberMark','aura'];}
    localStorage.setItem(SAVE_KEY,encodeSave(s));
   },kind);
   await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await page.locator('.draft-card').first().waitFor();assert.equal(await page.locator('.draft-card').count(),3);
   const bounds=await page.locator('.draft-card').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
   const size=page.viewportSize();for(const r of bounds)assert.ok(r.x>=0&&r.x+r.w<=size.width+1&&r.y>=0&&r.y+r.h<=size.height+1,JSON.stringify({mobile,kind,r,size}));assert.ok(bounds[0].x+bounds[0].w<bounds[1].x&&bounds[1].x+bounds[1].w<bounds[2].x);
   const title=await page.locator('#draftTitle').boundingBox();assert.ok(title&&title.y>=0&&title.y+title.height<=bounds[0].y,'Title must remain above cards');assert.equal(await page.locator('body>header').isVisible(),false);
   const build=await page.locator('.draft-build').boundingBox();assert.ok(build&&build.y+build.height<=bounds[0].y,'Build tags must remain above cards');assert.equal(await page.locator('.draft-header').evaluate(n=>getComputedStyle(n).position),'static');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.screenshot({path:join(out,`${kind}-${mobile?'mobile':'desktop'}.png`)});
   if(kind==='main'){
    await page.locator('#rerollMain').click();const before=await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload));assert.equal(before.rerolls,0);
    await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await page.locator('.draft-card').first().waitFor();const ids=await page.locator('.draft-card').evaluateAll(nodes=>nodes.map(n=>n.id.slice(5)));assert.deepEqual(ids,before.mainChoices);assert.equal(await page.locator('#rerollMain').isDisabled(),true);
    await page.keyboard.press('1');await page.waitForFunction(()=>!document.querySelector('.draft-card'));const after=await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload));assert.equal(after.player.mainSkill,before.mainChoices[0]);assert.equal(after.pendingLevels,0);
   }else{
    assert.match(await page.locator('#u2').innerText(),/유니크 보조/);await page.locator('#skillDetails summary').click();assert.equal(await page.locator('#skillDetails').getAttribute('open'),'');await page.keyboard.press('Escape');assert.equal(await page.locator('#skillDetails').getAttribute('open'),null);
    if(mobile)await page.locator('#u0').tap();else await page.locator('#u0').click();await page.waitForFunction(()=>!document.querySelector('.draft-card'));const after=await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload));assert.equal(after.player.blastTip,1);assert.equal(after.pendingLevels,0);
   }
   report.views.push({mobile,kind,cards:3,bounds});
  await context.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:1800}});page.on('pageerror',e=>errors.push(e.message));await page.route('**/skill-package-probe',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#17212a"><canvas width="1440" height="1800"></canvas></body>'}));await page.goto(base+'/skill-package-probe');
 const result=await page.evaluate(async()=>{
  const {newRun,currentRoom}=await import('/src/game/engine.js'),{stepRun}=await import('/src/game/simulation.js'),{encodeSave,parseSave}=await import('/src/persistence/storage.js'),{synergySkills}=await import('/src/progression/synergies.js');
  const {drawProjectile,drawPixelActor}=await import('/src/rendering/pixel-world.js'),{drawSynergyEffect,drawPlayerSkillStates}=await import('/src/rendering/combat-vfx.js'),{drawSpectralBlade,spectralBladeReady}=await import('/src/rendering/spectral-blade.js'),{tickSpectralBlade}=await import('/src/combat/spectral-blade.js'),{heroSpriteReady}=await import('/src/rendering/hero-sprite.js');
  if(!await spectralBladeReady||!await heroSpriteReady)throw Error('Required PNG unavailable');
  const {drawElementHit}=await import('/src/rendering/element-hit-visuals.js'),{drawPlayerBlast}=await import('/src/rendering/skill-burst-art.js'),{drawArrowImpact}=await import('/src/rendering/arrow-impact-visuals.js'),{drawArrowRain,drawCrossbow}=await import('/src/rendering/ultimate-visuals.js');
  const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#17212a';c.fillRect(0,0,1440,1800);c.textAlign='center';const text=(s,x,y)=>{c.fillStyle='#eadcbd';c.font='16px monospace';c.fillText(s,x,y);};let scenes=0;
  for(const [row,main] of ['fire','frost','poison','chain','precision'].entries()){
   const s=newRun(31);s.player.mainSkill=main;s.player[main]=main==='frost'?4:3;for(const k of synergySkills.filter(k=>k.main===main))s.player[k.id]=3;
   text(main,90,55+row*85);for(let i=0;i<4;i++){const x=270+i*300,y=50+row*85;drawProjectile(c,{x,y,vx:420,vy:0,element:main,enemy:false},1+i*.2,s.player,i===3);text(i===3?'reduced effects':i===0?'main + support':'flight',x,y+30);scenes++;}
  }
  const hostiles=[{}, {frostArrow:true},{poisonShot:'orb'},{ricochet:1},{dark:true},{demonIce:true}];for(let i=0;i<hostiles.length;i++){drawProjectile(c,{x:150+i*225,y:535,vx:420,vy:0,enemy:true,...hostiles[i]},1,{});text(['ordinary','frost','poison orb','ricochet','dark','demon ice'][i],150+i*225,575);scenes++;}
  for(const [i,kind] of ['ember','spore','charge'].entries())for(let j=0;j<3;j++){const x=160+i*450,y=630+j*45;c.save();c.translate(x-140,y-140);drawSynergyEffect(c,{x:140,y:140,toX:240,toY:140,synergyEffect:kind,t:.3-j*.08,duration:.3});c.restore();scenes++;}
  const blades=[];for(const [row,branch] of ['judgment','dance'].entries())for(let col=0;col<5;col++){
   const s=newRun(35),r=currentRoom(s);s.player.x=145+col*285;s.player.y=855+row*180;s.player.aura=3;s.player.evolutions={aura:branch};s.player.mainSkill='chain';s.player.chain=3;s.player.chargeCell=3;s.player.chargeReady=true;s.elapsed=1;s.metrics={damageDealt:0};r.obstacles=[];r.enemies=[{id:0,type:'archer',x:s.player.x+60,y:s.player.y,hp:1000,max:1000}];
   if(col>0){tickSpectralBlade(s,r,.01,[]);if(col>1)tickSpectralBlade(s,r,[0,0,.12,.30,.4][col],[]);}
   const before=JSON.stringify(s);drawPixelActor(c,{...s.player,type:'player'},s.elapsed,s);drawSpectralBlade(c,s,col===4);drawPlayerSkillStates(c,s,col===4);if(JSON.stringify(s)!==before)throw Error('Render mutated run');text(branch+' / '+['idle','prepare','cut','follow/return','reduced'][col],s.player.x,s.player.y+55);scenes++;blades.push({branch,col});
  }
  for(const [i,kind] of ['fire','frost','poison','chain','precision'].entries())for(let j=0;j<3;j++){
   const x=130+i*285,y=1230+j*75;c.save();c.translate(x-150,y-150);const f={x:150,y:150,hitElement:kind,level:3,t:.3-j*.08,duration:.3};if(kind==='precision')drawArrowImpact(c,{...f,arrowImpact:true,precision:true});else drawElementHit(c,f);if(kind==='fire')drawPlayerBlast(c,{...f,playerBlast:'fire',r:55});c.restore();if(j===0)text(kind+' / contact',x,y-35);scenes++;
  }
  c.save();c.translate(-100,1250);drawArrowRain(c,{x:480,y:300,r:180,elapsed:.08,pulses:1});c.restore();text('arrow rain / real pulse',350,1750);scenes++;
  for(const [i,main] of ['fire','frost','poison','chain','precision'].entries()){c.save();c.translate(680+i*140-480,1300);drawCrossbow(c,{x:480,y:300,time:18.7,clock:.55,aim:-.3,build:{[main]:3}});c.restore();text(main+' turret',680+i*140,1690);scenes++;}
  const frozen=document.querySelector('canvas').toDataURL();for(let i=0;i<2;i++){const scratch=document.createElement('canvas');scratch.width=96;scratch.height=96;const ctx=scratch.getContext('2d');drawProjectile(ctx,{x:40,y:40,vx:420,vy:0,enemy:true,frostArrow:true},1,{});if(ctx.getTransform().toString()!=='matrix(1, 0, 0, 1, 0, 0)')throw Error('Canvas transform leak');}
  const combat=[];for(const main of ['fire','frost','poison','chain','precision']){
   let s=newRun(178),r=currentRoom(s);Object.assign(s.player,{mainSkill:main,[main]:main==='frost'?4:3,level:20,utility:'focus',aura:3,damage:30,haste:3,power:3,split:2,pierce:2,repeat:1,homing:1});s.player.evolutions={aura:'dance'};for(const k of synergySkills.filter(k=>k.main===main))s.player[k.id]=3;
   s.invulnerable=999;r.obstacles=[];r.enemies=Array.from({length:8},(_,i)=>({id:i,type:'archer',x:520+i%4*45,y:260+Math.floor(i/4)*60,hp:800,max:800,cd:999,balanceVersion:1}));
   for(let frame=0;frame<600;frame++){stepRun(s,1/60);if(frame===200){s=parseSave(encodeSave(s));r=currentRoom(s);}}parseSave(encodeSave(s));if(!Number.isFinite(s.metrics.damageDealt)||s.metrics.damageDealt<=0)throw Error('No finite damage '+main);combat.push({main,damage:s.metrics.damageDealt,kills:s.kills,saveRoundTrip:true});
  }
  return {gallery:{scenes,blades:blades.length,renderStateUnchanged:true,pauseImageStable:frozen===document.querySelector('canvas').toDataURL()},combat};
 });report.gallery=result.gallery;report.combat=result.combat;await page.screenshot({path:join(out,'skill-effects-package.png'),fullPage:true});await page.close();
 const fallback=await browser.newPage();await fallback.route('**/vergas-blade-v1.png',r=>r.abort());await fallback.goto(base,{waitUntil:'domcontentloaded'});report.fallback=await fallback.evaluate(async()=>{const m=await import('/src/rendering/spectral-blade.js'),{newRun}=await import('/src/game/engine.js');if(await m.spectralBladeReady)return false;const s=newRun(1);s.player.aura=1;const c=document.createElement('canvas');c.width=960;c.height=540;m.drawSpectralBlade(c.getContext('2d'),s);return c.getContext('2d').getImageData(0,0,960,540).data.some((n,i)=>i%4===3&&n>0);});assert.equal(report.fallback,true);await fallback.close();assert.deepEqual(errors,[]);report.errors=errors;await writeFile(join(out,'skill-renewal-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
