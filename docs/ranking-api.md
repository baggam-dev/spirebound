# 랭킹 3단계 — SQLite와 HTTP API

## 구성

- Python 3.9+ 표준 라이브러리와 SQLite WAL 사용. 외부 패키지 없이 독립 systemd 서비스로 운영한다.
- API는 127.0.0.1:8787에만 바인딩하고 Nginx가 /api/ 요청을 전달한다. 클라이언트 IP 헤더는 프록시가 덮어쓴다.
- 코드: /opt/spirebound-api-releases/<release>, 현재 링크: /opt/spirebound-api-current.
- DB: /var/lib/spirebound-api/ranking.sqlite3. 웹 루트 및 릴리스 밖에 있어 배포·롤백 후 유지된다.
- 서비스 사용자 spirebound-api, 데이터 디렉터리 0700, UMask 0077, 서비스 파일시스템은 DB 디렉터리를 제외하고 읽기 전용이다.
- 현재 서비스는 HTTP 베타이며 쿠키의 Secure는 false다. 4단계 UI를 같은 HTTP 주소에 연결했다. HTTPS 전환 시 api/config.json origins와 secureCookie를 함께 변경한다. 5단계에서 전송 보안과 운영 설정을 점검한다.

## API 계약

쓰기 요청은 Content-Type: application/json, 등록된 Origin, 같은 출처 쿠키가 필요하다. fetch는 기본 same-origin credentials를 사용한다. 인증 토큰은 응답 JSON에 노출하지 않고 HttpOnly / SameSite=Strict / Path=/api 쿠키로 발급한다. DB에는 토큰 해시만 저장한다. 세션은 365일이며 만료·쿠키 삭제 시 새 참가자가 된다.

| 경로 | 메서드 | 역할 |
| --- | --- | --- |
| /api/health | GET | 프로세스·DB 읽기 상태 |
| /api/session | POST | 빈 객체로 익명 참가자 세션 발급/확인 |
| /api/runs | POST | 시작 전 온라인 도전 발급, 재시도 시 동일 시작 시각 반환 |
| /api/records | POST | 탈출 기록 등록, 서버 점수 계산, 동일 runId 멱등 응답 |
| /api/rankings?season=BETA-1 | GET | 상위 100명 및 쿠키 소유자의 최고 기록·전체 순위 |

도전 시작 요청:

```json
{"runId":"고유한-도전-ID","seed":17,"roomCounts":[7,8,7,8,7,8,7,8],"rulesVersion":"ranking-v1","gameVersion":"0.31.0-prebeta","seasonId":"BETA-1"}
```

runId는 영문·숫자·하이픈·밑줄 8~80자다. roomCounts는 실제 생성된 각 층 방 수이며 위 값은 형식 예시다. 온라인 시작 요청은 플레이 시간 진행 전에 완료되어야 한다. 실패 시 로컬 도전으로 계속할지 4단계 UI에서 처리한다. 기존 로컬 도전을 완료 시점에 시작 요청해 등록해서는 안 된다.

완료 요청:

```json
{"runId":"고유한-도전-ID","nickname":"모험가_1","outcome":"escaped","kingDefeated":true,"floor":0,"practice":false,"rulesVersion":"ranking-v1","gameVersion":"0.31.0-prebeta","seasonId":"BETA-1","elapsedMs":1200000,"visited":["0:0","1:0","2:0","3:0","4:0","5:0","6:0","7:0"],"defeated":[0,1,2,3,4,5,6,7,8,9],"mainSkill":"fire"}
```

visited / defeated는 2단계 ranking의 고유 목록이다. total 또는 score를 보내더라도 서버는 신뢰하지 않고 재계산한다. 완료 응답은 recordId, runId, seasonId, nickname, submittedAt, status와 score 항목을 반환한다. status=held는 등록을 보관하되 공개 순위에 제외한 상태다.

조회 응답 entries에는 rank, recordId, nickname, score, elapsedMs, mainSkill이 있으며 mine은 본인 최고 기록 또는 null이다. 100위 밖 본인도 전체 순위를 받는다. 익명 참가자 ID·쿠키·원시 이벤트는 공개하지 않는다. 닉네임은 중복 허용이다.

## 검증과 한계

