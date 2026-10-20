# 0.43 플레이 피드백 묶음 — 배포/공개 확인 완료

- 활성: **release-20261020-145818-671bcd / runtime e494023 / 0.43.0-prebeta / https://168.107.21.43/** (2026-10-20 KST).
- 구현 커밋9f2395b,공개 첫접속 timeout 보완 e494023. 이전144409 및112002 릴리스/DB·저장 원본 유지. 최종 기록/QA커밋은 git 이력 참조.
- 사용자 ‘이렇게 수정 진행 배포까지 해’와 통합 PNG ‘이 방향으로 구현·배포’ 명시 승인. 이번 작업 이후 새 배포 지시 전 수정·문서·로컬 커밋 규칙으로 복귀. BGM 보류.

## 반영 범위
1. 미니맵 확대/우측 상단/바탕 반투명·표식 선명, 모바일 여백에 크기를 제한하지 않음.
2. 층별 실제 환경/벽/소품/캐릭터 자산 준비 및 첫 방 캐시 생성 후 진입. 시작/이어하기/상하행 공통 로딩,전투·시간·입력 정지, 실패 시 진행 보존·재로드/입구 복구.
3. 일반 보스 대사는 머리 위3.6초 자동 표시·조작정지/다음/스킵 제거,탄막/장판 중에도 읽을 수 있게 유지.
4. 2층 파수꾼 초회 웅크림1초·약진동/천장먼지 동안 이동만 허용/상호공격 차단→기상과 대사/전투 개시. 기존 기상프레임 재사용,효과완화는 진동 제거/먼지 축소. 중도 저장/재입장 중복 방지.
5. 파수꾼 이동+10%/점프 예고1.1→.9초,방향고정 전방 베기·짧은 돌진 추가/쿨타임·후딜·벽 검사·단일 타격. 전 동작/사망 색채도.88로 붉은 기 소폭 완화.
6. 파수꾼 보스방 가장자리에 낮은 대비 혈흔·파손석재·뼈·깨진무구 PNG 장식,중앙/출입구/기존 충돌 유지.
7. 스킬 선택창 회갈 양피지/아이콘 채도 완화·레어 청색/유니크 보라와 은은한 가장자리빛,효과완화/OS reduce 대응.
8. 누적 fca76fe 메인 그림 contain 보정 포함,화면 비율로 주인공 발이 추가로 잘리는 문제 방지.

기존 스킬 이름/성능/선택확률은 그대로. 전투 변경으로 client/API 최신 허용0.43 동기화. SQLite/로컬저장·시즌SPIREBOUND/ranking-v13·지도35·점수식 보존. 최신표는0.43으로 시작한 기록만 조회하는 기존 정책,과거기록 원본 삭제 없음.

## 검증 증거
- `full-authorized.log`: 전체 **577/577**,179초. 이후 중도저장 대사1회귀·신규PNG서버응답 포함 `focused-final.log` **31/31**. timeout 보완 후 `timeout-focused.log` **15/15**. 마지막 전체578을 다시 수행한 것은 아님.
- `local-ready`: Edge1280×589/844×390/740×360 각10층자산준비/실제도어입장·파수꾼/지도/자동대사/카드/title PNG ready 후 캡처·오류0.
- `loading-final`: PC/모바일의 자산 요청을 실제 보류하여 기록시간 동결/절차맵 미노출/상행 및 자산실패 재로드/입구 복구 통과.
- `deploy-final.log`:308파일 공식 배포,원격Python27/27·nginx/health/index/TLS 성공.
- `public-online-final`: 실제 UI 새 도전 PC1280/가로844 **2건** session/runs200·온라인true·0층ready/10층/초반5·6방·오류0·점수제출0.
- `public-ready-final`: 공개 PC1280×589/844×390/740×360 **3해상도** 각10층준비 및 title PNG ready/실제 도어입장 웅크림→기상·대사/지도/3희귀도 카드 통과,오류0. 대표844보스/카드와740타이틀 PNG 직접 육안 확인.
- `public-loading-final`: 공개 PC/모바일의 실제 자산 요청gate·시간동결·절차맵미노출·상행·실패복구 통과,오류0.
- `public-https-final.log`: **182 코드/스타일 목록 항목**(고유개수 아님)·전체 PNG 바이트 일치(신규장식 포함),TLS/HTTP308·랭킹·SecureHttpOnly 쿠키/기존쿠키 승격·HTTP 기록 새기기/기존저장 이관2종·원본 보존 성공,페이지오류/점수제출0. 이 검사의 API 직접 시작2건은 실제UI2건과 별개.

## 발견/보완과 남은 제약
- 제한 환경의 Edge 시작/루프백/API접속EACCES → 허용된 실행환경으로 재검증. 초기 로그 보존.
- 첫 테스트 fixture의 불완전hazard 메타/요정 레벨3 → 실제 유효 형식으로 보완. 초기 지연 QA는 타이머보다 자산이 먼저 준비되어 pixel 가정 실패 → 실제 요청gate로 보완.
- 초기 title 캡처는 PNG 로딩전 → ready 조건 명시 후 별도 최종 PNG. PC 지도 과대 → arena폭28%로 보완.
- 최초144409 배포에서 공개 실제UI가20초 로딩timeout으로 실패. `asset-diagnostic.json`: 새환경0층 준비 **43,431ms**,실패요청0. 제한을90초로 보완 e494023 재배포 후 공개실제UI/로딩 검증 모두 통과. 가짜 지연으로 숨기지 않으며 실제 준비 완료 전 입장하지 않음.
- 기존 이미지 원본 합계 약149MB/여러 층 자산의 초기 요청 구조는 남아 있음. **다음 우선 검토: 층별 원본 지연 로딩/첫접속 전송량 최적화.** 이번 작업에서 첫접속 속도까지 최적화했다고 주장하지 않음.
- 실제 iPhone/저사양 장시간 플레이는 미검증. 모바일 검증은 Edge 에뮬레이션. BGM/새 전체 컷씬 미구현·보류.
- 모든 서버·테스트·배포·공개 QA 명령 종료. 마지막 변경은 기록/공개증거·QA도구 대기/fixture 효율 보완이며 제품 추가 변경/재배포 없음.

## 실제 PNG / 내장 imagegen 원본 및 정확 프롬프트

시안과 신규 장식은 **내장 imagegen**으로 생성했으며 원본 보존,PNG 편집을 Python/SVG로 대체하지 않음. 파수꾼 톤은 런타임 렌더 필터로 전 프레임에 동일 적용했다.

- [통합 승인 PNG](C:/baggam-dev/spirebound/docs/design-drafts/play-feedback-20261020/package-v1.png) · [정확 통합 프롬프트](C:/baggam-dev/spirebound/docs/design-drafts/play-feedback-20261020/prompt-package-v1.md)
- [장식 원본 PNG](C:/baggam-dev/spirebound/assets/images/warden-room-props-v1.png) · [정확 장식 프롬프트](C:/baggam-dev/spirebound/docs/design-drafts/play-feedback-20261020/prompt-props-v1.md)
- [구현 상세](C:/baggam-dev/spirebound/docs/design-drafts/play-feedback-20261020/implementation-package-v1.md)
- [공개 실제 모바일 보스방](C:/baggam-dev/spirebound/docs/qa-play-feedback-20261020/public-ready-final/warden-844.png) · [공개 스킬 선택창](C:/baggam-dev/spirebound/docs/qa-play-feedback-20261020/public-ready-final/draft-844.png)