import {ENEMY_CHATTER} from '../ui/enemy-chatter-data.js';
import {enemyKey} from '../world/expedition.js';
import {anchor,drawBubble} from './boss-dialogue.js';
import {PURSUER} from '../combat/pursuer.js';

const strong=e=>e.hp>0&&!e.summoned&&(e.elite||e.trialChampion||e.roamingElite||e.gateTitle||e.type==='boss'||e.type==='pursuer');
const activePhase=phase=>!!phase&&phase!=='recover';
const danger=r=>r.wardenArrival>0||(r.enemies||[]).some(e=>e.hp>0&&(e.highAttack||e.meleeAttack||e.darkAttack||e.gravity||e.eliteWarning>0||e.kingTransition>0||activePhase(e.prismPhase)||e.chaserWindup>0||e.chaserStrike>0||activePhase(e.attackPhase)||activePhase(e.phase)||Number.isFinite(e.chargeAngle)));
const head=e=>e.type==='pursuer'?{x:e.x,y:e.y-PURSUER.height-7}:anchor(e);
// Presentation-only PRNG and clocks. Never consume run RNG or write expedition state.
export function createEnemyChatter(run,{random:randomSource}={}){
 const rooms=new WeakMap();let current=null,speech=null;
 let seed=((Number(run.seed)||0)^0x51b7a9d3)>>>0;
 const random=randomSource||(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;});
 const room=()=>run.floors[run.floor][run.room];
 const pool=e=>{
  const key=enemyKey(e);
  // Old-layout demon dialogue has a different identity; retain neutral battle lines.
  if(key==='demon'&&run.bossLayoutVersion!==1)return ENEMY_CHATTER.elite;
  if(e.trialChampion)return ENEMY_CHATTER.trial;
  return ENEMY_CHATTER[key]||ENEMY_CHATTER[e.elite]||ENEMY_CHATTER.elite;
 };
 return {
  tick(dt,{scripted=false}={}){
   const r=room();if(r!==current){current=r;speech=null;}
   if(run.practice||run.status!=='playing'){speech=null;return;}
   // New ascent/return or altar trial encounter gets its own budget, not each visit.
   const epoch=(run.key?'return':'ascent')+(r.trialState==='active'?':trial':'');
   let histories=rooms.get(r);if(!histories){histories=new Map();rooms.set(r,histories);}
   let state=histories.get(epoch);if(!state){state={time:0,next:7+random()*5,count:0,used:new Set(),eliteChance:new WeakMap(),lastActor:null};histories.set(epoch,state);}
   if(speech&&speech.epoch!==epoch)speech=null;
   if(Number.isFinite(dt)&&dt>0)state.time+=dt;
   if(speech&&(speech.actor.hp<=0||!r.enemies.includes(speech.actor)||state.time>=speech.expires))speech=null;
   if(scripted){speech=null;state.next=Math.max(state.next,state.time+4);return;}
   if(danger(r)){state.next=Math.max(state.next,state.time+.5);return;}
   // Brief warnings hide speech without spending its readable duration.
   if(speech){if(Number.isFinite(dt)&&dt>0)speech.remaining-=dt;if(speech.remaining<=0)speech=null;}
   if(speech||state.count>=2||state.time<state.next)return;
   let actors=(r.enemies||[]).filter(e=>strong(e)&&(e.variant!=='demon'||e.part==='core')&&pool(e).some(line=>!state.used.has(line)));
   // One presentation-only roll per elite and encounter epoch, including failures.
   actors=actors.filter(e=>{
    if(!(e.elite||e.trialChampion||e.roamingElite))return true;
    if(!state.eliteChance.has(e))state.eliteChance.set(e,random()<.7);
    return state.eliteChance.get(e);
   });
   if(!actors.length){state.next=state.time+3;return;}
   if(actors.length>1)actors=actors.filter(e=>e!==state.lastActor);
   const actor=actors[Math.floor(random()*actors.length)],words=pool(actor).filter(line=>!state.used.has(line));
   state.next=state.time+16+random()*9;
   if(!words.length)return;
   const line=words[Math.floor(random()*words.length)];state.used.add(line);state.count++;
   state.lastActor=actor;
   speech={actor,epoch,lines:[line],remaining:1.82,expires:state.time+4.2};
  },
  draw(ctx,{compact=false,scripted=false}={}){
   if(!speech||scripted||room()!==current||speech.actor.hp<=0||!current.enemies.includes(speech.actor)||danger(current))return;
   drawBubble(ctx,{point:head(speech.actor),lines:speech.lines},run.player,compact);
  }
 };
}
