import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5174',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],reports=[];
try{for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile}),p=await context.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/boss-effects-preview',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#1d2027"><canvas id="gallery" width="960" height="900"></canvas></body>'}));await p.goto(base+'/boss-effects-preview');
 const report=await p.evaluate(async()=>{
  const v=await import('/src/rendering/boss-attack-vfx.js'),{drawPrism}=await import('/src/combat/prism.js'),{beamEnd}=await import('/src/combat/ranged.js'),{judgmentStripe}=await import('/src/combat/upper-floors.js');
  const {prismSpriteReady}=await import('/src/rendering/prism-sprite.js');await prismSpriteReady;
  const check=(ok,msg)=>{if(!ok)throw Error(msg);},canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const c=canvas.getContext('2d',{willReadFrequently:true});
  const clear=()=>c.clearRect(0,0,960,540),data=()=>c.getImageData(0,0,960,540).data,count=()=>data().reduce((a,n,i)=>a+(i%4===3&&n>0?1:0),0);
  const outside=predicate=>{const d=data();for(let y=0;y<540;y++)for(let x=0;x<960;x++)if(d[(y*960+x)*4+3]&&predicate(x+.5,y+.5))return true;return false;};
  const state=()=>JSON.stringify([c.globalAlpha,c.getTransform().toString(),c.lineWidth,c.lineCap,c.getLineDash(),c.globalCompositeOperation]);c.globalAlpha=.71;c.lineWidth=3;c.lineCap='round';c.setLineDash([2,7]);const saved=state();
  const from={x:150,y:200},ends=[{x:350,y:200}];
  v.drawPrismRays(c,from,ends,1,{phase:'recover',laser:true});check(count()===0,'load replays beam');
  v.drawPrismRays(c,from,ends,2,{phase:'beam',laser:true});check(count()>0,'beam absent');check(!outside((x,y)=>x<149||x>351),'beam endpoint exceeded');clear();v.drawPrismRays(c,from,[],2.1,{phase:'recover',laser:true});check(count()>0,'ending absent');const pause=canvas.toDataURL();clear();v.drawPrismRays(c,from,[],2.1,{phase:'recover',laser:true});check(pause===canvas.toDataURL(),'paused beam changed');clear();v.drawPrismRays(c,from,[],2.15,{phase:'recover',laser:true,reduced:true});check(count()===0,'reduced ending');clear();v.drawPrismRays(c,from,[],2.3,{phase:'recover',laser:true});check(count()===0,'ending persists');v.drawPrismRays(c,from,[],1,{phase:'recover',laser:true});check(count()===0,'rewind replay');check(state()===saved,'beam leaks canvas');
  for(const axis of ['horizontal','vertical'])for(let step=0;step<4;step++)for(const remaining of [.18,.05]){const z=judgmentStripe({axis,step});clear();v.drawJudgmentStripe(c,z,{flash:true,remaining});check(count()>0,'stripe absent');check(!outside((x,y)=>x<z.x||y<z.y||x>z.x+z.w||y>z.y+z.h),'stripe outside real shape');check(state()===saved,'stripe leaks canvas');}
  for(const reduced of [false,true])for(const time of [.4,.2,.05]){clear();v.drawFrostRain(c,{x:400,y:250,radius:85,time},{flash:true,reduced});check(count()>0,'rain absent');check(!outside((x,y)=>Math.hypot(x-400,y-250)>86),'rain outside radius');check(state()===saved,'rain leaks canvas');}
  // Observe the real Canvas paths after their transforms, rather than recomputing expected render output.
  const strokes=[];let path=[];const begin=c.beginPath.bind(c),move=c.moveTo.bind(c),line=c.lineTo.bind(c),stroke=c.stroke.bind(c);
  c.beginPath=()=>{path=[];begin();};c.moveTo=(x,y)=>{path.push(c.getTransform().transformPoint({x,y}));move(x,y);};c.lineTo=(x,y)=>{path.push(c.getTransform().transformPoint({x,y}));line(x,y);};c.stroke=()=>{if(path.length===2)strokes.push({width:c.lineWidth,color:c.strokeStyle,points:[...path]});stroke();};
  const obstacle={x:620,y:100,w:20,h:350},actors=[];
  for(const kind of ['bounce','shards','cage','laser'])for(const shot of (['shards','cage'].includes(kind)?[0,1,2]:[0])){
   const e={id:1,type:'boss',variant:'prism',x:480,y:270,hp:100,max:100,aim:.2,prismAttack:kind,prismPhase:kind==='laser'?'beam':shot?'salvo':'warning',prismTime:.2,prismShot:shot};actors.push(e);const before=JSON.stringify(e);strokes.length=0;clear();drawPrism(c,e,[obstacle],[],4,{actor:e});check(JSON.stringify(e)===before,'prism mutates actor');
   const actual=strokes.filter(s=>kind==='laser'?s.width===26&&s.color==='#28212e':s.width===1&&s.color==='#7ae6df');check(actual.length===(kind==='laser'?5:kind==='bounce'?18:12),'wrong ray count '+kind);
   for(let i=0;i<actual.length;i++){let a=kind==='laser'?.2+[-.65,-.325,0,.325,.65][i]:.2+i*Math.PI*2/actual.length+shot*(kind==='cage'?.27:.14);if(kind==='bounce')a=Math.atan2(Math.sin(a)*240,Math.cos(a)*280);const [f,t]=actual[i].points;check(Math.abs(Math.atan2(Math.sin(Math.atan2(t.y-f.y,t.x-f.x)-a),Math.cos(Math.atan2(t.y-f.y,t.x-f.x)-a)))<1e-6,'wrong actual direction '+kind);if(kind==='laser'){const end=beamEnd({...e,aim:a},[obstacle]);check(Math.hypot(t.x-end.x,t.y-end.y)<1e-6,'wall endpoint mismatch');}else check(Math.hypot(t.x-f.x,t.y-f.y)<=120.0001,'preview too long');}
  }
  const gallery=document.querySelector('#gallery'),g=gallery.getContext('2d');g.font='14px monospace';
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){const x=col*320,y=row*300;g.save();g.beginPath();g.rect(x,y,320,300);g.clip();g.fillStyle=['#34363b','#3c333d','#2d3c45'][row];g.fillRect(x,y,320,300);g.fillStyle='#e0cdb4';g.fillText(['PRISM','MORDO','VELKAR'][row]+' / '+['PREPARE','IMPACT','FADE'][col],x+8,y+20);if(row===0){const actor={x:x+30,y:y+150},rays=[-.65,-.325,0,.325,.65].map(a=>({x:actor.x+Math.cos(a)*270,y:actor.y+Math.sin(a)*270}));if(col===2){v.drawPrismRays(c,actor,rays,1,{phase:'beam',laser:true});g.fillStyle='#34363b';g.fillRect(x,y+30,320,270);v.drawPrismRays(g,actor,[],1.08,{phase:'recover',laser:true});}else v.drawPrismRays(g,actor,rays,1,{phase:col?'beam':'warning',laser:true,progress:.8});}if(row===1)v.drawJudgmentStripe(g,{x:x+10,y:y+120,w:300,h:48},{flash:col>0,remaining:col===1?.18:.04,progress:.8});if(row===2)v.drawFrostRain(g,{x:x+160,y:y+160,radius:100,time:col===1?.4:.08},{flash:col>0,progress:.8});g.restore();}
  return {beamGeometry:true,counts:[5,18,12],rotations:true,wallEndpoints:true,judgmentAxesAndSteps:8,frostClip:true,canvasRestored:true,actorUnchanged:true,pauseStable:true,reduced:true,noLoadOrRewindReplay:true};
 });await p.locator('#gallery').screenshot({path:join(out,`effects-${mobile?'mobile':'desktop'}.png`)});
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
 await p.evaluate(async()=>{const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(31);s.tutorialComplete=true;s.player.mainSkill='fire';s.player.fire=1;s.pendingLevels=0;s.levelQueue=[];s.invulnerable=999;s.attack=999;s.player.x=480;s.player.y=410;const r=s.floors[s.floor][s.room];r.tutorial=false;r.seen=true;r.obstacles=[{x:620,y:100,w:20,h:180,type:'wall'}];r.enemies=[{id:0,type:'boss',variant:'prism',x:400,y:220,hp:9999,max:9999,cd:999,aim:.1,prismAttack:'laser',prismPhase:'beam',prismTime:999}];localStorage.setItem(SAVE_KEY,encodeSave(s));});
 await p.reload({waitUntil:'domcontentloaded',timeout:120000});await p.locator('#continue').click();
 const hero=await p.evaluate(async()=>{const h=await import('/src/rendering/hero-sprite.js'),p=await import('/src/rendering/prism-sprite.js');if(!await h.heroSpriteReady||!await p.prismSpriteReady)throw Error('game art not ready');return h.heroSpriteState();});await p.waitForTimeout(250);await p.keyboard.press('Escape');
 await writeFile(join(out,`game-${mobile?'mobile':'desktop'}.png`),Buffer.from(await p.locator('#game').evaluate(c=>c.toDataURL().split(',')[1]),'base64'));
 reports.push({mobile,...report,gamePrism:true,hero});await context.close();
 }assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({base,reports,errors,productionRecordsSubmitted:0},null,2));console.log(JSON.stringify({reports,errors}));
}finally{await browser.close();}
