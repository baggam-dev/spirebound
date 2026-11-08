// Real Canvas probes + same-scene old/current render benchmark. No ranking writes.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2],compare=process.argv.includes('--compare');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];let scores=0;
const files=['arrow-impact-visuals','element-hit-visuals','skill-burst-art','ground-visuals','enemy-attack-vfx','skill-visuals','skill-overhaul-effects','interaction-visuals','xp-shards','frost-aura'];
try{
 for(const baseline of (compare?[true,false]:[false]))for(const width of [1280,844])for(const reduced of [false,true]){
  const cx=await browser.newContext({viewport:{width,height:width===1280?1000:700},isMobile:width<1000,hasTouch:width<1000}),p=await cx.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/records'))scores++;});
  if(baseline)for(const file of files){const source=execFileSync('git',['show',`f04a640:src/rendering/${file}.js`],{encoding:'utf8'});await p.route(`**/src/rendering/${file}.js`,r=>r.fulfill({contentType:'text/javascript',body:source}));}
  await p.route('**/effects-preview',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#101519;color:#eee"><canvas id="gallery" width="960" height="900" style="width:100%;max-width:960px;display:block;margin:auto"></canvas></body>'}));
  await p.goto(base+'/effects-preview');
  const report=await p.evaluate(async({reduced,baseline})=>{
   const a=await import('/src/rendering/arrow-impact-visuals.js'),el=await import('/src/rendering/element-hit-visuals.js'),bl=await import('/src/rendering/skill-burst-art.js'),g=await import('/src/rendering/ground-visuals.js'),enemy=await import('/src/rendering/enemy-attack-vfx.js'),trail=await import('/src/rendering/skill-visuals.js'),over=await import('/src/rendering/skill-overhaul-effects.js'),xp=await import('/src/rendering/xp-shards.js'),inter=await import('/src/rendering/interaction-visuals.js');
   const canvas=document.querySelector('canvas'),c=canvas.getContext('2d'),probe=document.createElement('canvas');probe.width=960;probe.height=540;const q=probe.getContext('2d',{willReadFrequently:true});
   const check=(ok,msg)=>{if(!ok)throw Error(msg);},snapshot=()=>JSON.stringify([q.globalAlpha,q.getTransform().toString(),q.getLineDash(),q.globalCompositeOperation,q.lineWidth]);
   const count=()=>q.getImageData(0,0,960,540).data.reduce((n,v,i)=>n+(i%4===3&&v>0),0),clear=()=>q.clearRect(0,0,960,540);
   q.globalAlpha=.4;q.lineWidth=3;q.setLineDash([2,7]);const saved=snapshot();let probes=0;
   const purity=(draw,f)=>{const before=JSON.stringify(f);clear();draw(q,Object.freeze(f),reduced);check(count()>0,'missing core');check(snapshot()===saved,'canvas state leak');check(JSON.stringify(f)===before,'effect mutated');const first=probe.toDataURL();clear();draw(q,f,reduced);check(first===probe.toDataURL(),'paused frame changed');probes++;};
   purity(a.drawArrowImpact,{arrowImpact:true,x:450,y:250,angle:.4,t:.15,duration:.2,precision:true});
   for(const hitElement of ['fire','frost','poison','chain'])purity(el.drawElementHit,{hitElement,x:450,y:250,angle:.4,t:.2,duration:.3,level:3});
   purity(el.drawElementHit,{hitElement:'chain',x:100,y:200,toX:600,toY:300,t:.15,duration:.2,level:3,branch:'web'});
   purity(bl.drawPlayerBlast,{playerBlast:'fire',x:450,y:250,r:85,t:.14,duration:.22});
   purity(g.drawBurst,{groundBurst:true,x:450,y:250,r:85,t:.4,duration:.6,color:'#96ff72'});
   clear();enemy.drawEnemyImpact(q,450,250,85,.35,{reduced});check(snapshot()===saved,'landing state leak');probes++;
   if(!baseline){
    clear();a.drawPrecisionBurst(q,{x:450,y:222,t:.6,precisionBurst:true,hitAngle:.4},reduced);check(count()>0,'precision accent absent');check(snapshot()===saved,'precision state leak');probes++;
    for(const draw of [bl.drawPlayerBlast,g.drawBurst]){clear();const f={playerBlast:'fire',groundBurst:true,x:450,y:250,r:55,t:.14,duration:.22,color:'#96ff72'};draw(q,f,reduced);const d=q.getImageData(0,0,960,540).data;for(let y=0;y<540;y++)for(let x=0;x<960;x++)if(d[(y*960+x)*4+3])check(Math.hypot(x+.5-450,y+.5-250)<57,'burst outside real radius');probes++;}
   }
   const area={fireZones:[],rollMines:[]},state={elapsed:1,player:{x:450,y:250,focusTime:0},floor:0,room:0,floors:[[area]],guardianTime:1,guardianCharges:2,roll:{kind:'slash',x:1,y:0,elapsed:.12,duration:.28}};
   c.fillStyle='#171b23';c.fillRect(0,0,960,900);for(let y=0;y<900;y+=24)for(let x=0;x<960;x+=24){c.strokeStyle='#282b32';c.strokeRect(x,y,24,24);}c.font='15px monospace';c.fillStyle='#e5d2b0';c.fillText(`${baseline?'0.49 BASELINE':'0.50 CURRENT'} / ${reduced?'REDUCED':'NORMAL'} / REAL CANVAS`,24,24);
   for(let j=0;j<3;j++){const life=[.9,.55,.15][j];for(const [i,kind] of ['fire','frost','poison','chain'].entries()){const x=170+i*210,y=100+j*85;el.drawElementHit(c,{x,y,hitElement:kind,t:life*.3,duration:.3,level:3,angle:0},reduced);c.fillStyle='#b4b4b4';c.fillText(kind+' '+life,x-35,y+35);}a.drawArrowImpact(c,{x:70,y:100+j*85,arrowImpact:true,precision:j===1,angle:0,t:life*.2,duration:.2},reduced);}
   for(let i=0;i<5;i++){c.save();c.translate(100+i*180,390);trail.drawSkillTrail(c,['fire','frost','poison','chain','precision'][i],{fire:3,frost:3,poison:3,chain:3,precision:3},1,reduced);c.restore();}
   const effects=Array.from({length:48},(_,i)=>({x:200+i%12*45,y:520+Math.floor(i/12)*30,hitElement:['fire','frost','poison','chain'][i%4],level:3,t:.06+(i%4)*.04,duration:.3,angle:.3}));
   const scene=(ctx,time=1)=>{
    g.drawGroundField(ctx,{x:400,y:575,r:100,time:1},'fire',time,reduced);g.drawGroundField(ctx,{x:550,y:580,r:90,time:1},'gas',time,reduced);
    for(const f of effects)el.drawElementHit(ctx,f,reduced);
    bl.drawPlayerBlast(ctx,{x:470,y:570,r:85,t:.14,duration:.22,playerBlast:'fire'},reduced);
    g.drawBurst(ctx,{x:600,y:560,r:70,t:.3,duration:.6,groundBurst:true,color:'#96ff72'},reduced);
    g.drawGroundField(ctx,{x:480,y:575,r:95,time:.8},'warning',time,reduced);
   };scene(c);enemy.drawEnemyImpact(c,780,560,85,.4,{reduced});
   state.player.y=760;over.drawOverhaulEffects(c,state,reduced);xp.drawXpPickup(c,{xpPickup:true,x:220,y:760,t:.12},reduced);inter.emitInteraction(state,'chest',area,{x:100,y:780});inter.emitInteraction(state,'fountain',area,{x:700,y:780});state.elapsed+=.25;inter.drawInteractionEffects(c,state,area,reduced);
   // Warm up, then time identical dense scenes; includes clear to avoid growing compositing cost.
   const timing=[];for(let i=0;i<42;i++){q.clearRect(0,0,960,540);const start=performance.now();q.save();q.translate(0,-300);scene(q);q.restore();if(i>=10)timing.push(performance.now()-start);}
   timing.sort((a,b)=>a-b);return {probes,renderMs:{mean:timing.reduce((a,b)=>a+b,0)/timing.length,p95:timing[Math.floor(timing.length*.95)]},heap:performance.memory?.usedJSHeapSize??null};
  },{reduced,baseline});
  await p.screenshot({path:join(out,`${baseline?'baseline':'current'}-${width}-${reduced?'reduced':'normal'}.png`),fullPage:true});results.push({baseline,width,reduced,...report});await cx.close();
 }
 assert.deepEqual(errors,[]);assert.equal(scores,0);await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors,scoreSubmissions:scores},null,2));console.log(JSON.stringify({cases:results.length,probes:results.reduce((n,r)=>n+r.probes,0),errors,scores,results}));
}finally{await browser.close();}
