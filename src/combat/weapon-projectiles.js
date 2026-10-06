import {ownedRelics} from '../progression/relics.js';
export const weaponLevels={fire:3,poison:3,frost:4,chain:3,precision:3,weakpoint:3,finisher:3,split:4,pierce:3,repeat:1,haste:5,power:5,homing:1};
// A small, serializable build snapshot: no actor, summon or mutable world state.
export function weaponSnapshot(p,origin=p,normal=false){
 const build={x:origin.x,y:origin.y,damage:p.damage,relics:ownedRelics(p),hexes:{...(p.hexes||{})},evolutions:{...(p.evolutions||{})}};
 delete build.evolutions.ultimate;
 for(const key of Object.keys(weaponLevels))build[key]=p[key]||0;
 if(normal)for(const key of ['fire','poison','frost','chain','precision','weakpoint','finisher','split','pierce','repeat','homing'])build[key]=0;
 return build;
}
export function emitWeaponVolley(projectiles,p,origin,target,side=1,turret=false){
 const a=Math.atan2(target.y-origin.y,target.x-origin.x),count=1+Math.min(4,p.split||0),first=projectiles.length;
 for(let i=0;i<count;i++){const offset=i===0?0:Math.ceil(i/2)*(i%2?side:-side),angle=a+offset*(p.evolutions?.split==='fan'?.25:p.evolutions?.split==='focus'?.055:.14);
  const b={x:origin.x,y:origin.y,vx:Math.cos(angle)*420,vy:Math.sin(angle)*420,enemy:false,elemental:true,element:p.fire?'fire':p.poison?'poison':p.frost?'frost':p.chain?'chain':p.precision?'precision':null,damageScale:i===0?1:(p.evolutions?.split==='fan'?.5:.45),homing:false,life:3,pierce:p.evolutions?.pierce==='impact'?0:(p.pierce||0)+(p.evolutions?.pierce==='depth'?2:0),hit:[],primary:i===0&&!turret,focused:!!p.focusTime&&!turret};
  if(turret){b.weapon=p;b.turretShot=true;}projectiles.push(b);
 }
 if(p.repeat)projectiles.push({...projectiles[first],hit:[],damageScale:.6,delay:.16,primary:false});
 return a;
}
export function emitSeeker(projectiles,p,origin,target,turret=false){
 const a=Math.atan2(target.y-origin.y,target.x-origin.x);
 projectiles.push({x:origin.x,y:origin.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,life:3,enemy:false,seeker:true,turretShot:turret,weapon:weaponSnapshot(p,origin,true),elemental:false,damageScale:1,homing:true,pierce:0,hit:[]});
}
// Storm arrows can make one deliberate turn after their first pierced target.
export function turnStormArrow(arrow,weapon,impact,enemies,blocked){
 if(!weapon.split||!weapon.pierce||arrow.hit.length!==1||arrow.pierce<0||arrow.frostShard||arrow.seeker)return false;
 const speed=Math.hypot(arrow.vx,arrow.vy);
 if(!speed)return false;
 const forward={x:arrow.vx/speed,y:arrow.vy/speed};
 const targets=enemies.filter(enemy=>enemy.hp>0&&!['air','splitJump'].includes(enemy.phase)&&enemy.attackPhase!=='leap'&&!arrow.hit.includes(enemy.id)).map(enemy=>{
  const dx=enemy.x-impact.x,dy=enemy.y-impact.y,distance=Math.hypot(dx,dy);
  return {enemy,distance,dot:(dx*forward.x+dy*forward.y)/distance};
 }).filter(({enemy,distance,dot})=>distance>0&&distance<=240&&dot>=.35&&dot<.985&&!blocked(impact,enemy));
 targets.sort((a,b)=>a.distance-b.distance||a.enemy.id-b.enemy.id);
 if(!targets.length)return false;
 const target=targets[0].enemy,angle=Math.atan2(target.y-impact.y,target.x-impact.x);
 arrow.vx=Math.cos(angle)*speed;arrow.vy=Math.sin(angle)*speed;
 return true;
}
// Ephemeral presentation is not part of the save; no phantom attacks after removal.
const endings=new WeakMap();
export function retireTurret(room,t){const list=endings.get(room)||[];list.push({x:t.x,y:t.y,aim:t.aim||0,time:.4});endings.set(room,list.slice(-4));}
export function tickTurretEndings(room,dt){endings.set(room,(endings.get(room)||[]).map(e=>({...e,time:e.time-dt})).filter(e=>e.time>0));}
export function turretEndings(room){return endings.get(room)||[];}
export function clearTurretEndings(room){endings.delete(room);}
