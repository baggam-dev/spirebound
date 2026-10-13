import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'msedge',headless:true});await mkdir('docs/qa-chaser-slash',{recursive:true});
try{
 const probe=async p=>{await p.route('**/slash-probe',r=>r.fulfill({contentType:'text/html',body:'<canvas width="800" height="200"></canvas>'}));await p.goto(base+'/slash-probe');};
 const page=await browser.newPage({viewport:{width:800,height:200}});await probe(page);
 const result=await page.evaluate(async()=>{const g=await import('/src/rendering/grunt-sprite.js'),a=await import('/src/rendering/chaser-slash.js'),walk=await import('/src/rendering/chaser-walk.js');await Promise.all([g.gruntSpriteReady,a.chaserSlashReady,walk.chaserWalkReady]);const c=document.querySelector('canvas').getContext('2d'),images=[];for(const [i,state] of [{},{chaserWindup:.08,chaserAim:0},{chaserStrike:.12,chaserAim:0},{chaserStrike:.12,chaserAim:Math.PI}].entries()){const e={type:'chaser',x:0,y:0,...state},before=JSON.stringify(e),p={face:1,moving:false};const local=document.createElement('canvas');local.width=160;local.height=160;const q=local.getContext('2d');q.translate(80,100);g.drawGruntSprite(q,e,p,null);if(before!==JSON.stringify(e))throw Error('Actor changed');images.push(local.toDataURL());c.drawImage(local,i*200,0);}return {distinct:new Set(images).size};});assert.equal(result.distinct,4);await page.screenshot({path:'docs/qa-chaser-slash/phases.png'});
 const failed=await browser.newPage();await failed.route('**/chaser-slash-atlas.png',r=>r.abort());await probe(failed);assert.equal(await failed.evaluate(async()=>{const g=await import('/src/rendering/grunt-sprite.js'),a=await import('/src/rendering/chaser-slash.js');if(await a.chaserSlashReady)throw Error('Missing failure');await g.gruntSpriteReady;const c=document.querySelector('canvas').getContext('2d');c.translate(80,100);g.drawGruntSprite(c,{type:'chaser',chaserStrike:.12,chaserAim:0},{face:1,moving:false},null);return c.getImageData(0,0,160,160).data.some((n,i)=>i%4===3&&n);}),true);console.log(JSON.stringify({result,fallback:true,stateUnchanged:true}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
