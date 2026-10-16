// Explicit game-update events only; draw calls never advance these clocks.
let actors=new WeakMap();
const phase=e=>e.hp/e.max>.65?1:e.hp/e.max>.3?2:3;
export const clearMordoPresentation=()=>{actors=new WeakMap();};
const priority=e=>!!(e.darkAttack||e.darkFlash?.time>0||e.kingTransition>0||e.kneel>0||e.opening>0||e.frozen>0);
export function startMordoArrival(e){
 if(e?.variant==='king'&&e.hp>0&&phase(e)===1)actors.set(e,{phase:1,intro:0,hit:null,cooldown:0});
}
export function notifyMordoHits(enemies,effects=[]){
 for(const e of enemies){
  if(e.variant!=='king'||e.hp<=0)continue;
  let v=actors.get(e);if(!v){v={phase:phase(e),intro:null,hit:null,cooldown:0};actors.set(e,v);}
  const f=effects.find(effect=>effect.enemyFeedback==='hit'&&effect.enemyId===e.id);
  if(!f||v.cooldown>0)continue;
  v.cooldown=.24;v.intro=null;
  if(priority(e)){v.hit=null;continue;}
  const heavy=f.beforeRatio-f.afterRatio>=.015;
  v.hit={phase:phase(e),pose:heavy?'heavy':'light',age:0,duration:heavy?.18:.12};
 }
}
export function tickMordoPresentation(enemies,dt,effects=[]){
 for(const e of enemies){
  const v=actors.get(e);if(!v)continue;
  if(v.phase!==phase(e)){v.phase=phase(e);v.intro=null;v.hit=null;}
  v.cooldown=Math.max(0,v.cooldown-dt);
  if(v.intro!==null){v.intro+=dt;if(v.intro>=.9||priority(e)||e.hp<=0)v.intro=null;}
  if(v.hit){v.hit.age+=dt;if(v.hit.age>=v.hit.duration||priority(e)||e.hp<=0)v.hit=null;}
 }
 notifyMordoHits(enemies,effects);
}
export function mordoPresentationPose(e,{reduced=false,staticPose=false}={}){
 if(reduced||staticPose||e.hp<=0||priority(e))return null;
 const v=actors.get(e);if(!v||v.phase!==phase(e))return null;
 if(v.intro!==null)return {phase:1,pose:v.intro<.4?'arrival':'awaken'};
 return v.hit?{phase:v.hit.phase,pose:v.hit.pose}:null;
}
export function mordoDeathPhase(e,previousHp){
 // A lethal hit can skip thresholds; retain the last visible form, not dead hp=0.
 if([1,2,3].includes(e.kingStage))return e.kingStage;
 const ratio=(previousHp??e.hp)/e.max;return ratio>.65?1:ratio>.3?2:3;
}
