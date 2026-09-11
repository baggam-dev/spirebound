export const mainSkills=['fire','frost','poison','chain'];
export const supportSkills=['split','pierce','haste','power','repeat','aura','homing'];
export const skillIds=[...mainSkills,...supportSkills];
export const skillPoints=p=>skillIds.reduce((n,id)=>n+(p[id]||0),0);
export const allowedSkill=(p,id)=>!mainSkills.includes(id)||!p.mainSkill||p.mainSkill===id;
// Selection is explicit: old multi-element builds refund the branches discarded.
export function chooseMain(s,id){
 const p=s.player;if(s.status!=='playing'||p.mainSkill||!mainSkills.includes(id)||!(s.pendingLevels+mainSkills.reduce((n,k)=>n+(p[k]||0),0)))return false;
 for(const k of mainSkills)if(k!==id){s.pendingLevels+=p[k]||0;p[k]=0;if(p.evolutions)delete p.evolutions[k];}
 if(!p[id]){if(!s.pendingLevels)return false;p[id]=1;s.pendingLevels--;}
 p.mainSkill=id;s.choices=null;return true;
}
export function steerArrow(b,enemies,obstacles,dt,blocked){
 if(!b.homing)return;
 const target=enemies.filter(e=>e.hp>0&&!b.hit.includes(e.id)&&e.phase!=='air'&&e.attackPhase!=='leap'&&!blocked(b,e,obstacles,3)).sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];
 if(!target)return;const current=Math.atan2(b.vy,b.vx),aim=Math.atan2(target.y-b.y,target.x-b.x),delta=Math.atan2(Math.sin(aim-current),Math.cos(aim-current)),angle=current+Math.max(-2.8*dt,Math.min(2.8*dt,delta)),speed=Math.hypot(b.vx,b.vy);b.vx=Math.cos(angle)*speed;b.vy=Math.sin(angle)*speed;
}

export const auraProfile=level=>({radius:55+15*level,dps:8*level});
export function skillGrade(id){return mainSkills.includes(id)?'main':id==='homing'?'unique':['split','repeat'].includes(id)?'rare':'normal';}
export const gradeLabels={main:'메인',normal:'일반 보조',rare:'레어 보조',unique:'유니크 보조'};
export function frostShatter(p,e,projectiles){
 if(!p.frost||e.hp>0||!(e.frozen>0||e.frozenDeath)||e.frostShattered)return false;
 e.frostShattered=true;for(let i=0;i<6;i++){const a=i*Math.PI/3;projectiles.push({x:e.x,y:e.y,vx:Math.cos(a)*320,vy:Math.sin(a)*320,life:2,enemy:false,frostShard:true,element:'frost',elemental:false,damageScale:1/3,pierce:0,hit:[]});}return true;
}
