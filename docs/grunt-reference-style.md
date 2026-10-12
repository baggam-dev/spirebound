# 승인 잡졸 v3 런타임 적용

2026-10-12 사용자 “확정 및 다음”으로 추격자·일반 연사 궁수 v3 승인. 무채색 옷/잿빛 머리/천 입가리개/수수한 장비. 원본은 docs/design-drafts/enemies-20261012/*-v3.png, 실제 image_gen 편집 프롬프트는 같은 폴더 prompts-v3.md. 새 디자인 생성 없이 승인 원본을 그대로 assets/images/chaser-masked-atlas.png·archer-masked-atlas.png에 복사.

- src/rendering/grunt-sprite.js: 1774×887 RGBA 원본 각2자세를 한 번만 게임크기로 캐시(몸체74px), 발21px 앵커. 추격자 접근65px 이내 낮은 자세, 궁수 warning/firing 활당김·patternAim 기준좌우. 이동시 기존 motion 기반 작은 바운스. 아직 별도 보행/방향별 완전 애니메이션은 없다.
- PNG 실패/잘못된 크기/Canvas 예외시 기존 코드 외형 fallback. 비동기 로딩 전 초상 캐시는 ready별 키로 구분하며 연결된 기록화면을 로딩 후 재렌더한다.
- 하강 시 회색 옷을 유지하고 붉은 발쪽 표식, 체력바는 몸체 위60px 위치. 충돌/전투 수치/저장/버전0.38/generation34/랭킹 변경 없음.
- server.js 및 deploy.ps1에 두PNG만 명시 허용, public-https QA에서 바이너리일치 확인.

검증: 전체447개 통과. tools/qa/grunt-reference-qa.mjs 로컬Edge12장면(PC1280×800, 모바일에뮬844×390/390×844 × normal/attack/rage/legacy), 실제렌더4캐시/자세/좌우/그리기상태불변/초상/이동·HP보존·구27저장·로딩실패fallback/오류·넘침0. 비교 grunt-reference-comparison.png 및 모바일 grunt-reference-mobile.png. 실제iPhone/장시간최대몹 FPS 미검증. 운영 배포/공개검증은 WORK_STATUS 및 WORK_LOG의 최신 기록을 따른다.
