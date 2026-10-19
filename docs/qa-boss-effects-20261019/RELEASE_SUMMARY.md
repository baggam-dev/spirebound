# 보스 효과 3종 배포 검증 — 2026-10-19

## 배포 범위

`5d2384a` 구현, `4dbb2f8` 검증: 프리즘 실제5/18/12방향 예고·26px 광선/벽끝/.16초 잔광, 모르도 실제 judgmentStripe 가로48/세로68·4단계·다음 예고/2하트 경고와 충격 잔상, 벨카르 실제 원 안 청백 얼음비·.4초 내 파편 소멸. 전투 업데이트·피해/시간/맵/저장/RNG 변경 없음.

공식 릴리스 `release-20261019-095303-c80fc6` / runtime `4dbb2f8` / https://168.107.21.43/. 281파일 포장, 서버27검사·nginx/인증서/index/health 통과. 이전 `release-20261019-020655-b28eae` 보존.

## 로컬 검증

- `tests.txt`: 전체533/533 통과.
- `local/result.json`: 실제 Edge Canvas PC/가로터치2. 5/18/12방향과 회전 회차·벽 끝 실제 경로, 심판 가로세로×4단계 clip, 얼음비 원clip, actor불변/Canvas복원·정지/reduced·로드역행 잔광재생방지 통과. 실제 프리즘 전투2 및 주인공 ready4frames58px/errors0.
- `bosses-local/result.json`: 문지기/모르도/벨카르/대악마/본체×PC가로터치10장면/errors0.
- 실제 프리즘 가로 화면과 효과판 PNG 육안확인. 효과판은 렌더 갤러리이며 실제 전투 캡처는 game-*.png다.
- QA 준비 실패 원본2건 보존: `local-initial.txt`는 사선광선 법선 폭을 x축 끝으로 검사한 조건 오류→수평빔 검사 및 각도별 실제 경로 검사로 수정. `local-fixture-initial.txt`는 저장 규격에 맞지 않는 벽 높이/type→h180/type wall 수정. 런타임 코드 추가 수정은 없으며 최종 검증 통과.

## 공개 확인

- `public-https.txt`: 154코드/스타일 원문·PNG byte 일치, TLS/308·랭킹/API8·10시작2·SecureHttpOnly 쿠키/기존쿠키업그레이드·HTTP저장이관2종 통과/errors0.
- `public-effects/result.json`: PC/가로터치 실제Canvas 기하·clip·잔광·정지/reduced·actor불변 및 실제 프리즘전투2/주인공ready4frames58px 통과/errors0. 공개 프리즘 가로 PNG 육안확인.
- `bosses-public/result.json`: 실제 모르도/벨카르×PC가로터치4장면 통과/errors0. 로컬은 전체상층10장면을 확인했고 공개에서는 이번 변경의 두 보스로 범위를 제한했다. QA_BOSS_SCENES 선택 옵션만 추가했으며 기본10장면 동작은 유지한다.
- 첫 동시브라우저 QA에서 타이틀 이미지 ready120초 초과와 가로터치 온라인 시작 실패(API응답 배열 없음)가 있었다. `public-https-initial.txt`/`public-opening-initial.txt`/`public-opening/failure-844.json` 보존. 직접 타이틀HEAD200/공개health ok, 서버nginx/API active·load0.02/0.13/0.11 확인. HTTPS 재실행 통과. 다른 검증 종료 후 `public-opening-final/result.json`의 실제 온라인 시작 버튼 PC/가로터치2 모두 online=true·5/6방10층·주인공ready4frames58px/errors0으로 통과. 공개 최종 가로터치hero PNG 육안확인. 초기 실패 원인은 확정하지 않았고 런타임 변경으로 숨기지 않았다. 재발 시 단일 브라우저에서 API요청 대기/응답/Abort·이미지 로딩 경로를 수집해 구분할 것.

운영 점수 제출0. 실제 iPhone/Android 및 저사양 장시간 플레이는 미검증이다.

로컬 서버·모든 배포/검증 명령 세션 종료. 이번 보스 배포 승인 범위 완료. 이후 새 명시 배포 지시 전 테스트·푸시·배포·공개확인은 하지 않는다.

## 다음 작업

`docs/design-drafts/interaction-effects-20261019/`의 상자 보상·샘물 회복·문 봉인 해제3종 시안은 내장 imagegen1회 생성, 원본/정확 프롬프트 보존, 로컬 `bd528a7`. 검토 대기 자료이며 runtime/배포 자산 미반영. 기존 시설 외형을 바꾸지 않고 interaction-visuals의 성공 이벤트/.9초/최대4/실제 doorCenter를 재사용하는 효과 제안이다.
