## 2026-10-29 고층 보스 가독성2 배포 버전
client/API/표시0.49.0-prebeta로 동기화한다. 기존 최신버전 정책을 따르며 DB·시즌·저장·원본기록·지도·점수식은 보존한다. 이번 변경은 렌더링이며 전투 수치는 유지한다. 실제 활성릴리스는 WORK_STATUS 최신상단을 따른다.

## 2026-10-29 베라 외형·가독성 배포 버전
client/API/표시0.48.0-prebeta로 동기화한다. 이번 변경은 기존전투/보상수치·판정·탄환수를 유지하는 렌더변경이며, 현재배포절차의 최신버전표시/허용정책을 따른다. DB·시즌·원본기록·저장·지도·점수식은 보존하고 이전원정 로컬플레이/개인기록도 유지한다. 실제활성릴리스는 WORK_STATUS 최상단확인.

## 2026-10-28 전투·보상 배포 버전
고층공격 조합·적 처치 보상·칼드/베라 내구 및 공격조건 변경에 따라 client/API 최신 허용을0.47.0-prebeta로 동기화한다. DB·저장·시즌·지도·점수식은 유지하고 최신표/신규제출은0.47 시작 기록 기준이다. 이전 원정의 로컬플레이·개인기록 및 과거기록은 보존하며 온라인 등록은 기존버전 정책을 따른다. 실제 활성릴리스는 WORK_STATUS 최상단 확인.

## 2026-10-22 군집·고층 고유공격 통합 배포
공격·이동 조건 변경으로 client/API 최신 허용0.46.0-prebeta로 동기화. 기존DB/저장/원본기록·SPIREBOUND/ranking-v13·지도35·점수식 보존. 최신표/신규제출은0.46 시작기록 기준이며 구저장은 로컬플레이·개인기록/과거정책 유지. 실제 활성릴리스는 WORK_STATUS 상단을 따른다.

## 2026-10-21 몬스터 전투 개선 배포 버전
사선 확보/근접 타격·접촉 대체로 실전투 조건이 달라 client/API 최신허용을0.45.0-prebeta로 동기화한다. 기존 SQLite/저장/순위 원본·SPIREBOUND/ranking-v13·지도35·점수식 유지. 최신표/신규제출은0.45 시작 기록 기준이며 구저장은 로컬플레이·개인기록을 유지하고 과거온라인등록은 기존정책 적용. 실제배포는 WORK_STATUS 최신상단을 따른다.
## 2026-10-21 자동 보스 진입·악마 흡인 하향 배포 버전
악마 pressureVersion1/2페이즈의 실난이도가 달라지는 누적 배포이므로 기존 운영 정책에 따라 client/API 최신허용을0.44.0-prebeta로 함께 변경한다. 구현 단계의0.43유지 기록은 당시 미배포 상태이며 배포판은0.44가 우선한다. 로컬 저장·SQLite/랭킹 원본·SPIREBOUND/ranking-v13·지도35·점수식은 유지하고 최신표/신규제출은0.44로 시작한 기록 기준이다. 기존버전저장은플레이·개인기록 유지,과거온라인등록은기존버전정책 적용. 활성릴리스/실제검증은WORK_STATUS최상단 참조.
## 2026-10-20 플레이 피드백 묶음 배포 버전
파수꾼 속도/공격/등장 전투 게이트가 달라 client/API 최신 허용 버전을 0.43.0-prebeta로 함께 변경한다. 로컬 저장·SQLite 원본·SPIREBOUND/ranking-v13·지도35·점수식은 유지한다. 최신 표는 0.43으로 시작한 기록 기준이며 과거 버전의 기록은 원본 보존/최신 표 미노출 정책을 따른다. 실제 활성 릴리스는 WORK_STATUS가 우선이다.

## 2026-10-20 타이틀·보스 대사 배포
표현·읽기일시정지 개선이며 전투/점수규칙을 변경하지 않아 client/API 최신허용0.42.0-prebeta를 유지한다. 기존0.42순위·저장·시즌SPIREBOUND/지도35 원본을 보존한다. 활성릴리스는WORK_STATUS가우선한다.

## 2026-10-19 환경v2 배포 버전

돌벽 모서리의 실제 몸/사선 판정 변화로 client/API 최신 허용 버전을0.41.0-prebeta로 함께 갱신한다. 기존 저장·DB 원본과 SPIREBOUND/ranking-v13·지도35·점수식은 유지한다. 최신 표·신규제출은0.41 시작 기록 기준이며 이전 기록은 원본 보존/최신 표 미노출 정책을 따른다. 실제 활성 릴리스는 WORK_STATUS가 우선이다.

## 2026-10-19 유물 확장 배포 버전

