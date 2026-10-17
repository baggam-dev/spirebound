// Presentation state belongs to the view, never the enemy or saved room.
let actors=new WeakMap();
const core=e=>e?.variant==='demon'&&e.part==='core'&&e.hp>0;
export const clearDemonPresentation=()=>{actors=new WeakMap();};
export function demonPresentationPriority(e,room){
 const d=room?.demon;
 return !!(e.frozen>0||e.opening>0||d?.attack||d?.attacks?.length||d?.coreFlash?.time>0||d?.sweepFlash?.time>0||d?.special||d?.flash?.time>0||d?.force?.time>0);
}
export function notifyDemonHits(room,effects=[]){
 for(const e of room?.enemies||[]){
  if(!core(e))continue;
  const f=effects.find(f=>f.enemyFeedback==='hit'&&f.enemyId===e.id&&f.demonCore);
  if(!f)continue;
  let v=actors.get(e);if(!v){v={intro:null,hit:null,cooldown:0};actors.set(e,v);}
  if(v.cooldown>0)continue;
  v.cooldown=.24;v.intro=null;
  if(demonPresentationPriority(e,room)){v.hit=null;continue;}
  const heavy=f.beforeRatio-f.afterRatio>=.015;
  v.hit={pose:heavy?'heavy':'light',age:0,duration:heavy?.16:.10};
 }
}
export function tickDemonPresentation(room,dt,effects=[],events=[]){
 // Phase events are emitted by actual simulation spawning, never on load/draw.
 const spawned=events.includes('demonPhase')&&room?.demon?.phase===3;
 for(const e of room?.enemies||[]){
  if(!core(e))continue;
  if(spawned)actors.set(e,{intro:0,hit:null,cooldown:0});
  const v=actors.get(e);if(!v)continue;
  v.cooldown=Math.max(0,v.cooldown-dt);
  if(v.intro!==null){if(!spawned)v.intro+=dt;if(v.intro>=.8||demonPresentationPriority(e,room))v.intro=null;}
  if(v.hit){v.hit.age+=dt;if(v.hit.age>=v.hit.duration||demonPresentationPriority(e,room))v.hit=null;}
 }
 notifyDemonHits(room,effects);
}
export function demonPresentationPose(e,room,{reduced=false,staticPose=false}={}){
 if(!core(e)||reduced||staticPose||demonPresentationPriority(e,room))return null;
 const v=actors.get(e);if(!v)return null;
 if(v.intro!==null)return v.intro<.35?'arrival':'awaken';
 return v.hit?.pose??null;
}
