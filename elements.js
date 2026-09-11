// Player elements are separate from hostile poison hazards. Each arrow's first
// impact activates them; secondary arrows scale damage with their strength.
const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<=r;
const grounded=e=>e.phase!=='air'&&e.attackPhase!=='leap';
function damage(e,amount,poison=false){if(e.hp<=0)return;const before=e.hp;e.hp-=amount*(e.protected?.5:1);if(poison&&before>0&&e.hp<=0)e.poisonKilled=true;}
function stack(e,key,time,dps,cap){const list=e[key]??=[];list.push({time,dps});if(list.length>cap)list.shift();}
export function fireFieldSpec(p){return p.fire>=3?{r:(20+7.5*p.fire)*(p.evolutions?.fire==='ember'?1.2:1),time:p.evolutions?.fire==='flare'?1:1.5,dps:10.2*(p.relic==='ember'?1.25:1)*(p.effectScale??1)}:null;}
export function markFireKill(e,spec,stacks=e.burnStacks?.filter(s=>s.time>0).length||0){if(e.hp<=0&&spec&&stacks>=3&&!e.fireFieldSpawned)e.pendingFireField??={...spec};}
export function resolveFireFields(room){for(const e of room.enemies)if(e.hp<=0&&e.pendingFireField&&!e.fireFieldSpawned){e.fireFieldSpawned=true;const zones=room.fireZones??=[];zones.push({x:e.x,y:e.y,...e.pendingFireField});if(zones.length>24)zones.shift();delete e.pendingFireField;}}
export function elementalImpact(p,target,enemies,room){
 const effects=[],boost=(p.relic==='ember'?1.25:1)*(p.effectScale??1);
 if(p.fire){
  const wide=p.evolutions?.fire==='ember',strong=p.evolutions?.fire==='flare';
  const radius=(20+7.5*p.fire)*(wide?1.2:1),blast=((10+3.2*(p.fire-1))*(p.effectScale??1)+p.damage*.25)*.85*(strong?1.25:wide?.85:1);
  for(const e of enemies)if(grounded(e)&&near(e,target,radius)){
   const alive=e.hp>0;damage(e,blast);if(alive)markFireKill(e,fireFieldSpec(p));if(e.hp>0&&p.fire>=2){stack(e,'burnStacks',2,(3.4+1.36*(p.fire-2))*boost,6);if(p.fire>=3)e.burnField=fireFieldSpec(p);}
  }
  effects.push({x:target.x,y:target.y,r:radius,t:.6,color:'#ff9b49'});
 }
 if(p.poison&&target.hp>0){
  const lasting=p.evolutions?.poison==='ember',potent=p.evolutions?.poison==='flare';
  stack(target,'poisonStacks',lasting?4.5:potent?2:3,(2+2*p.poison)*boost*(lasting?.8:potent?1.25:1),8);
  target.poisonRadius=30+12*p.poison;target.poisonLevel=p.poison;
  effects.push({x:target.x,y:target.y,r:18,t:.35,color:'#83ed79'});
 }
 return effects;
}
export function tickElements(room,dt,poisonLevel=0){
 const effects=[],enemies=room.enemies;
 // Snapshot living gas sources: enemy iteration order must not change damage.
 const gas=enemies.filter(e=>e.hp>0&&grounded(e)&&e.poisonStacks?.length>=2).map(e=>{
  const times=e.poisonStacks.map(s=>s.time).sort((a,b)=>b-a);
  return {owner:e,x:e.x,y:e.y,r:e.poisonRadius,active:Math.min(dt,times[1]),dps:2+2*e.poisonLevel};
 });
 for(const e of enemies){
  for(const key of ['burnStacks','poisonStacks'])if(e[key]){
   // Integrate simultaneous stacks between expirations so a large frame cannot
   // count expired stacks toward a lethal three-stack burn.
   let elapsed=0;for(const end of [...new Set([...e[key].map(s=>Math.min(dt,s.time)),dt])].sort((a,b)=>a-b)){const active=e[key].filter(s=>s.time>elapsed),alive=e.hp>0;damage(e,(end-elapsed)*active.reduce((n,s)=>n+s.dps,0),key==='poisonStacks');if(alive&&key==='burnStacks')markFireKill(e,e.burnField,active.length);elapsed=end;}
   for(const s of e[key])s.time=Math.max(0,s.time-dt);
   e[key]=e[key].filter(s=>s.time>0);
  }
  if(grounded(e)){
   // Overlapping auras/ground flames use the strongest exposure, not their sum.
   damage(e,Math.max(0,...gas.filter(g=>g.owner!==e&&near(g,e,g.r)).map(g=>g.dps*g.active)),true);
   damage(e,Math.max(0,...(room.fireZones||[]).filter(z=>near(z,e,z.r)).map(z=>z.dps*Math.min(dt,z.time))));
  }
 }
 room.fireZones=(room.fireZones||[]).map(z=>({...z,time:Math.max(0,z.time-dt)})).filter(z=>z.time>0);
 // Each corpse explodes once, including a bounded chain through poisoned foes.
 let pending;do{pending=enemies.filter(e=>e.hp<=0&&e.poisonKilled&&(e.poisonLevel>=3||poisonLevel>=3)&&!e.corpseExploded);for(const e of pending){e.corpseExploded=true;for(const other of enemies)if(grounded(other)&&near(e,other,85))damage(other,24,true);effects.push({x:e.x,y:e.y,r:85,t:.6,color:'#96ff72'});}}while(pending.length);
 return effects;
}
export function drawElements(ctx,room){
 ctx.save();for(const z of room.fireZones||[]){ctx.fillStyle='#f5783438';ctx.strokeStyle='#fa984f';ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fill();ctx.stroke();}
 for(const e of room.enemies){
  if(e.poisonStacks?.length>=2){ctx.fillStyle='#7bde6320';ctx.strokeStyle='#89d86d88';ctx.beginPath();ctx.arc(e.x,e.y,e.poisonRadius,0,Math.PI*2);ctx.fill();ctx.stroke();}
  if(e.poisonStacks?.length){ctx.fillStyle='#8dea77';ctx.font='11px sans-serif';ctx.fillText('독 '+e.poisonStacks.length,e.x-15,e.y+31);}
  if(e.burnStacks?.length){ctx.fillStyle='#ff9b49';ctx.fillRect(e.x-20,e.y-8,4,12);}
  if(e.frozen>0){ctx.fillStyle='#9ceaff66';ctx.strokeStyle='#c4f6ff';ctx.fillRect(e.x-22,e.y-30,44,52);ctx.strokeRect(e.x-22,e.y-30,44,52);}else if(e.frostStacks){ctx.fillStyle='#b4ecff';ctx.font='11px sans-serif';ctx.fillText('서리 '+e.frostStacks,e.x-15,e.y+40);}
  if(e.trialChampion){ctx.strokeStyle='#ca8cff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,29,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#dbb0ff';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('시련의 용사',e.x,e.y-44);}
 }ctx.restore();
}
