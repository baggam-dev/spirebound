import {judgmentStripe,kingPhase} from '../combat/upper-floors.js';
import {commanderOffsets,pressureBoss} from '../combat/boss-pressure.js';
import {DEMON_EYE,demonEyeOffsets,demonRayLength,demonForceProfile} from '../combat/demon-attack-shapes.js';
import {DEMON_SWEEP,isDemonSweep} from '../combat/demon-sweep.js';
import {CORE_MOTION} from '../combat/demon-core-motion.js';
import {segmentBlocked,blocked} from '../world/terrain.js';
import {drawJudgmentStripe,drawFrostRain} from './boss-attack-vfx.js';
import {drawDemonSweep} from './demon-sweep.js';
import {drawDemonTongueWarning} from './demon-core-attack-effects.js';
import {strokeThreat} from './threat-contours.js';

const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
const recoveries=new WeakMap(),phases=new WeakMap();
const colors={flame:'#f3ab71',ice:'#b0dfed',zeus:'#e8cf80'};
// No second fill, impact, particle or label in this late pass.
export function bossCircleContour(c,x,y,r,{warning=true,color='#dba5d1'}={}){
 if(!(r>0))return;c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.strokeStyle=color;c.lineWidth=1.5;c.setLineDash(warning?[5,4]:[]);c.beginPath();c.arc(x,y,Math.max(0,r-1),0,TAU);strokeThreat(c);c.restore();
}
function aimLine(c,a,angle,length,color){c.strokeStyle=color;c.lineWidth=1.3;c.setLineDash([5,4]);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(a.x+Math.cos(angle)*length,a.y+Math.sin(angle)*length);strokeThreat(c);}
function commanderContours(c,e,reduced){
 const s=e.commander;if(!s)return;
 if(s.rain)drawFrostRain(c,s.rain,{reduced,outlineOnly:true});
 if(s.blink)bossCircleContour(c,s.blink.x,s.blink.y,40,{color:'#a7d4e4'});
 for(const [a,length,color] of [[s.volley,220,'#a9d9ed'],[s.ricochet,260,'#8ad4cf']])if(a)for(const offset of commanderOffsets(a.count))aimLine(c,e,a.aim+offset,length,color);
 if(s.snipe)aimLine(c,e,s.snipe.aim,920,'#c3e6f6');
}
function eyeContours(c,a,room,enhanced,warning){
 for(const offset of demonEyeOffsets(enhanced)){
  const angle=a.aim+offset,length=demonRayLength(a,angle,room.obstacles,1200,2);if(!(length>0))continue;
  c.save();c.translate(a.x,a.y);c.rotate(angle);c.strokeStyle='#d9b0e3';c.lineWidth=1.2;c.setLineDash(warning?[5,4]:[]);c.beginPath();c.rect(0,-DEMON_EYE.halfWidth,length,DEMON_EYE.halfWidth*2);strokeThreat(c);c.restore();
 }
}
function demonContours(c,room,reduced){
 const d=room.demon;if(!d||!room.enemies.some(e=>e.variant==='demon'&&e.hp>0))return;
 const enhanced=d.pressureVersion===1;
 for(const a of enhanced?d.attacks||[]:d.attack?[d.attack]:[]){
  if(isDemonSweep(a.kind))drawDemonSweep(c,a,{reduced,outlineOnly:true});
  else if(a.kind==='eyeRay')eyeContours(c,a,room,enhanced,true);
  else if(a.kind==='mouthTongue')drawDemonTongueWarning(c,a,room.obstacles,{outlineOnly:true});
  else if(a.kind==='footJump')bossCircleContour(c,a.tx,a.ty,95);
  else if(a.kind==='mouthPull'||a.kind==='mouthPush')bossCircleContour(c,a.x,a.y,enhanced?demonForceProfile(d).radius:245);
  else if(a.kind==='noseTrail'){
   // Same sample count/spacing and wall exclusion as resolve(noseTrail).
   const count=enhanced?Math.max(6,Math.ceil(Math.hypot(a.tx-a.x,a.ty-a.y)/30)+1):6;
   c.save();c.globalAlpha*=.65;for(let i=0;i<count;i++){const t=i/(count-1),x=a.x+(a.tx-a.x)*t,y=a.y+(a.ty-a.y)*t;if(!blocked(x,y,24,room.obstacles))bossCircleContour(c,x,y,34,{color:'#bfd990'});}c.restore();
  }else if(a.kind==='footDash'){
   const owner=room.enemies.find(e=>e.part===a.owner&&e.hp>0),from=owner||a,dx=a.tx-from.x,dy=a.ty-from.y,length=Math.hypot(dx,dy);
   if(!segmentBlocked(from,{x:a.tx,y:a.ty},room.obstacles,32)){c.save();c.translate(from.x,from.y);c.rotate(Math.atan2(dy,dx));c.strokeStyle='#dba5d1';c.lineWidth=1.3;c.setLineDash([5,4]);c.beginPath();c.roundRect(-42,-42,length+84,84,42);strokeThreat(c);c.restore();}
  }
 }
 if(d.sweepFlash?.time>DEMON_SWEEP.recover)drawDemonSweep(c,d.sweepFlash,{flash:true,reduced,outlineOnly:true});
 if(d.coreFlash?.time>CORE_MOTION.recover){const a=d.coreFlash;if(a.kind==='eyeRay')eyeContours(c,a,room,enhanced,false);else if(a.kind==='mouthTongue')drawDemonTongueWarning(c,a,room.obstacles,{outlineOnly:true,active:true});}
 if(d.force?.time>0)bossCircleContour(c,d.force.x,d.force.y,enhanced?demonForceProfile(d).radius:180,{warning:false});
 if(enhanced){
  for(const e of room.enemies)if(e.variant==='demon'&&e.hp>0&&['hand','nose'].includes(e.part))bossCircleContour(c,e.x,e.y,e.part==='hand'?78:92,{warning:false,color:e.part==='hand'?colors.flame:'#bfd990'});
  for(const f of d.fields||[])if(f.time>0)bossCircleContour(c,f.x,f.y,f.radius,{warning:false,color:colors.flame});
  for(const o of room.obstacles)if(o.demonBolt)bossCircleContour(c,o.x+13,o.y+23,62,{warning:false,color:colors.zeus});
  if(d.special)bossCircleContour(c,d.special.x,d.special.y,d.special.radius,{color:colors[d.special.kind]});
 }
 for(const t of d.trails||[])if(t.time>0)bossCircleContour(c,t.x,t.y,t.radius,{warning:false,color:'#bfd990'});
}
export function drawBossThreatContours(c,room,{reduced=false}={}){
 if(!room.enemies.some(e=>e.hp>0&&['king','commander','demon'].includes(e.variant)))return;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.globalAlpha*=.85;
 for(const e of room.enemies)if(e.hp>0){
  if(e.variant==='king'&&e.darkAttack){const a=e.darkAttack;
   if(a.kind==='judgment')drawJudgmentStripe(c,judgmentStripe(a),{reduced,outlineOnly:true});
   else if(a.kind==='mark'||a.kind==='blink')bossCircleContour(c,a.tx,a.ty,a.kind==='blink'?35:65,{color:a.finisher?'#e9b278':'#dba5d1'});
  }else if(e.variant==='commander')commanderContours(c,e,reduced);
 }
 demonContours(c,room,reduced);c.restore();
}
const commanderBusy=s=>!!(s.volley||s.rain||s.rainFlash?.time>0||s.blink||s.blinkFlash>0||s.snipe||s.ricochet||s.transition>0);
export function bossRoomThreatened(room,bullets=[]){
 const d=room.demon;
 return bullets.some(b=>b.enemy&&b.life>0)||(room.hazards||[]).some(h=>h.phase==='warning'||h.phase==='active')||room.enemies.some(e=>e.hp>0&&e.type!=='boss')||!!(d&&(d.attack||d.attacks?.length||d.special||d.force?.time>0||d.flash?.time>0||d.sweepFlash?.time>DEMON_SWEEP.recover||d.coreFlash?.time>CORE_MOTION.recover||(d.trails||[]).some(t=>t.time>0)||(d.fields||[]).some(f=>f.time>0)||(room.obstacles||[]).some(o=>o.demonBolt)));
}
function recoveryMark(c,e){
 // Small off-white lowered-blade cue, never a safe ground area or instruction.
 c.save();c.strokeStyle='#d2d0c3';c.lineWidth=1.2;c.setLineDash([]);c.beginPath();c.moveTo(e.x-37,e.y-32);c.lineTo(e.x-31,e.y-23);c.moveTo(e.x-35,e.y-21);c.lineTo(e.x-28,e.y-26);strokeThreat(c);c.restore();
}
function phaseAccent(c,e,color,progress,reduced){
 c.save();c.globalAlpha*=.65*(1-progress*.5);c.strokeStyle=color;c.lineWidth=1.3;c.setLineDash([]);
 for(const side of [-1,1]){const x=e.x+side*(34+(reduced?0:progress*9));c.beginPath();c.moveTo(x-side*7,e.y-62);c.lineTo(x,e.y-68);c.lineTo(x+side*4,e.y-54);c.moveTo(x,e.y-10);c.lineTo(x,e.y+8);c.lineTo(x-side*7,e.y+11);strokeThreat(c);}c.restore();
}
export function drawBossStateAccents(c,room,time,bullets=[],{reduced=false}={}){
 if(!room.enemies.some(e=>e.hp>0&&['king','commander','demon'].includes(e.variant)))return;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();const threatened=bossRoomThreatened(room,bullets);
 for(const e of room.enemies)if(e.hp>0){
  if(e.variant==='king'){
   if(e.kingTransition>0)phaseAccent(c,e,kingPhase(e)===3?'#d4a6e7':'#b8a0d9',clamp(1-e.kingTransition/1.4),reduced);
   else if(!threatened&&!(e.frozen>0)&&!e.darkAttack&&!e.guardPortal&&(e.kneel>0||e.opening>0))recoveryMark(c,e);
  }else if(e.variant==='commander'&&e.commander){
   const s=e.commander,busy=commanderBusy(s),old=recoveries.get(e);
   let ended=old&&time>=old.time?old.ended:-Infinity;if(old&&time>old.time&&old.busy&&!busy)ended=time;
   recoveries.set(e,{time,busy,ended});
   if(s.transition>0)phaseAccent(c,e,'#b4e0ed',clamp(1-s.transition/1.1),reduced);
   else if(!busy&&!threatened&&!(e.frozen>0)&&time-ended>=0&&time-ended<.35&&[s.volleyClock,s.rainClock,s.blinkClock,s.snipeClock,...(pressureBoss(e)?[s.ricochetClock]:[])].every(t=>t>.25))recoveryMark(c,e);
  }
 }
 const d=room.demon;if(d){
  const old=phases.get(room);let changed=old&&time>=old.time?old.changed:-Infinity;
  if(old&&time>=old.time&&d.phase!==old.phase)changed=time;phases.set(room,{phase:d.phase,time,changed});
  if(time-changed>=0&&time-changed<1)for(const e of room.enemies)if(e.variant==='demon'&&e.hp>0)phaseAccent(c,e,'#d2a1d7',time-changed,reduced);
  const core=room.enemies.find(e=>e.variant==='demon'&&e.part==='core'&&e.hp>0),f=d.sweepFlash||d.coreFlash;
  if(core&&f?.time>0&&f.time<=CORE_MOTION.recover&&!threatened)recoveryMark(c,core);
 }
 c.restore();
}
