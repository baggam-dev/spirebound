import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));
if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true});
const types=['charger','scatter','ricochet','laser','brute'],errors=[];
await mkdir('docs/qa-remaining-walk',{recursive:true});
try {
 const page=await browser.newPage({viewport:{width:1000,height:500}});page.on('pageerror',e=>errors.push(e.message));
 const probe=async p=>{await p.route('**/walk-probe',r=>r.fulfill({contentType:'text/html',body:'<canvas width="1000" height="500"></canvas>'}));await p.goto(base+'/walk-probe');};
 await probe(page);
 const result=await page.evaluate(async types=>{
  const g=await import('/src/rendering/grunt-sprite.js');await g.gruntSpriteReady;
  const c=document.querySelector('canvas').getContext('2d'),results=[];
  for(const [row,type] of types.entries()){
   const m=await import(`/src/rendering/${type}-walk.js`);if(!await m[type+'WalkReady'])throw Error(type+' load');
   const e={type,x:0,y:0},before=JSON.stringify(e),images=[],attacks=[];
   const attack=type==='charger'?{chargeAngle:0}:type==='scatter'?{attackPhase:'warning',patternAim:0}:type==='brute'?{phase:'windup'}:{phase:'aim',aim:0};
   const local=document.createElement('canvas');local.width=160;local.height=160;const q=local.getContext('2d');q.translate(80,80);
   for(let i=0;i<4;i++){
    const p={moving:true,face:1,walk:i*Math.PI/2};q.clearRect(-80,-80,160,160);g.drawGruntSprite(q,e,p,null);images.push(local.toDataURL());c.drawImage(local,i*200,row*100-30);
    q.clearRect(-80,-80,160,160);g.drawGruntSprite(q,{...e,...attack},p,null);attacks.push(local.toDataURL());
   }
   results.push({type,distinct:new Set(images).size,attackStable:new Set(attacks).size===1,idle:m['draw'+type[0].toUpperCase()+type.slice(1)+'Walk'](q,{moving:false})===false,unchanged:before===JSON.stringify(e)});
  }
  const b=await import('/src/combat/brute.js'),e={type:'brute',x:80,y:80};b.drawEnemyDetails(c,e);e.x+=3;const before=JSON.stringify(e);b.drawEnemyDetails(c,e);if(before!==JSON.stringify(e))throw Error('Brute actor mutated');
  return results;
 },types);
 for(const r of result){assert.equal(r.distinct,4,r.type);assert.ok(r.attackStable&&r.idle&&r.unchanged,r.type);}
 await page.screenshot({path:'docs/qa-remaining-walk/frames.png'});
 for(const type of types){const p=await browser.newPage();await p.route(`**/${type}-walk-atlas.png`,r=>r.abort());await probe(p);assert.equal(await p.evaluate(async type=>{const m=await import(`/src/rendering/${type}-walk.js`),g=await import('/src/rendering/grunt-sprite.js');if(await m[type+'WalkReady'])throw Error('Failed load accepted');await g.gruntSpriteReady;const c=document.querySelector('canvas').getContext('2d');c.translate(80,80);g.drawGruntSprite(c,{type,x:0,y:0},{moving:true,face:1,walk:0},null);return c.getImageData(0,0,160,160).data.some((n,i)=>i%4===3&&n);},type),true);await p.close();}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result,fallbacks:5,pageErrors:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
