import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
const output=process.env.QA_OUTPUT||'docs/qa-renewal-20261014';await mkdir(output,{recursive:true});
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:844,height:390}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/renewal-probe',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#171b21"><canvas width="1280" height="800" style="width:100%;height:auto"></canvas>'}));await page.goto(base+'/renewal-probe');
  const result=await page.evaluate(async()=>{
   const names=['flower','prism','slime','astral-sniper','gravity-mage','star-knight','star-bearer','royal-guard','pulse-turret','rift-hunter','mordo-phase1','mordo-phase2','mordo-phase3'],modules=await Promise.all(names.map(n=>import('/src/rendering/'+n+'-sprite.js'))),aura=await import('/src/rendering/shadow-aura.js');
   const ready=await Promise.all([...modules.flatMap(m=>Object.entries(m).filter(([k])=>k.endsWith('Ready')).map(([,v])=>v)),aura.shadowAuraReady]);if(!ready.every(Boolean))throw Error('Not all sprites ready: '+JSON.stringify(ready));
   const {drawUpper}=await import('/src/rendering/upper-visuals.js'),{drawPoisonEnemy}=await import('/src/combat/poison.js'),{drawPrism}=await import('/src/combat/prism.js'),c=document.querySelector('canvas').getContext('2d'),states=[];
   c.fillStyle='#252b31';c.fillRect(0,0,1280,800);
   const actors=['flower','prism','slime','minislime','astralSniper','gravityMage','starKnight','starBearer','royalGuard','pulseTurret','riftHunter','king1','king2','king3'];
   for(const [i,type] of actors.entries())for(let pose=0;pose<3;pose++){
    const x=100+(i%7)*180,y=140+Math.floor(i/7)*380+pose*100,e={id:i,x,y,type,hp:100,max:100};if(type==='prism'||type==='slime'){e.type='boss';e.variant=type;e.stage=pose;}
    if(type.startsWith('king')){e.type='boss';e.variant='king';e.hp=[100,50,25][Number(type.at(-1))-1];}
    if(pose){e.darkAttack={kind:'slash',aim:pose===2?Math.PI:0,time:.3,x,y};e.prismPhase='warning';}const before=JSON.stringify(e);
    if(type==='prism')drawPrism(c,e,[],[],1);else if(['flower','slime','minislime'].includes(type))drawPoisonEnemy(c,e,1,{hazards:pose?[{owner:i,phase:'warning'}]:[]});else drawUpper(c,e,1,false);
    if(before!==JSON.stringify(e))throw Error('Actor mutated '+type);const pixels=c.getImageData(x-85,y-100,170,135).data;if(!pixels.some((v,j)=>j%4===0&&v!==37))throw Error('Empty actor '+type);
    states.push(type+':'+pose);c.fillStyle='#ddd';c.font='10px monospace';c.fillText(type+' '+pose,x-60,y+42);
   }
   const local=document.createElement('canvas');local.width=200;local.height=200;const q=local.getContext('2d'),e={id:42,x:100,y:125,type:'riftHunter'},before=JSON.stringify(e);
   const render=t=>{q.clearRect(0,0,200,200);aura.drawShadowAura(q,e,t);return local.toDataURL();};if(render(0)===render(.7))throw Error('Aura did not change');e.frozen=1;if(render(0)!==render(.7))throw Error('Frozen aura moved');delete e.frozen;if(JSON.stringify(e)!==before)throw Error('Aura mutated actor');
   return {ready:ready.length,states:states.length,actorUnchanged:true,auraAnimated:true,frozenAura:true};
  });assert.equal(result.states,42);await page.screenshot({path:join(output,`${mobile?'mobile':'pc'}.png`)});console.log(JSON.stringify({mobile,...result}));await page.close();
 }
 const failed=await browser.newPage();await failed.route('**/*-atlas.png',r=>r.abort());await failed.route('**/fallback-probe',r=>r.fulfill({contentType:'text/html',body:'<canvas width="800" height="300"></canvas>'}));await failed.goto(base+'/fallback-probe');
 const fallback=await failed.evaluate(async()=>{const {drawUpper}=await import('/src/rendering/upper-visuals.js'),{mordoPhase3SpriteReady}=await import('/src/rendering/mordo-phase3-sprite.js'),{shadowAuraReady}=await import('/src/rendering/shadow-aura.js');if(await mordoPhase3SpriteReady||await shadowAuraReady)throw Error('Failure did not resolve false');const c=document.querySelector('canvas').getContext('2d');for(const [i,type] of ['royalGuard','pulseTurret','riftHunter','boss'].entries()){const e={type,x:100+i*180,y:150,hp:25,max:100};if(type==='boss')e.variant='king';const before=JSON.stringify(e);drawUpper(c,e);if(before!==JSON.stringify(e))throw Error('Fallback mutation');}return c.getImageData(0,0,800,300).data.some((v,i)=>i%4===3&&v>0);});assert.equal(fallback,true);assert.deepEqual(errors,[]);console.log(JSON.stringify({fallback:true,pageErrors:0,productionRecordsSubmitted:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
