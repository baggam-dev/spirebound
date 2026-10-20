import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href),base=process.env.BASE_URL||'http://127.0.0.1:5173',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];
try{for(const width of [1280,844])for(const kind of ['core','prism-death']){
 const c=await browser.newContext({viewport:{width,height:width===1280?800:390},isMobile:width===844,hasTouch:width===844}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(20000);
 await p.addInitScript(()=>{window.qaSpeech=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(/이 탑에서|나갈 수|왕실 봉인|유지…/.test(text)&&!window.qaSpeech.includes(text))window.qaSpeech.push(text);return original.call(this,text,...args);};});
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:120000});await p.locator('#start').waitFor();
 await p.evaluate(async kind=>{
  const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{challengeDemon,advanceDemonPhase}=await import('/src/combat/demon.js');
  const s=newRun(31,{campaign:'expanded'});s.tutorialComplete=true;s.player.mainSkill='frost';s.player.frost=1;s.floor=kind==='core'?9:3;s.room=s.floors[s.floor].findIndex(r=>r.type==='boss');s.player.x=480;s.player.y=350;const r=s.floors[s.floor][s.room];r.seen=true;
  if(kind==='core'){challengeDemon(s);r.enemies.forEach(e=>e.hp=0);advanceDemonPhase(r,s.projectiles);r.enemies.forEach(e=>e.hp=0);}else r.enemies.forEach(e=>e.hp=0);
  localStorage.setItem(SAVE_KEY,encodeSave(s));
 },kind);
 await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();
 if(kind==='core'){await p.waitForFunction(()=>window.qaSpeech.some(s=>s.includes('이 탑에서'))).catch(async error=>{await p.screenshot({path:join(out,'failure.png')});await writeFile(join(out,'failure.json'),JSON.stringify({overlay:await p.locator('#overlay').innerText(),errors,speech:await p.evaluate(()=>window.qaSpeech)},null,2));throw error;});}
 else{await p.locator('#dialogueNext').waitFor();assert.match(await p.locator('.dialogue-live').textContent(),/왕실 봉인/);}
 await p.screenshot({path:join(out,`${kind}-${width}.png`)});results.push({kind,width,drawn:await p.evaluate(()=>window.qaSpeech)});
 await p.keyboard.press('Escape');if(kind!=='core'){await p.keyboard.press('Escape');await p.locator('#resume').waitFor();}
 await c.close();
}assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors},null,2));console.log(JSON.stringify({results,errors}));}finally{await browser.close();}
