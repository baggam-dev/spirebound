# 현재 작업 상태

최종 확인: 2026-09-29 (KST). 이 파일은 **현재 상태만** 유지하며 이력은 WORK_LOG.md에 쌓는다.

## 현재 목표
- 랭킹 5단계(HTTPS·백업·운영 검증) 완료. 다음 개발 범위는 사용자 요청 대기.
- 다른 대화/AI에서도 이어갈 수 있도록 저장소 기록 체계를 확립한다.

## 검증된 상태
- 랭킹 1~4단계 구현·배포 완료: 로컬 점수, SQLite API, 메인 RANK, 이름 등록, 재시도·내 순위.
- 마지막 확인된 운영 릴리스: `release-20260929-015934-a89eb7`.
- 현재 운영 URL: https://168.107.21.43/ (HTTP 첫 화면은 기존 기록 이전 안내).
- 2026-09-29 SSH 확인: API·백업·운영 점검·인증서 갱신 타이머 active, HTTPS 전환 마커 존재. 백업/운영 점검 서비스 Result=success, ExecMainStatus=0.
- IP 인증서 발급 완료, Certbot 5.8.0 및 하루 두 번 갱신 타이머 active. 갱신 dry-run 성공. 현재 인증서 만료: 2026-10-05 03:19:50 UTC(재개 시 재조회).
- 마지막 전체 로컬 테스트: 349개 통과(리팩터링 import 경로 검사 포함). Python API/운영 테스트는 Node 검사 내부에서 별도 실행된다.
- HTTP→HTTPS 이전 브라우저 QA: 신규 저장 복사 및 기존 HTTPS 저장 보존 확인.
- 배포 코드 커밋: `d53053d`(랭킹 시스템과 HTTPS 운영·기록 이전 구성). 기존 기준은 `53b26fa`. 푸시하지 않음.


## 완료 체크포인트 — HTTPS 전환 및 공개 검증
- 사용자 Oracle TCP 443 허용 후 외부 TLS 검증 성공. 사용자 재개 지시에 따라 HTTPS 전환 배포 완료.
- 릴리스: release-20260929-015934-a89eb7. 서버 Python 테스트 18개, Nginx 및 배포 파일 검사, 백업·복원 검사와 운영 점검 성공.
- Edge 격리 컨텍스트에서 공개 TLS, 로컬과 공개 파일 5개 일치, HTTP 일반 파일 308 전환, 랭킹 조회, Secure/HttpOnly 쿠키 및 기존 쿠키 식별값 보존·Secure 갱신 확인.
- 공개 HTTP→HTTPS 팝업 이전은 모바일 화면 에뮬레이션에서 신규 저장 복사/기존 HTTPS 저장 보존/HTTP 원본 및 별도 백업 보존 확인. pageerror 0. 실제 iPhone 검증은 아님.
- QA는 세션 쿠키 발급만 수행했으며 운영 랭킹 점수는 등록하지 않았다. 첫 쿠키 검사는 QA가 /api 경로를 누락하여 실패했고 조회 경로 수정 후 전체 통과(제품 변경 없음).
- 배포 이후 커밋 정리 완료: 제품 코드 d53053d 및 작업 지침/인계 문서 커밋. 실행 중 명령/세션 없음. 푸시는 미실행.
- 다음 단계: 폴더 구조 리팩터링 검토 완료, 구현 요청 대기(repository-structure.md). 랭킹 서버 공유는 이미 구현되어 중복 개발 불필요. 인증서 설치·HTTPS 초기 전환 반복 불필요. 이후 일반 배포는 HTTPS를 유지한다.

## 주요 파일
- 랭킹: `src/ranking/ranking.js`, `src/ranking/ranking-client.js`, `src/ranking/ranking-ui.js`, `api/ranking_api.py`, `api/config.json`.
- 운영: `api/maintenance.py`, `api/ops_check.py`, `api/nginx_config.py`, `tools/deploy/deploy.ps1`, `tools/deploy/deploy-remote.sh`, `tools/deploy/secure-server.sh`.
- HTTPS 저장 이전: `upgrade.html`, `src/persistence/upgrade.js`, `src/persistence/upgrade-transfer.js`.
- 상세 기록: `docs/ranking-rules.md`, `docs/ranking-api.md`, `docs/ranking-stage2.md`, `docs/ranking-stage4.md`.

## 주의할 제약
- 실제 iPhone Safari는 아직 미검증.
- 백업은 같은 서버 디스크에 보관한다. 서버 전체 유실을 대비한 외부 백업 목적지는 미지정.
- 운영 점검 실패는 systemd/journal에 남는다. 사용자에게 보내는 외부 알림 연동은 없다.
- 랭킹은 친구 대상 베타 수준의 집계 검증이며 게임 실행 재현 기반 완전한 치트 방지가 아니다.

## 커밋 운영 원칙
- 사용자 상시 승인: 관련 코드·테스트·문서를 검증된 의미 있는 수정 단위마다 커밋한다. 푸시는 별도 요청 시에만 수행한다.

## 리팩터링 진행 체크포인트
- 사용자 개선 작업 승인. src 기능별 분리, tests/styles/assets/tools 하위 구조로 이동하고 import·서버·배포·QA 경로를 동시 수정한다. 랭킹 저장 구조/게임 규칙/저장 키는 유지한다.
- 마지막 성공 검증: 이전 릴리스 공개 HTTPS QA. 실행 중 세션 없음. 다음: 파일 이동 및 경로 수정, 전체 테스트.

- 176개 파일 이동 및 패키징 83개 완료. 전체 테스트 348개 통과. 브라우저 QA에서 부수효과 import 1개(mobile-ui)가 옛 경로인 것을 발견해 수정하고 모듈 경로 통합 검사를 추가했다. 다음: 전체 테스트/브라우저 QA 재검증. 현재 이전 실행 세션 모두 종료.

- 리팩터링 검증: 전체 349개 통과, PC/모바일 3화면 랭킹 QA 및 저장 이전 QA 성공. README 기능별 탐색 표 추가. 다음: 독립 브라우저 공통 랭킹 검증 강화, 패키징 확인 후 커밋·배포. 실행 중 세션 없음.

- 강화 검증 완료: 별도 쿠키 없는 브라우저에서 임시 서버의 사용자 3명 랭킹을 동일하게 조회했다. API 통합 테스트와 브라우저 QA 통과. 83개 정적 배포 파일 검사 통과(테스트/API/문서/DB 제외). 다음: 리팩터링 커밋 후 일반 HTTPS 유지 배포.
