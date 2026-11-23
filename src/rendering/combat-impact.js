// View-only contacts. No actor writes, simulation time scaling, rewards or RNG.
const states=new WeakMap();
const LIMIT=16,CONTACT_GAP=.18,SHAKE_GAP=.35;
const valid=h=>h?.applied&&h.newHit&&h.damage>0&&Number.isFinite(h.x)&&Number.isFinite(h.y);
const fresh=room=>({room,time:0,contacts:[],cooldowns:new Map(),shake:null,shakeAt:-Infinity});
export const resetCombatImpacts=run=>{if(run)states.delete(run);};
export function advanceCombatImpacts(run,room,dt,results=[],effects=[]){
 if(!run||!room||!(dt>0)||!Number.isFinite(dt))return;
 let v=states.get(run);if(!v||v.room!==room){v=fresh(room);states.set(run,v);}
 const step=Math.min(dt,.1);v.time+=step;
 v.contacts=v.contacts.filter(f=>(f.age+=step)<f.duration);
 for(const [id,until] of v.cooldowns)if(until<=v.time)v.cooldowns.delete(id);
 const byEnemy=new Map();
 for(const h of results){
  if(!valid(h))continue;
  const previous=byEnemy.get(h.enemyId);
  if(!previous||(!previous.critical&&h.critical)||previous.critical===h.critical&&h.damage>previous.damage)byEnemy.set(h.enemyId,h);
 }
 // Critical contacts get the bounded slots first; repeated DoT snapshots do not.
 for(const h of [...byEnemy.values()].sort((a,b)=>Number(b.critical)-Number(a.critical)||b.damage-a.damage)){
  if(v.cooldowns.has(h.enemyId))continue;
  v.cooldowns.set(h.enemyId,v.time+CONTACT_GAP);
  const heavy=!!h.critical,x=h.x,y=h.y-18;
  const angle=h.hitDirection===-1?Math.PI:h.hitDirection===1?0:Math.atan2(h.y-(run.player?.y??h.y),h.x-(run.player?.x??h.x));
  // Existing arrow/element/utility/critical contacts remain the main sparks.
  const accented=effects.some(f=>(f.arrowImpact||f.criticalBurst||f.precisionBurst||f.utilityContact||f.hitElement)&&Math.hypot(f.x-x,f.y-y)<40);
  v.contacts.push({id:h.enemyId,x,y,age:0,duration:heavy?.24:.16,heavy,angle,sparks:!accented});
  if(v.contacts.length>LIMIT){const light=v.contacts.findIndex(f=>!f.heavy);v.contacts.splice(light<0?0:light,1);}
  if(heavy&&v.time-v.shakeAt>=SHAKE_GAP){v.shakeAt=v.time;v.shake={at:v.time};}
 }
}
export function combatImpactState(run){
 const v=run&&states.get(run);return v?{count:v.contacts.length,time:v.time}:null;
}
export function combatImpactFilter(run,enemy,{reduced=false}={}){
 if(reduced||enemy.shadowBoss===1)return null;
 const v=run&&states.get(run),f=v?.contacts.findLast(f=>f.id===enemy.id&&f.age<(f.heavy?.06:.04));
 return f?'brightness(1.8) saturate(0.55)':null;
}
export function combatImpactShake(run,{reduced=false}={}){
 const v=run&&states.get(run),age=v?.shake?v.time-v.shake.at:Infinity;
 if(reduced||age<0||age>=.13)return {x:0,y:0};
 const strength=2.5*(1-age/.13)**2;
 return {x:Math.round(Math.sin(age*105+1)*strength),y:Math.round(Math.cos(age*87)*strength*.6)};
}
export function drawCombatImpacts(c,run,{reduced=false}={}){
 const v=run&&states.get(run);if(!v?.contacts.length)return false;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();const alpha=c.globalAlpha;
 for(const f of v.contacts){
  if(!f.sparks)continue;
  const q=f.age/f.duration,power=f.heavy?1.7:1,count=reduced?2:f.heavy?10:4;
  c.globalAlpha=alpha*(1-q)**1.7;
  for(let i=0;i<count;i++){
   const a=f.angle-1.25+(i+.5)/count*2.5,r=(3+(1-(1-q)**3)*22)*power;
   const size=Math.max(1,Math.round((1-q)*(f.heavy?3:2)));
   c.fillStyle=i%3?'#d7a265':'#ffedc7';
   c.fillRect(Math.round(f.x+Math.cos(a)*r),Math.round(f.y+Math.sin(a)*r*.65),size*2,size);
  }
 }
 c.restore();return true;
}
