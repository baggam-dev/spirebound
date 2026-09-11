import {skillPoints} from './skill-tree.js';
import {seededRandom} from './random.js';
export const relics=[
 {id:'lens',name:'정찰병의 망원경',description:'280 이상 떨어진 적 직격 +20% · 140 미만의 적 직격 -20%'},
 {id:'boots',name:'순례자의 장화',description:'이동속도 +8% · 화살 직격 피해 -12%'},
 {id:'iron',name:'철의 부적',description:'보호막 재충전 8초 단축 (최소 12초) · 회피 재사용 25초',requires:p=>p.armor>0},
 {id:'ember',name:'불씨 등불',description:'화상/중첩 독 초당 피해 +25% · 화살 직격 피해 -10%',requires:p=>p.fire>0||p.poison>0},
 {id:'rain',name:'비를 부르는 종',description:'화살비 재사용 20초 · 기본 공격 간격 +10%',requires:p=>skillPoints(p)>=5}
];
export function relicInfo(id){return relics.find(r=>r.id===id);}
export function offerRelics(s,room){
 if(room.relicOffers)return;
 const random=seededRandom((s.seed??1)^((s.floor+1)*73471)),pool=relics.filter(r=>r.id!==s.player.relic&&(!r.requires||r.requires(s.player)));
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 room.relicOffers=pool.slice(0,3).map(r=>r.id);room.relicClaimed=false;
}
export function claimRelic(s,id){
 const r=s.floors[s.floor][s.room];
 if(s.status!=='playing'||r.type!=='boss'||!r.used||r.enemies.length||r.relicClaimed||!r.relicOffers||id!=='skip'&&!r.relicOffers.includes(id))return false;
 if(id!=='skip')s.player.relic=id;r.relicClaimed=true;return true;
}
export function directRelicFactor(p,e){if(p.relic==='boots')return .88;if(p.relic==='ember')return .9;if(p.relic==='lens'){const d=Math.hypot(p.x-e.x,p.y-e.y);return d>=280?1.2:d<140?.8:1;}return 1;}
export function movementSpeed(p){return p.speed*(1+(p.bonusMove||0))*(p.evolutions?.haste==='stride'?1.12:1)*(p.relic==='boots'?1.08:1);}
export function dodgeCooldown(p){return p.relic==='iron'?25:20;}
