# 생환 3초 연출 검증·배포 (2026-10-21)

사용자 최신 ‘진행 및 배포’로 escape-storyboard-v1 승인 및 구현·검증·푸시·배포·공개확인 허가. 전투·저장형식·점수 규칙 변경 없음/0.44.0-prebeta 유지. BGM 보류.

## 구현
실승리 기록/점수·온라인 초안 확정/리스 해제 후 준비 최대800ms, 0~.8초 문열림·봉인파편→.8~2.4초 기존 hero3frame 이동→2.4~3초 ‘살아서 내려왔다.’→기존 결과. 상시 터치44px·Escape/Space 스킵, 입력누출 방지. 사망/연습/기록 저장실패는 즉시 기존 결과. 숨김/blur/회전/resize/pagehide/RAF 큰 지연/그림 실패·지연 시 결과로 직행하며 완료 기록 재실행 없음. 랭킹 등록은 기존 사용자의 명시 버튼 유지. 키 보유 최종 출구/봉인전투 시작 때만 사전 준비, 타이틀 초기4PNG 유지. 기존 입장 문짝 로더 공유, 여명 PNG 한 장만 파생 제작/원본·정확 프롬프트·버전 사본 보존. 메인 헤더 0.43 오기를 실제 버전0.44에 맞춤.

## 검증
- focused9 통과(focused.log), 전체608 2회 통과(full.log/full-final.log). 최종800ms 실시간 제한·봉인파편·발소리 포함 full-final.log 608/실패0.
- 기존 입장12 통과(entrance/result.json), 점수제출0. 공유문 준비·자동/스킵/실패/중단·효과완화·연습 회귀.
- local-v2 생환16 통과/오류0·점수0: PC/가로모바일 자동3컷, Space/터치, blur/세로/resize/pagehide/hidden/큰RAF간격, 효과완화·무음, 이미지지연·실패·준비중스킵/blur·결과저장실패. 최종 local-final17 통과/오류0·점수0: 위16과 랭킹초안 격리fixture1. history/ended 각각1회/초안1회, 결과·도감왕복·새로고침 보존. 최종 실제 PNG3컷 보존.
- 실제 PNG 직접 확인: local-v2/escape-auto-1280-1.png 및 가로844의0·2. 원근·hero발·16:9 무crop/우하단스킵·생환자막 확인.
- 첫 실패는 제품 오류가 아니라 expanded QA fixture에서 demonPending=false만 지정하고 실제 demon상태 누락. 실제 보스 단계 전개로 fixture수정, 실패 원본 local/failure.json 및 fixture-failure.log 보존. runtime 우회 없음.

## 배포·공개
아직 배포 전. 최종 로컬 UI 완료 후 main 커밋/푸시→공식 deploy.ps1→공개 생환핵심·실온라인시작2·HTTPS194소스/대상PNG 바이트/TLS308·기록이관 검증 예정. 합성 점수 POST 금지. 실제 iPhone/기기 음질·장시간 플레이 미검증.
