import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5173',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];
try{
 for(const [width,height,mobile] of [[1280,589,false],[844,390,true],[740,360,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),p=await context.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#start').waitFor();
  await p.evaluate(async()=>{await Promise.all(['title-background-v1.png','title-logo-v1.png','title-hero-idle-v1.png','title-branch-v1.png'].map(async name=>{const im=new Image();im.src='/assets/images/'+name;await im.decode();}));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await p.waitForTimeout(80);await p.screenshot({path:join(out,`title-${width}.png`)});
  const floors=await p.evaluate(async()=>{const m=await import('/src/rendering/floor-assets.js');const a=[];for(let floor=0;floor<10;floor++){await m.prepareFloorAssets(floor);a.push(m.floorAssetsLoaded(floor));}return a;});assert.deepEqual(floors,Array(10).fill(true));
  // Enter through a real doorway so first-entry arrival runs rather than a pre-seen save.
  await p.evaluate(async()=>{const {newRun,neighbor}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{doorCenter}=await import('/src/world/doors.js');
   const s=newRun(31,{campaign:'expanded'});s.floor=1;s.player.mainSkill='frost';s.player.frost=1;s.player.hp=s.player.max=30;s.tutorialComplete=true;
   const b=s.floors[1].findIndex(r=>r.type==='boss');let source,dir;
   for(let i=0;i<s.floors[1].length;i++)for(let d=0;d<4;d++)if(neighbor(s,d,i)===b){source=i;dir=d;}
   s.room=source;const r=s.floors[1][source];r.enemies=[];r.seen=true;r.used=true;
   const point=doorCenter(r,dir);s.player.x=dir===1?922:dir===3?38:point;s.player.y=dir===0?56:dir===2?484:point;
   localStorage.setItem(SAVE_KEY,encodeSave(s));localStorage.setItem('feedbackQA-dir',String(dir));
  });await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.waitForFunction(()=>!document.querySelector('#overlay').children.length);
  const map=await p.locator('#mobileMinimap').boundingBox();assert.ok(map.width>=(mobile?120:140));
  const dir=Number(await p.evaluate(()=>localStorage.getItem('feedbackQA-dir'))),key=['w','d','s','a'][dir];await p.keyboard.down(key);await p.waitForTimeout(220);await p.keyboard.up(key);
  await p.screenshot({path:join(out,`arrival-${width}.png`)});assert.equal(await p.locator('#dialogueNext').count(),0);
  await p.waitForTimeout(1100);await p.screenshot({path:join(out,`warden-${width}.png`)});
  const speech=await p.evaluate(()=>{const c=document.getElementById('game').getContext('2d');return {map:document.getElementById('mobileMinimap').width,canvas:!!c};});assert.ok(speech.canvas);
  // Real draft markup with the real rarity data, without changing run state.
  await p.evaluate(async()=>{const {draftMarkup,mountDraft}=await import('/src/ui/skill-draft.js'),{skills}=await import('/src/progression/progression.js'),{newRun}=await import('/src/game/engine.js');const s=newRun(31);s.player.mainSkill='frost';s.player.frost=1;
   const selected=['normal','rare','unique'].map(grade=>skills.find(k=>k.grade===grade));const overlay=document.getElementById('overlay');overlay.innerHTML='<div class="panel">'+draftMarkup(s,selected)+'</div>';mountDraft(overlay.firstChild);
  });await p.screenshot({path:join(out,`draft-${width}.png`)});results.push({width,height,map,floors});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors,scoreSubmissions:0},null,2));console.log(JSON.stringify({viewports:results.length,all10FloorAssets:true,errors}));
}finally{await browser.close();}
