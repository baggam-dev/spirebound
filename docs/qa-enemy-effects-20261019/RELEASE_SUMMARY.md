# 적 공격 효과 6계열 배포 검증 (2026-10-19)

## 범위

2a0c33a 시안 → 92d2227 구현 → 9e59be7 착지 파편 고정 → 830269e 검증. 새 원화 자산 없이 Canvas 적탄/베기/광선/독장판/착지/인력 표현을 연결했다. 전투 시간·피해·AI·맵/저장 버전은 유지한다.

## 로컬 검증

- `tests-final.txt`: 전체 533/533 통과. 첫 실행 531/532는 구 장판 테스트의 mock/계약 불일치이며 아군/적 장판의 실제반경과 clip 검증으로 수정했다. `tests.txt` 실패 원본 보존.
- `local/result.json`: 실제 Edge Canvas PC/가로터치. 필드·55/120도 섹터·광선30px/벽 끝, actor 불변, 착지좌표 고정, 시간역행/로드/방복귀 재생 방지, 정지·효과 줄이기·Canvas 복원 통과.
- `characters-local/report.json`: 30포즈60방향, 일반24종72장면, 죽음101, PC/터치 실제 혼전 정지/ready, 4종 누락 fallback, errors0.
- `bosses-local/result.json`: 문지기/모르도/군단장/대악마/본체 × PC/가로터치 10장면, 주인공 ready/4frames/58px, errors0.
- Canvas 효과판과 실제 군단장 장면 PNG를 육안 확인했다. 효과판의 발사체 예시는 일반탄 전체 유형의 실제 게임 캡처가 아니며, 공격 판정 자체는 전체 회귀 테스트가 보완한다.

## 운영

운영 릴리스 `release-20261019-020655-b28eae`, runtime `830269e`, https://168.107.21.43/. 공식 배포 280파일·서버27테스트·nginx/인증서/index/health 통과. 이전 `release-20261018-200643-7c1a59` 보존.

- `public-https.txt`: 코드/스타일153개 원문 및 PNG byte 일치, TLS/HTTP308, 랭킹 응답, 8/10캠페인 API시작2, Secure/HttpOnly 쿠키·기존쿠키 업그레이드·HTTP저장 이관2종 모두 통과/errors0.
- `public-opening/result.json`: 실제 온라인 시작 버튼 PC/가로터치2 online=true, 5/6방·10층·주인공ready4frames58px/errors0. 공개 가로터치 hero PNG 육안확인.
- `public-effects/result.json`: 운영 JS에서 Canvas 기하·착지고정·로드역행/방복귀·정지reduced·Canvas복원 PC/가로터치2 통과/errors0.
- `bosses-public/result.json`: 공개 문지기/모르도/벨카르/대악마/본체 × PC/가로터치 10장면 통과/errors0. 공개 모르도844 PNG 육안확인. 본체3페이즈의 추가 소환체는 정상 전투 경과이며 고정 적 수를 요구하지 않는다.

운영 점수 제출 0. 실제 iPhone/Android 및 저사양 장시간 세션은 미검증이다.

## 다음 작업

`docs/design-drafts/boss-effects-20261019/`는 프리즘/모르도 심판/벨카르 얼음비 시안과 정확 프롬프트를 보존한다. 기존 6계열 배포와 별개의 검토 대기 자료이며 runtime/배포 자산에 미반영이다. 다음 디자인은 한 패키지로 승인받는다.

모든 검증/배포 세션 및 로컬 개발 서버는 종료했다. 실패 미해결 항목은 없으며 이번 배포 승인 범위 완료. 이후 테스트/푸시/배포/공개 확인은 새 명시 배포 지시를 기다린다.
