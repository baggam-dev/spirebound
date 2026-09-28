# 현재 작업 상태

최종 확인: 2026-09-29 (KST). 현재 상태만 유지하며 이력은 WORK_LOG.md에 쌓는다.

## 현재 목표
- 벽 배치·외형 개선 구현·검증·배포 완료. 상세: docs/room-shapes.md. 다음 요청 대기.
- 공통 랭킹은 기존 서버 SQLite 방식 유지. 다른 브라우저의 동일 목록 조회 검증 완료.

## 검증된 상태
- 운영 URL: https://168.107.21.43/ — HTTP 첫 화면은 기존 기록 이전 안내.
- 운영 릴리스: release-20260929-024051-9c51cc. 벽 개선 코드 커밋: 443f707(미푸시). 이전 a362ebf까지 origin/main 반영.
- 서버 SQLite 랭킹 1~5단계 구현·배포 완료. 공개 목록은 시즌별 사용자 최고 기록 상위 100명, 내 순위 식별은 브라우저 쿠키 기준.
- 전체 node --test 353개 통과(벽 생성·연결성·적 우회·석조 경계 검사 포함). 이후 강화한 공통 랭킹 API 통합 검사 별도 통과. 배포 서버 Python 테스트 18개 통과.
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
- 개발 서버는 공개 경로만 제공하고 파일의 실제 경로 이탈을 차단. 현재 배포는 공개 파일 84개만 포함하며 API/테스트/문서/DB 제외를 검사했다.
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

## 벽 개선 완료 체크포인트
- 적용 가능한 일반/시설 방: 기존 기본·세로·가로·좁은형 합계 50%, 얇은 십자·엇갈린 칸막이·짧은 미로 합계 50%. 보스/문지기/튜토리얼 유지, 출발/층 이동방은 기존형.
- 새 벽 두께 28px, 기존 좁은형 대비 벽 면적 25% 미만. 반경 30px 이동체의 모든 열린 격자와 출입구 연결, 시설 여유 55px, 적 AI 좌우/상하 우회 도달 검증.
- 새 배치는 새 도전부터 적용. 기존 저장의 지형/충돌은 보존하고 석조 외형만 공통 개선. 연결부 내부 테두리를 제거하고 줄눈·전면·그림자를 렌더링한다.
- 핵심 파일: src/world/room-shapes.js, src/rendering/stone-walls.js, src/world/terrain.js, src/world/object-positions.js. tests/unit/wall-layouts.test.js 및 tools/qa/room-shapes-qa.mjs.
- 로컬 및 공개 HTTPS에서 7유형 갤러리와 신규 3유형 × PC/모바일 4크기 QA 통과. 실제 모바일 기기 검증 아님. 운영 점수 제출 없음.
- 공개 TLS·랭킹·Secure 쿠키·HTTP 저장 이전 QA 성공(pageerror 0). 서버 Python 테스트 18개, API/백업/운영 점검/갱신 타이머 및 인증서 점검 정상.
- 자동 승인 검토 사용량 오류로 최종 확인이 한 차례 미실행됐으나, 사용자 재개 후 동일 승인 경로에서 정상 실행·완료했다. 현재 차단 없음.
- 개발 서버와 모든 QA/배포 세션 종료. 다음: 사용자 다음 요청. 푸시는 별도 요청 대기.

## PC 선택창 진행
- styles/pixel-theme.css에 1100×600 이상 화면의 카드 선택창 최대 960px/좌우 여백 적용. 작은 모바일 뷰포트 규칙 유지. 다음: 3개/4개 실제 선택창과 모바일 비교 QA.

- PC 선택창 로컬 QA 10화면 통과: 3/4개 선택·클릭 정상, 모바일 가로/세로 변경 전후 카드 배치 일치. 다음: CSS 커밋·배포 및 공개 파일 검증. 개발 서버 세션 86261(5174).