- 서버 발급 도전·세션 소유권·시즌·버전·탈출 플래그·8개 층 방문·고유 방/적 ID·맵 범위·정수 시간 등을 검사한다.
- 기록의 플레이 시간이 서버 도전 발급 이후 경과한 시간보다 5초 넘게 길면 거부한다. 2분 미만 완주, 10 미만/3,000 초과 유효 처치는 보류한다. 이는 베타 탐지 기준이며 실제 플레이 표본에 따라 조정한다.
- 소환·분열몹 제외는 클라이언트 2단계 집계에 따른다. 서버에 전투 재현 로그가 없으므로 ID 목록이나 탈출 주장이 진짜 플레이에서 나왔음을 완전히 증명하지 못한다. 지도 수 역시 시작 요청에 고정하고 범위를 검증하지만 시드로 지도를 재생성하지 않는다.
- 계정 인증이나 실행 재현 검증이 없는 친구 대상 베타 용도다. 상금·공식 대회 수준의 부정행위 방지는 보장하지 않는다.
- 요청 제한: Nginx 초당 5회/burst 20, API IP별 세션 발급 20회/시간·도전 60회/시간·등록 30회/시간·조회 120회/분. 본문 최대 128KiB, 읽기 타임아웃 10초. API 제한은 메모리 기반으로 재시작 때 초기화된다.
- JSON 오류/입력 오류 400, 세션 없음 401, Origin 거부 403, 없음 404, 시즌 종료/도전 충돌 409, 본문 초과 413, 형식 415, 빈도 초과 429, 저장소 오류 503. 예외 세부정보와 인증 정보는 응답/로그에 남기지 않는다.
- 금칙어와 운영자 사칭 문자열은 api/config.json에서 관리한다. 초기 목록은 완전한 욕설 탐지기가 아니다.

## 배포·운영

- 기존 tools/deploy.ps1이 정적 사이트와 별도 API 묶음을 함께 업로드한다. API 파일은 웹 루트에 포함하지 않는다.
- deploy-remote.sh는 기존 DB가 있으면 SQLite backup API로 backups/<release>.sqlite3을 만든 후 교체한다. 정적 파일·API·Nginx 확인 실패 시 이전 링크와 서비스 설정을 복구한다. DB는 롤백 때 삭제·교체하지 않는다.
- SELinux enforcing은 유지한다. Nginx의 로컬 upstream 연결을 위해 httpd_can_network_connect를 활성화하며, 배포 실패 시 이전 값을 복구한다.
- 상태: sudo systemctl status spirebound-api. DB 점검은 서비스 사용자/관리자 권한으로 수행한다. DB·백업 파일은 외부로 공개하지 않는다.
- 수동 백업: sudo -u spirebound-api python3 /opt/spirebound-api-current/ranking_api.py --backup /var/lib/spirebound-api/backups/manual.sqlite3
- 복원은 서비스 정지 후 DB와 WAL/SHM 상태를 함께 관리해야 한다. 자동 복원·정기 백업 보존 정책은 5단계에서 검증한다. 배포 백업은 현재 자동 삭제하지 않는다.
- 시즌 전환은 config season을 새 ID로 바꾸고 배포한다. 이전 기록은 보존되고 조회 가능하다. open=false는 신규 시작/등록을 막되 이미 등록된 요청의 멱등 재시도는 허용한다.
- 현재 스키마는 user_version=1이다. 향후 비호환 스키마 변경은 별도 마이그레이션과 롤백 계획이 필요하다.

## 로컬 개발과 테스트

- node --test가 Python API 테스트도 실행한다. PYTHON 환경변수 또는 Codex 번들 Python을 사용하고, 그 외 환경에서는 python3(Windows python)가 필요하다.
- API 단독 실행: python3 -B api/ranking_api.py --database <임시 DB 경로> --config <개발 설정 경로>. 개발 설정의 origins에 http://localhost:5173을 넣는다.
- RANKING_API_PORT=8787로 node server.js를 시작하면 /api/가 로컬 API에 프록시된다. 설정이 없으면 기존 정적 개발 서버처럼 동작한다.
- 테스트: SQLite 재시작 보존, 동일 도전 동시 등록, 점수 재계산, 최고 기록·동점·100위 밖 내 순위, 시즌 종료, 쿠키 소유권, 닉네임, 비정상 수치·보류, HTTP Origin/본문 제한 및 백업을 검증한다.
- 4단계 RANK 메뉴와 이름 입력 구현은 ranking-stage4.md에 기록한다. 온라인 자격은 새 도전 시작 시 발급하며 기존 로컬 저장에는 소급하지 않는다.

## 검증·배포 결과

- 2026-09-23: node --test 338개 통과(API Python 통합 테스트 14개를 실행하는 검사 포함).
- 실제 Oracle Linux Python 3.9에서 격리된 임시 DB로 14개 API 테스트 모두 통과한 뒤 배포했다.
- 릴리스 release-20260923-092239-35fc04. Nginx 검사·리로드와 /api/health 정상 확인.
- 공개 /api/rankings는 BETA-1 빈 목록과 mine=null을 반환했다. 인증 없는 등록은 401, API 소스 경로는 404.
- 서비스 active, 127.0.0.1:8787 바인딩, 데이터 디렉터리 0700 및 DB 0600 확인. 운영 DB에는 테스트 순위 기록을 등록하지 않았다.
