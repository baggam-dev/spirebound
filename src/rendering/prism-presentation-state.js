// View-only clocks and room history. Seed saved seen rooms to avoid load replay.
let actors=new WeakMap(),entered=new WeakSet();
export const isPrism=e=>e?.variant==='prism';
export function resetPrismPresentation(rooms=[]){actors=new WeakMap();entered=new WeakSet(rooms.filter(r=>r.seen));}
export const clearPrismActors=()=>{actors=new WeakMap();};
const priority=e=>!!(e.prismPhase||e.opening>0||e.frozen>0||e.kneel>0);
export function enterPrismPresentation(room,{practice=false,returning=false}={}){
 if(!room)return;const first=!entered.has(room);entered.add(room);
 if(!first||practice||returning||room.used||room.type!=='boss')return;
 for(const e of room.enemies||[])if(isPrism(e)&&e.hp>0&&!priority(e))actors.set(e,{intro:0,hit:null,cooldown:0});
}
export function notifyPrismHits(enemies,effects=[]){
 for(const e of enemies){
  if(!isPrism(e)||e.hp<=0)continue;
  const f=effects.find(f=>f.enemyFeedback==='hit'&&f.enemyId===e.id);if(!f)continue;
  let v=actors.get(e);if(!v){v={intro:null,hit:null,cooldown:0};actors.set(e,v);}
  if(v.cooldown>0)continue;v.cooldown=.24;v.intro=null;
  if(priority(e)){v.hit=null;continue;}
  const heavy=f.beforeRatio-f.afterRatio>=.015;
  v.hit={pose:heavy?'heavy':'light',age:0,duration:heavy?.16:.10};
 }
}
export function tickPrismPresentation(enemies,dt,effects=[]){
 for(const e of enemies){const v=actors.get(e);if(!v)continue;
  v.cooldown=Math.max(0,v.cooldown-dt);
  if(v.intro!==null){v.intro+=dt;if(v.intro>=.8||priority(e)||e.hp<=0)v.intro=null;}
  if(v.hit){v.hit.age+=dt;if(v.hit.age>=v.hit.duration||priority(e)||e.hp<=0)v.hit=null;}
 }notifyPrismHits(enemies,effects);
}
export function prismPresentationPose(e,{reduced=false,staticPose=false}={}){
 if(!isPrism(e)||e.hp<=0||reduced||staticPose||priority(e))return null;
 const v=actors.get(e);if(!v)return null;
 return v.intro!==null?(v.intro<.35?'arrival':'awaken'):v.hit?.pose??null;
}
