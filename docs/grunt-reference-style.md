# 승인 잡졸 v3 런타임 적용

2026-10-12 사용자 “확정 및 다음”으로 추격자·일반 연사 궁수 v3 승인. 무채색 옷/잿빛 머리/천 입가리개/수수한 장비. 원본은 docs/design-drafts/enemies-20261012/*-v3.png, 실제 image_gen 편집 프롬프트는 같은 폴더 prompts-v3.md. 새 디자인 생성 없이 승인 원본을 그대로 assets/images/chaser-masked-atlas.png·archer-masked-atlas.png에 복사.

- src/rendering/grunt-sprite.js: 1774×887 RGBA 원본 각2자세를 한 번만 게임크기로 캐시(몸체74px), 발21px 앵커. 추격자 접근65px 이내 낮은 자세, 궁수 warning/firing 활당김·patternAim 기준좌우. 이동시 기존 motion 기반 작은 바운스. 아직 별도 보행/방향별 완전 애니메이션은 없다.
- PNG 실패/잘못된 크기/Canvas 예외시 기존 코드 외형 fallback. 비동기 로딩 전 초상 캐시는 ready별 키로 구분하며 연결된 기록화면을 로딩 후 재렌더한다.
- 하강 시 회색 옷을 유지하고 붉은 발쪽 표식, 체력바는 몸체 위60px 위치. 충돌/전투 수치/저장/버전0.38/generation34/랭킹 변경 없음.
- server.js 및 deploy.ps1에 두PNG만 명시 허용, public-https QA에서 바이너리일치 확인.

검증: 전체447개 통과. tools/qa/grunt-reference-qa.mjs 로컬Edge12장면(PC1280×800, 모바일에뮬844×390/390×844 × normal/attack/rage/legacy), 실제렌더4캐시/자세/좌우/그리기상태불변/초상/이동·HP보존·구27저장·로딩실패fallback/오류·넘침0. 비교 grunt-reference-comparison.png 및 모바일 grunt-reference-mobile.png. 실제iPhone/장시간최대몹 FPS 미검증. 운영 배포/공개검증은 WORK_STATUS 및 WORK_LOG의 최신 기록을 따른다.

운영 검증 완료: ac3c115 origin/main / release-20261012-141218-8c4571. 공개 Edge 12장면 및47파일·PNG3종바이너리일치·HTTPS/HTTP308/랭킹/보안쿠키/이전 통과, 서버Python25개. 공개 모바일 캡처 grunt-reference-public-mobile.png. 운영 점수제출 없음.

## 2026-10-12 돌진병·산탄사수 추가 — 로컬 구현/미검증

사용자 “확정” 승인으로 PNG2종을 assets/images에 그대로 복사. 돌진병 charger-roundshield-v2.png·산탄사수 scatter-concept.png 기준, 앞선 승인 두종과 같은74px/발21px 기준. grunt-sprite는4종8캐시·상태ready 조건도4종으로 확대. chargeAngle이 있는 돌진예고/돌진에 방패앞세운자세와 고정방향, 산탄사수warning/firing에 조준자세/patternAim방향을 표시한다. 기록초상 같은캐시 및 체력바60px. 방패 방어기능/전투/저장 수치는 바꾸지 않았다.

server/deploy 허용PNG에 charger/scatter-masked-atlas 추가. QA스크립트의4종8캐시·4초상·4종저장·실패fallback 및 공개PNG4종 바이트비교 준비. **테스트 실행하지 않음, 미푸시·미배포**. 이전447개/공개12장면 통과 기록은 신규두종 검증을 의미하지 않는다. 사용자 배포 지시 때 실행/실패수정/필요한 재검증 후 푸시·배포·공개확인. 실제게임 크기·자세/양손장비일관성·성능은 아직 확인 전.
