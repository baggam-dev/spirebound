import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')));
const base=process.env.SPIREBOUND_URL||'http://localhost:5173';
const output=process.argv[2];
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];
try{
 const gallery=await browser.newPage({viewport:{width:1200,height:720}});
 gallery.on('pageerror',error=>errors.push(error.message));
 await gallery.route('**/visual-preview',route=>route.fulfill({contentType:'text/html',body:'<canvas width="1200" height="720"></canvas>'}));
 await gallery.goto(base+'/visual-preview');
 const state=await gallery.evaluate(async()=>{
  const {drawPixelActor}=await import('/src/rendering/pixel-world.js');
  const {drawElites}=await import('/src/combat/elites.js');
  const {drawElements}=await import('/src/combat/elements.js');
  const {drawRoomStory}=await import('/src/rendering/atmosphere.js');
  const c=document.querySelector('canvas').getContext('2d');
  c.fillStyle='#25322f';c.fillRect(0,0,1200,720);
  c.fillStyle='#d7dec8';c.font='18px sans-serif';c.fillText('HERO · BLOND MERCENARY ARCHER',32,34);
  const faces=[{name:'idle',dx:0,attack:0},{name:'walk right',dx:5,attack:0},{name:'walk left',dx:-5,attack:0},{name:'release',dx:0,attack:1}];
  for(let i=0;i<faces.length;i++){
   const f=faces[i],run={player:{x:480,y:300},attack:0},x=150+i*290;
   c.save();c.translate(x,202);c.scale(3,3);
   drawPixelActor(c,{type:'player',x:0,y:0},0,run);
   run.player.x+=f.dx;run.attack=f.attack;
   drawPixelActor(c,{type:'player',x:0,y:0},.2,run);
   c.restore();c.fillStyle='#d7dec8';c.fillText(f.name,x-50,312);
  }
  c.fillStyle='#d7dec8';c.fillText('MONSTER STATES · NO HARD OUTLINES',32,365);
  const enemies=[
   {id:0,type:'chaser',x:160,y:508,hp:100,max:100,protected:true},
   {id:1,type:'chaser',x:430,y:508,hp:100,max:100,frozen:1},
   {id:2,type:'chaser',x:700,y:508,hp:100,max:100,trialChampion:true},
   {id:3,type:'starKnight',x:970,y:508,hp:100,max:100,gateFury:true}
  ];
  drawElites(c,{enemies,blasts:[]});drawElements(c,{enemies,fireZones:[]});
  for(const e of enemies)drawPixelActor(c,e,0);
  c.save();c.beginPath();c.rect(0,440,1200,190);c.clip();
  drawRoomStory(c,{key:false,floor:6},{gate:true,used:false,enemies:[enemies[3]],gateBanner:0});c.restore();
  for(const [i,label] of ['protected','frozen','trial','gate fury'].entries()){c.fillStyle='#d7dec8';c.fillText(label,110+i*270,600);}
  return {heroPoses:faces.length,states:enemies.length};
 });
 await gallery.screenshot({path:join(output,'hero-status-gallery.png')});
 let screens=0;
 for(const [width,height] of [[1280,800],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.evaluate(async()=>{const {newRun,currentRoom}=await import('/src/game/engine.js');const {RunStore}=await import('/src/persistence/storage.js');const s=newRun(29);s.room=2;s.player.x=480;s.player.y=300;s.attack=999;const r=currentRoom(s);r.enemies=[];r.obstacles=[];const saved=new RunStore(localStorage).write(s);if(!saved.ok)throw Error('fixture save');});
  await page.reload();await page.locator('#continue').click();await page.waitForFunction(()=>document.querySelector('#overlay').childElementCount===0);
  await page.screenshot({path:join(output,`${width}-hero.png`)});screens++;await context.close();
 }
 console.log(JSON.stringify({state,screens,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
