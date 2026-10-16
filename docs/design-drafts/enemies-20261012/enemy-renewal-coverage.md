# 敵 외형 연결 현황

2026-10-15 · 도감30종 정적 소스 대조 · 런타임 검증 결과 아님

| 범위 | 도감 키 | PNG 연결 경로 |
|---|---|---|
| 기본7 | chaser, archer, charger, scatter, ricochet, laser, brute | grunt-sprite / brute 상세 렌더 |
| 독성2 | flower, minislime | flower-sprite / slime-sprite |
| 상층7 | astralSniper, gravityMage, starKnight, starBearer, royalGuard, pulseTurret, riftHunter | 각각 전용 sprite → upper-visuals |
| 악마5 | demonBat, spikeNest, demonSoldier, demonArcher, demonCaptain | 각각 전용 sprite → infernal-enemies |
| 귀환3 | strafer, ringcaster, ambusher | 각각 전용 sprite → pixel-world / return-enemies 효과 |
| 보스6 | warden, prism, slime, king, commander, demon | 전용 sprite / 모르도3단계·군단장2단계·대악마6부위 및 본체 레이어 |

기준은 src/world/expedition.js의 enemyGuide, 실제 렌더 import/호출 및 assets/images 파일 목록이다. 정예·문지기·소환체·귀환 강화 변형은 해당 기본 키를 재사용하므로 별도30종으로 늘리지 않았다. PNG 경로가 있다는 사실은 화면에서 올바르게 표시되거나 검증·배포되었다는 뜻이 아니다. 이미 승인한 기본형을 다시 생성하지 않는다.

## 현재 후속 작업

- 귀환 횡단 사수·매복 사냥꾼의 효과 줄이기 옵션을 game → pixel-world → 전용 sprite로 전달하도록 수정. 기본값 false로 기존 호출 호환. 옵션이 켜지면 장식적 이동2자세 전환은 정지하고 준비·발동·회수 위험 동작은 유지한다. 전투·저장·actor 변경 없음.
- 각 패키지에 기록한 crop·상단 여백·alpha·손가락/파지·발 기준점·좌우·초상 ready/fallback·동결/저장 재개·actor 불변은 배포 지시 후 누적 검증해야 한다.
- 별도 걷기·피격·사망 프레임이 없는 기존2자세 적은 여전히 있다. 사용자 선호상 다른 캐릭터 기본형 우선이었으며, 이번 확인만으로 새 프레임 제작이나 기존 승인 반복을 시작하지 않는다.
- 운영은 release-20261014-201910-449d0e 유지. 그 뒤 군단장·대악마·악마5종·귀환3종 누적 로컬 구현은 미검증·미배포다. 테스트·브라우저QA·푸시·배포·공개 확인은 새 명시 배포 지시 후 수행한다.
