// Reuse approved bodies for short presentation transforms; no new designs.
let actors=new WeakMap(),entered=new WeakSet();
export function remainingBossKey(e){
 if(e?.variant==='slime'&&e.type==='boss'&&!e.summoned)return 'slime';
 if(e?.gateTitle&&e.type==='starKnight')return 'kald';
 if(e?.gateTitle&&e.type==='astralSniper')return 'vera';
 if(e?.variant==='demon'&&['hand','foot','eye','nose','mouth'].includes(e.part))return e.part;
 return null;
}
export function resetRemainingBossPresentation(rooms=[]){actors=new WeakMap();entered=new WeakSet(rooms.filter(r=>r.seen));}
export const clearRemainingBossActors=()=>{actors=new WeakMap();};
function priority(e,room){
 if(e.hp<=0||e.frozen>0||e.opening>0||e.kneel>0||e.darkAttack||e.darkFlash?.time>0||e.phase==='splitJump'||e.attackPhase)return true;
 if(e.variant==='slime')return !!((room?.hazards||[]).some(h=>h.owner===e.id&&h.phase!=='expired')||e.slimeShotClock>0&&e.slimeShotClock<.25||e.slimeShotClock>((e.stage||0)===0?2.8:4)-.16);
 if(e.variant==='demon'){const d=room?.demon;return !!(d?.attack||d?.attacks?.length||d?.force?.time>0||d?.special||d?.flash?.time>0);}
 return false;
}
export function startRemainingBosses(room,{partsOnly=false}={}){
 for(const e of room?.enemies||[])if(remainingBossKey(e)&&e.hp>0&&(!partsOnly||e.variant==='demon')&&!priority(e,room))actors.set(e,{intro:0,hit:null,cooldown:0,blocked:false});
}
export function enterRemainingBossPresentation(room,{practice=false,returning=false}={}){
 if(!room)return;const first=!entered.has(room);entered.add(room);
 if(!first||practice||returning||room.used||room.type!=='boss'&&!room.gate)return;
 // Demon parts arrive from explicit challenge/phase-spawn events instead.
 for(const e of room.enemies||[])if(e.variant!=='demon'&&remainingBossKey(e)&&e.hp>0&&!priority(e,room))actors.set(e,{intro:0,hit:null,cooldown:0,blocked:false});
}
export function notifyRemainingBossHits(room,effects=[]){
 for(const e of room?.enemies||[]){
  if(!remainingBossKey(e)||e.hp<=0)continue;
  const f=effects.find(f=>f.enemyFeedback==='hit'&&f.enemyId===e.id);if(!f)continue;
  let v=actors.get(e);if(!v){v={intro:null,hit:null,cooldown:0,blocked:false};actors.set(e,v);}
  v.blocked=priority(e,room);if(v.cooldown>0)continue;
  v.cooldown=.24;v.intro=null;if(v.blocked){v.hit=null;continue;}
  const heavy=f.beforeRatio-f.afterRatio>=.015;v.hit={age:0,duration:heavy?.16:.10,heavy};
 }
}
export function tickRemainingBossPresentation(room,dt,effects=[],events=[]){
 if(events.includes('demonPhase')&&room?.demon?.phase===2)startRemainingBosses(room,{partsOnly:true});
 for(const e of room?.enemies||[]){const v=actors.get(e);if(!v)continue;v.blocked=priority(e,room);v.cooldown=Math.max(0,v.cooldown-dt);
  if(v.intro!==null){v.intro+=dt;if(v.intro>=.8||v.blocked)v.intro=null;}
  if(v.hit){v.hit.age+=dt;if(v.hit.age>=v.hit.duration||v.blocked)v.hit=null;}
 }notifyRemainingBossHits(room,effects);
}
export function remainingBossPose(e,{reduced=false,staticPose=false}={}){
 if(!remainingBossKey(e)||reduced||staticPose||priority(e))return null;
 const v=actors.get(e);if(!v||v.blocked)return null;
 if(v.intro!==null)return {kind:'arrival',progress:v.intro/.8};
 return v.hit?{kind:'hit',progress:v.hit.age/v.hit.duration,heavy:v.hit.heavy}:null;
}
// Caller owns save/restore and local coordinates. Only the bitmap is distorted.
export function applyRemainingBossPose(c,e,options={},feet=21){
 const p=remainingBossPose(options.actor||e,options);if(!p)return;
 const pulse=Math.sin(Math.PI*Math.max(0,Math.min(1,p.progress))),slime=remainingBossKey(e)==='slime';
 const sx=p.kind==='arrival'?1-.08*(1-p.progress):1+pulse*(slime?.1:p.heavy?.045:.025);
 const sy=p.kind==='arrival'?1-.1*(1-p.progress):1-pulse*(slime?.13:p.heavy?.06:.035);
 c.translate(0,feet);c.scale(sx,sy);c.translate(0,-feet);
}
