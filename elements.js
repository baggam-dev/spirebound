import {drawGroundField} from './ground-visuals.js';
import {bindDefenses,enemyDamageFactor} from './enemy-defense.js';
import {relicStat} from './relics.js';
// Player effects are separate from hostile hazards. Fire triggers on first
// contact; poison also applies after piercing. Secondary arrows scale damage.
const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<=r;
const grounded=e=>e.phase!=='air'&&e.phase!=='splitJump'&&e.attackPhase!=='leap';
function damage(e,amount,poison=false){if(e.hp<=0)return;const before=e.hp;e.hp-=amount*enemyDamageFactor(e);if(poison&&before>0&&e.hp<=0)e.poisonKilled=true;}
function stack(e,key,time,dps,cap){const list=e[key]??=[];list.push({time,dps});if(list.length>cap)list.shift();}
export function fireFieldSpec(p){return p.fire>=3?{r:(35+40/3*p.fire)*(p.evolutions?.fire==='ember'?1.2:1),time:p.evolutions?.fire==='flare'?1:1.5,dps:30*(1+relicStat(p,'fire'))*(p.effectScale??1)}:null;}
export function markFireKill(e,spec,stacks=e.burnStacks?.filter(s=>s.time>0).length||0){if(e.hp<=0&&spec&&stacks>=3&&!e.fireFieldSpawned)e.pendingFireField??={...spec};}
export function resolveFireFields(room){for(const e of room.enemies)if(e.hp<=0&&e.pendingFireField&&!e.fireFieldSpawned){e.fireFieldSpawned=true;const zones=room.fireZones??=[];zones.push({x:e.x,y:e.y,...e.pendingFireField});if(zones.length>24)zones.shift();delete e.pendingFireField;}}
export function elementalImpact(p,target,enemies,room){
 bindDefenses(enemies);const effects=[],boost=(1+relicStat(p,'dot'))*(p.effectScale??1);
 if(p.fire){
  const wide=p.evolutions?.fire==='ember',strong=p.evolutions?.fire==='flare';
  const radius=(40+15*p.fire)*(wide?1.2:1),blast=((18+7*(p.fire-1))*(p.effectScale??1)+p.damage*.4*(1+relicStat(p,'element')))*(1+relicStat(p,'fire'))*(strong?1.25:wide?.85:1)*.9;
  for(const e of enemies)if(grounded(e)&&near(e,target,radius)){
   const alive=e.hp>0;damage(e,blast);if(alive)markFireKill(e,fireFieldSpec(p));if(e.hp>0&&p.fire>=2){stack(e,'burnStacks',2,(6+3*(p.fire-2))*boost,6);if(p.fire>=3)e.burnField=fireFieldSpec(p);}
  }
  effects.push({x:target.x,y:target.y,r:radius,t:.22,color:'#ff9b49',instant:true});
 }
 if(p.poison&&target.hp>0){
  const lasting=p.evolutions?.poison==='ember',potent=p.evolutions?.poison==='flare';
  stack(target,'poisonStacks',lasting?4.5:potent?2:3,(p.poison===1?4.8:2+2*p.poison)*boost*(lasting?.8:potent?1.25:1),8);
  target.poisonRadius=30+12*p.poison;target.poisonLevel=p.poison;target.poisonGasDps=(2+2*p.poison)*boost;target.poisonBlast=24*boost;
  effects.push({x:target.x,y:target.y,r:18,t:.35,color:'#83ed79'});
 }
 return effects;
}
export function tickElements(room,dt,poisonLevel=0){bindDefenses(room.enemies);
 const effects=[],enemies=room.enemies;
 // Snapshot living gas sources: enemy iteration order must not change damage.
 const gas=enemies.filter(e=>e.hp>0&&grounded(e)&&e.poisonStacks?.length>=2).map(e=>{
  const times=e.poisonStacks.map(s=>s.time).sort((a,b)=>b-a);
  return {owner:e,x:e.x,y:e.y,r:e.poisonRadius,active:Math.min(dt,times[1]),dps:e.poisonGasDps??(2+2*e.poisonLevel)};
 });
 for(const e of enemies){
  for(const key of ['burnStacks','poisonStacks'])if(e[key]){
   if(key==='burnStacks'){
    // Advance to each pulse/expiration boundary, including large simulation steps.
    let remaining=dt;e.burnClock??=.5;e.burnAccrued??=0;
    while(remaining>1e-9&&e[key].length){const delta=Math.min(remaining,e.burnClock,...e[key].map(s=>s.time)),active=e[key].length;
     e.burnAccrued+=delta*e[key].reduce((n,s)=>n+s.dps,0);e.burnClock-=delta;remaining-=delta;for(const s of e[key])s.time=Math.max(0,s.time-delta);
     if(e.burnClock<1e-9||e[key].some(s=>s.time<1e-9)){const alive=e.hp>0;damage(e,e.burnAccrued);if(alive)markFireKill(e,e.burnField,active);if(e.burnAccrued>0&&alive)effects.push({x:e.x,y:e.y-25,text:'화상',t:.35,color:'#ffad62'});e.burnAccrued=0;if(e.burnClock<1e-9)e.burnClock=.5;}
     e[key]=e[key].filter(s=>s.time>1e-9);
    }
    if(!e[key].length){e.burnClock=.5;e.burnAccrued=0;}
   }else{for(const stack of e[key])damage(e,Math.min(dt,stack.time)*stack.dps,true);for(const stack of e[key])stack.time=Math.max(0,stack.time-dt);e[key]=e[key].filter(s=>s.time>0);}
  }
  if(grounded(e)){
   // Overlapping auras/ground flames use the strongest exposure, not their sum.
   damage(e,Math.max(0,...gas.filter(g=>g.owner!==e&&near(g,e,g.r)).map(g=>g.dps*g.active)),true);
   damage(e,Math.max(0,...(room.fireZones||[]).filter(z=>near(z,e,z.r)).map(z=>z.dps*Math.min(dt,z.time))));
  }
 }
 room.fireZones=(room.fireZones||[]).map(z=>({...z,time:Math.max(0,z.time-dt)})).filter(z=>z.time>0);
 // Each corpse explodes once, including a bounded chain through poisoned foes.
 let pending;do{pending=enemies.filter(e=>e.hp<=0&&e.poisonKilled&&(e.poisonLevel>=3||poisonLevel>=3)&&!e.corpseExploded);for(const e of pending){e.corpseExploded=true;for(const other of enemies)if(grounded(other)&&near(e,other,85))damage(other,e.poisonBlast??24,true);effects.push({x:e.x,y:e.y,r:85,t:.6,color:'#96ff72',groundBurst:true});}}while(pending.length);
 return effects;
}
export function drawElements(ctx,room,time=0){
 ctx.save();for(const z of room.fireZones||[]){drawGroundField(ctx,z,'fire',time);}
 for(const e of room.enemies){
  if(e.poisonStacks?.length>=2){drawGroundField(ctx,{x:e.x,y:e.y,r:e.poisonRadius},'gas',time);}
  if(e.poisonStacks?.length){ctx.fillStyle='#8dea77';ctx.font='11px Galmuri, monospace';ctx.fillText('독 '+e.poisonStacks.length,e.x-15,e.y+31);}
  if(e.burnStacks?.length){ctx.fillStyle='#ff9b49';ctx.fillRect(e.x-20,e.y-8,4,12);}
  if(e.frozen>0){ctx.fillStyle='#9ceaff66';ctx.strokeStyle='#c4f6ff';ctx.fillRect(e.x-22,e.y-30,44,52);ctx.strokeRect(e.x-22,e.y-30,44,52);}else if(e.frostStacks){ctx.fillStyle='#b4ecff';ctx.font='11px Galmuri, monospace';ctx.fillText('서리 '+e.frostStacks,e.x-15,e.y+40);}
  if(e.trialChampion){ctx.strokeStyle='#ca8cff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,29,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#dbb0ff';ctx.font='12px Galmuri, monospace';ctx.textAlign='center';ctx.fillText('시련의 용사',e.x,e.y-44);}
 }ctx.restore();
}
