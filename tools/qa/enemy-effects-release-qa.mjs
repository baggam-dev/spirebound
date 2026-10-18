import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5174',out=process.argv[2]||'docs/qa-enemy-effects-20261019/local';
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],reports=[];
try{for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/enemy-effects-preview',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#191820"><canvas id="vfx" width="960" height="720"></canvas></body>'}));await page.goto(base+'/enemy-effects-preview');
 const report=await page.evaluate(async()=>{
  const v=await import('/src/rendering/enemy-attack-vfx.js'),canvas=document.querySelector('canvas'),c=canvas.getContext('2d',{willReadFrequently:true});
  const check=(ok,msg)=>{if(!ok)throw Error(msg);},scratch=document.createElement('canvas');scratch.width=960;scratch.height=720;const q=scratch.getContext('2d',{willReadFrequently:true});
  const pixels=()=>q.getImageData(0,0,960,720).data,clear=()=>q.clearRect(0,0,960,720),count=()=>pixels().filter((_,i)=>i%4===3).reduce((a,b)=>a+(b>0),0);
  const outside=pred=>{const p=pixels();for(let y=0;y<720;y++)for(let x=0;x<960;x++)if(p[(y*960+x)*4+3]&&pred(x+.5,y+.5))return true;return false;};
  const state=()=>JSON.stringify([q.globalAlpha,q.getTransform().toString(),q.globalCompositeOperation,q.getLineDash(),q.lineCap,q.lineWidth]);
  q.globalAlpha=.73;q.setLineDash([2,9]);q.lineCap='round';const saved=state();
  for(const kind of ['warning','gravity','poison']){clear();v.drawEnemyField(q,150,150,62,{kind,time:2});check(!outside((x,y)=>Math.hypot(x-150,y-150)>63),'field outside radius');check(state()===saved,'field canvas leak');}
  clear();v.drawEnemySector(q,150,150,55,0,Math.PI/3);check(count()>0,'missing sector');check(!outside((x,y)=>Math.hypot(x-150,y-150)>56||x<149||Math.abs(Math.atan2(y-150,x-150))>Math.PI/3+.03),'sector geometry');check(state()===saved,'sector canvas leak');
  clear();v.drawEnemyBeam(q,{x:100,y:100},{x:300,y:100},{active:true,width:30});check(!outside((x,y)=>x<100||x>300||Math.abs(y-100)>15),'beam exceeds wall endpoint or width');check(count()>0,'beam absent');check(state()===saved,'beam canvas leak');
  const e={x:150,y:150},initial=JSON.stringify(e);clear();v.drawEnemyLanding(q,e,1,{air:false,recover:true,radius:62});check(count()===0,'load replay');v.drawEnemyLanding(q,e,2,{air:true,recover:false,radius:62});v.drawEnemyLanding(q,e,3,{air:false,recover:true,radius:62});check(count()>0,'landing missing');check(JSON.stringify(e)===initial,'actor mutated');
  e.x=600;clear();v.drawEnemyLanding(q,e,3.08,{air:false,recover:true,radius:62});check(count()>0&&!outside((x,y)=>Math.hypot(x-150,y-150)>63),'landing follows actor');const paused=scratch.toDataURL();clear();v.drawEnemyLanding(q,e,3.08,{air:false,recover:true,radius:62});check(paused===scratch.toDataURL(),'pause changes landing');clear();v.drawEnemyLanding(q,e,3.3,{air:false,recover:true,radius:62});check(count()===0,'landing persists');clear();v.drawEnemyLanding(q,e,1,{air:false,recover:true,radius:62});check(count()===0,'rewind replay');
  const beam={x:100,y:100,phase:'beam'},end={x:300,y:100};v.drawEnemyBeamEnding(q,beam,end,1);beam.phase=null;clear();v.drawEnemyBeamEnding(q,beam,end,2);check(count()>0,'beam ending missing');clear();v.drawEnemyBeamEnding(q,beam,end,2.05,true);check(count()===0,'reduced beam ending');
  const z={x:150,y:150,r:62,phase:'active'},room={hazards:[z]},s={elapsed:1};clear();v.drawEnemyGroundTransitions(q,s,room);check(count()===0,'hazard load replay');s.elapsed=2;room.hazards=[];v.drawEnemyGroundTransitions(q,s,room);check(count()>0,'hazard fade absent');clear();v.drawEnemyGroundTransitions(q,s,room,true);check(count()===0,'reduced hazard fade');v.drawEnemyGroundTransitions(q,s,{hazards:[]});clear();v.drawEnemyGroundTransitions(q,s,room);check(count()===0,'room return replay');
  for(let row=0;row<3;row++)for(let col=0;col<6;col++){
   const x=col*160,y=row*240;c.fillStyle=['#393738','#39414a','#392f40'][row];c.fillRect(x,y,160,240);c.strokeStyle='#67606655';for(let a=0;a<4;a++)c.strokeRect(x+(a%2)*80,y+Math.floor(a/2)*120,80,120);c.fillStyle='#ead9c3';c.font='11px monospace';c.fillText(['BULLET / MUZZLE','MELEE 55 / 120','BEAM 30 / WALL','POISON','LANDING','GRAVITY'][col],x+5,y+16);const cx=x+80,cy=y+116,reduced=row===2;
   if(col===0){v.drawEnemyMuzzle(c,cx,cy,0,{active:row>0,progress:.7,reduced});c.fillStyle='#f1c7ad';c.fillRect(cx+25,cy-1,8,2);}
   if(col===1)v.drawEnemySector(c,cx,cy,55,0,Math.PI/3,{warning:row===0,reduced});
   if(col===2)v.drawEnemyBeam(c,{x:x+12,y:cy},{x:x+145,y:cy},{active:row>0,reduced});
   if(col===3)v.drawEnemyField(c,cx,cy,62,{kind:row===0?'warning':'poison',time:2,reduced});
   if(col===4){if(row===0)v.drawEnemyField(c,cx,cy,62,{kind:'warning'});else v.drawEnemyImpact(c,cx,cy,62,.35,{reduced});}
   if(col===5)v.drawEnemyField(c,cx,cy,62,{kind:'gravity',time:2,reduced});
  }
  check(state()===saved,'transition canvas leak');return {geometry:true,canvasRestored:true,actorUnchanged:true,landingAnchored:true,noLoadOrRewindReplay:true,pauseStable:true,reduced:true,roomReturnNoReplay:true};
 });await page.locator('#vfx').screenshot({path:join(out,`effects-${mobile?'mobile':'desktop'}.png`)});reports.push({mobile,...report});await context.close();
 }assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({reports,errors,productionScoresSubmitted:0},null,2));console.log(JSON.stringify({reports,errors}));}finally{await browser.close();}
