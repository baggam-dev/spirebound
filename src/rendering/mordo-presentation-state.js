// Explicit game-update events only; draw calls never advance these clocks.
let actors=new WeakMap();
const phase=e=>e.hp/e.max>.65?1:e.hp/e.max>.3?2:3;
export const clearMordoPresentation=()=>{actors=new WeakMap();};
const priority=e=>!!(e.darkAttack||e.darkFlash?.time>0||e.kingTransition>0||e.kneel>0||e.opening>0||e.frozen>0);
export function startMordoArrival(e){
 if(e?.variant==='king'&&e.hp>0&&phase(e)===1)actors.set(e,{phase:1,intro:0});
}
export function notifyMordoHits(enemies,effects=[]){
 for(const e of enemies){
  if(e.variant!=='king'||e.hp<=0)continue;
  const v=actors.get(e);if(!v)continue;
  const f=effects.find(effect=>effect.enemyFeedback==='hit'&&effect.enemyId===e.id);
  // Hits can end the arrival presentation, but never replace the combat body.
  if(f)v.intro=null;
 }
}
export function tickMordoPresentation(enemies,dt,effects=[]){
 for(const e of enemies){
  const v=actors.get(e);if(!v)continue;
  if(v.phase!==phase(e)){v.phase=phase(e);v.intro=null;}
  if(v.intro!==null){v.intro+=dt;if(v.intro>=.9||priority(e)||e.hp<=0)v.intro=null;}
 }
 notifyMordoHits(enemies,effects);
}
export function mordoPresentationPose(e,{reduced=false,staticPose=false}={}){
 if(reduced||staticPose||e.hp<=0||priority(e))return null;
 const v=actors.get(e);if(!v||v.phase!==phase(e))return null;
 if(v.intro!==null)return {phase:1,pose:v.intro<.4?'arrival':'awaken'};
 return null;
}
export function mordoDeathPhase(e,previousHp){
 // A lethal hit can skip thresholds; retain the last visible form, not dead hp=0.
 if([1,2,3].includes(e.kingStage))return e.kingStage;
 const ratio=(previousHp??e.hp)/e.max;return ratio>.65?1:ratio>.3?2:3;
}
