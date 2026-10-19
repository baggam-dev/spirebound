# 경험치 파편·비전투 연출 누적 배포 — 2026-10-19

기존 즉시 경험치를 1/3/9XP 보석 파편으로 바꾸고 직접 수집하도록 연결했다. 기존 경험치 총량과 성장 곡선은 유지한다. 수집 반경 30px에 수집 자석 +70px가 함께 적용된다. 벽을 관통하지 않으며, 미수집 파편은 방에 남고 저장된다. 방을 떠날 때 자동 회수하지 않는다. 종류별 64개를 넘으면 동종 파편에 값을 묶어 총량을 보존한다.

승인된 축복/저주, 계약 3종, 정수 흡수, 성장, 계단 상승/하강 연출을 누적 포함한다. 오라는 캐릭터 PNG에 합치지 않으며, 승인 원본·정확 프롬프트를 보존했다.

## 로컬 검증

- 전체 `node --test`: 540/540 통과 (`tests.txt`). XP 지급 총량·자석/벽·방 이동/저장·상한 묶음·변조 거부·소환/하강 제외·보스45 중복 방지 및 튜토리얼 수집 성장 포함.
- 첫 PNG ready 검사 실패로 개발 서버 허용 목록 누락을 발견해 수정했다. 해당 PNG를 서버 통합 회귀에 추가하고 2/2 재검증했다 (`server-retest.txt`).
- `local/result.json`: PNG 3프레임 ready, 실제 폭 3/6/10px, 이미지 실패 시 fallback, 정지, Canvas 복원, 렌더 상태 불변, 비전투 9분기 렌더/수명/효과 줄이기. PC1280 및 가로 터치 에뮬844에서 실제 게임 처치13XP 바닥 생성→이동 수집13→저장 재로드 확인. 실제 iPhone 검증은 아니다.
- `facilities/result.json`: 기존 시설 회귀 PC/가로 터치 × 상자·샘물·함정 6건, 회복·소모·정예3 생성·주인공 ready4frames58px. 열린 통로·수명·최대4·상태 불변 검사도 통과.
- PNG 재생성은 없었다. 실제 PNG/게임 화면을 직접 확인했다.

## 배포

아래 검증을 마치고 배포 및 공개 확인을 완료했다.

- noncombat/result.json: 실제 UI 축복/저주·blood/supply/trial 성공마다 emit 1회, 교환취소+지나가기 0회. blood5→3, 시련active, 저장used 확인. 관찰용 emit 로그만 QA route에 삽입했고 runtime 소스에는 삽입하지 않았다. 초기 fixture의 mainSkill/시설거리/상자 우선순위 대기를 중단하고 fixture를 바로잡아 최종 성공했다.

공식 release-20261019-160149-81acfc / runtime990bc2d 활성. 284파일, 서버27/27, nginx/인증서/index/health 통과. 이전release-20261019-131144-f5e588 보존. public-opening/result.json: 실제온라인시작PC/터치2건·session/runs200·226~1771ms·요청실패0·errors0·순위제출0. public-xp/result.json: 공개3frames/폭3·6·10/fallback·정지/상태복원·PC/터치13XP수집/재로드 통과. 실제 iPhone 및 저사양 장시간 플레이/흡수음 청취 검증은 하지 않았다.

public-noncombat/result.json: 공개 실제축복/저주·계약3종 성공마다 emit1, 취소0, HP/used/trial 저장 모두통과/errors0.

public-https.txt: 공개156코드/스타일 및PNG바이트일치, TLS/HTTP308, 랭킹, secure/HttpOnly쿠키, 기존세션승격, HTTP기록이전2종·원본보존 통과. pageErrors0/productionRecordsSubmitted0. 모든 실행세션을 종료했다.