신규 일반4/레어1 및 부활로 플레이 조건이 달라 client/API 최신 허용 버전을 0.40.0-prebeta로 함께 갱신한다. 기존 저장/DB 원본은 보존하며, 최신 표에는 0.40 시작 기록만 표시·제출한다. 기존 시즌/지도35/점수식은 유지한다. 실제 활성 릴리스는 WORK_STATUS를 우선한다.

## 적용 완료 — 초반 방 개수·게임 버전 검증

release-20261018-013123-46cc98에서 신초반[5,6] 및 구[7~10,8~11] 지도지원, API 허용0.39.0-prebeta 동기화. 나머지 층 제한·DB/시즌/점수규칙 유지. 기존 기록 원본은 보존하며 공개표는 최신버전 정책을 따른다. 실제config를 사용하는 JS→Python계약과 공식deploy.ps1의 버전일치가드로 누락을 방지한다. 공개검증은 실제새도전버튼PC/가로터치2건, 8/10층 API시작2종을 포함한다(점수제출없음). 현재활성상태는 WORK_STATUS를 우선한다.

# 랭킹 운영·HTTPS 절차

현재 활성화 여부와 마지막 릴리스는 WORK_STATUS.md를 기준으로 한다. 이 문서는 절차와 경로를 설명한다.

## 단일 최신 랭킹
- 시작 화면의 최신 새 도전은 모드 선택 없이 10층 확장으로 시작한다. 기존 8층 저장 이어하기/같은 지도 재도전과 이미 등록된 8층 기록의 DB 원본은 보존한다. 두 캠페인의 랭킹 식별자는 모두 **SPIREBOUND/ranking-v13**, 게임 `0.41.0-prebeta`, 지도 generationVersion 35이다. 한 표에 두 캠페인의 사용자별 최고 기록을 합치고 각 행에 8층/10층을 표시한다. 처치 점수 상한 4,000·탐험 점수 정규화·시간 점수는 현재 공통 규칙을 따른다. 10층 완료는 대악마 처치, 두 캠페인 모두 마지막 1층 봉인 추격 완료가 필요하다. 이름·점수 등록은 명시적 사용자 동작이다.
- 공개 표는 config versions의 최신 게임 버전으로 시작한 기록만 조회한다. 같은 SPIREBOUND 시즌의 이전0.34/0.35 기록도 DB 원본은 유지하지만 최신 표에는 표시하지 않는다. 이전 저장은 원래 보스 패턴으로 로컬 재개할 수 있고 최신 점수 등록은 불가하다. 버전 갱신 직후 표가 비어 있을 수 있다.
- 과거 BETA/ASCENT 시즌은 화면과 공개 API에서 조회되지 않고 신규 제출도 받지 않는다. 기존 로컬 저장은 시즌·배치 규칙을 바꾸지 않고 이어갈 수 있으나 최신 순위에 제출할 수 없다. 운영 SQLite에 이미 저장된 과거 행은 원본을 보존한다. 그 기록을 최신 버전 기록으로 이관하지 않는다.
- `api/config.json`의 `season`/`open`이 공통 랭킹을 제어한다. `open=false`는 새 시작·등록을 막으며 기존 현재 순위 조회는 유지한다. 실제 운영 활성 릴리스는 WORK_STATUS.md와 배포된 설정을 확인한다.

## 일상 운영
- 정적 파일: `/usr/share/nginx/spirebound-current` → 릴리스 디렉터리.
- API: `/opt/spirebound-api-current`, `spirebound-api.service`, 127.0.0.1:8787. Nginx만 외부 요청을 전달한다.
- 운영 DB: `/var/lib/spirebound-api/ranking.sqlite3`. 삭제·교체·Git 저장 금지. 파일 0600, 디렉터리 0700.
- 백업: `spirebound-backup.timer`, 매일 UTC 02:00 이후 최대 15분 지연(KST 11:00~11:15). `daily-*.sqlite3` 최근 14개만 유지한다. 배포/수동 백업은 자동 삭제하지 않는다.
- 각 백업은 SQLite backup API → 무결성/외래키 검사 → 격리된 임시 DB에 복원 → 테이블 건수 비교를 거친 뒤 원자적으로 공개한다. 원본 DB를 중지·교체하지 않는다.
- 운영 점검: `spirebound-ops-check.timer`, 15분 간격. API 응답, 36시간 이내 백업, HTTPS 활성화 시 인증서 잔여 48시간 및 갱신 타이머 상태를 확인한다.
- 알림은 systemd 실패 상태와 journal에만 남는다. 외부 알림/다른 서버 백업은 아직 구성하지 않았다.

조회 예시(SSH opc, 필요한 명령만 sudo):

```sh
sudo systemctl status spirebound-api spirebound-backup.timer spirebound-ops-check.timer
sudo systemctl list-timers 'spirebound-*' --all
sudo journalctl -u spirebound-backup.service -u spirebound-ops-check.service -n 30 --no-pager
sudo systemctl start spirebound-backup.service
sudo systemctl start spirebound-ops-check.service
```

