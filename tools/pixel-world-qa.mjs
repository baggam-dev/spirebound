// Usage: PLAYWRIGHT_PATH=<package directory> node tools/pixel-world-qa.mjs <output directory>
import {mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const library=process.env.PLAYWRIGHT_PATH;
const {chromium}=await import(library?pathToFileURL(join(library,'index.mjs')).href:'playwright');
const output=resolve(process.argv[2]||'artifacts/pixel-world');await mkdir(output,{recursive:true});
const base=process.env.SPIREBOUND_URL||'http://localhost:5173';
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];const results=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true],[667,375,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  for(const [i,boss] of (mobile?['king']:['warden','prism','slime','gate','king']).entries()){
   await page.goto(base);await page.locator('#bossPractice').click();await page.locator('#practiceBoss').selectOption(boss);
   await page.locator('#practiceMain').selectOption(['fire','frost','poison','chain'][i%4]);await page.locator('#rollPractice').click();await page.locator('#launchPractice').click();
   await page.keyboard.down('a');await page.waitForTimeout(450);await page.keyboard.up('a');await page.waitForTimeout(350);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   if(overflow)errors.push(`Horizontal overflow: ${width}x${height}`);
   await page.screenshot({path:join(output,`${width}x${height}-${boss}.png`)});
   results.push({width,height,boss,overflow});
  }
  await context.close();
 }
 const page=await browser.newPage({viewport:{width:1200,height:940}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/pixel-gallery',route=>route.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#111820"><canvas width="1200" height="940"></canvas></body>'}));
 await page.goto(`${base}/pixel-gallery`);
 const check=await page.evaluate(async()=>{
  const p=await import('/pixel-world.js'),{drawUpper}=await import('/upper-visuals.js'),{drawObstacles}=await import('/terrain.js');
  const c=document.querySelector('canvas').getContext('2d');c.imageSmoothingEnabled=false;
  const label=(text,x,y,size=14)=>{c.fillStyle='#c8c6b3';c.font=`${size}px monospace`;c.textAlign='center';c.fillText(text,x,y);};
  c.fillStyle='#111820';c.fillRect(0,0,1200,940);label('SPIREBOUND / PIXEL WORLD',600,38,24);
  c.save();c.translate(25,60);c.scale(1.2,1.2);
  const types=['player','chaser','archer','charger','scatter','ambusher','ringcaster'];
  types.forEach((type,i)=>{const e={x:65+i*140,y:75,type,hp:100,max:100},s={player:e,attack:0};c.save();c.translate(e.x,e.y);c.scale(2,2);p.drawPixelActor(c,{...e,x:0,y:0},1,s);c.restore();label(type,e.x,132,12);});c.restore();
  label('BOSSES / CORRUPTED ARMOR & LIVING CRYSTALS',600,267,16);
  c.save();c.translate(0,310);const bosses=[{type:'boss',x:135,y:90},{type:'boss',variant:'prism',x:360,y:90},{type:'boss',variant:'slime',x:585,y:90},{type:'boss',variant:'king',x:850,y:90},{type:'starKnight',x:1080,y:90}];
  bosses.forEach((e,i)=>{e.hp=e.max=100;c.save();c.translate(e.x,e.y);c.scale(1.65,1.65);const n={...e,x:0,y:0};if(i===0)p.drawPixelActor(c,n,1);else if(i===1)p.drawCrystalBody(c,n,1);else if(i===2)p.drawOrganicBody(c,n,38,1);else drawUpper(c,n,1);c.restore();label(['WARDEN','PRISM','SLIME','MORDO','KNIGHT'][i],e.x,185);});c.restore();
  label('FIRE / FROST / POISON / LIGHTNING',600,535,16);
  for(const [i,element] of ['fire','frost','poison','chain'].entries()){c.save();c.translate(190+i*275,575);c.scale(3,3);p.drawProjectile(c,{x:0,y:0,vx:420,vy:0,element},1);c.restore();label(element,190+i*275,615);}
  c.save();c.translate(120,640);const r={type:'treasure',obstacles:[{type:'rock',x:0,y:65,w:60,h:50},{type:'bookshelf',x:160,y:65,w:80,h:60},{type:'table',x:340,y:65,w:75,h:45}],enemies:[]};drawObstacles(c,r.obstacles);p.drawObjectDetails(c,{elapsed:1},r);c.restore();
  label('STONE / LIBRARY / RELICS',600,820,16);label('Code-drawn sprites. Original combat timing and hitboxes preserved.',600,900,14);
  // Verify renderer purity against frozen combat state, including repeated frames.
  const probe=document.createElement('canvas').getContext('2d');probe.canvas.width=960;probe.canvas.height=540;
  const frozen=Object.freeze({type:'player',x:0,y:0,aura:0});const state=Object.freeze({player:frozen,attack:0,key:false});
  p.drawPixelActor(probe,frozen,0,state);p.drawPixelActor(probe,frozen,1,state);
  const before=probe.getTransform().toString();p.drawProjectile(probe,{x:1,y:1,vx:0,vy:420,element:'fire'},2);
  if(probe.getTransform().toString()!==before)throw Error('Leaked canvas transform');
  const moving={player:{x:80,y:80},attack:0};const anchor={x:80,y:80,type:'player'};
  const frameAt=time=>{probe.clearRect(0,0,160,160);p.drawPixelActor(probe,anchor,time,moving);return probe.getImageData(0,0,160,160).data.toString();};
  const idle=frameAt(0);moving.player.x+=7;const walk=frameAt(.1);moving.attack=1;const attack=frameAt(.2);const paused=frameAt(.2);
  if(idle===walk||walk===attack||attack!==paused)throw Error('Walk, firing, or pause animation regression');
  const times=[];for(let frame=0;frame<60;frame++){const start=performance.now();for(let i=0;i<150;i++)p.drawProjectile(probe,{x:30+i*5,y:100,vx:420,vy:0,element:'fire'},frame/60);times.push(performance.now()-start);}
  times.sort((a,b)=>a-b);return {frozenState:'unchanged',canvasTransform:'restored',animation:'walking and firing differ; paused frame stable',projectiles:150,medianDrawMs:times[30]};
 });
 await page.screenshot({path:join(output,'pixel-world-gallery.png')});console.log(JSON.stringify({results,check,errors},null,2));
 if(errors.length)process.exitCode=1;
}finally{await browser.close();}
