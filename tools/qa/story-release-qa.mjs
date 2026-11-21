import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];let scores=0;
try{for(const width of [1280,844]){
 const context=await browser.newContext({viewport:{width,height:width===1280?720:390},hasTouch:width===844,isMobile:width===844,ignoreHTTPSErrors:true});
 const p=await context.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/api/session',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"QA offline"}'}));
 await p.route('**/api/records',r=>{if(r.request().method()==='POST'){scores++;return r.abort();}return r.continue();});
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#start').waitFor();
 await p.addInitScript(()=>{window.qaWords=new Set();const fill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.qaWords.add(text);const result=fill.call(this,text,...args);if(!window.qaSpeechFrame&&/내가 있는 한|이 뒤는 내가|동료에게는/.test(text)){const canvas=this.canvas;queueMicrotask(()=>{if(!window.qaSpeechFrame)window.qaSpeechFrame=canvas.toDataURL();});}return result;};});
 await p.evaluate(async()=>{
  const {newRun}=await import('/src/game/engine.js'),{RunStore}=await import('/src/persistence/storage.js');
  const s=newRun(45,{campaign:'expanded',bossLayoutVersion:1});s.floor=2;s.room=s.floors[2].findIndex(r=>r.type==='normal');s.tutorialComplete=true;
  Object.assign(s.player,{mainSkill:'precision',precision:1,hp:10,max:10,x:700,y:420});s.invulnerable=999;s.attack=999;
  const r=s.floors[2][s.room];r.seen=true;r.deployed=true;r.obstacles=[];r.hazards=[];r.blasts=[];r.fireZones=[];
  r.enemies=[{id:9001,type:'chaser',elite:'guardian',hp:500,max:500,x:180,y:200,cd:30,tier:0,eliteCooldown:30}];
  const result=new RunStore(localStorage).write(s);if(!result.ok)throw Error(result.error);
 });
 await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.waitForFunction(()=>!document.getElementById('overlay').children.length);
 const words=await p.evaluate(async()=>Object.values((await import('/src/ui/enemy-chatter-data.js')).ENEMY_CHATTER).flat());
 try{await p.waitForFunction(words=>words.some(word=>window.qaWords.has(word)),words,{timeout:25000});}catch(error){
  await p.screenshot({path:join(out,`integrated-failure-${width}.png`)});
  await writeFile(join(out,`integrated-failure-${width}.json`),JSON.stringify(await p.evaluate(async()=>{const {RunStore}=await import('/src/persistence/storage.js'),s=new RunStore(localStorage).read().run;return {words:[...window.qaWords],overlay:document.querySelector('#overlay').innerText,run:s?{elapsed:s.elapsed,key:s.key,practice:s.practice,room:s.floors[s.floor][s.room]}:null};}),null,2));throw error;
 }
 const frame=await p.evaluate(()=>window.qaSpeechFrame);assert.ok(frame,'integrated speech frame captured');await writeFile(join(out,`integrated-chatter-frame-${width}.png`),Buffer.from(frame.split(',')[1],'base64'));
 await p.screenshot({path:join(out,`integrated-chatter-${width}.png`)});await p.locator('#pause').click();await p.locator('#resume').waitFor();
 const story=await p.evaluate(async()=>{
  const {newRun}=await import('/src/game/engine.js'),{journalMarkup,resultOverviewMarkup}=await import('/src/ui/ui.js'),{ownedRelicMarkup}=await import('/src/ui/relic-ui.js');
  const s=newRun(45,{campaign:'expanded',bossLayoutVersion:1});s.player.relics=['hawkCharm'];s.bestiary={pursuer:{kills:1,traits:[]},demon:{kills:1,traits:[]}};
  const unseen=journalMarkup(s);if(unseen.includes('<b>10층</b>'))throw Error('Future floor story leaked');
  const overlay=document.getElementById('overlay');overlay.innerHTML='<div class="panel">'+journalMarkup(s)+ownedRelicMarkup(s)+'</div>';
  return {futureHidden:true,remnant:overlay.textContent.includes('봉인의 거상'),relic:overlay.textContent.includes('유물에 남은 이야기')};
 });assert.ok(story.remnant&&story.relic);
 await p.getByText('탑에서 읽은 흔적',{exact:true}).click();await p.getByText('유물에 남은 이야기',{exact:true}).click();
 await p.screenshot({path:join(out,`journal-${width}.png`)});
 await p.evaluate(async()=>{const {newRun}=await import('/src/game/engine.js'),{resultOverviewMarkup}=await import('/src/ui/ui.js');const s=newRun(45,{campaign:'expanded',bossLayoutVersion:1});s.status='won';document.getElementById('overlay').innerHTML='<div class="panel"><div class="result-screen result-win">'+resultOverviewMarkup(s)+'</div></div>';});
 await p.getByText('문밖의 아침',{exact:true}).click();assert.match(await p.locator('#overlay').innerText(),/왕이 붙잡던 마지막 밤/);await p.screenshot({path:join(out,`epilogue-${width}.png`)});
 await p.evaluate(async()=>{const {prepareEntranceArt,entranceMarkup,createEntranceRenderer}=await import('/src/ui/entrance-scene.js');const art=await prepareEntranceArt();if(!art)throw Error('Entrance art unavailable');document.getElementById('overlay').innerHTML='<div class="panel">'+entranceMarkup()+'</div>';window.qaEntrance=createEntranceRenderer(document.querySelector('.entrance-scene'),art);window.qaEntrance(6.65);});
 await p.screenshot({path:join(out,`gate-closed-${width}.png`)});
 const chatter=await p.evaluate(async width=>{
  const {createEnemyChatter}=await import('/src/rendering/enemy-chatter.js'),{drawPursuerSprite,pursuerSpriteReady}=await import('/src/rendering/pursuer-sprite.js');
  (await import('/src/rendering/asset-requests.js')).activateAssetFiles(['pursuer-atlas-v1.png']);if(!await pursuerSpriteReady)throw Error('Pursuer atlas unavailable');
  const actor={type:'pursuer',hp:100,max:100,x:370,y:350},s={seed:45,status:'playing',key:true,bossLayoutVersion:1,floor:0,room:0,player:{x:600,y:450},floors:[[{enemies:[actor]}]]},before=JSON.stringify(s),ch=createEnemyChatter(s);
  const host=document.getElementById('overlay');host.innerHTML='<div style="position:fixed;inset:0;display:grid;place-items:center;background:#151d26"><canvas id="qaChatter" width="960" height="540" style="width:min(100vw,177.77vh);height:auto"></canvas></div>';
  const canvas=document.getElementById('qaChatter'),c=canvas.getContext('2d'),fill=c.fillText.bind(c);let lines=[];c.fillText=(text,...args)=>{lines.push(text);fill(text,...args);};
  let appeared=false;for(let n=0;n<200;n++){ch.tick(.1);c.clearRect(0,0,960,540);drawPursuerSprite(c,actor,0,true,true);lines=[];ch.draw(c,{compact:width===844});if(lines.length){appeared=true;break;}}
  if(!appeared)throw Error('Pursuer never spoke');const visible=lines[0];actor.attackPhase='warning';lines=[];ch.tick(.1);ch.draw(c);const warningHidden=lines.length===0;
  actor.attackPhase='recover';ch.tick(.1);c.clearRect(0,0,960,540);drawPursuerSprite(c,actor,0,true,true);lines=[];ch.draw(c,{compact:width===844});const recovered=lines.length>0;delete actor.attackPhase;
  if(JSON.stringify(s)!==before)throw Error('Chatter mutated combat state');return {visible,warningHidden,recovered,stateUnchanged:true};
 },width);assert.ok(chatter.warningHidden&&chatter.recovered);await p.screenshot({path:join(out,`chatter-${width}.png`)});
 results.push({width,integratedChatter:true,...story,chatter});await context.close();
}assert.deepEqual(errors,[]);assert.equal(scores,0);await writeFile(join(out,'result.json'),JSON.stringify({results,errors,scoreSubmissions:scores},null,2));console.log(JSON.stringify({cases:results.length,errors,scoreSubmissions:scores}));
}finally{await browser.close();}
