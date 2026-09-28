# 현재 작업 상태

최종 확인: 2026-09-29 (KST). 현재 상태만 유지하며 이력은 WORK_LOG.md에 쌓는다.

## 현재 목표
- 벽 배치·외형 개선 진행. 합의 내용은 docs/room-shapes.md에 기록. 랭킹/폴더 정리는 완료.
- 공통 랭킹은 기존 서버 SQLite 방식 유지. 다른 브라우저의 동일 목록 조회 검증 완료.

## 검증된 상태
- 운영 URL: https://168.107.21.43/ — HTTP 첫 화면은 기존 기록 이전 안내.
- 운영 릴리스: release-20260929-022149-cb811d. 코드 커밋: 3e6c57a. 사용자 요청으로 8935398까지 origin/main 푸시 완료(2026-09-29).
- 서버 SQLite 랭킹 1~5단계 구현·배포 완료. 공개 목록은 시즌별 사용자 최고 기록 상위 100명, 내 순위 식별은 브라우저 쿠키 기준.
- 전체 node --test 349개 통과. 이후 강화한 공통 랭킹 API 통합 검사 별도 통과. 배포 서버 Python 테스트 18개 통과.
- Edge PC/모바일 3화면 QA: 등록·이름 거부·응답 유실·새로고침 재시도·내 순위·오프라인·조회 실패 정상. 독립 브라우저에서 임시 서버의 사용자 3명 공통 목록 확인.
- 공개 HTTPS QA: 정적 파일 5개 로컬 일치, 이미지/폰트 로딩, HTTP 308, 랭킹 조회, Secure/HttpOnly 쿠키, 기존 쿠키 값 보존과 Secure 갱신 정상.
- 실제 공개 HTTP→HTTPS 팝업 이전: 모바일 화면 에뮬레이션으로 신규 저장 복사·기존 HTTPS 저장 유지·HTTP 원본/별도 백업 보존 확인. pageerror 0. 운영 점수 제출 없음.
- API·백업·운영 점검·인증서 갱신 타이머 active. 백업/운영 점검 Result=success, ExecMainStatus=0. 인증서 잔여 시간 검사 성공.
- 인증서 발급/갱신 dry-run은 이전 단계 완료. 마지막 만료 조회: 2026-10-05 03:19:50 UTC(운영 점검 시 재조회).

## 폴더 구조와 핵심 파일
- 루트 파일 156→9개. 공개 진입 index.html/upgrade.html, server.js, package.json, deploy.bat 및 저장소 안내만 유지.
- src/game: game.js(시작/루프), engine.js(상태), simulation.js(진행).
- src/combat / world / progression / rendering / ui: 전투 / 지도·탐험 / 성장 / 시각 효과 / 화면·조작.
- src/ranking: ranking.js, ranking-client.js, ranking-ui.js. 서버는 api/ranking_api.py.
- src/persistence: storage.js, session.js, upgrade.js, upgrade-transfer.js.
- styles / assets/images / assets/fonts: CSS / 이미지 / 폰트·라이선스.
- tests/unit / tests/integration: 자동 테스트. tools/qa: 브라우저/시뮬레이션 및 public-https-qa.mjs.
- tools/deploy: deploy.ps1, deploy-remote.sh, secure-server.sh. 일반 배포로 HTTPS 유지.
- README.md 소스 탐색표 및 docs/repository-structure.md 참고.

## 완료 체크포인트
- 이동한 74개 브라우저 모듈을 이전 커밋과 비교: import·자산 경로 외 로직 변경 없음. API/운영 DB 경로·저장 키·게임 규칙 유지.
- 개발 서버는 공개 경로만 제공하고 파일의 실제 경로 이탈을 차단. 배포는 공개 파일 83개만 포함하며 API/테스트/문서/DB 제외를 검사했다.
- 모듈 경로 통합 검사를 추가해 부수효과 import 누락 재발을 방지한다. 검증 중 발견한 옛 테스트 URL 및 mobile-ui import는 수정·재검증 완료.
- 마지막 성공 검증: 공개 HTTPS QA 및 SSH 운영 점검, 화면 캡처 확인. 실행 중 명령/세션 없음. 차단 없음.
- 다음 단계: 사용자 다음 요청 대기. 초기 HTTPS 구성과 완료된 리팩터링 반복 불필요.

## 남은 제약
- 실제 iPhone Safari는 미검증(모바일 화면 에뮬레이션과 구분).
- 백업은 같은 서버 디스크에 보관. 서버 외부 저장소와 외부 오류 알림 채널 미지정.
- 계정 기반 기기 간 본인 식별/101위 이후 페이지 조회는 별도 요구 확인 후 진행.
- 친구 베타 수준의 집계 검증이며 게임 실행 재현 기반 완전한 치트 방지는 아님.

## 커밋 원칙
- 검증된 의미 있는 수정 단위마다 관련 코드·테스트·문서 커밋. 푸시는 별도 요청 시에만 수행.

## 벽 개선 체크포인트
- 기존/신규 동선형 혼합과 석조 외형 합의를 기록했다. 현재 관련 코드 조사 완료. 다음: 생성·렌더링 및 연결성 검증 구현. 실행 중 명령 없음.

- 생성/석조 렌더링 구현 완료. 기존형 50%, 새 3유형 합계 50%, 특수 전투·층 이동방 보존. 적 우회·저장/시설 검사 통과. 연결 검사에서 경계 접촉의 판정 차이를 발견해 검사 조건을 실제 선분 충돌과 일치시키는 중. 다음: 전체 테스트 및 7유형 화면 QA. 실행 중 세션 없음.

- 로컬 완료: 전체 353개 통과, 반경 30px 전체 통로 연결/시설/적 추적/저장 검증. 7유형 갤러리 및 새 유형 PC/모바일 12화면 QA 오류 없음. 캡처의 일시정지 오버레이를 제거해 실제 전투 화면을 다시 캡처한다. 개발 서버 세션 97346(port 5174) 실행 중. 다음: 화면 확인 후 커밋·배포.
