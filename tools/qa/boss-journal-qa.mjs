import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),reports=[],errors=[];
const hook=`\nglobalThis.__journalQA={async load(run){await lease.acquire();renderTitleScene=null;s=run;resetTransient();enterRoom(s);await prepareFloorAssets(s.floor,floorAssetOptions(s));resume();paused=true;},open:journalPanel};`;
try{for(const width of [1280,844]){
 const cx=await browser.newContext({viewport:{width,height:width===1280?800:390},isMobile:width===844,hasTouch:width===844}),p=await cx.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/src/game/game.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+hook});});
 await p.goto(process.env.BASE_URL||'http://127.0.0.1:5173');await p.waitForFunction(()=>!!globalThis.__journalQA);
 await p.evaluate(async()=>{
  const {newRun}=await import('/src/game/engine.js'),{challengeKing}=await import('/src/combat/upper-floors.js'),growth=await import('/src/progression/growth-records.js'),{usePotion}=await import('/src/combat/abilities.js'),{encodeSave,parseSave}=await import('/src/persistence/storage.js');
  let s=newRun(78,{campaign:'expanded',bossLayoutVersion:1});s.floor=9;s.room=s.floors[9].findIndex(v=>v.type==='boss');challengeKing(s);const room=s.floors[9][s.room];s.player.hp=3;s.player.potions=2;usePotion(s);growth.tickBossRecord(s,room,2);growth.recordBossResource(s,'damageTaken',1);room.enemies[0].kingStage=3;growth.tickBossRecord(s,room,3);s=parseSave(encodeSave(s));await __journalQA.load(s);__journalQA.open();
 });
 const overlay=p.locator('#overlay');await overlay.getByText('교전 첫 관찰',{exact:false}).first().waitFor();assert.ok((await overlay.innerText()).includes('3단계 각성'));
 const overflow=await overlay.evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth}));assert.ok(overflow.scroll<=overflow.width+2,JSON.stringify(overflow));
 await p.screenshot({path:join(out,`journal-${width}.png`)});reports.push({width,overflow,savedFixture:true,actualDevice:false});await cx.close();
}assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({reports,errors},null,2));}finally{await browser.close();}
