import {hasFairy} from './skill-overhaul.js';
import {CROSSBOW} from '../combat/combat-tuning.js';
import {seededRandom} from '../game/random.js';
export const relics=[
 {id:'openingWhetstone',name:'선봉의 숫돌',description:'체력이 가득 찬 적에게 화살 직격 피해 +20%',stats:{}},
 {id:'thornBuckle',name:'가시 버클',description:'실제 피격 시 반경 80 반격 · 평타 100% · 재사용 2초',stats:{}},
 {id:'ritualKnot',name:'의식의 매듭',description:'액티브 재사용 시간 15% 감소 · 궁극기·구르기 제외',stats:{utilityCooldown:.15}},
 {id:'fairyWhistle',name:'은빛 호루라기',description:'보유 요정·요정왕 피해 +20%',stats:{fairyDamage:.2}},
 {id:'phoenixReliquary',name:'불사조의 성유골',description:'원정당 1회 죽음 방지 · 2하트 회복 · 1.5초 무적',grade:'rare',weight:.6,stats:{}},
 {id:'windSeal',name:'바람의 인장',description:'20처치마다 1하트 회복',stats:{}},
 {
  "id": "lens",
  "name": "정찰병의 망원경",
  "description": "280 이상 떨어진 적 직격 +20%",
  "stats": {}
 },
 {
  "id": "boots",
  "name": "순례자의 장화",
  "description": "이동속도 +8%",
  "stats": {
   "move": 0.08
  }
 },
 {
  "id": "iron",
  "name": "철의 부적",
  "description": "장비 보호막 재충전 8초 단축",
  "stats": {
   "shield": 8
  }
 },
 {
  "id": "ember",
  "name": "불씨 등불",
  "description": "화상·독 피해 +25%",
  "stats": {
   "dot": 0.25
  }
 },
 {
  "id": "rain",
  "name": "비를 부르는 종",
  "description": "궁극기 재사용 시간 20% 감소",
  "stats": {
   "ultimateCooldown": 0.2
  }
 },
 {
  "id": "fang",
  "name": "거인의 송곳니",
  "description": "화살 직격 피해 +15%",
  "stats": {
   "direct": 0.15
  }
 },
 {
  "id": "ruby",
  "name": "붉은 룬",
  "description": "화살 직격·속성 피해 +10%",
  "stats": {
   "damage": 0.1
  }
 },
 {
  "id": "quiver",
  "name": "바람깃 화살통",
  "description": "공격속도 +15%",
  "stats": {
   "attack": 0.15
  }
 },
 {
  "id": "feather",
  "name": "새벽 깃털",
  "description": "이동속도 +10%",
  "stats": {
   "move": 0.1
  }
 },
 {
  "id": "hourglass",
  "name": "역행 모래시계",
  "description": "궁극기 재사용 시간 15% 감소",
  "stats": {
   "ultimateCooldown": 0.15
  }
 },
 {
  "id": "crown",
  "name": "폭우의 왕관",
  "description": "궁극기 피해 +35%",
  "stats": {
   "ultimateDamage": 0.35
  }
 },
 {
  "id": "comet",
  "name": "혜성의 꼬리",
  "description": "구르기 거리 +50%",
  "stats": {
   "blinkRange": 0.5
  }
 },
 {
  "id": "moon",
  "name": "달빛 나침반",
  "description": "구르기 재사용 시간 20% 감소",
  "stats": {
   "blinkCooldown": 0.2
  }
 },
 {
  "id": "heart",
  "name": "생명의 씨앗",
  "description": "최대 체력 +1 · 획득 시 1하트 회복",
  "stats": {}
 },
 {
  "id": "chalice",
  "name": "은빛 성배",
  "description": "물약 회복량 +1하트",
  "stats": {
   "potion": 1
  }
 },
 {
  "id": "bastion",
  "name": "수호자의 문장",
  "description": "장비 보호막 재충전 5초 단축",
  "stats": {
   "shield": 5
  }
 },
 {
  "id": "blade",
  "name": "검무의 반지",
  "description": "베르가스 참격 피해 +30%",
  "stats": {
   "auraDamage": 0.3
  }
 },
 {
  "id": "orbit",
  "name": "궤도의 팔찌",
  "description": "베르가스 요격 사거리 +20%",
  "stats": {
   "auraRange": 0.2
  }
 },
 {
  "id": "coal",
  "name": "영원의 숯",
  "description": "화상·독 피해 +30%",
  "stats": {
   "dot": 0.3
  }
 },
 {
  "id": "sun",
  "name": "태양 파편",
  "description": "화염 폭발·장판 피해 +25%",
  "stats": {
   "fire": 0.25
  }
 },
 {
  "id": "prism",
  "name": "원소의 결정",
  "description": "화염·독·서리·번개 피해 +20%",
  "stats": {
   "element": 0.2
  }
 },
 {
  "id": "hunter",
  "name": "왕 사냥꾼의 증표",
  "description": "보스 대상 직격 피해 +25%",
  "stats": {}
 },
 {
  "id": "execution",
  "name": "황혼의 칼날",
  "description": "체력 30% 이하 적 직격 피해 +30%",
  "stats": {}
 },
 {
  "id": "magnet",
  "name": "수집 자석",
  "description": "경험치·정수 획득 반경 +70",
  "stats": {
   "pickup": 70
  }
 },
 {
  "id": "halo",
  "name": "순백의 고리",
  "description": "베르가스 재사용 15% 감소 · 구저장 계승 수호 재충전 15초 단축",
  "stats": {
   "auraShield": 15
  }
 }
, ...[
{id:'sunFairy',name:'태양요정',description:'유니크 · 1.5초마다 주황 유도탄 · 공격력 40% + 3초간 60% 화상'},
{id:'snowFairy',name:'눈꽃요정',description:'유니크 · 1.5초마다 하늘 유도탄 · 공격력 50% + 2초 이동 둔화 25%'},
{id:'stormFairy',name:'번개요정',description:'유니크 · 1.5초마다 노랑 유도탄 · 공격력 80% + 주변 1체에 절반 피해'},
{id:'afterimage',name:'잔상의 망토',description:'유니크 · 구르기 무적시간 +0.05초',stats:{blinkInvulnerability:.05}},
{id:'orbitBlades',name:'궤도 칼날',description:'유니크 · 회전 칼날 2개 · 공격력 50% · 적당 0.6초 간격'},
{id:'voidBell',name:'공허의 종',description:'유니크 · 12초마다 가까운 적 주변을 끌어모음 · 보스 제외'}
].map(r=>({...r,grade:'unique',weight:.4}))
];
export const relicInfo=id=>relics.find(r=>r.id===id);
export const ownedRelics=p=>[...new Set([...(p.relics||[]),...(p.relic?[p.relic]:[]),...(p.unique?['windSeal']:[])])];
export const hasRelic=(p,id)=>ownedRelics(p).includes(id);
export function removeRelic(p,id){if(!hasRelic(p,id))return false;p.relics=ownedRelics(p).filter(key=>key!==id);delete p.relic;if(id==='windSeal'){p.unique=false;p.leechKills=0;}if(id==='heart'){p.max=Math.max(1,p.max-1);p.hp=Math.min(p.hp,p.max);}return true;}
export const relicStat=(p,key)=>ownedRelics(p).reduce((n,id)=>n+(relicInfo(id)?.stats?.[key]||0),0);
export const relicSummary=p=>ownedRelics(p).map(id=>relicInfo(id)?.name).filter(Boolean).join(' · ')||'없음';
export function grantRelic(p,id){if(!relicInfo(id)||hasRelic(p,id))return false;p.relics=[...ownedRelics(p),id];delete p.relic;if(id==='heart'){p.max++;p.hp=Math.min(p.max,p.hp+1);}return true;}
export function offerRelics(s,room){if(room.relicOffers)return;const random=seededRandom((s.seed??1)^((s.floor+1)*73471)^(s.room*1877)),pool=relics.filter(r=>!['sunFairy','snowFairy','stormFairy'].includes(r.id)&&!hasRelic(s.player,r.id));room.relicOffers=[];while(pool.length&&room.relicOffers.length<3){const chosen=weightedRelic(pool,random);room.relicOffers.push(chosen.id);pool.splice(pool.indexOf(chosen),1);}room.relicClaimed=false;}
export function claimRelic(s,id){const r=s.floors[s.floor][s.room];if(s.status!=='playing'||!r.used||r.enemies.length||r.relicClaimed||!r.relicOffers||id!=='skip'&&!r.relicOffers.includes(id))return false;if(id!=='skip'&&!grantRelic(s.player,id))return false;r.relicClaimed=true;return true;}
export function directRelicFactor(p,e,arrow=false){let factor=1+relicStat(p,'direct');if(hasRelic(p,'lens')&&Math.hypot(p.x-e.x,p.y-e.y)>=280)factor*=1.2;if(hasRelic(p,'hunter')&&e.type==='boss')factor*=1.25;if(hasRelic(p,'execution')&&e.hp<=e.max*.3)factor*=1.3;if(arrow&&hasRelic(p,'openingWhetstone')&&e.hp>=e.max)factor*=1.2;return factor;}
export const utilityCooldown=(p,id=p.utility)=>({focus:25,firstAid:30,guardian:25}[id]??25)*(1-relicStat(p,'utilityCooldown'));
export const relicGrade=id=>relicInfo(id)?.grade||'normal';
export const relicGradeName=id=>({normal:'일반',rare:'레어',unique:'유니크'})[relicGrade(id)];
export function movementSpeed(p){return p.speed*hexFactor(p,'move')*(1+(p.bonusMove||0)+relicStat(p,'move')+(hasFairy(p,'snowFairy')?.05:0)+(p.fairyKing?.1:0)+(p.focusTime>0?.25:0))*(p.evolutions?.haste==='stride'?1.12:1);}
export const hexFactor=(p,key)=>p.hexes?.[key]??1;
export const dodgeCooldown=p=>Math.max(2.5,4*(1-relicStat(p,'blinkCooldown'))*hexFactor(p,'blink'));
export const blinkDistance=p=>140*(1+relicStat(p,'blinkRange'))*hexFactor(p,'reach');
export const ultimateCooldown=p=>(p.evolutions?.ultimate==='turret'?CROSSBOW.cooldown:25)*Math.max(.2,Math.pow(.9,p.ultimateEssences||0)*(1-relicStat(p,'ultimateCooldown'))*hexFactor(p,'ultimate'));

export const attackInterval=p=>.65/(1+(p.haste||0)*.1+(p.bonusAttack||0)+relicStat(p,'attack')+(hasFairy(p,'stormFairy')?.05:0)+(p.fairyKing?.15:0)+(p.focusTime>0?.7:0))/hexFactor(p,'attack')*(p.evolutions?.haste==='tempo'?.85:1)*(p.evolutions?.split==='focus'?1.15:1)/(p.fire>0?.62:1);

export function weightedRelic(pool,random=Math.random){let roll=random()*pool.reduce((n,r)=>n+(r.weight??1),0);for(const r of pool){roll-=r.weight??1;if(roll<0)return r;}return pool.at(-1);}
