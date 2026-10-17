// One-time migration is separate from random offers: loading never rerolls a build.
export const fairyIds=['sunFairy','snowFairy','stormFairy'];
export const hasFairy=(p,id)=>!!p[id]||(p.relics||[]).includes(id)||p.relic===id;
export const fairyTrio=p=>fairyIds.every(id=>hasFairy(p,id));
export const bossesCleared=s=>s.floors.filter(f=>f.some(r=>r.type==='boss'&&r.used)).length;
export const utilityAvailable=s=>s.player.level>=5&&bossesCleared(s)>=1;
export const ultimateAvailable=s=>s.player.level>=8&&bossesCleared(s)>=2;
export function syncUnlocks(s){if(!s.player.ultimate&&ultimateAvailable(s)){s.player.ultimate=1;s.skill=0;}}
export function migrateSkillOverhaul(s){
 if(s.skillOverhaulVersion===1)return s;
 const p=s.player;p.evolutions??={};let refund=0;
 for(const [key,max] of [['pierce',2],['frost',3]])if(p[key]>max){refund+=p[key]-max;p[key]=max;}
 delete p.evolutions.pierce;delete p.evolutions.haste;
 // Existing projectiles/towers retain their paid build but lose retired branches.
 const weapons=s.floors.flat().flatMap(r=>[...(r.turrets||[]).map(t=>t.build),...r.enemies.map(e=>e.frostWeapon)]).concat((s.projectiles||[]).map(b=>b.weapon));
 for(const w of weapons)if(w){if(w.evolutions){delete w.evolutions.pierce;delete w.evolutions.haste;}w.pierce=Math.min(2,w.pierce||0);w.frost=Math.min(3,w.frost||0);}
 for(const id of fairyIds){p[id]=hasFairy(p,id)?1:0;}
 p.relics=(p.relics||[]).filter(id=>!fairyIds.includes(id));if(fairyIds.includes(p.relic))delete p.relic;
 p.fairyKing??=0;p.rollMastery??=0;
 s.pendingLevels=(s.pendingLevels||0)+refund;s.levelQueue??=[];for(let i=0;i<refund;i++)s.levelQueue.push(p.level);
 s.choices=null;s.ultimateOffer=false;s.dodge=Math.min(s.dodge||0,4);
 delete s.roll;s.skillOverhaulVersion=1;return s;
}
