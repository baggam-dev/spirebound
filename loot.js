import {relics,ownedRelics,grantRelic,relicInfo,weightedRelic} from './relics.js';
import {skills,applySkill} from './progression.js';
import {seededRandom} from './random.js';
import {encounter} from './encounters.js';
import {promoteElite} from './elites.js';
import {safeSpawn} from './terrain.js';
export const lootTable=[
 {id:'relic',name:'유물 1개',weight:8},
 {id:'heal',name:'체력 1칸 회복',weight:20},
 {id:'potion',name:'물약 1개',weight:20},
 {id:'elites',name:'함정 · 정예 3마리',weight:14,trap:true},
 {id:'speed',name:'이동속도 +2%',weight:10},
 {id:'attack3',name:'공격력 +3',weight:8},
 {id:'attackSpeed',name:'공격속도 +2%',weight:6},
 {id:'attack6',name:'공격력 +6',weight:5},
 {id:'support',name:'보조 기술 1레벨',weight:4},
 {id:'main',name:'메인 기술 1레벨',weight:2.5},
 {id:'boss',name:'함정 · 작은 보스',weight:1.5,trap:true},
 {id:'unique',name:'유니크 기술 1레벨',weight:1},
];
export const trialRelic={id:'relic',name:'유물 1개',weight:4};
export const lootInfo=id=>id==='relic'?trialRelic:lootTable.find(k=>k.id===id);
const roomOf=s=>s.floors[s.floor][s.room];
const skillPool=(p,id)=>skills.filter(k=>k.id!=='ultimate'&&(p[k.id]||0)<k.max&&(id==='main'?k.id===p.mainSkill:id==='unique'?k.grade==='unique':k.tree==='support'&&k.grade!=='unique'));
export function eligibleLoot(p,id){if(id==='relic')return ownedRelics(p).length<relics.length;if(id==='heal')return p.hp<p.max;if(['support','main','unique'].includes(id))return skillPool(p,id).length>0;return !!lootInfo(id);}
export function drawLoot(p,random,positive=false,excluded=[],trial=false){
 const pool=(trial?[...lootTable.filter(k=>k.id!=='relic'),trialRelic]:lootTable).filter(k=>(!positive||!k.trap)&&!excluded.includes(k.id)&&(!positive||eligibleLoot(p,k.id)));
 let roll=random()*pool.reduce((n,k)=>n+k.weight,0),item=pool.at(-1);for(const k of pool){roll-=k.weight;if(roll<0){item=k;break;}}
 if(!eligibleLoot(p,item.id))return drawLoot(p,random,true,excluded,trial);const result={id:item.id};if(item.id==='relic'){const available=relics.filter(r=>!ownedRelics(p).includes(r.id));result.relic=weightedRelic(available,random).id;}if(['support','main','unique'].includes(item.id)){const list=skillPool(p,item.id);result.skill=list[Math.floor(random()*list.length)].id;}if(item.id==='boss')result.boss=['warden','prism','slime'][Math.floor(random()*3)];return result;
}
const lootRandom=(s,salt=0)=>seededRandom(((s.seed??1)^((s.floor+1)*99173)^((s.room+1)*51787)^salt)>>>0);
export function prepareChest(s){const r=roomOf(s);if((r.type==='treasure'||r.hasChest)&&!(r.hasChest?r.chestUsed:r.used))r.chestReward??=drawLoot(s.player,lootRandom(s));return r.chestReward;}
export function prepareTrialLoot(s){const r=roomOf(s);if(r.trialState!=='reward'||r.enemies.length)return [];if(!r.trialOffers){const random=lootRandom(s,17417);r.trialOffers=[];for(let i=0;i<3;i++)r.trialOffers.push(drawLoot(s.player,random,true,r.trialOffers.map(k=>k.id),true));}return r.trialOffers;}
export function lootLabel(item){return (item.relic?'유물 · '+relicInfo(item.relic)?.name:lootInfo(item.id)?.name||'보상')+(item.skill?' · '+skills.find(k=>k.id===item.skill)?.name:'');}
export function applyLoot(s,item){
 const p=s.player,r=roomOf(s);let reward=item;
 // A saved offer can become capped while the player explores another room.
 if(!eligibleLoot(p,item.id)||item.skill&&(p[item.skill]||0)>=skills.find(k=>k.id===item.skill).max)reward=drawLoot(p,lootRandom(s,811),true);
 const id=reward.id;if(id==='relic'&&!grantRelic(p,reward.relic)){const available=relics.find(r=>!ownedRelics(p).includes(r.id));if(available){grantRelic(p,available.id);reward={id:'relic',relic:available.id};}else{p.damage+=3;reward={id:'attack3'};}}
 if(id==='heal')p.hp=Math.min(p.max,p.hp+1);
 if(id==='potion')p.potions++;
 if(id==='speed')p.bonusMove=(p.bonusMove||0)+.02;
 if(id==='attackSpeed')p.bonusAttack=(p.bonusAttack||0)+.02;
 if(id==='attack3'||id==='attack6'){p.damage+=id==='attack3'?3:6;p.weapon++;}
 if(reward.skill)applySkill(p,reward.skill);
 if(id==='elites'||id==='boss'){
  s.projectiles=[];r.fireZones=[];r.allyZone=null;r.hazards=[];r.blasts=[];s.entryGrace=1.2;
  const random=lootRandom(s,2617);
  if(id==='elites'){r.enemies=encounter(s.floor,random,r.obstacles).slice(0,3);r.enemies.forEach((e,i)=>{promoteElite(e,['explosive','guardian','volley'][i]);e.cd=1.5;e.spawnGrace=1.2;});}
  else{const kind=reward.boss,base=kind==='prism'?2100:kind==='slime'?1350:1155,native=kind==='prism'?4:kind==='slime'?6:2,max=Math.ceil(base*(s.floor+1)/native*.5);const e={id:0,type:'boss',x:480,y:300,hp:max,max,tier:s.floor,cd:2,stage:0,chestBoss:true,scale:.7,balanceVersion:1,bossHealthVersion:1,bossPowerVersion:18,spawnGrace:1.2};if(kind!=='warden')e.variant=kind;safeSpawn(e,r.obstacles,27);r.enemies=[e];}
  r.chestBattle='active';
 }
 r.lastLoot=reward;return reward;
}
export function openChest(s){const r=roomOf(s);if(s.status!=='playing'||(r.type!=='treasure'&&!r.hasChest)||(r.hasChest?r.chestUsed:r.used)||r.enemies.length)return false;const reward=prepareChest(s);if(r.hasChest)r.chestUsed=true;else r.used=true;applyLoot(s,reward);return true;}
export function claimTrialLoot(s,index){const r=roomOf(s);if(s.status!=='playing'||r.trialState!=='reward'||r.enemies.length||!Number.isInteger(index)||!r.trialOffers?.[index])return false;applyLoot(s,r.trialOffers[index]);r.trialState='done';return true;}
