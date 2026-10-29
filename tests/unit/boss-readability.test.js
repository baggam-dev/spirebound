// Prepared for the next explicit deployment; not executed during implementation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {drawBossThreatContours,drawBossStateAccents,bossRoomThreatened} from '../../src/rendering/boss-threat-contours.js';
import {drawDemonSweep} from '../../src/rendering/demon-sweep.js';
import {drawJudgmentStripe} from '../../src/rendering/boss-attack-vfx.js';
import {judgmentStripe} from '../../src/combat/upper-floors.js';
import {DEMON_SWEEP,demonSweepSector} from '../../src/combat/demon-sweep.js';
import {drawOpenings} from '../../src/combat/tactics.js';
function recorder(){
 const calls=[],stack=[],state={globalAlpha:1,lineWidth:1,strokeStyle:'#fff'};
 const c=new Proxy(state,{get:(t,k)=>k in t?t[k]:k==='save'?()=>{stack.push({...t});calls.push(['save']);}:k==='restore'?()=>{const old=stack.pop();Object.keys(t).forEach(key=>delete t[key]);Object.assign(t,old);calls.push(['restore']);}:(...args)=>calls.push([k,...args]),set:(t,k,v)=>(t[k]=v,true)});
 return {c,calls};
}
const room=(enemies=[],demon)=>({enemies,obstacles:[],hazards:[],...(demon?{demon}:{})});
const actor=(variant,extra={})=>({type:'boss',variant,hp:100,max:100,x:480,y:200,...extra});
function noPaint(calls){assert.equal(calls.filter(a=>['fill','fillRect','fillText','drawImage'].includes(a[0])).length,0);}

