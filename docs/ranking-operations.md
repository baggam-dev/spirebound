# 랭킹 운영·HTTPS 절차

현재 활성화 여부와 마지막 릴리스는 WORK_STATUS.md를 기준으로 한다. 이 문서는 절차와 경로를 설명한다.

## 캠페인별 시즌
- 현재 신규 도전은 기본 **BETA-5/ranking-v11**, 확장 **ASCENT-7/ranking-v12**이다. 폭풍 화살 조합의 첫 관통 뒤 경로 변경을 이전 도전/점수와 분리한다(`storm-recipe-stage.md`). 마지막 1층 봉인 추격 완료는 계속 점수 제출 조건이다. 직전 BETA-4/ranking-v9·ASCENT-6/ranking-v10과 그 이전 시즌은 조회 전용이며 기존 로컬 저장의 이어하기는 유지한다. 결말 규칙은 `final-escape-stage6.md`를 참고한다.
- 6~9층 출현표 변경은 기본 8층에도 영향을 주므로 새 기본 도전 BETA-2/ranking-v5, 새 확장 도전 ASCENT-4/ranking-v6로 분리한다. 이전 BETA-1/ranking-v1 및 ASCENT-1/ranking-v2·ASCENT-2/ranking-v3·ASCENT-3/ranking-v4 기록은 조회 전용으로 보존한다. 시즌별 상위 100명·내 최고 기록을 섞지 않는다. 실제 운영 활성 릴리스는 WORK_STATUS.md와 배포된 `api/config.json`을 확인한다.
- 확장 시즌 시작 요청은 기존 8층 지도 대신 10층 지도(마지막 층 2방)를 검증한다. 완료 기록에는 10층 방문과 대악마 처치 표시가 필요하다. 이름·점수 등록은 기존과 같이 명시적 사용자 동작이다.
- `api/config.json`의 `expandedSeason`/`expandedOpen`으로 확장 시즌을 운영한다. 중지 시 `expandedOpen=false`로 배포하면 새 확장 시작·등록이 막히고 기존 순위는 읽을 수 있다. 런타임 설정/DB 경로는 아래 절차를 따른다.

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
