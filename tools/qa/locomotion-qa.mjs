import assert from 'node:assert/strict';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||`http://127.0.0.1:${server.address().port}`,out=process.env.QA_OUTPUT||'docs/qa-locomotion-20261015';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:844,height:390}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/locomotion-probe',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#20272c"><canvas width="1200" height="1950"></canvas>'}));await page.goto(base+'/locomotion-probe');
  const result=await page.evaluate(async()=>{
   const names=['astral-sniper','star-knight','star-bearer','royal-guard','rift-hunter','mordo-phase1','mordo-phase2','mordo-phase3','commander-phase1','commander-phase2','slime','demon'];
   const modules=await Promise.all(names.map(n=>import(`/src/rendering/${n}-sprite.js`)));const ready=await Promise.all(modules.flatMap(m=>Object.entries(m).filter(([k])=>k.endsWith('Ready')).map(([,v])=>v)));if(!ready.every(Boolean))throw Error('Missing sprite');
   const {drawUpper}=await import('/src/rendering/upper-visuals.js'),{drawCommander}=await import('/src/rendering/commander-visuals.js'),{drawOrganicBody}=await import('/src/rendering/pixel-world.js'),{drawDemonSprite}=await import('/src/rendering/demon-sprite.js');
   const rows=[];for(const type of ['astralSniper','starKnight','starBearer','royalGuard','riftHunter'])rows.push({type});
   for(const hp of [100,50,20])rows.push({type:'boss',variant:'king',hp});for(const phase of [1,2])rows.push({type:'boss',variant:'commander',commander:{phase},hp:phase===1?100:40});
   for(const stage of [0,1,2])rows.push({type:'boss',variant:'slime',stage});rows.push({type:'minislime'});for(const part of ['hand','foot','eye','nose','mouth'])rows.push({type:'boss',variant:'demon',part});
   const canvas=document.querySelector('canvas'),c=canvas.getContext('2d'),probe=document.createElement('canvas');probe.width=220;probe.height=140;const q=probe.getContext('2d');let changed=0,unchanged=0;
   const render=(ctx,e,t,staticPose=false,reduced=false)=>{if(e.variant==='demon')drawDemonSprite(ctx,e,t,{staticPose,reduced});else if(e.variant==='commander')drawCommander(ctx,e,t,reduced,staticPose);else if(e.variant==='slime'||e.type==='minislime')drawOrganicBody(ctx,e,20,t,{}, {staticPose,reduced,actor:e});else drawUpper(ctx,e,t,reduced,staticPose);};
   for(const [row,spec] of rows.entries()){
    const e={id:row,x:100,y:100,max:100,hp:100,cd:2,...spec};const sample=(t,staticPose=false)=>{q.clearRect(0,0,220,140);q.save();q.translate(110-e.x,100-e.y);const before=JSON.stringify(e);render(q,e,t,staticPose);if(JSON.stringify(e)!==before)throw Error('Mutation '+row);q.restore();return probe.toDataURL();};
    sample(0);let last;
    for(let col=0;col<4;col++){e.x+=3;e.y+=1;const image=sample((col+1)*.1);if(last&&last!==image)changed++;last=image;c.drawImage(probe,col*280,row*100-30,220,140);}
    sample(.6);sample(.7); // Idle breathing may continue; unit tests check walking stops.
    const staticA=sample(.8,true);e.x+=3;if(sample(.9,true)!==staticA)throw Error('Static portrait walked '+row);
    e.frozen=1;const frozen=sample(1);if(sample(2)!==frozen)throw Error('Frozen actor animated '+row);unchanged++;
    c.fillStyle='#ddd';c.font='12px monospace';c.fillText(`${spec.variant||spec.type} ${spec.part||spec.stage||spec.commander?.phase||spec.hp||''}`,5,row*100+95);
   }
   if(changed<rows.length)throw Error('Not enough distinct gait samples '+changed);return {actors:rows.length,changed,frozen:unchanged,staticPortraits:true,actorUnchanged:true};
  });assert.equal(result.actors,19);await page.screenshot({path:join(out,`${mobile?'mobile':'pc'}-walk.png`),fullPage:true});console.log(JSON.stringify({mobile,...result}));await page.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({pageErrors:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
