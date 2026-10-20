import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {pathToFileURL} from 'node:url';
import {newRun} from '../../src/game/engine.js';import {encodeSave,SAVE_KEY} from '../../src/persistence/storage.js';import {objectPoint} from '../../src/world/object-positions.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href),base=process.env.BASE_URL||'http://127.0.0.1:5173',out=process.argv[2];await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],checks=[];
try{for(const kind of ['chest','rare']){
 const s=newRun(31,{campaign:'expanded'});s.player.mainSkill='frost';s.player.frost=1;s.player.hp=s.player.max=30;s.tutorialComplete=true;
 if(kind==='chest'){s.room=s.floors[0].findIndex(r=>r.type==='treasure');const r=s.floors[0][s.room];r.enemies=[];r.obstacles=[];r.chestReward={id:'boss',boss:'prism'};Object.assign(s.player,objectPoint(r));}
 else{s.floor=2;s.room=0;s.floors[2][0].enemies=[{id:0,type:'royalGuard',hp:150,max:150,x:650,y:250,tier:2,cd:5,balanceVersion:1}];}
 const c=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),p=await c.newPage();p.setDefaultTimeout(360000);p.on('pageerror',e=>errors.push(e.message));const files=[];p.on('request',r=>{if(r.url().endsWith('.png'))files.push(new URL(r.url()).pathname.split('/').at(-1));});await c.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:SAVE_KEY,value:encodeSave(s)});await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.waitForFunction(()=>!document.querySelector('#overlay').children.length);
 if(kind==='chest'){
  assert.equal(files.includes('prism-reference-atlas.png'),false);let release;const gate=new Promise(r=>release=r);await p.route('**/prism-reference-atlas.png',async route=>{await gate;await route.continue();});await p.locator('#interact:not([hidden])').click();await p.locator('.floor-loading-panel').waitFor();await p.screenshot({path:join(out,'chest-loading.png')});release();await p.waitForFunction(()=>!document.querySelector('#overlay').children.length);
  assert.equal(await p.evaluate(async()=>{const a=await import('/src/rendering/prism-sprite.js'),b=await import('/src/rendering/prism-presentation-art.js');return a.prismSpriteState().ready&&b.prismPresentationArtState().ready;}),true);
 }else assert.equal(await p.evaluate(async()=>{const m=await import('/src/rendering/royal-guard-sprite.js');return m.royalGuardSpriteState().ready;}),true);
 await p.screenshot({path:join(out,kind+'.png')});checks.push({kind,ready:true});await c.close();
 }assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({base,checks,errors,scoreSubmissions:0},null,2));console.log(JSON.stringify({checks,errors}));
}finally{await browser.close();}
