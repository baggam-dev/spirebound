import {seededRandom} from '../game/random.js';
import {blocked} from './terrain.js';
import {supportTypes} from '../combat/support-profile.js';
const phase=s=>s.key?'descent':'ascent';
const occupied=r=>r.enemies.some(e=>['starBearer','gravityMage',...supportTypes].includes(e.type)&&e.hp>0);
const special=r=>['planned','active'].includes(r.specialEncounter?.state)||['planned','active'].includes(r.pursuerEncounter?.state);
export function planSupportEncounters(s){
 const key=phase(s);s.supportEncounterVersion??=1;s.supportPlannedPhases??=[];if(s.supportPlannedPhases.includes(key))return;s.supportPlannedPhases.push(key);
 if(s.practice||(s.generationVersion||0)<25)return;
 for(let floor=2;floor<=Math.min(7,s.floors.length-1);floor++)for(const [index,r] of s.floors[floor].entries()){
  if(r.type!=='normal'||r.sealEngine||r.gate||r.tutorial||r.hasChest||r.deployed||(!s.key&&(r.seen||r.used))||r.enemies.length<3||r.enemies.length>=64||occupied(r)||special(r)||(floor===s.floor&&index===s.room)||r.supportEncounter?.[key])continue;
  const random=seededRandom(((s.seed??1)^Math.imul(floor+1,0x1725a4d3)^Math.imul(index+1,0x39a7e113)^(s.key?0x416ab83:0x717eca))>>>0);if(random()>=.3)continue;
  (r.supportEncounter??={version:1})[key]={state:'planned',type:random()<.5?'ossuarySummoner':'choirCantor',enemyId:null};
 }
}
export function activateSupportEncounter(s,r){
 const plan=r.supportEncounter?.[phase(s)];if(!plan||plan.state!=='planned'||s.practice||r.deployed)return false;
 if(occupied(r)||special(r)){plan.state='cancelled';return false;}
 const eligible=e=>e.hp>0&&!e.elite&&!e.summoned&&e.type!=='boss'&&e.type!=='pursuer';
 const e=r.enemies.find(e=>['archer','scatter','laser','ricochet'].includes(e.type)&&eligible(e))||r.enemies.find(eligible),points=[];
 for(let y=95;y<=445;y+=35)for(let x=100;x<=870;x+=35)if(!blocked(x,y,19,r.obstacles)&&Math.hypot(x-s.player.x,y-s.player.y)>=160&&r.enemies.every(n=>n===e||Math.hypot(x-n.x,y-n.y)>=44))points.push({x,y});
 if(!e||!points.length){plan.state='cancelled';return false;}points.sort((a,b)=>Math.hypot(a.x-650,a.y-270)-Math.hypot(b.x-650,b.y-270));
 const max=Math.ceil(e.max*.9),identity={id:e.id,...(e.rankingId!==undefined?{rankingId:e.rankingId}:{})};for(const key of Object.keys(e))delete e[key];
 Object.assign(e,identity,{type:plan.type,role:'지원',...points[0],hp:max,max,tier:s.floor,escapeDepth:s.key?s.floors.length-s.floor:0,balanceVersion:1,cd:1.8,supportClock:2.5,spawnGrace:.7,xpReward:24,...(plan.type==='ossuarySummoner'?{supportSummons:0}:{supportHeals:0})});
 plan.state='active';plan.enemyId=e.id;return true;
}
export function retireSupportForReturn(s){for(const r of s.floors.flat()){const plan=r.supportEncounter?.ascent;if(plan&&['active','planned'].includes(plan.state)){plan.state='cancelled';plan.enemyId=null;}}}
export function recordSupportDefeat(s,r,e){const plan=r.supportEncounter?.[phase(s)];if(plan?.state==='active'&&plan.type===e.type&&plan.enemyId===e.id)plan.state='defeated';}
