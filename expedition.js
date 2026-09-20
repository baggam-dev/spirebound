export const enemyGuide={
 king:{name:'타락한 왕, 모르드',tip:'검은 왕 → 타락 → 마왕의 세 단계. 보라 전조를 피하고 검이 멈추면 공격하세요.'},
 astralSniper:{name:'별자리 저격수',tip:'고정된 조준선에서 벗어나 검기를 피하세요.'},
 gravityMage:{name:'인력술사',tip:'보라 원이 활성화되기 전에 벗어나세요. 점멸로 탈출할 수 있습니다.'},
 starKnight:{name:'성운 기사',tip:'전방 방패는 직격 피해를 줄입니다. 후방 공격과 장판·지속 피해로 공략하세요.'},
 starBearer:{name:'별무리 운반체',tip:'주변 적의 공격 준비를 가속합니다. 우선 처치하세요.'},
 royalGuard:{name:'망령 근위병',tip:'넓은 전방 베기를 사용합니다. 소환체는 보상을 주지 않습니다.'},
 pulseTurret:{name:'맥동 포탑',tip:'고리 탄막의 넓은 틈으로 이동하세요.'},
 riftHunter:{name:'균열 사냥꾼',tip:'예고된 직선 경로에서 벗어나세요.'},
 strafer:{name:'횡단 사수',tip:'측면으로 이동하며 평행 탄막을 발사합니다.'},
 ringcaster:{name:'고리술사',tip:'고리 탄막의 넓은 틈으로 통과하세요.'},
 ambusher:{name:'매복 사냥꾼',tip:'긴 돌진 예고 후 측면을 파고듭니다.'},
 chaser:{name:'추격자',tip:'가까이 붙어 접촉 피해를 줍니다. 장애물을 돌아 이동하세요.'},
 charger:{name:'돌진병',tip:'고정된 예고 방향으로 돌진합니다. 옆으로 움직여 피하세요.'},
 archer:{name:'연사 궁수',tip:'조준을 고정하고 연사합니다. 같은 방향으로 계속 걷는 것이 도움이 됩니다.'},
 scatter:{name:'산탄 사수',tip:'엇갈린 부채꼴 탄막. 가까이 붙으면 피할 공간이 줄어듭니다.'},
 brute:{name:'도약 거인',tip:'높은 체력, 근접 휘두르기와 도약. 착지 원 밖으로 이동하세요.'},
 laser:{name:'광선 포대',tip:'예고 후 굵은 광선이 방 끝까지 이어집니다. 장애물이 광선을 막습니다.'},
 ricochet:{name:'반사 사수',tip:'빠른 탄환이 벽에 한 번 반사됩니다. 등 뒤로 돌아오는 탄도 확인하세요.'},
 flower:{name:'독 꽃봉우리',tip:'움직이지 않습니다. 착탄 예고를 피하고 장판이 사라질 때까지 거리를 두세요.'},
 minislime:{name:'미니 슬라임',tip:'독성 군체의 소환체. 처치해도 경험치와 회복 보상을 주지 않습니다.'},
 warden:{name:'녹슨 탑의 파수꾼',tip:'원형·부채꼴·회전·십자포화와 내려찍기. 내려찍기는 목표 위치를 고정합니다.'},
 prism:{name:'프리즘의 수호자',tip:'반사 결정탄·오중 광선·회전 연사. 광선 예고 방향에서 벗어나세요.'},
 slime:{name:'독성 군체',tip:'거대 1 → 중형 2 → 소형 4. 모든 분열체를 처치해야 끝납니다.'}
};
export function enemyKey(e){return e.type==='boss'?(e.variant||'warden'):e.type;}
export function enemyName(e){return Object.hasOwn(enemyGuide,enemyKey(e))?enemyGuide[enemyKey(e)].name:'알 수 없는 적';}
export function observeRoom(s,room){
 for(const e of room.enemies){const key=enemyKey(e);if(!Object.hasOwn(enemyGuide,key))continue;const entry=(s.bestiary??={})[key]??={kills:0,traits:[]};if(e.elite&&!entry.traits.includes(e.elite))entry.traits.push(e.elite);}
}
export function recordDefeat(s,e){if(!Object.hasOwn(enemyGuide,enemyKey(e)))return;observeRoom(s,{enemies:[e]});const entry=s.bestiary?.[enemyKey(e)];if(entry)entry.kills++;}
export function recordHit(s,source,amount,blocked){
 if(!amount&&!blocked)return;
 const hit={source,time:s.elapsed,floor:s.floor+1,room:s.room,amount,blocked};
 (s.combatLog??=[]).push(hit);s.combatLog=s.combatLog.slice(-10);
 if(amount){s.lastHit=hit;const totals=s.metrics.floorDamage??=Array(s.floors.length).fill(0);totals[s.floor]=(totals[s.floor]||0)+amount;}
}
