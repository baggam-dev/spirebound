## 후속 정정 — 주인공 외형은 검증 누락

공개 game-1280.png/game-844.png에는 승인 주인공 PNG 대신 로딩/offline fallback이 담겼다. 이를 정상 주인공 외형까지 확인한 자료로 해석하면 안 된다. 배경 ready만 기다린 캡처 조건의 누락이며, 이번 환경 배포에 주인공 원본/렌더러 변경은 없었다. 로딩 지연과 실제 PNG 실패 중 어느 원인인지는 미확인이다. 주인공 heroSpriteReady/state 필수검사를 추가했으며 재실행하지 않았다. 다음 명시 배포 검증에서 원인과 정상 외형 PNG를 확인해야 한다. 기존 자료는 원본 증거로 보존한다.

# 2026-10-17 환경 리뉴얼 배포 검증

## 범위

승인한 1층 회녹색 판석·이끼 석벽·문, 공통 시설 6종/사용 전후, 별도 불꽃·불티/수면/먼지/웅덩이, 결정적 타일 균열·파손. a7ae004 → 320be0a → 93c442c 누적. 실제 화면에서 내벽에 횃불이 가려진 것을 발견해 장애물 벽 이후·액터 이전으로 레이어를 옮겼다. 게임 RNG/저장/충돌/상호작용 조건을 바꾸지 않았다.

## 검사

- 전체 node --test 530/530 통과: environment-tests-unrestricted-20261017.txt. 최초 527/530은 localhost 연결이 차단된 샌드박스에서 발생한 HTTP/API3건이며 원본 environment-tests-20261017.txt 보존.
- 최종 횃불 레이어 변경 후 관련 object-positions/terrain/sound/wall-cache/wall-layouts 20/20 통과: related-final.txt.
- 환경 전용 tools/qa/environment-release-qa.mjs: 16프레임 준비, 시설18장면, 30지도231웅덩이 반복 배치·영역, 동일시간 픽셀동일, reduced정지, 시간별애니메이션, run/RNG불변, Canvas복원, PNG차단fallback, 자산응답 내용일치.
- 실제 PC1280×800 및 가로 터치844×390 게임·시설 사용 검증은 local/result.json 최종 결과 기준. 화면은 game-*.png(게임캔버스 직접 캡처), screen-*.png(일시정지UI), facilities.png.
- 초기 QA스크립트 괄호오타/샌드박스 서버 연결 실패/기존페이지 pagehide 저장에 의한 준비 데이터 덮어쓰기 로그를 보존했다. QA는 새 격리 저장소를 사용하며 운영 점수는 제출하지 않는다.

## 배포

runtime 6ef3f09/main 누적푸시 후 공식 deploy.ps1로 release-20261017-214239-b3eb8e 배포 완료. 268개 런타임 파일, 서버 Python25개·Nginx·인증서 유효·공개 index 바이트·health 확인. 이전 release-20261017-171745-074b87. deploy.txt 참조.

공개 HTTPS QA: TLS·147개 JS/CSS/HTML 일치·PNG 바이트 일치·HTTP308·랭킹 Secure/HttpOnly 세션·기존 세션 업그레이드·HTTP 저장 이관2종 통과, pageErrors0/운영 점수 제출0. public-https.txt 참조. 공개 환경 QA의 기본30초 load 대기는 네트워크에서 timeout이 발생해 DOMContentLoaded/120초 및 게임 atlas ready 명시 대기로 변경했다. runtime 변경 없음. 각 격리 탭의 timeout/오류 수집 적용을 바로잡고 최종 공개 검사 완료: public/result.json, public-environment-verified.txt. 시설18장면·30지도231웅덩이·PNGready/fallback·상태/RNG불변·정지/reduced·Canvas복원·PC/가로터치 시설실사용4건, errors0. 실제 공개 game-1280.png/game-844.png 육안 확인. 개발 서버는 모두 종료했다. 이번 runtime 추가 수정은 없다.

## 한계와 다음 구상

실제 iPhone/Android 기기·저사양 장시간·전층 수동 플레이는 확인하지 않았다. 이번 범위의 1층 배경과 공통 시설 외 2~10층 배경 및 기존 비벽 장애물의 전면 디자인은 후속이다. 다음2층은 옛 왕국 검문 회랑: 규칙적 판석/무쇠 보강/부러진 창·방패/퇴색한 깃발/파수꾼 연병장. next-floor2.md에 구상만 작성하고 새 PNG 승인 전 runtime미반영.
