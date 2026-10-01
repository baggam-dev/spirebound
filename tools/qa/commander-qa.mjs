import {mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173',output=resolve(process.argv[2]||'artifacts/commander');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(base);await page.locator('#bossPractice').click();if(await page.locator('#practiceBoss option[value="commander"]').count())throw Error('Hidden boss is exposed in public practice menu');
  const state=await page.evaluate(async()=>{const {createPractice}=await import('/src/game/boss-practice.js'),{currentRoom}=await import('/src/game/engine.js'),{updateCommander}=await import('/src/combat/commander.js'),{drawCommander,drawCommanderGround}=await import('/src/rendering/commander-visuals.js');const s=createPractice('commander','frost',98),r=currentRoom(s),e=r.enemies[0],c=document.createElement('canvas').getContext('2d');c.canvas.width=960;c.canvas.height=540;const snapshots=[];for(const phase of [1,2]){e.hp=phase===1?e.max:e.max/2;e.commander.phase=phase;e.commander.volleyClock=0;e.commander.rainClock=20;updateCommander(e,s.player,r,.01,s.projectiles,()=>{});drawCommanderGround(c,e,1);drawCommander(c,e,1);snapshots.push(c.getImageData(0,0,960,540).data.some(v=>v!==0));}e.commander.volley=undefined;e.commander.snipe={aim:1.1,time:.36};drawCommanderGround(c,e,1);drawCommander(c,e,1);snapshots.push(c.getImageData(0,0,960,540).data.some(v=>v!==0));return {floors:s.floors.length,ranking:s.ranking??null,variant:e.variant,snapshots};});
  if(state.floors!==10||state.ranking!==null||state.variant!=='commander'||!state.snapshots.every(Boolean))throw Error(JSON.stringify(state));
  await page.evaluate(async()=>{const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(37,{campaign:'expanded'});s.floor=8;s.room=s.floors[8].findIndex(r=>r.type==='boss');s.player.x=480;s.player.y=115;s.tutorialComplete=true;localStorage.setItem(SAVE_KEY,encodeSave(s));});
  await page.reload();await page.locator('#continue').click();await page.waitForFunction(()=>document.querySelector('#floor')?.textContent?.startsWith('9층'));await page.locator('#interact').getByText('악마 군단장에게 도전',{exact:false}).waitFor();await page.locator('#interact').click();await page.screenshot({path:join(output,`${width}x${height}-commander.png`)});
  const challenged=await page.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY)),r=s.floors[8][s.room];return {pending:r.commanderPending,variant:r.enemies[0]?.variant,ranking:s.ranking??null};});
  if(challenged.pending||challenged.variant!=='commander'||challenged.ranking?.seasonId!=='ASCENT-5'||challenged.ranking.online)throw Error(JSON.stringify(challenged));
  if(!mobile){
   const gallery=await context.newPage();
   await gallery.route('**/commander-gallery',route=>route.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#141c23"><canvas width="720" height="360"></canvas></body>'}));
   await gallery.goto(`${base}/commander-gallery`);
   const comparison=await gallery.evaluate(async()=>{
    const {drawCommander}=await import('/src/rendering/commander-visuals.js');
    const c=document.querySelector('canvas').getContext('2d'),hashes=[];
    for(const [i,phase] of [1,2].entries()){
     c.save();c.translate(190+i*340,230);c.scale(3,3);
     drawCommander(c,{x:0,y:0,variant:'commander',commander:{phase}},1);c.restore();
     c.fillStyle='#c8d9de';c.font='18px monospace';c.fillText(`PHASE ${phase}`,110+i*340,60);
     const bytes=c.getImageData(70+i*340,70,240,240).data;let hash=0,opaque=0;for(let j=0;j<bytes.length;j+=4){hash=(Math.imul(hash,31)+bytes[j]+bytes[j+1]+bytes[j+2]+bytes[j+3])|0;if(bytes[j+3]>0)opaque++;}hashes.push({hash,opaque});
    }
    return {visible:hashes.every(item=>item.opaque>500),different:hashes[0].hash!==hashes[1].hash};
   });
   if(!comparison.visible||!comparison.different)throw Error(`Commander phase gallery invalid: ${JSON.stringify(comparison)}`);
   await gallery.locator('canvas').screenshot({path:join(output,'commander-phases.png')});await gallery.close();
  }
  await context.close();
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({viewports:2,hiddenPractice:true,challengeAndSave:true,hiddenExpanded:true,renderedPhases:2,phaseGallery:true,pageErrors:0}));
}finally{await browser.close();}
