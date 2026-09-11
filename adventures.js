import {openChest,claimTrialLoot} from './loot.js';
import {heartContainer} from './health.js';
import {encounter} from './encounters.js';
import {seededRandom} from './random.js';
export const rewards=[{id:'weapon',name:'무기',description:'공격력 +3'},{id:'survival',name:'생존',description:'최대 하트 +1 (상한 10) / 1하트 회복 · 물약 +1'},{id:'skill',name:'기술',description:'기술 선택 1회 (경험치 레벨 유지)'}];
export function grantReward(s,id){if(s.status!=='playing'||!rewards.some(r=>r.id===id))return false;if(id==='weapon'){s.player.damage+=3;s.player.weapon++;}if(id==='survival'){if(!heartContainer(s.player))s.player.hp=Math.min(s.player.max,s.player.hp+1);s.player.potions++;}if(id==='skill')s.pendingLevels++;return true;}
export const claimTreasure=openChest;
export const eventOptions=[{id:'blood',name:'생명의 계약',description:'현재 하트 2칸 지불 → 보호막 장비 +2 (최소 1하트 유지)'},{id:'supply',name:'보급품 거래',description:'물약 1개 지불 → 바람의 인장 (12처치당 1하트)'},{id:'trial',name:'봉인된 시련',description:'보라색 시련 용사 3마리 · 층별 광폭 수준 · 체력과 공격 강화 · 완료 후 보상 1택 · 문은 열려 있음'}];
export function canChooseEvent(s,id){const r=s.floors[s.floor][s.room],p=s.player;return s.status==='playing'&&r.type==='event'&&!r.used&&!r.enemies.length&&!r.trialState&&(id==='blood'?p.hp>2:id==='supply'?p.potions>0&&!p.unique:id==='trial'&&!s.key);}
export function chooseEvent(s,id){if(!canChooseEvent(s,id))return false;const r=s.floors[s.floor][s.room],p=s.player;r.eventChoice=id;r.used=true;if(id==='blood'){p.hp-=2;p.armor+=2;}if(id==='supply'){p.potions--;p.unique=true;}if(id==='trial'){s.projectiles=[];s.entryGrace=.6;r.allyZone=null;r.fireZones=[];r.hazards=[];r.blasts=[];const random=seededRandom((s.seed||1)+s.floor*177+s.room);r.enemies=encounter(s.floor,random,r.obstacles,s.floor+1).slice(0,3);r.enemies.forEach(e=>{e.hp=e.max=Math.ceil(Math.max(e.max,Math.ceil((e.type==='brute'?120+s.floor*14:e.type==='flower'?66+s.floor*12:32+s.floor*16)*1.25)*2.8)*1.1);e.cd=1.5;e.trialChampion=true;});r.trialState='active';}return true;}
export const claimTrial=claimTrialLoot;
