# 고층·군집 배포 검증 2026-10-22
- full.log: 전체 637/637 통과. 당시 첫 로딩 수정 후 실행했으며, 후속 실제 진입에서 일반 Ready 모듈 등록 오류를 발견해 extra PNG 활성화로 수정했다.
- loading-fixed.log: 로딩 수정 뒤 관련20/20. 최종 crop 보정 뒤 final-related.log와 environment-final로 다시 확인한다.
- focused.log: 최초61 중1실패(자산 사전 로딩 누락). 성공 결과로 계산하지 않는다.
- environment/: 최초 검사 결함으로 로딩 중 검정 화면 캡처. 성공 근거에서 제외한다. environment-fixed 및 최종 environment-final은 실제 overlay 종료 후 캡처한다.
- combat.log: 첫 진입 대기 중 중단. combat-fixed: 9종 실제 RAF/UI 및 24마리 일반/완화 11장면, 저장 재개·공유 예고·플레이어 좌표 보존, 예외0/순위 등록0.
- regression: 기존 근접·벽·후방·베라·군단장·완화 저장재개 7장면 통과.
- art-fixed: 24모듈 실제 crop/원본 실패 시 v1 왕국·마족 fallback 통과. 원본 PNG는 변환하지 않고 source crop 열 경계만 보정했다.
- 밀집24마리: 일반 평균27.09ms/p95 49.8, 완화 평균23.26ms/p95 33.6. 다른 QA와 병행한 데스크톱 헤드리스 Edge 측정이며 실제 휴대폰·장기 플레이 검증이 아니다.
- 다음: 최종 관련 결과 확인 → 커밋/푸시 → 공식 배포 → HTTPS 파일·온라인 시작/고층 공개 확인. 원격 기록 POST는 하지 않는다.

최종: environment-final 및 final-related20 통과. release-20261022-194335-06691a/runtime e868e2e 배포 완료, 서버API27 통과. 공개 고층3/온라인시작2/HTTPS210파일·PNG일치·308·랭킹·보안쿠키·저장이전 통과. JS오류0/순위기록제출0. public-combat/result.json, public-online/result.json, public-https.log 참고. 개발서버 종료.
