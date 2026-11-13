import {DEMON_SWEEP,demonSweepSide,isDemonSweep} from '../combat/demon-sweep.js';
import {CORE_MOTION} from '../combat/demon-core-motion.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const out=n=>1-(1-clamp(n))**3;
let remnants=new WeakMap();
export const clearRemnantMotion=()=>{remnants=new WeakMap();};
// Observe simulation updates, never draw calls. No run/enemy/save fields added.
export function tickRemnantMotion(room){
 const d=room?.demon;if(d?.remnantVersion!==1)return;
 const previous=remnants.get(room),same=previous?.phase===d.phase;
 const live=owner=>room.enemies.some(e=>e.remnantVersion===1&&e.part===owner&&e.hp>0);
 let release=same?previous.release:null;
 if(!d.attack&&same&&previous.attack&&d.recovery>0&&live(previous.attack.owner))release={...previous.attack,duration:d.recovery};
 if(d.attack||!(d.recovery>0)||release&&!live(release.owner))release=null;
 const attack=d.attack?{kind:d.attack.kind,owner:d.attack.owner,aim:d.attack.aim}:null;
 remnants.set(room,{phase:d.phase,attack,release});
}
export function remnantMotion(e,room,attack,{reduced=false,staticPose=false}={}){
 const d=room?.demon,release=remnants.get(room)?.release;
 const pose={tilt:0,lift:0,squash:0,lunge:0,aim:attack?.aim??0,arms:[0,0]};
 if(reduced||staticPose||e.hp<=0)return pose;
 const flash=d?.sweepFlash||d?.coreFlash;
 const kind=attack?.kind||flash?.kind;
 const windup=attack?.windup||(isDemonSweep(kind)?DEMON_SWEEP.windup:['footJump','eyeRay'].includes(kind)?1.1:.85);
 const charge=attack?smooth(1-attack.time/windup):0;
 if(e.part==='core'){
  if(isDemonSweep(kind)){
   const side=demonSweepSide(kind),elapsed=flash?CORE_MOTION.duration-flash.time:0;
   const turn=attack?-.24*charge:elapsed<CORE_MOTION.strike?-.24+.74*out(elapsed/CORE_MOTION.strike):.50*(1-smooth((elapsed-CORE_MOTION.strike)/CORE_MOTION.recover));
   pose.arms[side<0?0:1]=side*turn;
  }else if(kind==='hand'){
   const weight=attack?charge:1-smooth((CORE_MOTION.duration-flash.time)/CORE_MOTION.duration);
   pose.arms=[weight*.12,-weight*.12];
  }
  return pose;
 }
 if(attack){
  pose.tilt=(e.part==='hand'?-.16:.05)*charge;
  if(e.part==='foot'&&kind==='footJump'){pose.lift=32*out(charge/.65)*(1-smooth((charge-.78)/.22));pose.squash=.07*Math.sin(charge*Math.PI);}
  return pose;
 }
 if(release?.owner===e.part&&d?.recovery>0){
  const age=Math.max(0,release.duration-d.recovery),strike=.12,t=age/strike;
  const settle=age<strike?out(t):1-smooth((age-strike)/Math.max(.01,release.duration-strike));
  pose.aim=release.aim;
  if(e.part==='hand'){pose.tilt=age<strike?-.16+.38*out(t):.22*settle;pose.lunge=3.5*settle;}
  if(e.part==='foot')pose.squash=(release.kind==='footJump'?.13:.05)*settle;
 }
 return pose;
}
export function kingWeaponMotion(e,{reduced=false,staticPose=false}={}){
 const a=e.darkAttack,f=e.darkFlash,kind=f?.kind||a?.kind;
 const spell=['mark','fan','ring','judgment','blink'].includes(kind);
 if(staticPose)return {from:0,to:0,mix:0,lean:0,blocked:true};
 if(e.kingTransition>0)return {from:3,to:3,mix:0,lean:0,blocked:true};
 if(e.kneel>0)return {from:5,to:5,mix:0,lean:0,blocked:true};
 if(f?.time>0){
  if(spell)return {from:3,to:3,mix:0,lean:0,blocked:true};
  const t=clamp(1-f.time/.18),recover=smooth((t-.55)/.45);
  return {from:2,to:0,mix:reduced?0:recover,lean:reduced?0:.035*(1-recover),blocked:true};
 }
 if(a){
  if(spell)return {from:3,to:3,mix:0,lean:0,blocked:true};
  if(a.moving)return {from:2,to:2,mix:0,lean:reduced?0:.035,blocked:true};
  const fast=e.bossPressureVersion===1&&e.hp/e.max<=.3,windup=a.kind==='slash'?(fast?.32:.5):fast?.45:.65;
  const charge=smooth(1-a.time/windup);
  return {from:0,to:1,mix:reduced?1:smooth(charge/.7),lean:reduced?0:-.018*charge,blocked:true};
 }
 return {from:0,to:0,mix:0,lean:0,blocked:false};
}
