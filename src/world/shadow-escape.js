import {seededRandom} from '../game/random.js';
import {encounter} from './encounters.js';
import {blocked,safeSpawn} from './terrain.js';
export const SHADOW_ESCAPE_DURATION=52;
export const SHADOW_WAVE_TIMES=[2,12,22,32,42];
export const SHADOW_BOSSES=['warden','prism','slime','commander','king'];
export const shadowBaseMax=(s,kind)=>({warden:1155,prism:2100,slime:1350,commander:8500,king:s.bossLayoutVersion===1?25600:18720})[kind];
const points=[110,210,310,650,750,850].flatMap(x=>[110,210,310,410].map(y=>[x,y]));
const spawnRadius=e=>e.type==='boss'?(e.variant==='slime'?[38,28,20][e.stage||0]:32):e.type==='brute'?24:19;
function spawnPoint(s,r,offset,radius=32){
 const candidates=points.map((_,i)=>points[(i+offset)%points.length]).map(([x,y])=>({x,y})),primaryCount=candidates.length;
 // Eight portals cannot hold fifteen arrivals. Use additional floor positions
 // before accepting any overlap, while leaving the central escape lane clear.
 for(let y=100;y<=440;y+=34)for(let x=100;x<=860;x+=38)if(Math.abs(x-480)>85)candidates.push({x,y});
 const free=candidates.filter(p=>!blocked(p.x,p.y,radius,r.obstacles)),living=r.enemies.filter(e=>e.hp>0);
 const playerGap=p=>Math.hypot(p.x-s.player.x,p.y-s.player.y);
 const actorGap=p=>Math.min(1000,...living.map(e=>Math.hypot(p.x-e.x,p.y-e.y)));
 const clearance=p=>Math.min(1000,...living.map(e=>Math.hypot(p.x-e.x,p.y-e.y)-radius-spawnRadius(e)));
 free.sort((a,b)=>actorGap(b)-actorGap(a)||playerGap(b)-playerGap(a));
 const p=candidates.slice(0,primaryCount).filter(p=>!blocked(p.x,p.y,radius,r.obstacles)&&playerGap(p)>=160&&actorGap(p)>85).sort((a,b)=>actorGap(b)-actorGap(a)||playerGap(b)-playerGap(a))[0]
  ||free.find(p=>playerGap(p)>=160&&actorGap(p)>85)
  ||free.find(p=>playerGap(p)>=160&&clearance(p)>=8)
  ||free.find(p=>clearance(p)>=8)
  ||free.sort((a,b)=>Math.min(playerGap(b),actorGap(b))-Math.min(playerGap(a),actorGap(a)))[0]
  ||{x:480,y:270};
 safeSpawn(p,r.obstacles,radius);return p;
}
export function shadowBoss(s,kind,id,point){
 const max=Math.ceil(shadowBaseMax(s,kind)*.7),e={id,type:'boss',...point,hp:max,max,cd:1.5,tier:kind==='warden'?1:kind==='prism'?3:kind==='slime'?5:kind==='commander'?8:9,balanceVersion:1,bossHealthVersion:1,bossPowerVersion:18,summoned:true,shadowBoss:1,shadowRootMax:max,spawnGrace:1.2};
 if(kind!=='warden')e.variant=kind;
 if(kind==='slime'){e.stage=0;e.shadowSplit=0;}
 if(kind==='commander'){e.bossPressureVersion=1;e.commander={phase:1,volleyClock:1.5,blinkClock:6,rainClock:6,snipeClock:5.5,strafeClock:3.5,strafeDirection:1,transition:0,blinkIndex:0,ricochetClock:3};}
 if(kind==='king'){e.bossPressureVersion=1;e.kingOverhaulVersion=1;e.resurrectionVersion=1;e.kingStage=3;}
 return e;
}
export function startShadowEscape(s,r){r.finalEscape={shadowVersion:1,elapsed:0,wave:0,ready:false};r.enemies=[];r.returnSealReleased=true;}
export function tickShadowEscape(s,r,dt){
 const state=r.finalEscape;if(!state||state.ready||!(dt>0)||!Number.isFinite(dt))return [];
 state.elapsed=Math.min(SHADOW_ESCAPE_DURATION,state.elapsed+dt);const events=[];
 while(state.wave<5&&state.elapsed>=SHADOW_WAVE_TIMES[state.wave]){
  const wave=state.wave,kind=SHADOW_BOSSES[wave],id=()=>{const n=Math.max(r.nextEnemyId||0,0,...r.enemies.map(e=>e.id+1));r.nextEnemyId=n+1;return n;};
  r.enemies.push(shadowBoss(s,kind,id(),spawnPoint(s,r,wave,kind==='slime'?38:32)));
  const random=seededRandom((s.seed??1)^Math.imul(wave+1,0x572381)),normal=encounter(7,random,r.obstacles,3).filter(e=>e.type!=='demonBat');
  for(const e of normal.slice(0,2))r.enemies.push({...e,id:id(),...spawnPoint(s,r,wave+2,spawnRadius(e)),summoned:true,shadowEscort:true,spawnGrace:1.2});
  state.wave++;events.push('finalWave');
 }
 if(state.elapsed>=SHADOW_ESCAPE_DURATION){state.ready=true;events.push('finalReady');}
 return events;
}
