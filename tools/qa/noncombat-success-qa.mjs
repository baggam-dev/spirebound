import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5174',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
try{
 for(const scene of ['good','bad','blood','supply','trial','cancel']){
  console.log(scene);const ctx=await browser.newContext(),p=await ctx.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));
  // Observe the real success call without changing its effect, inputs, or saved state.
  await p.route('**/src/rendering/interaction-visuals.js',async route=>{const response=await route.fetch(),body=(await response.text()).replace('export function emitInteraction(s,kind,room,detail={}){','export function emitInteraction(s,kind,room,detail={}){ (window.__interactionCalls??=[]).push({kind,...detail});');await route.fulfill({response,body});});
  await p.goto(base,{waitUntil:'domcontentloaded'});await p.evaluate(async scene=>{
   const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(31),shrine=['good','bad'].includes(scene);let found=false;
   for(let f=0;f<s.floors.length&&!found;f++){const i=s.floors[f].findIndex(r=>r.type===(shrine?'shrine':'event'));if(i>=0){s.floor=f;s.room=i;found=true;}}if(!found)throw Error('no fixture room');
   const r=s.floors[s.floor][s.room];r.enemies=[];r.hasChest=false;r.used=false;if(shrine){r.shrineState='choice';r.incantations=['might','frailty'];}const {objectPoint}=await import('/src/world/object-positions.js');s.player.x=objectPoint(r).x;s.player.y=objectPoint(r).y+35;s.player.hp=5;s.player.relics=['magnet'];s.tutorialComplete=true;s.player.mainSkill='fire';s.player.fire=1;s.pendingLevels=0;s.levelQueue=[];s.attack=999;s.invulnerable=999;localStorage.setItem(SAVE_KEY,encodeSave(s));
  },scene);await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.evaluate(async()=>{if(!await (await import('/src/rendering/hero-sprite.js')).heroSpriteReady)throw Error('hero');});
  if(['good','bad'].includes(scene)){if(!await p.locator('#hex0').isVisible())await p.locator('#interact').click();await p.locator(scene==='good'?'#hex0':'#hex1').click();}
  else{console.log('interact',await p.locator('#interact').textContent());await p.locator('#interact').click();if(scene==='cancel'){await p.locator('#event1').click();await p.locator('#cancelTrade').click();await p.locator('#leaveEvent').click();}else{await p.locator('#event'+({blood:0,supply:1,trial:2}[scene])).click();if(scene==='supply')await p.locator('#tradeRelic0').click();}}
  await p.waitForTimeout(80);await p.keyboard.press('Escape');const calls=await p.evaluate(()=>window.__interactionCalls||[]);const relevant=calls.filter(c=>['shrine','pact'].includes(c.kind));assert.equal(relevant.length,scene==='cancel'?0:1);if(scene==='good'||scene==='bad')assert.equal(relevant[0].good,scene==='good');else if(scene!=='cancel')assert.equal(relevant[0].choice,scene);
  const saved=await p.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY)),r=s.floors[s.floor][s.room];return {used:r.used,hp:s.player.hp,event:r.eventChoice,incantation:r.incantationChoice,trial:r.trialState};});assert.equal(saved.used,scene!=='cancel');if(scene==='blood')assert.equal(saved.hp,3);if(scene==='trial')assert.equal(saved.trial,'active');
  await writeFile(join(out,scene+'.png'),Buffer.from(await p.locator('#game').evaluate(c=>c.toDataURL().split(',')[1]),'base64'));results.push({scene,relevant,saved});await ctx.close();
 }
 assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors,observerOnlyInstrumentation:true},null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
