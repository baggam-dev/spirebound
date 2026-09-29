import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')));
const base=process.env.SPIREBOUND_URL||'http://localhost:5173',output=process.argv[2];await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];let cases=0;
try{
 const page=await browser.newPage({viewport:{width:1200,height:720}});page.on('pageerror',e=>errors.push(e.message));await page.route('**/hero-preview',r=>r.fulfill({contentType:'text/html',body:'<canvas width="1200" height="720"></canvas>'}));await page.goto(base+'/hero-preview');
 const gallery=await page.evaluate(async()=>{
 const {drawPixelActor}=await import('/src/rendering/pixel-world.js'),{drawCrossbow,drawCrossbowEnding,drawArrowRain,drawUltimateGround}=await import('/src/rendering/ultimate-visuals.js'),{drawElites}=await import('/src/combat/elites.js'),{drawEnemyDetails}=await import('/src/combat/brute.js');const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#202d30';c.fillRect(0,0,1200,720);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,run={player:{x:480,y:300},attack:0};for(let n=0;n<12;n++){run.player.x+=Math.cos(a)*3;run.player.y+=Math.sin(a)*3; c.save();c.translate(85+i*145,140);c.scale(2.5,2.5);if(n<11)c.globalAlpha=0;drawPixelActor(c,{type:'player',x:0,y:0},n/60,run);c.restore();}}
 for(let i=0;i<3;i++){c.save();c.translate(175+i*400,355);c.scale(2,2);c.translate(-480,-270);if(i===2)drawCrossbowEnding(c,{x:480,y:270,time:.25,aim:0});else drawCrossbow(c,{x:480,y:270,time:i===0?18.9:10,clock:i===0?0:.6,aim:-.3});c.restore();}
 drawElites(c,{enemies:[{x:100,y:590,elite:'explosive'}],blasts:[]});drawEnemyDetails(c,{type:'brute',x:300,y:580,phase:'windup',phaseTime:.7,landX:420,landY:610});
 const z={x:850,y:560,r:150,elapsed:.64,pulses:2};drawArrowRain(c,z);
 const probe=document.createElement('canvas').getContext('2d');probe.canvas.width=960;probe.canvas.height=540;drawUltimateGround(probe,{arrowRain:z});if(probe.getImageData(0,0,960,540).data.some(n=>n))throw Error('rain floor marker remains');return {heroDirections:8,rainMarkerRemoved:true};
 });await page.screenshot({path:join(output,'hero-and-effects.png')});
 for(const [width,height] of [[1280,800],[844,390]])for(const kind of ['fire','frost','poison','chain']){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base);
 await p.evaluate(async kind=>{const {newRun,currentRoom}=await import('/src/game/engine.js'),{RunStore}=await import('/src/persistence/storage.js');const s=newRun(17);s.room=2;s.player.x=400;s.player.y=300;Object.assign(s.player,{[kind]:3,mainSkill:kind,split:2,pierce:2,repeat:1,homing:1,ultimate:1,evolutions:{ultimate:'turret',[kind]:{fire:'flare',frost:'deep',poison:'flare',chain:'surge'}[kind]}});const r=currentRoom(s);r.obstacles=[];r.type='normal';r.enemies=Array.from({length:3},(_,id)=>({id,type:'chaser',x:600+id*60,y:220+id*70,hp:10000,max:10000,cd:2,balanceVersion:1}));const saved=new RunStore(localStorage).write(s);if(!saved.ok)throw Error('fixture');},kind);
 await p.reload();await p.locator('#continue').click();await p.waitForFunction(()=>document.querySelector('#overlay').childElementCount===0);await p.locator('#skill').click();await p.keyboard.down('a');await p.waitForTimeout(200);await p.keyboard.up('a');await p.waitForTimeout(1500);await p.screenshot({path:join(output,`${width}-${kind}.png`)});await p.locator('#pause').click();
 const saved=await p.evaluate(async()=>{const {RunStore}=await import('/src/persistence/storage.js');const result=new RunStore(localStorage).read();if(!result.run)throw Error('save');const s=result.run,t=s.floors[s.floor][s.room].turrets;return {turrets:t?.length,build:!!t?.[0]?.build,seekers:s.projectiles.filter(b=>b.seeker).length};});if(saved.turrets!==1||!saved.build)throw Error(JSON.stringify(saved));await p.reload();await p.locator('#continue').click();await p.waitForFunction(()=>document.querySelector('#overlay').childElementCount===0);cases++;await context.close();
 }
 console.log(JSON.stringify({gallery,cases,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
