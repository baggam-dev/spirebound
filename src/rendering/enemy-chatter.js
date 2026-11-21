import {ENEMY_CHATTER} from '../ui/enemy-chatter-data.js';
import {enemyKey} from '../world/expedition.js';
import {anchor,drawBubble} from './boss-dialogue.js';

const strong=e=>e.hp>0&&!e.summoned&&(e.elite||e.trialChampion||e.roamingElite||e.gateTitle||e.type==='boss'||e.type==='pursuer');
const danger=r=>r.wardenArrival>0||(r.enemies||[]).some(e=>e.hp>0&&(e.highAttack||e.meleeAttack||e.darkAttack||e.gravity||e.eliteWarning>0||e.kingTransition>0||e.prismPhase||e.chaserWindup>0||e.chaserStrike>0||e.attackPhase||e.phase||Number.isFinite(e.chargeAngle)));
// Presentation-only PRNG and clocks. Never consume run RNG or write expedition state.
export function createEnemyChatter(run){
 const rooms=new WeakMap();let current=null,speech=null;
 let seed=((Number(run.seed)||0)^0x51b7a9d3)>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const room=()=>run.floors[run.floor][run.room];
 const pool=e=>{
  const key=enemyKey(e);
  // Old-layout demon dialogue has a different identity; retain neutral battle lines.
  if(key==='demon'&&run.bossLayoutVersion!==1)return ENEMY_CHATTER.elite;
  return ENEMY_CHATTER[key]||(e.trialChampion?ENEMY_CHATTER.trial:ENEMY_CHATTER.elite);
 };
 return {
  tick(dt,{scripted=false}={}){
   const r=room();if(r!==current){current=r;speech=null;}
   if(run.practice||run.status!=='playing'){speech=null;return;}
   let state=rooms.get(r);if(!state){state={time:0,next:7+random()*5,count:0,used:new Set()};rooms.set(r,state);}
   if(Number.isFinite(dt)&&dt>0)state.time+=dt;
   if(scripted||danger(r)){speech=null;state.next=Math.max(state.next,state.time+(scripted?4:.5));return;}
   if(speech&&(speech.actor.hp<=0||state.time>=speech.until))speech=null;
   if(speech||state.count>=2||state.time<state.next)return;
   const actors=(r.enemies||[]).filter(e=>strong(e)&&(e.variant!=='demon'||e.part==='core'));
   if(!actors.length){state.next=state.time+3;return;}
   const actor=actors[Math.floor(random()*actors.length)],words=pool(actor).filter(line=>!state.used.has(line));
   state.next=state.time+16+random()*9;
   if(!words.length)return;
   const line=words[Math.floor(random()*words.length)];state.used.add(line);state.count++;
   speech={actor,lines:[line],until:state.time+2.6};
  },
  draw(ctx,{compact=false,scripted=false}={}){
   if(!speech||scripted||room()!==current||speech.actor.hp<=0||danger(current))return;
   drawBubble(ctx,{point:anchor(speech.actor),lines:speech.lines},run.player,compact);
  }
 };
}
