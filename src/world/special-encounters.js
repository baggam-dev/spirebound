import {seededRandom} from '../game/random.js';
import {blocked} from './terrain.js';
import {promoteElite} from '../combat/elites.js';
import {relics,canGrantRelic,weightedRelic,grantRelic,relicInfo} from '../progression/relics.js';

export const SPECIAL_ENCOUNTER_VERSION=1;
export const ROAMING_XP=54;
const legacyFairies=['sunFairy','snowFairy','stormFairy'];
export const specialRoomEligible=r=>r.type==='normal'&&!r.seen&&!r.used&&!r.hasChest&&!r.tutorial&&!r.gate&&!r.specialEncounter&&r.enemies.length>=3&&r.enemies.length<128;
// One independent plan per floor; no combat-time spawn or world RNG consumption.
export function planSpecialEncounters(s){
 if(s.specialEncounterVersion===1)return;
 s.specialEncounterVersion=1;if(s.key||s.practice)return;
 for(let floor=1;floor<=Math.min(7,s.floors.length-1);floor++){
  if(s.floors[floor].some(r=>r.specialEncounter))continue;
  const random=seededRandom(((s.seed??1)^Math.imul(floor+1,0x65a71e35)^0x29baf01d)>>>0);
  const candidates=s.floors[floor].map((r,index)=>({r,index})).filter(({r,index})=>specialRoomEligible(r)&&!(floor===s.floor&&index===s.room));
  if(!candidates.length||random()>=.45)continue;
  const {r}=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];
  const choices=relics.filter(relic=>!legacyFairies.includes(relic.id)&&relic.id!=='crackedCrown'&&canGrantRelic(s.player,relic.id));
  const relic=random()<.2&&choices.length?weightedRelic(choices,random).id:null;
  r.specialEncounter={version:1,kind:'roamingElite',state:'planned',enemyId:null,relicId:relic,fallbackEssence:['attack','speed','health','haste','ultimate'][Math.floor(random()*5)],rewarded:false};
 }
}
export function activateSpecialEncounter(s,r){
 const plan=r.specialEncounter;
 if(!plan||plan.state!=='planned'||s.key||s.practice||!specialRoomEligible({...r,specialEncounter:null}))return false;
 const enemy=r.enemies.find(e=>e.type==='chaser'&&!e.elite&&!e.summoned)||r.enemies.find(e=>!e.elite&&!e.summoned&&e.type!=='boss');
 const points=[];for(let y=95;y<=445;y+=35)for(let x=90;x<=870;x+=35)if(!blocked(x,y,24,r.obstacles)&&Math.hypot(x-s.player.x,y-s.player.y)>=180&&r.enemies.every(e=>e===enemy||Math.hypot(x-e.x,y-e.y)>=44))points.push({x,y});
 if(!enemy||!points.length){plan.state='cancelled';return false;}
 points.sort((a,b)=>Math.hypot(a.x-480,a.y-270)-Math.hypot(b.x-480,b.y-270));
 enemy.type='chaser';enemy.role='유랑 정예';enemy.roamingElite=true;enemy.xpReward=ROAMING_XP;
 promoteElite(enemy,'guardian');enemy.max=Math.ceil(enemy.max*1.6);enemy.hp=enemy.max;enemy.x=points[0].x;enemy.y=points[0].y;enemy.cd=Math.max(1.2,enemy.cd||0);
 plan.state='active';plan.enemyId=enemy.id;return true;
}
export function retireSpecialEncounters(s){
 for(const r of s.floors.flat()){
  const plan=r.specialEncounter;if(!plan||!['planned','active'].includes(plan.state))continue;
  if(plan.state==='active'&&r.enemies.some(e=>e.roamingElite&&e.id===plan.enemyId))continue;
  plan.state='cancelled';plan.enemyId=null;
 }
}
// Generic defeat handling still owns normal XP and the guaranteed essence.
export function rewardSpecialEncounter(s,r,e,effects=[]){
 const plan=r.specialEncounter;
 if(s.practice||!plan||plan.kind!=='roamingElite'||plan.state!=='active'||plan.rewarded||plan.enemyId!==e.id||!e.roamingElite||e.hp>0||e.summoned)return null;
 plan.state='defeated';plan.rewarded=true;
 let event='roamingDefeated',text='유랑 정예 격파 · 추가 경험치·정수';
 if(plan.relicId){
  if(grantRelic(s.player,plan.relicId)){event='roamingRelic';text='유랑 유물 · '+relicInfo(plan.relicId).name;}
  else{(r.essences??=[]).push({id:plan.fallbackEssence,x:e.x+14,y:e.y});text='중복 유물 대신 정수 +1';}
 }
 effects.push({x:e.x,y:e.y-45,t:1,color:'#e5d4a5',text});return event;
}