## HTTPS 초기 구성
1. 현재 deploy 스크립트로 HTTP 운영 준비 파일과 안정된 ACME 경로(`/usr/share/nginx/spirebound-acme`)를 먼저 배포한다.
2. `tools/deploy/secure-server.sh`를 LF 개행으로 서버 임시 경로에 업로드하고 `sudo bash <경로> 168.107.21.43`으로 실행한다.
3. Python 3.12 + 전용 `/opt/spirebound-certbot` 환경, Certbot 5.4 이상, staging/production 순 IP 인증서 발급을 수행한다. 앱의 Python 3.9는 변경하지 않는다.
4. 인증서는 `/etc/letsencrypt/live/spirebound-ip/`. **privkey.pem 내용 출력·복사 금지**. 6일 유효기간이므로 하루 두 번 갱신 점검 타이머를 사용한다.
5. 443 시험 리스너 `/api/health`를 외부에서 인증서 검증을 켠 상태로 확인한다. 외부 차단 시 Oracle 인바운드 규칙을 확인해야 한다. `-k`로 우회한 결과를 성공으로 간주하지 않는다.
6. `tools/deploy/deploy.ps1 -EnableHttps`로 실제 전환한다. 이후 일반 배포도 `/etc/spirebound-https-enabled` 마커에 따라 HTTPS를 유지한다.
7. 배포기는 서버용 API 설정을 HTTPS Origin / Secure 쿠키로 맞춘다. `api/config.json`의 저장소 기본값과 서버 생성 설정이 다를 수 있다.
8. 기존 HTTP 첫 화면은 기록 이전 안내로 남긴다. 그 외 요청은 HTTPS로 리다이렉트하며, ACME·기록 이전에 필요한 파일만 HTTP에 제공한다.

Certbot 정보: [IP 인증서 및 자동 갱신 안내](https://letsencrypt.org/2026/03/11/shorter-certs-certbot), [공식 pip 설치 방식](https://certbot.eff.org/instructions?os=pip&ws=other).

## 인증서 갱신
- `spirebound-cert-renew.timer`: UTC 00:00/12:00 이후 최대 30분 지연, Persistent=true.
- `spirebound-cert-renew.service`: `/opt/spirebound-certbot/bin/certbot renew --quiet`.
- 성공 후 deploy hook이 `nginx -t` 및 reload를 실행한다.
- 시험: `sudo /opt/spirebound-certbot/bin/certbot renew --cert-name spirebound-ip --dry-run`.
- 만료 조회: `sudo openssl x509 -noout -dates -in /etc/letsencrypt/live/spirebound-ip/fullchain.pem`.
- 인증서 도구 업데이트는 별도 검증 후 수행한다. 이번 구성을 위해 자동 패키지 업데이트 작업은 추가하지 않는다.

## 브라우저 기록 이전
- HTTP와 HTTPS의 localStorage는 다르다. HTTP 안내 페이지의 “기록을 옮기고 시작”이 HTTPS 새 창을 열고, 정확한 Origin·창·임의 nonce를 검증한 postMessage로 지정된 게임 키만 전달한다.
- 도전/백업/종료표식/개인 이력/등록 대기 기록을 이전한다. 탭 잠금·다른 앱 데이터·쿠키는 복사하지 않는다.
- HTTPS에 이미 도전 그룹이 있으면 HTTP 도전 그룹을 섞거나 덮어쓰지 않는다. 원본을 별도 `spirebound.http-backup.*` 키로 보관한다. HTTP 원본도 남긴다.
- 팝업 차단 시 JSON 백업 다운로드 후 HTTPS `/upgrade.html`에서 파일을 가져온다. 쿠키는 같은 호스트에서 유지되며 유효한 기존 참가자 쿠키는 HTTPS API 응답으로 Secure 속성으로 갱신한다.
- 자동 이전이 되더라도 과거 HTTP 통신의 보호 수준을 소급 개선하는 것은 아니다.

## 실제 장애 복원 주의
- 평상시 자동 검사는 임시 DB 복원만 한다. 운영 DB에 대한 실제 복원은 별도 장애 작업으로 다룬다.
- 운영 서비스 중지 → 현재 DB/WAL/SHM 묶음의 안전 사본 확보 → 선택 백업을 별도 경로에서 무결성 검사 → DB 교체 및 소유권 복구 → 서비스 시작 → 조회 검증 순서다.
- 활성 WAL을 남긴 채 DB 파일만 덮어쓰면 안 된다. 데이터 유실 범위와 복원 시점을 확인한 뒤 정확한 대상 경로로 수행한다.
- 같은 서버의 백업은 디스크 전체 유실을 막지 못한다. 외부 저장소가 지정되면 별도 복제/복원 시험을 TODO에 추가한다.
