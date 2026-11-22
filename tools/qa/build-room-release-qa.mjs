// Prepared only: run after an explicit deployment instruction. Isolated local saves.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const base=process.env.BASE_URL||'http://127.0.0.1:5173',out=process.argv[2];
if(!out)throw Error('Provide an evidence directory');
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname)&&!process.argv.includes('--allow-public'))throw Error('Public QA requires --allow-public');
const playwright=process.env.PLAYWRIGHT_PATH||join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {chromium}=await import(pathToFileURL(join(playwright,'index.mjs')).href);
const hook=`
const {roomGeometry:geometryQA,roomDoorCenter:doorCenterQA}=await import('/src/world/room-geometry.js');
globalThis.__buildRoomQA={
 state:()=>s,mode:()=>mode,
 async load(run){await lease.acquire();stop('pause');renderTitleScene=null;s=run;resetTransient();enterRoom(s);await prepareFloorAssets(s.floor,floorAssetOptions(s));if(!save())throw Error(saveError);resume();},
 persist:()=>save(),
 placeAtDoor(d){const r=room();const n=doorCenterQA(r,d),b=geometryQA(r).recovery;s.player.x=d===1?b.maxX-35:d===3?b.minX+35:n;s.player.y=d===0?b.minY+35:d===2?b.maxY-35:n;input.reset();canvas.focus();},
 async returnPhase(){stop('pause');const {enrage}=await import('/src/game/engine.js');enrage(s);enterRoom(s);s.invulnerable=999;s.attack=999;await prepareFloorAssets(s.floor,floorAssetOptions(s));if(!save())throw Error(saveError);resume();}
};
`;
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];let active,posts=0;
async function open(width,height,touch,reduced){
 const context=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch,ignoreHTTPSErrors:true}),p=await context.newPage();active=p;p.setDefaultTimeout(60000);
 p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/api/**',r=>{if(r.request().method()==='POST'){posts++;return r.abort();}return r.continue();});
 await p.route('**/src/game/game.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+hook});});
 await p.addInitScript(reduced=>localStorage.setItem('spirebound.settings.v1',JSON.stringify({muted:true,volume:0,reducedEffects:reduced})),reduced);
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.__buildRoomQA);return {context,p};
}
async function fixture(p,profile=false){return p.evaluate(async profile=>{
 const {newRun,neighbor}=await import('/src/game/engine.js');let s,chosen;
 for(let seed=1;seed<=40;seed++){
  s=newRun(seed);if(!profile)break;
  outer:for(const [floor,rooms] of s.floors.entries())for(const [index,r] of rooms.entries())if(r.footprint){
   s.floor=floor;s.room=index;
   const d=[0,1,2,3].find(d=>{const i=neighbor(s,d);return i>=0&&rooms[i].type==='normal'&&!rooms[i].tutorial&&!rooms[i].gate;});
   if(d!==undefined){chosen={floor,index,d,next:neighbor(s,d),footprint:r.footprint};break outer;}
  }
  if(chosen)break;
 }
 if(profile&&!chosen)throw Error('No doorway fixture within 40 generated seeds');
 s.tutorialComplete=true;Object.assign(s.player,{mainSkill:'precision',precision:1,utility:'guardian',level:4,max:10,hp:8,food:2,relics:['lens','windSeal'],essenceCounts:{attack:3,ultimate:2},damage:26,ultimateEssences:2});
 for(const id of ['split','pierce','haste','power','repeat','aura','homing','weakpoint','finisher'])s.player[id]=1;
 if(profile){s.floors[chosen.floor][chosen.index].enemies=[];s.floors[chosen.floor][chosen.next].enemies=[];}else s.floors[s.floor][s.room].enemies=[];
 s.invulnerable=999;s.attack=999;await __buildRoomQA.load(s);return chosen||{};
},profile);}
const playing=p=>p.waitForFunction(()=>__buildRoomQA.mode()==='play'&&!document.querySelector('#overlay').children.length);
const state=p=>p.evaluate(()=>{const s=__buildRoomQA.state();return {elapsed:s.elapsed,food:s.player.food,hp:s.player.hp,pending:!!s.pendingHeal,room:s.room,floor:s.floor,random:s.randomState};});
async function buildCase(width,height,touch,reduced){
 console.log('build',width,height,reduced);
 const {context,p}=await open(width,height,touch,reduced);
 try{
  await fixture(p);await playing(p);await p.locator('#bag').click();await p.locator('.build-window').waitFor();const frozen=await state(p);
  await p.waitForTimeout(300);assert.deepEqual(await state(p),frozen);
  for(const tab of ['skills','relics','essences']){await p.locator('#buildTab-'+tab).click();assert.equal(await p.locator('#buildTab-'+tab).getAttribute('aria-selected'),'true');await p.locator('[data-build-entry]').first().click();assert.equal(await p.locator('[data-build-entry][aria-pressed=true]').count(),1);}
  assert.match(await p.locator('.build-detail').innerText(),/획득 즉시 적용됨/);
  await p.locator('#journal').click();await p.locator('#closeJournal').click();assert.equal(await p.locator('#buildTab-essences').getAttribute('aria-selected'),'true');
  await p.locator('#buildBestiary').click();await p.locator('#closeBestiary').click();assert.equal(await p.locator('#buildTab-essences').getAttribute('aria-selected'),'true');
  await p.locator('#buildTab-skills').focus();await p.keyboard.press('End');assert.equal(await p.locator('#buildTab-essences').getAttribute('aria-selected'),'true');
  for(const id of ['buildClose','buildTab-skills','buildTab-relics','buildTab-essences','eat','journal','buildBestiary','closeBag']){const box=await p.locator('#'+id).boundingBox();assert.ok(box&&box.height>=43.5&&box.x>=0&&box.y>=0&&box.x+box.width<=width+.5&&box.y+box.height<=height+.5,id+' touch target/viewport');}
  await p.screenshot({path:join(out,`build-${width}-${reduced}.png`)});
  await p.locator('#eat').click();assert.equal(await p.locator('#eat').isDisabled(),true);assert.equal((await state(p)).food,frozen.food-1);assert.equal((await state(p)).pending,true);
  await p.keyboard.press('Escape');await playing(p);assert.equal((await state(p)).hp,frozen.hp+1);assert.equal((await state(p)).food,frozen.food-1);
  await p.locator('#bag').click();
  await p.evaluate(()=>{window.__originalBuildSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===localStorage&&k==='spirebound.run.v1')throw new DOMException('QA quota','QuotaExceededError');return __originalBuildSet.call(this,k,v);};});
  await p.locator('#closeBag').click();assert.equal(await p.evaluate(()=>__buildRoomQA.mode()),'pause');
  await p.evaluate(()=>{Storage.prototype.setItem=__originalBuildSet;});
  results.push({kind:'build',width,height,touch,reduced,frozen:true,tabs:true,subpanels:true,foodOnce:true,saveFailureStops:true});
 }catch(error){await p.screenshot({path:join(out,'failure-'+width+'-'+Date.now()+'.png')}).catch(()=>{});throw error;}finally{await context.close();}
}
async function cross(p,d,expected){
 await p.evaluate(d=>__buildRoomQA.placeAtDoor(d),d);const key=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][d];
 await p.keyboard.down(key);try{await p.waitForFunction(expected=>__buildRoomQA.state().room===expected,expected);}finally{await p.keyboard.up(key);}
}
async function roomCase(width,height,touch){
 console.log('room',width,height);
 const {context,p}=await open(width,height,touch,false);
 try{
  const chosen=await fixture(p,true);await playing(p);
  await p.waitForFunction(touch=>!touch||document.querySelector('#game').width>960,touch);
  const pixel=await p.evaluate(()=>{const c=document.querySelector('#game');return [...c.getContext('2d').getImageData(2,2,1,1).data];});assert.deepEqual(pixel,[5,6,8,255]);
  await p.screenshot({path:join(out,`room-${width}.png`)});
  await cross(p,chosen.d,chosen.next);await cross(p,(chosen.d+2)%4,chosen.index);
  await p.evaluate(()=>__buildRoomQA.persist());await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await playing(p);
  assert.equal((await state(p)).room,chosen.index);assert.equal(await p.evaluate(()=>__buildRoomQA.state().floors[__buildRoomQA.state().floor][__buildRoomQA.state().room].footprint),chosen.footprint);
  await p.evaluate(()=>__buildRoomQA.returnPhase());await playing(p);const before=await state(p);await p.waitForFunction(time=>__buildRoomQA.state().elapsed>=time+1.5,before.elapsed);
  const bounds=await p.evaluate(async()=>{const {roomGeometry}=await import('/src/world/room-geometry.js'),{enemyRadius,enemyAirborne}=await import('/src/game/simulation.js');const s=__buildRoomQA.state(),r=s.floors[s.floor][s.room],f=roomGeometry(r).footprint;return r.enemies.filter(e=>e.hp>0&&!enemyAirborne(e)).every(e=>{const n=enemyRadius(e);return e.x>=f.x+n-.1&&e.x<=f.x+f.width-n+.1&&e.y>=f.y+n-.1&&e.y<=f.y+f.height-n+.1;});});assert.equal(bounds,true);
  await p.screenshot({path:join(out,`return-${width}.png`)});results.push({kind:'room',...chosen,width,height,blackVoid:true,doorRoundtrip:true,reload:true,returnBounds:true});
 }catch(error){await p.screenshot({path:join(out,'failure-'+width+'-'+Date.now()+'.png')}).catch(()=>{});throw error;}finally{await context.close();}
}
try{
 for(const args of [[1280,720,false,false],[844,390,true,false],[740,360,true,true]])await buildCase(...args);
 for(const args of [[1280,720,false],[844,390,true]])await roomCase(...args);
 assert.deepEqual(errors,[]);assert.equal(posts,0);await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors,apiPosts:posts},null,2));console.log(JSON.stringify({cases:results.length,errors,apiPosts:posts}));
}catch(error){await writeFile(join(out,'failure.json'),JSON.stringify({error:String(error),results,errors,apiPosts:posts},null,2));throw error;}
finally{await browser.close();}
