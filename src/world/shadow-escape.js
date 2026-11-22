import {seededRandom} from '../game/random.js';
import {encounter} from './encounters.js';
import {blocked,safeSpawn} from './terrain.js';
export const SHADOW_ESCAPE_DURATION=52;
export const SHADOW_WAVE_TIMES=[2,12,22,32,42];
export const SHADOW_BOSSES=['warden','prism','slime','commander','king'];
export const shadowBaseMax=(s,kind)=>({warden:1155,prism:2100,slime:1350,commander:8500,king:s.bossLayoutVersion===1?25600:18720})[kind];
const points=[[130,130],[830,130],[130,410],[830,410],[300,130],[660,410],[300,410],[660,130]];
function spawnPoint(s,r,offset){
 const candidates=points.map((_,i)=>points[(i+offset)%points.length]).map(([x,y])=>({x,y})).filter(p=>!blocked(p.x,p.y,40,r.obstacles));
 candidates.sort((a,b)=>Math.hypot(b.x-s.player.x,b.y-s.player.y)-Math.hypot(a.x-s.player.x,a.y-s.player.y));
 const p=candidates.find(p=>r.enemies.every(e=>e.hp<=0||Math.hypot(p.x-e.x,p.y-e.y)>85))||candidates[0]||{x:480,y:270};safeSpawn(p,r.obstacles,40);return p;
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
  r.enemies.push(shadowBoss(s,kind,id(),spawnPoint(s,r,wave)));
  const random=seededRandom((s.seed??1)^Math.imul(wave+1,0x572381)),normal=encounter(7,random,r.obstacles,3).filter(e=>e.type!=='demonBat');
  for(const e of normal.slice(0,2))r.enemies.push({...e,id:id(),...spawnPoint(s,r,wave+2),summoned:true,shadowEscort:true,spawnGrace:1.2});
  state.wave++;events.push('finalWave');
 }
 if(state.elapsed>=SHADOW_ESCAPE_DURATION){state.ready=true;events.push('finalReady');}
 return events;
}
