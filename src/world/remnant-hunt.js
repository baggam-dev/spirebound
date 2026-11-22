import {seededRandom} from '../game/random.js';

export const REMNANT_PARTS=Object.freeze(['hand','foot','eye','nose','mouth']);
export const REMNANT_NAMES={hand:'손',foot:'발',eye:'눈',nose:'코',mouth:'입',core:'완전체'};
export const remnantSeal=s=>s?.remnantHuntVersion===1?s.floors[7]?.find(r=>r.remnantSeal)?.remnantSeal:null;
export const remnantFragments=s=>remnantSeal(s)?.defeated.length??0;
export const remnantBattleActive=r=>['hunt','whole','split'].includes(r.remnantBattle?.stage);
// Test the room graph with the boss room removed: no fragment may be behind its door.
export function remnantReachableRooms(rooms){
 const seen=new Set([0]),queue=[0];
 for(let i=0;i<queue.length;i++){const r=rooms[queue[i]];for(let j=0;j<rooms.length;j++)if(!seen.has(j)&&rooms[j].type!=='boss'&&Math.abs(r.x-rooms[j].x)+Math.abs(r.y-rooms[j].y)===1){seen.add(j);queue.push(j);}}
 return [...seen].filter(i=>i!==0);
}
export function remnantActor(part,id=0,stage='hunt',x=480,y=235){
 const base={hand:800,foot:950,eye:700,nose:800,mouth:850,core:4200}[part],hp=stage==='split'?Math.ceil(base*.65):base;
 return {id,type:'boss',variant:'demon',part,x,y,hp,max:hp,cd:1,tier:7,balanceVersion:1,bossHealthVersion:1,bossPowerVersion:18,remnantVersion:1,remnantHuntVersion:1};
}
export function remnantBattle(stage){return {stage,turn:0,attacks:[],flashes:[],partClocks:{}};}
export function planRemnantHunt(s){
 if(s.bossLayoutVersion!==1||s.remnantHuntVersion===1||s.key)return false;
 const rooms=s.floors[7],boss=rooms?.find(r=>r.type==='boss');
 // Only new, untouched layouts opt in; never replace an active or completed encounter.
 if(!boss?.demonPending||rooms.some(r=>r.seen)||boss.demon)return false;
 const reachable=remnantReachableRooms(rooms),random=seededRandom((s.seed??1)^0x72656d6e);
 const available=reachable.filter(i=>!rooms[i].rest);
 if(available.length<5)for(const i of reachable)if(!available.includes(i))available.push(i);
 if(available.length<5)return false;
 for(let i=available.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[available[i],available[j]]=[available[j],available[i]];}
 const locations=available.slice(0,5);s.remnantHuntVersion=1;
 boss.remnantSeal={version:1,rooms:locations,defeated:[]};boss.obstacles=[];
 for(const [n,i] of locations.entries()){
  const r=rooms[i],part=REMNANT_PARTS[n];r.type='normal';r.remnantPart=part;r.used=false;r.obstacles=[];r.enemies=[remnantActor(part)];r.nextEnemyId=1;r.deployed=true;
  for(const k of ['hasChest','chestUsed','rest','intro','objectPosition','chestPosition','sealEngine','supportEncounter','specialEncounter'])delete r[k];
  r.remnantBattle=remnantBattle('hunt');
 }
 return true;
}
export function canEnterRemnantRoom(s,index){
 const r=s.floors[s.floor]?.[index];return !r?.remnantSeal||s.key||r.used||remnantFragments(s)===5;
}
export function prepareRemnantPractice(s){
 const seal=remnantSeal(s);if(!seal||s.practice?.boss!=='demon')return false;
 for(const index of seal.rooms){const r=s.floors[7][index];r.enemies=[];r.used=true;r.remnantBattle=remnantBattle('done');}
 seal.defeated=[...REMNANT_PARTS];return true;
}
export function challengeRemnant(s,r){
 if(!r.remnantSeal||!canEnterRemnantRoom(s,s.room)||!r.demonPending||r.used||r.enemies.length)return false;
 r.demonPending=false;r.remnantBattle=remnantBattle('whole');r.enemies=[remnantActor('core',0,'whole')];r.nextEnemyId=1;r.bossTotalHp=4200;s.entryGrace=1;return true;
}
// Called after deaths are removed and before any generic boss completion/reward code.
export function advanceRemnantHunt(s,r,defeated){
 if(!r.remnantBattle||!defeated.some(e=>e.remnantHuntVersion===1))return null;
 r.remnantBattle.attacks=r.remnantBattle.attacks.filter(a=>r.enemies.some(e=>e.part===a.owner&&e.hp>0));
 if(r.enemies.some(e=>e.remnantHuntVersion===1&&e.hp>0))return null;
 if(r.remnantBattle.stage==='hunt'){
  const seal=remnantSeal(s);if(!seal.defeated.includes(r.remnantPart))seal.defeated.push(r.remnantPart);
  r.remnantBattle=remnantBattle('done');r.used=true;return 'remnantFragment';
 }
 if(r.remnantBattle.stage==='whole'){
  r.remnantBattle=remnantBattle('split');
  r.enemies=REMNANT_PARTS.map((part,id)=>remnantActor(part,id,'split',...[[270,180],[690,180],[480,120],[300,370],[660,370]][id]));
  r.nextEnemyId=5;r.bossTotalHp=r.enemies.reduce((n,e)=>n+e.max,0);s.projectiles=[];r.hazards=[];r.blasts=[];s.entryGrace=1;return 'remnantSplit';
 }
 if(r.remnantBattle.stage==='split'){r.remnantBattle=remnantBattle('done');return 'remnantComplete';}
 return null;
}
