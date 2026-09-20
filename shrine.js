import {seededRandom} from './random.js';
import {encounter} from './encounters.js';
import {promoteElite} from './elites.js';
import {grantRelic,ownedRelics,relics,weightedRelic} from './relics.js';

export const incantations=[
 {id:'might',name:'거인의 축복',good:true,description:'공격력 +5'},
 {id:'rhythm',name:'바람의 박자',good:true,description:'공격속도 +8%'},
 {id:'stride',name:'순풍',good:true,description:'이동속도 +5%'},
 {id:'vitality',name:'생명의 맹세',good:true,description:'최대 체력 +1 · 현재 체력 +1'},
 {id:'mend',name:'재생의 빛',good:true,description:'체력 3하트 회복'},
 {id:'rain',name:'폭우의 부름',good:true,description:'궁극기 재사용 시간 10% 감소'},
 {id:'blink',name:'찰나의 축복',good:true,description:'점멸 재사용 시간 15% 감소'},
 {id:'reach',name:'먼 걸음',good:true,description:'점멸 거리 +15%'},
 {id:'ward',name:'고대의 수호',good:true,description:'장비 보호막 획득 · 이미 있으면 재충전 5초 단축'},
 {id:'relic',name:'잊힌 보물',good:true,description:'무작위 미소유 유물 1개'},
 {id:'frailty',name:'쇠약',good:false,description:'공격력 8% 감소'},
 {id:'torpor',name:'무거운 시위',good:false,description:'공격속도 8% 감소'},
 {id:'burden',name:'돌의 족쇄',good:false,description:'이동속도 5% 감소'},
 {id:'blood',name:'피의 대가',good:false,description:'현재 체력 2하트 상실 · 최소 1하트 유지'},
 {id:'silence',name:'침묵의 인장',good:false,description:'궁극기 재사용 시간 10% 증가'}
];
export const incantationInfo=id=>incantations.find(k=>k.id===id);
export const shrineLocked=r=>r.type==='shrine'&&!r.used&&!!r.shrineState;
const shrineRandom=s=>{let seed=((s.seed??1)^((s.floor+1)*73129)^((s.room+1)*29173))>>>0;seed=Math.imul(seed^(seed>>>16),0x45d9f3b);seed=Math.imul(seed^(seed>>>16),0x45d9f3b);return seededRandom((seed^(seed>>>16))>>>0);};

export function enterShrine(s){
 const r=s.floors[s.floor][s.room];if(r.type!=='shrine'||r.used)return;
 // Legacy unclaimed shrines get a encounter only when entered, preserving other rooms.
 if(!r.shrineState){const random=shrineRandom(s);r.enemies=encounter(s.floor,random,r.obstacles).slice(0,3);r.enemies.forEach((e,i)=>promoteElite(e,['explosive','guardian','volley'][i]));}
 r.shrineState=r.enemies.length?'active':'choice';
 if(r.shrineState==='choice')prepareIncantations(s);
}
export function prepareIncantations(s){
 const r=s.floors[s.floor][s.room];if(!shrineLocked(r)||r.enemies.some(e=>e.hp>0))return false;
 r.shrineState='choice';
 if(!r.incantations){const random=shrineRandom(s),pool=[...incantations];r.incantations=[];for(let i=0;i<2;i++)r.incantations.push(pool.splice(Math.floor(random()*pool.length),1)[0].id);
  const available=relics.filter(k=>!ownedRelics(s.player).includes(k.id));if(r.incantations.includes('relic')&&available.length)r.incantationRelic=weightedRelic(available,random).id;
 }return true;
}
export function claimIncantation(s,index){
 const r=s.floors[s.floor][s.room],p=s.player;
 if(s.status!=='playing'||r.shrineState!=='choice'||r.used||r.enemies.length||!Number.isInteger(index)||!r.incantations?.[index])return false;
 const id=r.incantations[index],h=p.hexes??={};const multiply=(key,value)=>h[key]=(h[key]??1)*value;
 if(id==='might')p.damage+=5;if(id==='rhythm')p.bonusAttack=(p.bonusAttack||0)+.08;if(id==='stride')p.bonusMove=(p.bonusMove||0)+.05;
 if(id==='vitality'){p.max++;p.hp++;}if(id==='mend')p.hp=Math.min(p.max,p.hp+3);
 if(id==='rain')multiply('ultimate',.9);if(id==='blink')multiply('blink',.85);if(id==='reach')multiply('reach',1.15);
 if(id==='ward'){if(!p.armor)p.armor=1;else p.shrineShield=(p.shrineShield||0)+5;}
 if(id==='relic'&&!grantRelic(p,r.incantationRelic)){const other=relics.find(k=>!ownedRelics(p).includes(k.id));if(other)grantRelic(p,other.id);else p.damage+=5;}
 if(id==='frailty')multiply('damage',.92);if(id==='torpor')multiply('attack',.92);if(id==='burden')multiply('move',.95);
 if(id==='blood')p.hp=Math.max(1,p.hp-2);if(id==='silence')multiply('ultimate',1.1);
 (p.incantations??=[]).push(id);r.incantationChoice=id;r.used=true;r.shrineState='done';return true;
}