test('Mordo late judgment uses actual horizontal and vertical stripes without drawing the future strike or filling',()=>{
 for(const axis of ['horizontal','vertical'])for(const step of [0,3]){
  const a={kind:'judgment',axis,step,time:.3},r=room([actor('king',{darkAttack:a})]),before=JSON.stringify(r),{c,calls}=recorder(),z=judgmentStripe(a);
  drawBossThreatContours(c,r);noPaint(calls);assert.ok(calls.some(a=>a[0]==='rect'&&a[1]===z.x&&a[2]===z.y&&a[3]===z.w&&a[4]===z.h));assert.equal(JSON.stringify(r),before);assert.equal(c.globalAlpha,1);
 }
 const {c,calls}=recorder();drawJudgmentStripe(c,{x:30,y:86,w:900,h:48},{secondary:true});noPaint(calls);
});
test('Velkar rain clips to its real radius and both spread beats retain the real offset count',()=>{
 for(const fired of [0,1])for(const reduced of [false,true]){
  const e=actor('commander',{commander:{rain:{x:450,y:330,radius:120,time:.7},volley:{aim:0,count:4,fired}}}),r=room([e]),before=JSON.stringify(r),{c,calls}=recorder();
  drawBossThreatContours(c,r,{reduced});noPaint(calls);assert.ok(calls.some(a=>a[0]==='arc'&&a[1]===450&&a[2]===330&&a[3]===120));assert.equal(calls.filter(a=>a[0]==='lineTo').length,4);assert.equal(JSON.stringify(r),before);
 }
});
test('phase2 mouth keeps 210px warning and active edges in both motion settings with no field repaint',()=>{
 for(const reduced of [false,true]){
  const d={phase:2,pressureVersion:1,attacks:[{kind:'mouthPull',x:420,y:390}],force:{x:420,y:390,time:.5},fields:[],trails:[]},r=room([actor('demon',{part:'mouth'})],d),before=JSON.stringify(r),{c,calls}=recorder();drawBossThreatContours(c,r,{reduced});noPaint(calls);
  assert.equal(calls.filter(a=>a[0]==='arc'&&a[3]===210).length,2);assert.ok(calls.some(a=>a[0]==='setLineDash'&&a[1].join(',')==='5,4'));assert.ok(calls.some(a=>a[0]==='setLineDash'&&a[1].length===0));assert.equal(JSON.stringify(r),before);
 }
});
test('core eye outlines share five wall-ended rays and sweep outlines share the damage sector',()=>{
 const a={kind:'eyeRay',aim:0,x:300,y:250},r=room([actor('demon',{part:'core'})],{phase:3,pressureVersion:1,attacks:[a],fields:[],trails:[]});r.obstacles=[{x:400,y:100,w:40,h:300}];
 const {c,calls}=recorder();drawBossThreatContours(c,r);noPaint(calls);const beams=calls.filter(a=>a[0]==='rect'&&a[1]===0&&a[2]===-15);assert.equal(beams.length,5);assert.ok(beams.every(a=>a[3]<110&&a[4]===30));
 const sweep={kind:'coreSweepLeft',x:480,y:145,time:.9},s=demonSweepSector(sweep),rec=recorder();drawDemonSweep(rec.c,sweep,{outlineOnly:true});noPaint(rec.calls);assert.ok(rec.calls.some(a=>a[0]==='translate'&&a[1]===s.x&&a[2]===s.y));assert.ok(rec.calls.some(a=>a[0]==='arc'&&a[3]===DEMON_SWEEP.radius));
});
test('persistent demon fields remain visible while no global recovery cue is allowed',()=>{
 const d={phase:3,pressureVersion:1,attacks:[],fields:[{x:200,y:250,radius:86,time:2}],trails:[{x:320,y:300,radius:34,time:2}],sweepFlash:{kind:'coreSweepRight',x:480,y:145,time:.2}},e=actor('demon',{part:'core'}),r=room([e],d),before=JSON.stringify(r),{c,calls}=recorder();
 assert.equal(bossRoomThreatened(r),true);drawBossThreatContours(c,r,{reduced:true});noPaint(calls);for(const radius of [86,34])assert.ok(calls.some(a=>a[0]==='arc'&&a[3]===radius));const state=recorder();drawBossStateAccents(state.c,r,10);assert.equal(state.calls.filter(a=>a[0]==='lineTo').length,0);assert.equal(JSON.stringify(r),before);
});
test('Velkar recovery requires an observed attack end and hides with live bullets; reload never replays a cue',()=>{
 const clocks={volleyClock:1,rainClock:4,blinkClock:3,snipeClock:2,ricochetClock:2},e=actor('commander',{bossPressureVersion:1,commander:{...clocks,volley:{aim:0,count:4}}}),r=room([e]);
 drawBossStateAccents(recorder().c,r,1);delete e.commander.volley;const before=JSON.stringify(r),rec=recorder();drawBossStateAccents(rec.c,r,1.1);assert.ok(rec.calls.some(a=>a[0]==='lineTo'));assert.equal(JSON.stringify(r),before);
 const blocked=recorder();drawBossStateAccents(blocked.c,r,1.2,[{enemy:true,life:1}]);assert.equal(blocked.calls.filter(a=>a[0]==='lineTo').length,0);
 const fresh=room([actor('commander',{commander:{...clocks}})]),still=recorder();drawBossStateAccents(still.c,fresh,20);assert.equal(still.calls.filter(a=>a[0]==='lineTo').length,0);
 const rewind=recorder();drawBossStateAccents(rewind.c,r,.5);assert.equal(rewind.calls.filter(a=>a[0]==='lineTo').length,0);
});
test('phase accents keep render-only history, do not replay on initial load, and cover reduced mode',()=>{
 const d={phase:2,attacks:[],fields:[],trails:[]},r=room([actor('demon',{part:'core'})],d),first=recorder();drawBossStateAccents(first.c,r,10);assert.equal(first.calls.filter(a=>a[0]==='lineTo').length,0);
 d.phase=3;const before=JSON.stringify(r),next=recorder();drawBossStateAccents(next.c,r,11,[],{reduced:true});assert.ok(next.calls.some(a=>a[0]==='lineTo'));noPaint(next.calls);assert.equal(JSON.stringify(r),before);const repeated=recorder();drawBossStateAccents(repeated.c,r,11,[],{reduced:true});assert.deepEqual(repeated.calls,next.calls);
});
test('Mordo replaces the old green ground cue and suppresses recovery during hazards, freeze or an attack',()=>{
 const e=actor('king',{kneel:1,opening:1}),r=room([e]),old=recorder();drawOpenings(old.c,r,{skipKing:true});noPaint(old.calls);
 const ready=recorder();drawBossStateAccents(ready.c,r,1);assert.ok(ready.calls.some(a=>a[0]==='lineTo'));noPaint(ready.calls);
 for(const effect of ['hazard','frozen','attack']){
  r.hazards=effect==='hazard'?[{phase:'warning'}]:[];e.frozen=effect==='frozen'?1:0;e.darkAttack=effect==='attack'?{kind:'slash'}:null;
  const hidden=recorder();drawBossStateAccents(hidden.c,r,2);assert.equal(hidden.calls.filter(a=>a[0]==='lineTo').length,0);
 }
});
