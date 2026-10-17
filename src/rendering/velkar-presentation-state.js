// View-only state: no actor/save fields and no draw-time clock updates.
let actors=new WeakMap();
const phase=e=>e.commander?.phase===2?2:e.hp/e.max>.5?1:2;
export const clearVelkarPresentation=()=>{actors=new WeakMap();};
const priority=e=>{const c=e.commander||{};return !!(c.volley||c.snipe||c.ricochet||c.rain||c.blink||c.blinkFlash>0||c.rainFlash?.time>0||c.transition>0||e.frozen>0||e.opening>0);};
export function startVelkarArrival(e){
 if(e?.variant==='commander'&&e.hp>0&&phase(e)===1)actors.set(e,{phase:1,intro:0,hit:null,cooldown:0});
}
export function notifyVelkarHits(enemies,effects=[]){
 for(const e of enemies){
  if(e.variant!=='commander'||e.hp<=0)continue;
  let v=actors.get(e);if(!v){v={phase:phase(e),intro:null,hit:null,cooldown:0};actors.set(e,v);}
  const f=effects.find(f=>f.enemyFeedback==='hit'&&f.enemyId===e.id);
  if(!f||v.cooldown>0)continue;
  v.cooldown=.24;v.intro=null;
  if(priority(e)){v.hit=null;continue;}
  const heavy=f.beforeRatio-f.afterRatio>=.015;
  v.hit={phase:phase(e),pose:heavy?'heavy':'light',age:0,duration:heavy?.16:.10};
 }
}
export function tickVelkarPresentation(enemies,dt,effects=[]){
 for(const e of enemies){
  const v=actors.get(e);if(!v)continue;
  if(v.phase!==phase(e)){v.phase=phase(e);v.intro=null;v.hit=null;}
  v.cooldown=Math.max(0,v.cooldown-dt);
  if(v.intro!==null){v.intro+=dt;if(v.intro>=.8||priority(e)||e.hp<=0)v.intro=null;}
  if(v.hit){v.hit.age+=dt;if(v.hit.age>=v.hit.duration||priority(e)||e.hp<=0)v.hit=null;}
 }
 notifyVelkarHits(enemies,effects);
}
export function velkarPresentationPose(e,{reduced=false,staticPose=false}={}){
 if(e.variant!=='commander'||reduced||staticPose||e.hp<=0)return null;
 // Existing combat transition is authoritative, including save/resume.
 if(e.commander?.transition>0)return {phase:2,pose:e.commander.transition>.3?'transition':'recover'};
 if(priority(e))return null;
 const v=actors.get(e);if(!v||v.phase!==phase(e))return null;
 if(v.intro!==null)return {phase:1,pose:v.intro<.35?'arrival':'ready'};
 return v.hit?{phase:v.hit.phase,pose:v.hit.pose}:null;
}
export function velkarDeathPhase(e,previousHp){
 if([1,2].includes(e.commander?.phase))return e.commander.phase;
 return (previousHp??e.hp)/e.max>.5?1:2;
}
export function velkarFacing(e){
 const c=e.commander||{},angle=c.volley?.aim??c.snipe?.aim??c.ricochet?.aim??e.facing??0;
 return Number.isFinite(angle)&&Math.cos(angle)<0?-1:1;
}
