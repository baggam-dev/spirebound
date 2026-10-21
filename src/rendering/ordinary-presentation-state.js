// Reactions are view-only. Neither actor fields nor saved state are modified.
let actors=new WeakMap(),known=new WeakSet(),heroes=new WeakMap();
export const isOrdinary=e=>!!e&&typeof e.type==='string'&&!['boss','player'].includes(e.type)&&!e.gateTitle&&e.variant!=='demon';
export function resetOrdinaryPresentation(rooms=[]){
 actors=new WeakMap();heroes=new WeakMap();known=new WeakSet(rooms.filter(r=>r.seen).flatMap(r=>r.enemies||[]));
}
export const clearOrdinaryActors=()=>{actors=new WeakMap();heroes=new WeakMap();};
export function ordinaryThreat(e,room){
 return !!(e.hp<=0||e.frozen>0||e.opening>0||e.kneel>0||e.meleeAttack||e.attackPhase||e.darkAttack||e.darkFlash?.time>0||e.chaserWindup>0||e.chaserStrike>0||Number.isFinite(e.chargeAngle)||e.gravity||e.guardPortal||e.eliteWarning>0||['windup','swing','recover','aim','beam','air','warning','dash','firing','strike','splitJump','leap'].includes(e.phase)||(room?.hazards||[]).some(h=>h.owner===e.id&&h.phase!=='expired'));
}
export function notifyOrdinaryHits(room,effects=[]){
 for(const e of room?.enemies||[]){
  if(!isOrdinary(e)||e.hp<=0)continue;
  const f=effects.find(f=>f.enemyFeedback==='hit'&&f.enemyId===e.id);if(!f)continue;
  let v=actors.get(e);if(!v){v={intro:null,hit:null,cooldown:0,x:e.x,face:1,blocked:false};actors.set(e,v);}
  v.blocked=ordinaryThreat(e,room);if(v.cooldown>0)continue;
  v.cooldown=.24;v.intro=null;if(v.blocked){v.hit=null;continue;}
  const heavy=f.beforeRatio-f.afterRatio>=.08;v.hit={age:0,duration:heavy?.14:.09,heavy};
 }
}
export function tickOrdinaryPresentation(room,dt,effects=[]){
 for(const e of room?.enemies||[]){
  if(!isOrdinary(e)||e.hp<=0)continue;
  let v=actors.get(e);
  if(!known.has(e)){known.add(e);if(!v){v={intro:0,hit:null,cooldown:0,x:e.x,face:1,blocked:false};actors.set(e,v);}}
  if(!v){v={intro:null,hit:null,cooldown:0,x:e.x,face:1,blocked:false};actors.set(e,v);}
  const dx=e.x-v.x;if(Math.abs(dx)>.1&&Math.abs(dx)<40)v.face=Math.sign(dx);v.x=e.x;
  v.blocked=ordinaryThreat(e,room);v.cooldown=Math.max(0,v.cooldown-dt);
  if(v.intro!==null){v.intro+=dt;if(v.intro>=.3||v.blocked)v.intro=null;}
  if(v.hit){v.hit.age+=dt;if(v.hit.age>=v.hit.duration||v.blocked)v.hit=null;}
 }notifyOrdinaryHits(room,effects);
}
export function ordinaryPose(e,{reduced=false,staticPose=false}={}){
 if(!isOrdinary(e)||reduced||staticPose||ordinaryThreat(e))return null;
 const v=actors.get(e);if(!v||v.blocked)return null;
 if(v.intro!==null)return {kind:'arrival',progress:v.intro/.3};
 return v.hit?{kind:'hit',progress:v.hit.age/v.hit.duration,heavy:v.hit.heavy}:null;
}
export function ordinaryDeathFace(e){
 const angle=e.darkAttack?.aim??e.chaserAim??e.chargeAngle??e.patternAim??e.aim??e.facing;
 return Number.isFinite(angle)?(Math.cos(angle)<0?-1:1):actors.get(e)?.face||1;
}
// Called inside save/restore around BODY only, outside warning/health/bullets.
export function applyOrdinaryPresentation(c,e,options={}){
 if(e.type==='flower')return; // Its fixed root must not be distorted with the top.
 const p=ordinaryPose(e,options);if(!p)return;
 const pulse=Math.sin(Math.PI*Math.max(0,Math.min(1,p.progress))),feet=e.type==='brute'?24:21;
 const amount=p.kind==='arrival'?.05*(1-p.progress):pulse*(p.heavy?.045:.025);
 c.translate(e.x,e.y+feet);c.scale(1+amount*.5,1-amount);c.translate(-e.x,-e.y-feet);
}
export function tickHeroPresentation(player,dt,effects=[]){
 if(!player)return;let v=heroes.get(player);if(!v){v={age:1,cooldown:0};heroes.set(player,v);}
 v.age+=dt;v.cooldown=Math.max(0,v.cooldown-dt);
 if(v.cooldown<=0&&effects.some(f=>f.hitSource)){v.age=0;v.cooldown=.24;}
}
export function heroPresentationPose(player,{reduced=false}={}){
 if(player?.hp<=0)return {kind:'defeat',amount:1};
 const v=heroes.get(player);if(reduced||!v||v.age>=.16)return null;
 return {kind:'hit',amount:Math.sin(Math.PI*v.age/.16)};
}
export function applyHeroPresentation(c,player,options={}){
 const p=heroPresentationPose(player,options);if(!p)return;
 c.translate(player.x,player.y+22);
 if(p.kind==='defeat')c.scale(1.08,.48);else c.scale(1+p.amount*.02,1-p.amount*.035);
 c.translate(-player.x,-player.y-22);
}
