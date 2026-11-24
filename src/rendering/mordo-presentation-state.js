// Explicit game-update events only; draw calls never advance these clocks.
import {ENEMY_HIT_REACTION_INTERVAL} from './enemy-hit-timing.js';
let actors=new WeakMap();
const phase=e=>e.hp/e.max>.65?1:e.hp/e.max>.3?2:3;
export const clearMordoPresentation=()=>{actors=new WeakMap();};
const priority=e=>!!(e.darkAttack||e.darkFlash?.time>0||e.kingTransition>0||e.kneel>0||e.opening>0||e.frozen>0);
export function startMordoArrival(e){
 if(e?.variant==='king'&&e.hp>0&&phase(e)===1)actors.set(e,{phase:1,intro:0,hit:0,cooldown:0});
}
export function notifyMordoHits(enemies,effects=[]){
 for(const e of enemies){
  if(e.variant!=='king'||e.hp<=0)continue;
  const f=effects.find(effect=>effect.enemyFeedback==='hit'&&effect.enemyId===e.id);
  let v=actors.get(e);
  if(f&&v)v.intro=null;
  if(!f||phase(e)!==1||(e.kingStage??1)!==1||e.shadowBoss===1||priority(e))continue;
  if(!v){v={phase:1,intro:null,hit:0,cooldown:0};actors.set(e,v);}
  if(v.cooldown>0)continue;v.hit=.12;v.cooldown=ENEMY_HIT_REACTION_INTERVAL;
 }
}
export function tickMordoPresentation(enemies,dt,effects=[]){
 for(const e of enemies){
  const v=actors.get(e);if(!v)continue;
  v.hit=Math.max(0,(v.hit||0)-dt);v.cooldown=Math.max(0,(v.cooldown||0)-dt);
  if(v.phase!==phase(e)){v.phase=phase(e);v.intro=null;v.hit=0;}
  if(priority(e)||e.hp<=0)v.hit=0;
  if(v.intro!==null){v.intro+=dt;if(v.intro>=.9||priority(e)||e.hp<=0)v.intro=null;}
 }
 notifyMordoHits(enemies,effects);
}
export function mordoPresentationPose(e,{reduced=false,staticPose=false}={}){
 if(reduced||staticPose||e.hp<=0||priority(e))return null;
 const v=actors.get(e);if(!v||v.phase!==phase(e))return null;
 if(v.intro!==null)return {phase:1,pose:v.intro<.4?'arrival':'awaken'};
 if(v.phase===1&&v.hit>0)return {phase:1,pose:'light'};
 return null;
}
export function mordoDeathPhase(e,previousHp){
 // A lethal hit can skip thresholds; retain the last visible form, not dead hp=0.
 if([1,2,3].includes(e.kingStage))return e.kingStage;
 const ratio=(previousHp??e.hp)/e.max;return ratio>.65?1:ratio>.3?2:3;
}
