# 남은 비전투 연출 — 6패널 시안 / 검토 대기

2026-10-19 ‘다음 비전투 연출 3묶음’ 제안에 사용자 ㄱㄱ. 기존 상자/샘물/문 효과는 배포 완료 상태로 보존하며, 이번은 시안·설계·로컬 커밋까지만이다. 새 배포 지시는 없고 runtime/배포 자산은 변경하지 않는다.

## 실제 코드와 구현 제안

### 신전 축복·저주 / 계약 대가

`src/world/shrine.js` incantations.good와 useShrine 성공을 기준으로 축복/저주를 구별한다. 현재 game.js shrine의 hex 선택 성공에는 시각 emit이 없다. 향후 승인 시 useShrine 성공 직후 incantationInfo(id).good만 시각 이벤트에 전달하고, 저장·resume·정예 전투 시작/축복·저주 효과 적용·선택 확률은 그대로 둔다. 신전 선택 전/실패/취소에는 발동하지 않는다.

- BLESSING: 짧은 상아금빛 열린 수호 문양과 안쪽으로 정리되는 점3개. 새 보호막 횟수나 무적을 의미하지 않는 순간 연출.
- CURSE: 탁한 보라/장밋빛의 꺾인 봉인 조각. 생성 시안의 검은 연기 높이는 실제로 낮추고 .9초 안에 지워 상시 저주 오라/독장판과 구별한다. 실루엣으로 축복과 구분하며 캐릭터 PNG에 굽지 않는다.
- PACT: game.js eventPanel의 chooseEvent 성공 및 supplyPanel 교환 성공에 별도 시각 emit 제안. adventures.js의 blood는 체력-2/방어+2, supply는 기존 유물→windSeal 교환, trial은 적 생성/시련 시작이다. 시안의 붉은 비용 조각은 blood만 사용한다. supply는 중립 황동 교환 조각, trial은 짧은 보라 시련 표식으로 구분하고 ‘모든 계약이 체력을 소모/즉시 보상’처럼 보이지 않게 한다. 그냥 지나가기/교환취소/불가능한 선택에는 표시하지 않는다. 실제 대가·보상·적 생성·RNG는 변경하지 않는다.

### 정수 획득 / 성장 완료

`game.js update`의 essencePickup 이벤트에는 fromX/fromY/color가 있고 interaction-visuals.js essence가5개 점을 플레이어로 보낸다. `src/progression/essences.js`의 기존5색(공격 빨강/이동 파랑/체력 분홍/공속 초록/궁극기 보라)을 그대로 전달한다. 시안의 분홍 정수로 전체를 통일하지 않는다. 수집은 즉시 적용하고 곡선 흔적·마지막 작은 흡수광만 개선한다. 적탄/드랍 정수 본체는 재디자인하지 않는다.

`game.js levelUp`은 실제 applyLevelReward/consumeLevelChoice 후 emitInteraction('level')를 사용하며 자동 회복 처리도 같은 이벤트를 쓴다. 이 순간만 GROWTH의 양옆 상승 괄호·머리 위3점으로 강화한다. 선택 UI/카드/아이콘·스킬 수치/새 선택 시점을 바꾸지 않는다. BLESSING은 바닥 가까이 열린 짧은 문양, GROWTH는 양옆을 타고 위로 지나가는 괄호와 LV 라벨로 구분해 같은 금빛 효과의 혼동을 줄인다.

### 계단 이동

`game.js changeFloor`는 travel 성공 후 새 방/player 도착 좌표와 direction=f-s.floor를 전달한다. 실제 interaction의 ‘올라가기’는 floor+1(direction+1), ‘내려가기’는 floor-1(direction-1)임을 확인했다. 시안 STAIRS의 좌측은 위 방향, 우측은 아래 방향의 꺾쇠와 짧은 잔향이다. 이 코드 매핑을 그대로 연결한다. 이동 전 실패에는 표시하지 않고, 도착 즉시 조작 가능·적 예고/통로를 가리는 전면 페이드나 포탈은 추가하지 않는다. 하강/귀환 판정·맵 배치·도착 좌표를 유지한다.

## 공통 제약과 보존

기존 interaction-visuals의 run별 WeakMap/방 구분·elapsed·최대4개/.9초 수명을 재사용한다. 정지 시 변화 없음·효과 줄이기에서 필수 모양만·Canvas 상태 복원·로드 시 재생 없음. 필요한 성공 콜사이트만 추가하며 전투/성장/보상/저장/RNG에는 렌더 상태를 넣지 않는다.

PNG는 위 축복/저주/계약, 아래 정수/성장/계단이다. 작은 빈 마름모는 수신 위치 표시이며 주인공을 교체하는 디자인이 아니다. 각 패널의 짧은3단계는 분위기 설명이고 시간/크기/선 개수의 정확한 명세가 아니다. 실제 작은 게임 화면에서는 과한 검은 연기·밝은 입자를 줄인다. 기존 캐릭터·시설·배경 원화를 변경하지 않는다.

내장 imagegen1회, 원본 `C:\Users\SDSPRO\.codex\generated_images\01a13828-0d36-7292-9c64-ff00ee502b14\exec-95d066a0-e957-46fc-8c07-8f36341c3190.png` 유지. 프로젝트 사본 `noncombat-effects-v1.png`, 정확 프롬프트 `prompt-v1.md`. PNG 직접 육안확인·불필요 재생성 없음.

승인 후 한 패키지로 구현·문서·로컬 커밋한다. 새 명시 배포 전 테스트/QA·서버·푸시·배포·공개 확인은 하지 않는다. 이후 검증 후보: 신전 good/bad 성공/실패, blood/supply/trial/취소, 정수5색·정확히1회 수집, 성장 선택 후1회, 층 이동2방향·도착/실패/귀환, 수명상한/정지/reduced/방변경로드·Canvas/보상저장RNG불변·PC가로터치.
