// Isolated saved fixtures; real simulation/UI, never POSTs a score or creates an online run.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2],core=process.argv.includes('--public-core');
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[],errors=[];let active,scores=0;
async function snap(p){return p.evaluate(async()=>{
 const {RunStore}=await import('/src/persistence/storage.js'),s=new RunStore(localStorage).read().run;
 if(!s)return null;const r=s.floors[s.floor][s.room];return {floor:s.floor,elapsed:s.elapsed,key:s.key,pending:s.returnNoticePending===true,bossPending:!!(r.kingPending||r.commanderPending||r.demonPending),bosses:r.enemies.filter(e=>e.type==='boss'&&e.hp>0).length,hp:s.player.hp,dodge:s.dodge,x:s.player.x,y:s.player.y,live:r.enemies.filter(e=>e.hp>0).length,persistentPresentation:Object.keys(s).some(k=>/journey|descentFrame/i.test(k))};
});}
async function game(p){await p.waitForFunction(()=>!document.getElementById('overlay').children.length);}
async function open(kind,width=844,floor=7){
 const c=await browser.newContext({viewport:{width,height:width===1280?720:390},isMobile:width<1000,hasTouch:width<1000}),p=await c.newPage();active=p;p.setDefaultTimeout(180000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/records'))scores++;});
 if(kind==='lease')await c.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}));
 if(kind==='reduced')await c.addInitScript(()=>localStorage.setItem('spirebound.settings.v1',JSON.stringify({muted:true,volume:0,reducedEffects:true})));
 let release;const gate=new Promise(r=>release=r);
 if(['cold','load-fail','loading-blur'].includes(kind))await p.route('**/guard-hall-atlas-v1.png',async r=>{if(kind==='load-fail')await r.abort();else{await gate;await r.continue().catch(()=>{});}});
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#continue,#start').first().waitFor();
 await p.evaluate(async({kind,floor})=>{
  const {newRun,enrage,currentRoom}=await import('/src/game/engine.js'),{RunStore}=await import('/src/persistence/storage.js'),{challengeDemon,advanceDemonPhase}=await import('/src/combat/demon.js');
  const s=newRun(77,{campaign:'expanded'});s.player.mainSkill='precision';s.player.precision=1;s.player.hp=s.player.max=10;s.invulnerable=999;s.attack=999;s.tutorialComplete=true;
  if(kind==='approach'){
   s.floor=floor;s.room=s.floors[floor].findIndex(r=>r.type==='boss');Object.assign(s.player,{x:480,y:310});currentRoom(s).seen=true;
  }else if(['descent','cold','load-fail','loading-blur'].includes(kind)){
   enrage(s);s.returnNoticePending=false;s.floor=2;s.room=s.floors[2].findIndex(r=>r.type==='down');const r=currentRoom(s);r.enemies=[];r.used=true;r.seen=true;r.returnSealReleased=true;
   const destination=s.floors[1].find(r=>r.type==='boss');destination.enemies=[];destination.used=true;destination.seen=true;destination.returnSealReleased=true;
   Object.assign(s.player,r.objectPosition||{x:480,y:115});
  }else{
   s.floor=9;s.room=1;challengeDemon(s);const r=currentRoom(s);while(r.demon.phase<3){r.enemies.forEach(e=>e.hp=0);advanceDemonPhase(r,s.projectiles);}r.seen=true;
   s.player.x=480;s.player.y=320;s.attack=0;r.demon.partClocks={core:3};r.demon.specialClock=3;r.demon.summonClock=6;r.enemies[0].hp=.01;
   if(kind==='loaded'){r.enemies=[];r.used=true;enrage(s);s.returnNoticePending=true;s.attack=999;}
  }
  const result=new RunStore(localStorage).write(s);if(!result.ok)throw Error(result.error);
 },{kind,floor});
 await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();return {c,p,release};
}
async function approach(width,floor){
 const {c,p}=await open('approach',width,floor);await game(p);const before=await snap(p);assert.equal(before.bossPending,true);assert.equal(await p.locator('#interact').isVisible(),false);
 await p.screenshot({path:join(out,`approach-${floor}-${width}.png`)});await p.keyboard.down('w');await p.waitForTimeout(450);await p.keyboard.up('w');
 await p.waitForFunction(async()=>{const {RunStore}=await import('/src/persistence/storage.js'),s=new RunStore(localStorage).read().run,r=s.floors[s.floor][s.room];return !(r.kingPending||r.commanderPending||r.demonPending)&&r.enemies.some(e=>e.type==='boss'&&e.hp>0);});
 await p.waitForTimeout(300);await p.keyboard.press('Escape');await p.locator('#resume').waitFor();const after=await snap(p);assert.equal(after.bossPending,false);assert.equal(after.bosses,floor===9?2:1);assert.equal(after.persistentPresentation,false);
 await p.locator('#resume').click();await game(p);await p.waitForTimeout(150);await p.keyboard.press('Escape');await p.locator('#resume').waitFor();assert.equal((await snap(p)).bosses,after.bosses);
 await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await game(p);await p.keyboard.press('Escape');await p.locator('#resume').waitFor();assert.equal((await snap(p)).bosses,after.bosses);
 results.push({kind:'approach',width,floor:floor+1,once:true,saveResume:true,bosses:after.bosses});await c.close();
}
async function keyReveal(kind,width=844){
 const {c,p}=await open(kind,width);await p.locator('.journey-return').waitFor();const before=await snap(p);assert.equal(before.key,true);assert.equal(before.pending,true);assert.equal(before.persistentPresentation,false);
 await p.waitForTimeout(220);await p.screenshot({path:join(out,`key-${kind}-${width}.png`)});
 if(kind==='space'){await p.keyboard.press('Space');await game(p);const after=await snap(p);assert.equal(after.elapsed,before.elapsed);assert.equal(after.pending,false);assert.equal(after.dodge,before.dodge);}
 else if(kind==='blur'||kind==='portrait'||kind==='lease'){
  if(kind==='portrait')await p.setViewportSize({width:390,height:844});
  else if(kind==='blur')await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
  else await p.evaluate(()=>{localStorage.setItem('spirebound.active-tab',JSON.stringify({id:'qa-other',time:Date.now()}));window.dispatchEvent(new StorageEvent('storage',{key:'spirebound.active-tab',newValue:localStorage.getItem('spirebound.active-tab')}));});
  await p.waitForFunction(()=>!document.querySelector('.journey-return'));await p.waitForTimeout(1700);assert.equal((await snap(p)).pending,true);
  if(kind!=='lease'){if(kind==='portrait')await p.setViewportSize({width:844,height:390});await p.locator('#resume').click();await p.locator('.journey-return').waitFor();await p.locator('#journeySkip').click();await game(p);assert.equal((await snap(p)).pending,false);}
 }else if(kind==='save-fail'){
  await p.evaluate(()=>{const set=Storage.prototype.setItem;window.__restore=()=>Storage.prototype.setItem=set;Storage.prototype.setItem=function(key,value){if(key.startsWith('spirebound.run.v1'))throw new DOMException('QA quota','QuotaExceededError');return set.call(this,key,value);};});
  await p.locator('#resume').waitFor();assert.equal((await snap(p)).pending,true);await p.evaluate(()=>window.__restore());await p.locator('#resume').click();await p.locator('.journey-return').waitFor();await p.locator('#journeySkip').click();await game(p);assert.equal((await snap(p)).pending,false);
 }else{
  await game(p);const after=await snap(p);assert.equal(after.pending,false);assert.equal(after.elapsed,before.elapsed);assert.equal(after.hp,before.hp);
  await p.keyboard.press('Escape');await p.locator('#resume').waitFor();await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await game(p);assert.equal(await p.locator('.journey-return').count(),0);
 }
 results.push({kind:'key-'+kind,width,clockFrozen:true,keySaved:true});await c.close();
}
async function descent(kind,width=844){
 const {c,p,release}=await open(kind,width);await game(p);const before=await snap(p);await p.locator('#interact').click();
 if(kind==='load-fail'){
  await p.locator('#loadingReload').waitFor({timeout:360000});const failed=await snap(p);assert.equal(failed.floor,1);await p.screenshot({path:join(out,`descent-failure-${width}.png`)});await p.locator('#loadingBack').click();await p.locator('#continue').waitFor();results.push({kind:'descent-failure',width,recovery:true});await c.close();return;
 }
 await p.locator('.journey-descent').waitFor();
 const saved=await snap(p);assert.equal(saved.floor,1);assert.ok(saved.elapsed>=before.elapsed);assert.equal(saved.persistentPresentation,false);
 if(kind==='cold'||kind==='loading-blur'){
  await p.waitForTimeout(350);assert.deepEqual(await p.locator('#game').evaluate(c=>[...c.getContext('2d').getImageData(480,270,1,1).data]),[8,9,14,255]);
  const timer=await p.locator('#timer').textContent();await p.keyboard.press('Space');await p.keyboard.press('q');await p.waitForTimeout(500);assert.equal(await p.locator('#timer').textContent(),timer);assert.equal((await snap(p)).elapsed,saved.elapsed);
  await p.screenshot({path:join(out,`descent-${kind}-${width}.png`)});
  if(kind==='loading-blur'){await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.locator('#resume').waitFor();release();await p.waitForTimeout(900);assert.equal(await p.locator('#resume').isVisible(),true);await p.locator('#resume').click();}
  else release();
 }
 await game(p);await p.keyboard.press('Escape');await p.locator('#resume').waitFor();const after=await snap(p);assert.equal(after.floor,1);assert.equal(after.dodge,before.dodge);assert.equal(after.hp,before.hp);assert.equal(after.persistentPresentation,false);
 results.push({kind:'descent-'+kind,width,clockFrozenDuringHold:true,floorChangedOnce:true});await c.close();
}
try{
 const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7);
 if(!only||only==='approach')for(const width of (core?[844]:[1280,844]))for(const floor of [7,8,9]){console.log('approach',width,floor);await approach(width,floor);}
 if(!only||only==='key')for(const [kind,width] of (core?[['auto',844],['space',844],['loaded',844]]:[['auto',1280],['auto',844],['space',844],['loaded',844],['blur',844],['portrait',844],['lease',844],['save-fail',844],['reduced',844]])){console.log('key',kind,width);await keyReveal(kind,width);}
 if(!only||only==='descent'||only==='load-fail')for(const [kind,width] of (only==='load-fail'?[['load-fail',844]]:core?[['cold',844]]:[['descent',1280],['cold',844],['loading-blur',844],['load-fail',844]])){console.log('descent',kind,width);await descent(kind,width);}
 assert.deepEqual(errors,[]);assert.equal(scores,0);await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors,productionRecordsSubmitted:scores},null,2));console.log(JSON.stringify({cases:results.length,errors,scores}));
}catch(e){if(active&&!active.isClosed()){await active.screenshot({path:join(out,'failure.png')}).catch(()=>{});await writeFile(join(out,'failure.json'),JSON.stringify({error:String(e),completed:results,overlay:await active.locator('#overlay').innerText().catch(()=>''),snapshot:await snap(active).catch(()=>null),errors,scores},null,2));}throw e;}finally{await browser.close();}
