# 랭킹 공유 및 저장소 구조 검토

2026-09-29. 검토 후 사용자 승인으로 구현·검증·배포 완료. 코드 커밋 3e6c57a, 릴리스 release-20260929-022149-cb811d. 최신 상태는 WORK_STATUS.md 참조.

## 1. 랭킹은 이미 서버 저장·공통 조회
- ranking-client.js의 submit은 POST /api/records, leaderboard는 GET /api/rankings를 호출한다. localStorage는 개인 저장/등록 대기·재시도 기록용이다.
- api/ranking_api.py는 운영 SQLite /var/lib/spirebound-api/ranking.sqlite3에 저장하며 leaderboard는 전체 accepted 기록에서 시즌별 사용자 최고 기록을 선정한다. 쿠키가 없어도 공통 entries를 반환한다.
- 같은 공식 서비스 주소를 사용하는 기기/브라우저는 공통 상위 100명을 조회한다. 별도 서버/로컬 개발 주소까지 자동으로 같은 DB에 연결되는 것은 아니다.
- 내 순위는 브라우저 쿠키 식별자 기준이다. 다른 기기를 같은 사람으로 연결하는 계정 기능은 없다. 같은 닉네임만으로 계정 통합하지 않는다.
- 온라인 시작 후 탈출하여 이름을 등록한 기록만 공개 대상이며, 로컬 기록/등록 대기/검토 보류 기록은 목록에 포함되지 않는다.
- 전체 유저라는 뜻이 101위 이후까지 조회라면 페이지네이션이 필요하다. 기기 간 내 기록 연결까지 원한다면 별도 계정/이전 기능 설계가 필요하다. 서버 저장 변경 자체는 필요 없다.
- 근거: ranking-ui.js board, ranking-client.js request/submit/leaderboard, api/ranking_api.py leaderboard, api/test_ranking_api.py의 재시작 보존·사용자별 최고·100위 밖 내 순위 검사. 후속 구현에서 임시 API에 3개 브라우저로 등록한 뒤 별도 익명 브라우저가 동일 목록을 보는 QA를 통과했다. 서로 다른 실제 기기 시험은 하지 않았다.

## 2. 적용 폴더 구조
기존 루트 156개 파일을 9개로 줄이고 src 기능별 8개 폴더, tests/unit·integration, styles, assets/images·fonts, tools/qa·deploy로 분리했다. server.js와 공개 HTML 진입점은 루트에 유지한다.

~~~text
index.html / upgrade.html   # 공개 진입점 유지
src/
  game/                    # game 진입, engine, simulation, 상태 진행
  combat/                  # 공격, 상태효과, 스킬, 적/보스 전투
  world/                   # 층·방·배치·탐험·귀환 경로
  progression/             # 성장·유물·보상
  rendering/               # Canvas 시각 효과와 픽셀 렌더링
  ui/                      # HUD·모바일 입력·화면 구성
  ranking/                 # 점수 규칙·API 클라이언트·랭킹 UI
  persistence/             # 저장·탭 세션·HTTPS 이전
styles/                    # CSS
assets/                    # 이미지·폰트·관련 라이선스
api/                       # 기존 Python API와 운영 모듈 유지
tests/
  unit/                    # 기능별 JS 테스트
  integration/             # 서버 및 Python 테스트 실행 연결
tools/
  qa/                      # 브라우저/시뮬레이션 QA
  deploy/                  # 배포·인증서 운영
docs/                      # 기존 문서 링크 유지
~~~

## 3. 이동과 함께 고쳐야 하는 부분
- 상대 import, HTML script/link, CSS 이미지·폰트 URL, 테스트에서 읽는 파일 경로를 함께 갱신한다.
- server.js는 src/styles/assets의 하위 디렉터리를 지원한다. src/styles/assets 등 공개 경로만 허용하고 api/docs/tests/.git 및 경로 이탈 차단을 유지한다.
- tools/deploy/deploy.ps1은 공개 HTML과 src/styles/assets만 폴더 구조를 보존해 묶는다. 예상하지 못한 파일 유형은 배포를 중단한다. 테스트·운영 문서·비밀·DB가 정적 배포물에 포함되지 않게 한다.
- deploy-remote.sh의 파일 검증 경로, api/nginx_config.py의 HTTP 이전용 허용 경로, tools QA의 /engine.js 같은 동적 import를 함께 갱신한다.
- package.json 명령, Python 테스트 탐색, QA 실행 위치, deploy.bat 및 문서 명령도 갱신한다. API/DB 운영 경로는 폴더 정리 이유만으로 이동하지 않는다.
- 저장 키/데이터 형식/API 경로/게임 규칙은 유지한다. 빌드 도구나 프레임워크 도입은 이번 목적에 필요하지 않다.

## 4. 권장 실행 순서와 완료 기준
1. import 및 공개 파일 목록을 조사하고 폴더 분류를 확정한다.
2. 소스·정적 자산 이동과 개발 서버/배포/QA 경로 수정을 하나의 실행 가능한 단위로 묶는다.
3. 테스트/QA 도구와 README 탐색 안내를 정리한다. 단계별 검증을 통과한 의미 있는 단위로 커밋한다.
4. node --test, 배포 패키지 누락/불필요 파일 확인, 개발 서버 접근 제한, PC·모바일 화면 QA, 기존 저장 로드·HTTPS 이전을 검증한다.
5. 승인된 구현 작업에서는 HTTPS 유지 일반 배포 후 공개 모듈 로딩·랭킹 조회·운영 상태를 검증한다.

권장 우선순위는 기존 공통 랭킹 동작의 설명/요구 확인 후 폴더 리팩터링이다. 서버 저장 재구현이나 계정 기능을 임의로 추가하지 않는다.
