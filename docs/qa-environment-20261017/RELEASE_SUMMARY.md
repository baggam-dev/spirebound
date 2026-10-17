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

최종 로컬 검사: PC/가로 터치 시설 실사용4건 통과·pageErrors0, local/result.json. 현재 배포 전. 최종 로컬 검사 완료 후 커밋/누적푸시 → 공식 deploy.ps1 → 공개 HTTPS/자산바이트/환경 화면/시설사용을 확인한다. 공개 결과와 실제 릴리스를 여기에 추가한다.

## 한계와 다음 구상

실제 iPhone/Android 기기·저사양 장시간·전층 수동 플레이는 확인하지 않았다. 이번 범위의 1층 배경과 공통 시설 외 2~10층 배경 및 기존 비벽 장애물의 전면 디자인은 후속이다. 다음2층은 옛 왕국 검문 회랑: 규칙적 판석/무쇠 보강/부러진 창·방패/퇴색한 깃발/파수꾼 연병장. next-floor2.md에 구상만 작성하고 새 PNG 승인 전 runtime미반영.
