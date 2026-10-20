# 층별 이미지 요청 지연 — 2026-10-20

상태: 로컬 구현/검증 완료, 배포·공개 결과는 docs/qa-lazy-assets-20261020/RELEASE_SUMMARY.md 및 WORK_STATUS 최신 항목 우선.

## 승인/범위
사용자 ‘다음 대상 뭐였지’에 첫 접속 로딩 최적화가 다음 대상임을 답했고 ‘진행 및 배포’로 구현·테스트·푸시·배포 승인. 외형/맵/스킬 변경 없음,새PNG나 시안 생성 필요 없음. 기존0.43전투/지도35/점수/저장·랭킹 규칙과 기존 그림 유지. BGM/후속 전체 컷씬 작업은 이번 범위 아님.

## 원인과 구현
- 기존 static import들이 Ready Promise를 만들면서 즉시 new Image/src를 설정해 타이틀부터 후반부 원본을 요청했다. floor-assets는 기다릴 Promise만 골랐고 요청 자체를 막지 못했다.
- asset-requests.js: **전역 Image는 바꾸지 않는다.** 렌더 모듈59개의 이미지 생성만 DeferredImage로 연결. 실제 native Image를 생성하고 src를 로컬 등록해 두었다가 해당 파일팩 activate 때 setAttribute('src', URL)로 원래 onload/onerror를 실행한다. 기존 크기 검증/crop/픽셀 처리/foot anchor는 그대로.
- asset-manifest.js: 실제 원본 파일 목록. asset-packs.js: 현재 층별/선택 초상별 요청 계획. 새 이미지 추가 시 manifest와 해당 plan을 함께 갱신하고 asset-requests.test.js의 존재/첫층 예산 회귀와 브라우저 ready 검증을 수행한다.
- floor-assets.js는 활성화→환경/해당층 atlas→필요한 sprite Ready까지 대기. 시작/이어하기/연습/상하행 resume 공통 입장 게이트·60초 무진척/총5분 제한 기반 실패복구·전투/시간 정지 유지. 이미 준비한 층은 이미지 재요청 없음. 9층 군단장 층과10층 대악마 본체 원본을 구분한다.
- feedback4시트는 named-brute/upper/demons/bosses 그룹별 대기 지원. 1층은 도약거인 등의 named-brute만 기다리며 후반 피격 atlas는 그 층/해당도감 선택 전에는 요청하지 않는다.
- journal-portraits.js는 전체 몬스터 Promise 장벽을 제거하고 IntersectionObserver로 보이는 목록 카드와 선택 상세만 준비 후 다시 그린다. 선택한 대악마 부위와 페이지 뒤로 복귀 검증. feedback 부분 로딩도 cache key에 반영해 과거 fallback 캡처가 남지 않게 했다.
- Ready 직접 대기를 사용하는 과거 QA는 먼저 prepareFloorAssets(floor) 또는 preparePortraitAssets(key)를 호출해야 한다. 현재 검증 도구는 lazy-assets-qa.mjs/floor-loading-qa.mjs/public-start-feedback-qa.mjs. 옛 타이틀/대사 모달 QA는 이미 이전버전의 이력이다.

## 검증/요청량
- 집중19/19 및 전체582/582(190초) 통과.
- 현운영145818/runtimee494023의 fresh844 Edge 기준선 baseline-final: 타이틀에서79PNG/136,321,378 bytes 원본 요청. 초기networkidle120초timeout은 baseline폴더에보존,DOM/실제title PNG ready 기준 도구로 보완하여 측정 성공.
- 로컬 fresh PC1280/가로844: 타이틀4PNG/5,491,784 bytes. 첫층은26PNG팩38,804,664 bytes + 타이틀4개 = 누적30개44,296,448 bytes. 기준선 대비 타이틀원본요청량95.97%/첫층누적67.51% 감소. 원본파일 크기를 더한 **요청량 지표**,실제 압축전송량/모든 기기의 시간 단축률이 아니다.
- 각10층 준비 성공·같은 층 재요청0,새 브라우저8층 저장 직접이어하기/필요팩만 요청,도감 가시카드·선택 대악마발 ready·뒤로 복귀 성공/오류0. 로컬 PNG 직접 확인.
- loading: PC/가로 모바일에서 실제 이미지 요청 보류 중 시간동결·절차맵미노출·준비후 상행,자산실패 복구 성공/오류0.
- 원본PNG 전체는 그대로이며 전체 게임/도감을 모두 둘러보면 결국 필요한 원본은 다운로드한다. 기존 시안을 재생성/압축하지 않았으므로 초반 팩 자체의 약39MB를 더 줄이거나 런타임 크기 파생본을 별도 만드는 것은 후속 검토.
- 실제iPhone/저사양 장시간은 미검증. 공개 cold start/온라인/동일요청량·10층/도감/로딩/TLS 확인은 배포 후 최종 요약에 기록.
## 공개 검증 후 보완
공개 직접10층이어하기는 자산누락이 아니라96,219ms 정상준비로90초고정제한에걸렸다. asset-wait.js가 실제파일load/error진척을관찰해계속준비중인작업은유지하고60초간진척없음/총5분상한에서만실패복구한다. watcher는성공/실패시해제한다. 단위진척/정지/전체상한회귀3개를포함한집중22/22통과,전체585를다시실행했다고주장하지않는다. 도감선택은준비중문자·aria-busy→완료PNG/실패문자를표시해임시외형으로오인하지않게했다. local-final은0층PC/모바일·각10층준비·8/10층cold직접이어하기·도감실제요청gate후준비/뒤로복귀통과·오류0. 초기공개실패/진단증거보존,재배포뒤공개검증결과는최종요약참조.

## 실제 출현 목록과 동적 추가
층 번호 외에 floorAssetOptions(run)으로 실제 저장의 전 방 적 목록을 모은다. 초반 희귀 상층 적, 귀환 3종/독꽃, 네임드, 상자 함정 보스의 전체 단계, 귀환 1층 최종 탈출 4종을 준비한다. 매 프레임 현재 방 목록을 시뮬레이션 전후 확인해 새 적은 준비 전 표시하지 않는다. 준비 cache는 층/hall 및 모듈/feedback 집합으로 확인하므로 적이 사라질 때 재로딩하지 않고 새로운 종류가 생길 때만 준비한다. 상자 프리즘 실요청 보류 및 희귀 royalGuard fixture 검사 통과. 초기 1층 요청량은 기존과 같다. 관련 회귀 포함 집중25/25 통과(기존 전체582와 구분).

## 최종 결과
175020-8afe12/runtimeee2d31a 배포 및 공개 전체 검사 통과. 최신 결과·제약·요청량은 docs/qa-lazy-assets-20261020/RELEASE_SUMMARY.md 참조. BGM보류, 다음 기존 입장/하강/생환 연출은 아직 미구현.
