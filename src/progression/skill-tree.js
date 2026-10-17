import {fairyTrio} from './skill-overhaul.js';
import {synergyIds,synergyAllowed,shardMultiplier} from './synergies.js';
import {runRandom} from '../game/random.js';
export const mainSkills=['fire','frost','poison','chain','precision'];
export const supportSkills=['split','pierce','haste','power','repeat','aura','homing','ultimate','weakpoint','finisher','rollMastery','sunFairy','snowFairy','stormFairy','fairyKing',...synergyIds];
export const skillIds=[...mainSkills,...supportSkills];
export const skillPoints=p=>skillIds.reduce((n,id)=>n+(p[id]||0),0);
export const allowedSkill=(p,id)=>id==='ultimate'?false:id==='fairyKing'?fairyTrio(p):synergyAllowed(p,id)&&(!mainSkills.includes(id)||!p.mainSkill||p.mainSkill===id);
export function mainChoices(s,random=()=>runRandom(s),reroll=false){
 if(s.player.mainSkill)return [];
 if(!reroll&&s.mainChoices?.length===3)return s.mainChoices;
 const pool=[...mainSkills],chosen=[];while(chosen.length<3)chosen.push(pool.splice(Math.min(pool.length-1,Math.floor(random()*pool.length)),1)[0]);
 s.mainChoices=chosen;return chosen;
}
export function rerollMain(s){if(s.status!=='playing'||s.player.mainSkill||(s.rerolls??1)<=0||!(s.pendingLevels+mainSkills.reduce((n,id)=>n+(s.player[id]||0),0)))return false;mainChoices(s,()=>runRandom(s),true);s.rerolls=(s.rerolls??1)-1;return true;}
// Selection is explicit: old multi-element builds refund the branches discarded.
export function chooseMain(s,id){
 const p=s.player;if(s.status!=='playing'||p.mainSkill||!mainSkills.includes(id)||!(s.pendingLevels+mainSkills.reduce((n,k)=>n+(p[k]||0),0)))return false;
 if(s.mainChoices&&!s.mainChoices.includes(id))return false;
 for(const k of mainSkills)if(k!==id){s.pendingLevels+=p[k]||0;p[k]=0;if(p.evolutions)delete p.evolutions[k];}
 if(!p[id]){if(!s.pendingLevels)return false;p[id]=1;s.pendingLevels--;s.levelQueue?.shift();}
 p.mainSkill=id;s.choices=null;delete s.mainChoices;return true;
}
export function steerArrow(b,enemies,obstacles,dt,blocked){
 if(!b.homing)return;
 const target=enemies.filter(e=>e.hp>0&&!b.hit.includes(e.id)&&e.phase!=='air'&&e.phase!=='splitJump'&&e.attackPhase!=='leap'&&!blocked(b,e,obstacles,3)).sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];
 if(!target)return;const current=Math.atan2(b.vy,b.vx),aim=Math.atan2(target.y-b.y,target.x-b.x),delta=Math.atan2(Math.sin(aim-current),Math.cos(aim-current)),angle=current+Math.max(-2.8*dt,Math.min(2.8*dt,delta)),speed=Math.hypot(b.vx,b.vy);b.vx=Math.cos(angle)*speed;b.vy=Math.sin(angle)*speed;
}


export function skillGrade(id){return mainSkills.includes(id)?'main':['homing','ultimate','aura','repeat','rollMastery','sunFairy','snowFairy','stormFairy','fairyKing'].includes(id)?'unique':['split'].includes(id)?'rare':'normal';}
export const gradeLabels={main:'메인',normal:'일반 보조',rare:'레어 보조',unique:'유니크 보조'};
export function frostShatter(p,e,projectiles){
 const frozen=e.frozen>0||e.frozenDeath,stacks=frozen?3:e.frostStackTime>0?e.frostStacks||0:0;
 if(!p.frost||e.hp>0||!stacks||e.frostShattered||e.passiveKilled)return false;e.frostShattered=true;const count=p.frost>=3&&frozen?12:6,size=[.5,1,1.5][Math.min(3,stacks)-1];
 for(let i=0;i<count;i++){const a=i*Math.PI*2/count;projectiles.push({x:e.x,y:e.y,vx:Math.cos(a)*480,vy:Math.sin(a)*480,life:p.shardHone>=2?2.3:2,enemy:false,frostShard:true,shardSize:size,element:'frost',elemental:true,damageScale:.3+.05*Math.min(4,p.frost),shardBoost:shardMultiplier(p,frozen),pierce:0,hit:Number.isInteger(e.id)?[e.id]:[]});}return true;
}
