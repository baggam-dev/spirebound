import {applyBoundDamage,criticalInstance} from './critical.js';
import {drawGroundField} from '../rendering/ground-visuals.js';
import {bindDefenses,enemyDamageFactor} from './enemy-defense.js';
import {relicStat} from '../progression/relics.js';
import {segmentBlocked} from '../world/terrain.js';
// Player effects are separate from hostile hazards. Fire triggers on first
// contact; poison also applies after piercing. Secondary arrows scale damage.
const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<=r;
const grounded=e=>e.phase!=='air'&&e.phase!=='splitJump'&&e.attackPhase!=='leap';
function damage(e,amount,poison=false,options={}){if(e.hp<=0||amount<=0)return 0;const before=e.hp;applyBoundDamage(e,amount,{source:poison?'poison':'fire',...options});if(poison&&before>0&&e.hp<=0)e.poisonKilled=true;return before-Math.max(0,e.hp);}
function stack(e,key,time,dps,cap,options={}){const list=e[key]??=[];list.push(criticalInstance(e,{time,dps},{amount:dps,...options}));if(list.length>cap)list.shift();}
function exposure(e,choices,poison,source){
 let best=null,power=0;
 for(const choice of choices){if(!(choice.amount>0))continue;const instance=criticalInstance(e,choice.instance),weighted=choice.amount*(instance.criticalSnapshot?.multiplier??1);if(weighted>power){power=weighted;best={amount:choice.amount,snapshot:instance.criticalSnapshot};}}
 if(best)damage(e,best.amount,poison,{snapshot:best.snapshot,source,procDepth:1});
}
export function fireFieldSpec(p){return p.fire>=3?{r:(35+40/3*p.fire)*(p.evolutions?.fire==='ember'?1.3:1),time:p.evolutions?.fire==='flare'?1:1.5,dps:30*(1+relicStat(p,'fire'))*(p.effectScale??1)}:null;}
export function markFireKill(e,spec,stacks=e.burnStacks?.filter(s=>s.time>0).length||0){if(e.hp<=0&&spec&&stacks>=3&&!e.fireFieldSpawned)e.pendingFireField??={...spec,...(e.burnField?.criticalSnapshot?{criticalSnapshot:e.burnField.criticalSnapshot}:{})};}
export function resolveFireFields(room){for(const e of room.enemies)if(e.hp<=0&&e.pendingFireField&&!e.fireFieldSpawned){e.fireFieldSpawned=true;const zones=room.fireZones??=[];zones.push({x:e.x,y:e.y,...e.pendingFireField});if(zones.length>24)zones.shift();delete e.pendingFireField;}}
export function elementalImpact(p,target,enemies,room,shot={}){
 bindDefenses(enemies);const effects=[],critical={player:p,packet:p.criticalPacket},boost=(1+relicStat(p,'dot'))*(p.effectScale??1);
 if(p.fire){
  const wide=p.evolutions?.fire==='ember',strong=p.evolutions?.fire==='flare';
  const radius=(40+15*p.fire)*(wide?1.3:1),blast=((19+7*(p.fire-1))*(p.effectScale??1)+p.damage*.4*(1+relicStat(p,'element')))*(1+relicStat(p,'fire'))*(strong?1.25:wide?.95:1)*.9;
  for(const e of enemies)if(grounded(e)&&near(e,target,radius)){
   const alive=e.hp>0,center=p.blastTip&&near(e,target,radius*(p.blastTip>=3?.5:.35))&&!segmentBlocked(target,e,room?.obstacles||[],1);
   const dealt=damage(e,blast*(center?(p.blastTip>=2?1.2:1.1):1),false,critical);if(alive)markFireKill(e,fireFieldSpec(p));
   if(e.hp>0&&p.fire>=2){stack(e,'burnStacks',2,(6+3*(p.fire-2))*boost,6,critical);if(p.fire>=3)e.burnField=criticalInstance(e,fireFieldSpec(p),critical);
    if(dealt>0&&p.emberMark&&e.burnStacks.length>=3&&!(e.emberCooldown>0)&&!segmentBlocked(target,e,room?.obstacles||[],1)){
     damage(e,blast*(p.emberMark>=2?.3:.15),false,critical);e.emberCooldown=p.emberMark>=3?1.4:2;
     effects.push({x:e.x,y:e.y,r:17,t:.25,duration:.25,color:'#f2b974',synergyEffect:'ember'});
    }
   }
  }
  effects.push({x:target.x,y:target.y,r:radius,t:.22,duration:.22,color:'#ff9b49',instant:true,playerBlast:'fire'});
 }
 if(p.poison&&target.hp>0){
  const lasting=p.evolutions?.poison==='ember',potent=p.evolutions?.poison==='flare';
  const infected=target.poisonStacks?.some(dot=>dot.time>0),duration=(lasting?4.5:potent?2:3)+(p.venomPenetration?.5:0),dps=(p.poison===1?4.8:2+2*p.poison)*boost*(lasting?.95:potent?1.25:1)*(p.venomPenetration>=2?1.1:1);
  stack(target,'poisonStacks',duration,dps,8,critical);delete target.sporeDot;
  if(p.venomPenetration>=3&&infected&&shot.venomPrimary&&shot.validDirect&&!(target.venomCooldown>0)){stack(target,'poisonStacks',duration,dps,8,critical);target.venomCooldown=1.5;}
  if(p.plagueSpore)target.sporeLevel=p.plagueSpore;
  target.poisonGasCritical=criticalInstance(target,{},critical);target.poisonBlastCritical=criticalInstance(target,{},critical);target.poisonRadius=30+12*p.poison;target.poisonLevel=p.poison;target.poisonGasDps=(2+2*p.poison)*boost;target.poisonBlast=24*boost;
  effects.push({x:target.x,y:target.y,r:18,t:.35,color:'#83ed79'});
 }
 return effects;
}
export function tickElements(room,dt,poisonLevel=0){bindDefenses(room.enemies);
 const effects=[],enemies=room.enemies;
 // Snapshot living gas sources: enemy iteration order must not change damage.
 const gas=enemies.filter(e=>e.hp>0&&grounded(e)&&e.poisonStacks?.length>=2).map(e=>{
  const times=e.poisonStacks.map(s=>s.time).sort((a,b)=>b-a);
  return {owner:e,x:e.x,y:e.y,r:e.poisonRadius,active:Math.min(dt,times[1]),dps:e.poisonGasDps??(2+2*e.poisonLevel),instance:e.poisonGasCritical??={}};
 });
 // Snapshot original sources before any spreading. Spore-only victims never
 // enter this list, and each source triggers at most once per simulation step.
 for(const e of enemies){e.emberCooldown=Math.max(0,(e.emberCooldown||0)-dt);e.venomCooldown=Math.max(0,(e.venomCooldown||0)-dt);e.sporeCooldown=Math.max(0,(e.sporeCooldown||0)-dt);}
 for(const source of gas){const e=source.owner;if(!e.sporeLevel||e.sporeCooldown>0)continue;
  const radius=Math.min(source.r,e.sporeLevel>=3?72:48),dot=e.poisonStacks.filter(n=>n.time>0).sort((a,b)=>b.dps-a.dps)[0];if(!dot)continue;
  const targets=enemies.filter(n=>n!==e&&n.hp>0&&grounded(n)&&!n.poisonStacks?.some(d=>d.time>0)&&!n.sporeDot&&near(n,e,radius)&&!segmentBlocked(e,n,room.obstacles||[],1)).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y)).slice(0,e.sporeLevel>=2?2:1);
  if(targets.length){for(const n of targets){n.sporeDot={time:1.5,dps:dot.dps*.5,...(dot.criticalSnapshot?{criticalSnapshot:dot.criticalSnapshot}:{})};effects.push({x:e.x,y:e.y,toX:n.x,toY:n.y,t:.3,duration:.3,color:'#a6cc83',synergyEffect:'spore'});}e.sporeCooldown=2;}
 }
 for(const e of enemies){
  if(e.sporeDot){const dot=e.sporeDot;if(e.hp>0&&grounded(e))damage(e,Math.min(dt,dot.time)*dot.dps,false,{snapshot:criticalInstance(e,dot,{amount:Math.min(dt,dot.time)*dot.dps}).criticalSnapshot,source:'spore',procDepth:1});dot.time=Math.max(0,dot.time-dt);if(!dot.time)delete e.sporeDot;}
  for(const key of ['burnStacks','poisonStacks'])if(e[key]){
   if(key==='burnStacks'){
    // Advance to each pulse/expiration boundary, including large simulation steps.
    let remaining=dt;e.burnClock??=.5;e.burnAccrued??=0;
    while(remaining>1e-9&&e[key].length){const delta=Math.min(remaining,e.burnClock,...e[key].map(s=>s.time)),active=e[key].length;
     e.burnComponents??=[];
     for(const dot of e[key]){
      if(!(delta*dot.dps>0))continue;const snapshot=criticalInstance(e,dot).criticalSnapshot;
      let component=e.burnComponents.find(c=>c.criticalSnapshot?.critical===snapshot?.critical&&c.criticalSnapshot?.multiplier===snapshot?.multiplier);
      if(!component){component={amount:0,...(snapshot?{criticalSnapshot:snapshot}:{})};e.burnComponents.push(component);}component.amount+=delta*dot.dps;
     }
     e.burnAccrued+=delta*e[key].reduce((n,s)=>n+s.dps,0);e.burnClock-=delta;remaining-=delta;for(const s of e[key])s.time=Math.max(0,s.time-delta);
     if(e.burnClock<1e-9||e[key].some(s=>s.time<1e-9)){
      const alive=e.hp>0,components=e.burnComponents.map(c=>({amount:c.amount,snapshot:c.criticalSnapshot})),legacy=e.burnAccrued-components.reduce((n,c)=>n+c.amount,0);
      if(legacy>1e-9)components.push({amount:legacy});
      damage(e,e.burnAccrued,false,{source:'burn',components,procDepth:1});
      if(alive)markFireKill(e,e.burnField,active);if(e.burnAccrued>0&&alive)effects.push({x:e.x,y:e.y-25,text:'화상',t:.35,color:'#ffad62'});e.burnAccrued=0;e.burnComponents=[];if(e.burnClock<1e-9)e.burnClock=.5;
     }
     e[key]=e[key].filter(s=>s.time>1e-9);
    }
    if(!e[key].length){e.burnClock=.5;e.burnAccrued=0;delete e.burnComponents;}
   }else{for(const stack of e[key])damage(e,Math.min(dt,stack.time)*stack.dps,true,{snapshot:criticalInstance(e,stack,{amount:Math.min(dt,stack.time)*stack.dps}).criticalSnapshot,procDepth:1});for(const stack of e[key])stack.time=Math.max(0,stack.time-dt);e[key]=e[key].filter(s=>s.time>0);}
  }
  if(grounded(e)){
   // Overlapping auras/ground flames use the strongest exposure, not their sum.
   exposure(e,gas.filter(g=>g.owner!==e&&near(g,e,g.r)).map(g=>({amount:g.dps*g.active,instance:g.instance})),true,'poisonGas');
   exposure(e,(room.fireZones||[]).filter(z=>near(z,e,z.r)).map(z=>({amount:z.dps*Math.min(dt,z.time),instance:z})),false,'fireField');
  }
 }
 room.fireZones=(room.fireZones||[]).map(z=>({...z,time:Math.max(0,z.time-dt)})).filter(z=>z.time>0);
 // Each corpse explodes once, including a bounded chain through poisoned foes.
 let pending;do{pending=enemies.filter(e=>e.hp<=0&&e.poisonKilled&&(e.poisonLevel>=3||poisonLevel>=3)&&!e.corpseExploded);for(const e of pending){e.corpseExploded=true;for(const other of enemies)if(grounded(other)&&near(e,other,85))damage(other,e.poisonBlast??24,true,{snapshot:e.poisonBlastCritical?.criticalSnapshot,source:'poisonCorpse',procDepth:1});effects.push({x:e.x,y:e.y,r:85,t:.6,color:'#96ff72',groundBurst:true});}}while(pending.length);
 return effects;
}
export function drawElements(ctx,room,time=0,reduced=false){
 ctx.save();for(const z of room.fireZones||[]){drawGroundField(ctx,z,'fire',time,reduced);}
 for(const e of room.enemies){
  if(e.poisonStacks?.length>=2){drawGroundField(ctx,{x:e.x,y:e.y,r:e.poisonRadius},'gas',time,reduced);}
  if(e.poisonStacks?.length){ctx.fillStyle='#8dea77';ctx.font='11px Galmuri, monospace';ctx.fillText('독 '+e.poisonStacks.length,e.x-15,e.y+31);}
  if(e.sporeDot){ctx.fillStyle='#a6cc83';ctx.fillRect(e.x+12,e.y-18,3,3);}
  if(e.burnStacks?.length){ctx.fillStyle='#ff9b49';ctx.fillRect(e.x-20,e.y-8,4,12);}
  if(e.frozen>0){drawSoftField(ctx,e.x,e.y-3,32,'#9ceaff',.31);ctx.fillStyle='#d8f5ff99';for(const [dx,dy] of [[-17,-16],[15,-7],[-13,12],[12,16]]){ctx.fillRect(e.x+dx,e.y+dy,2,6);ctx.fillRect(e.x+dx-2,e.y+dy+2,6,2);}}else if(e.frostStacks){ctx.fillStyle='#b4ecff';ctx.font='11px Galmuri, monospace';ctx.fillText('서리 '+e.frostStacks,e.x-15,e.y+40);}
  if(e.trialChampion){drawSoftField(ctx,e.x,e.y-3,34,'#b98bdf',.31);ctx.fillStyle='#dbb0ff';ctx.fillRect(e.x-2,e.y-36,4,4);ctx.font='12px Galmuri, monospace';ctx.textAlign='center';ctx.fillText('시련의 용사',e.x,e.y-44);}
 }ctx.restore();
}
import {drawSoftField} from '../rendering/ground-visuals.js';
