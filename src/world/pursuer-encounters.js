import {seededRandom} from '../game/random.js';
import {blocked} from './terrain.js';
import {PURSUER} from '../combat/pursuer.js';

export function planPursuerEncounters(s){
 if(!s.key||s.pursuerVersion===1)return;s.pursuerVersion=1;if(s.practice||(s.generationVersion||0)<25)return;
 for(let floor=1;floor<=Math.min(7,s.floors.length-1);floor++){
  const random=seededRandom(((s.seed??1)^Math.imul(floor+1,0x41b5a135)^0x76c9d21)>>>0);
  const candidates=s.floors[floor].filter((r,index)=>r.type==='normal'&&!r.sealEngine&&!r.gate&&!r.hasChest&&!r.footprint&&!r.tutorial&&!r.deployed&&!r.pursuerEncounter&&r.enemies.length>=3&&r.enemies.length<128&&!(floor===s.floor&&index===s.room));
  if(!candidates.length||random()>=.55)continue;
  candidates[Math.floor(random()*candidates.length)].pursuerEncounter={version:1,state:'planned',enemyId:null,rewarded:false};
 }
}
export function activatePursuerEncounter(s,r){
 const plan=r.pursuerEncounter;if(!plan||plan.state!=='planned'||!s.key||s.practice||r.deployed)return false;
 const enemy=r.enemies.find(e=>['chaser','charger'].includes(e.type)&&!e.elite&&!e.summoned)||r.enemies.find(e=>!e.elite&&!e.summoned&&e.type!=='boss');
 const points=[];for(let y=105;y<=435;y+=35)for(let x=110;x<=850;x+=35)if(!blocked(x,y,PURSUER.radius,r.obstacles)&&Math.hypot(x-s.player.x,y-s.player.y)>=190&&r.enemies.every(e=>e===enemy||Math.hypot(x-e.x,y-e.y)>=52))points.push({x,y});
 if(!enemy||!points.length){plan.state='cancelled';return false;}
 points.sort((a,b)=>Math.hypot(a.x-480,a.y-270)-Math.hypot(b.x-480,b.y-270));
 const max=Math.min(2500,Math.ceil(enemy.max*2.4)),identity={id:enemy.id,...(enemy.rankingId!==undefined?{rankingId:enemy.rankingId}:{})};
 for(const key of Object.keys(enemy))delete enemy[key];
 Object.assign(enemy,identity,{type:'pursuer',role:'하강 추격',...points[0],hp:max,max,tier:s.floor,escapeDepth:s.floors.length-s.floor,balanceVersion:1,cd:1.2,spawnGrace:.9,xpReward:PURSUER.xp});
 plan.state='active';plan.enemyId=enemy.id;return true;
}
export function rewardPursuer(s,r,e,effects=[]){
 const plan=r.pursuerEncounter;if(s.practice||e.type!=='pursuer'||e.summoned||e.hp>0||!plan||plan.state!=='active'||plan.rewarded||plan.enemyId!==e.id)return false;
 plan.state='defeated';plan.rewarded=true;
 r.potionDropped=true;
 if(s.player.potions<5){s.player.potions++;}else(r.essences??=[]).push({id:'health',x:e.x+14,y:e.y});
 effects.push({x:e.x,y:e.y-60,t:1,color:'#d5c7ec',text:'봉인 추적자 격파 · 성장·회복 보상'});return true;
}
