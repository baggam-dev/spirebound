// Focused material/collision probe. Isolated storage, no ranking submissions.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5174',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/pixel-probe',r=>r.fulfill({contentType:'text/html',body:'<canvas width="960" height="540"></canvas>'}));await page.goto(base+'/pixel-probe');
 const result=await page.evaluate(async()=>{
  const {environmentMaterial}=await import('/src/rendering/environment-material.js'),{stoneFragments}=await import('/src/world/stone-shape.js'),{blocked,segmentBlocked}=await import('/src/world/terrain.js'),{drawStoneWalls}=await import('/src/rendering/stone-walls.js');
  const env=await import('/src/rendering/environment-art.js');if(!await env.environmentArtReady)throw Error('art');
  const source=document.createElement('canvas');source.width=source.height=96;const sg=source.getContext('2d');sg.fillStyle='#809080';sg.fillRect(0,0,96,96);const before=source.toDataURL(),material=environmentMaterial(source),g=material.getContext('2d'),p=g.getImageData(0,0,1,1).data;
  if(source.toDataURL()!==before||material.width>96||p[0]>=128||p[1]>=144||p[2]>=128)throw Error('material failed');
  const {newRun}=await import('/src/game/engine.js'),{encodeSave,parseSave}=await import('/src/persistence/storage.js');const s=newRun(31),r=s.floors[0][0],json=JSON.stringify(s);
  const {drawFloorMood}=await import('/src/rendering/atmosphere.js'),c=document.querySelector('canvas').getContext('2d',{willReadFrequently:true});drawFloorMood(c,s,r);
  const d=c.getImageData(0,0,960,540).data;let groups=0;
  for(let y=60;y<480;y+=2)for(let x=36;x<921;x+=2){const index=(y*960+x)*4;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)for(let k=0;k<4;k++)if(d[((y+yy)*960+x+xx)*4+k]!==d[index+k])throw Error('grid');groups++;}
  if(JSON.stringify(s)!==json)throw Error('render mutated run');const saved=JSON.parse(encodeSave(s));saved.release='0.40.0-prebeta';const old=parseSave(JSON.stringify(saved));if(old.seed!==s.seed||old.player.hp!==s.player.hp)throw Error('old save');
  const wall={type:'wall',x:180,y:120,w:180,h:120},wc=document.createElement('canvas');wc.width=960;wc.height=540;const cg=wc.getContext('2d',{willReadFrequently:true});drawStoneWalls(cg,[wall]);const pixels=cg.getImageData(0,0,960,540).data;let outside=0,missingCore=0;
  for(let y=119;y<=241;y++)for(let x=179;x<=361;x++){const painted=pixels[(y*960+x)*4+3]>128,solid=blocked(x+.5,y+.5,0,[wall]);if(painted&&!solid)outside++;if(!painted&&blocked(x+.5,y+.5,-3,[wall]))missingCore++;}
  if(outside>28||missingCore)throw Error('wall mask '+outside+'/'+missingCore);
  const start=performance.now();for(let i=0;i<5000;i++)segmentBlocked({x:100,y:125+i%110},{x:400,y:125+i%110},[wall],2);const collisionMs=performance.now()-start;
  c.drawImage(wc,0,0);return {material:{width:material.width,rgb:[...p]},grid2pxGroups:groups,wallParts:stoneFragments(wall).length,outside,missingCore,unchangedRun:true,old040Save:true,segmentCalls:5000,collisionMs};
 });assert.ok(result.outside<=28);assert.equal(result.missingCore,0);assert.deepEqual(errors,[]);await page.locator('canvas').screenshot({path:join(out,'wall-pixels.png')});await writeFile(join(out,'result.json'),JSON.stringify({base,...result,errors,productionRecordsSubmitted:0},null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
