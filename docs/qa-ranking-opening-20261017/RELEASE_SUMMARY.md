## 최종 결과 — 완료

[랭킹 오류 배포·공개 검증 완료 / 2층 시안 검토 대기] release-20261018-013123-46cc98 / https://168.107.21.43/ / runtimec1dd8c8 main누적푸시. 초반방5/6과구지도모두허용+API허용버전0.39동기화로두불일치수정. 실제config계약검사·패키징전버전불일치차단/UTF-8가드추가. 로컬관련12/12·실제설정계약1/1(초기Temp권한실패후허용환경통과),서버27/nginx/인증서/index/health통과. 공개PC1280×800·가로터치844×390 실제새도전버튼2건 online=true/5·6방/10층/hero4frames58px/환경ready/errors0 및정상주인공PNG육안확인. 별도공개8층10층API starts2/TLS147코드및PNG일치/308/랭킹SecureHttpOnly세션·저장이관2종 통과·운영점수제출0. 자료 docs/qa-ranking-opening-20261017/{RELEASE_SUMMARY.md,public-verified/result.json,public-https-final.txt}. 첫unsupported_version/PowerShell인코딩/Temp권한실패·가로터치첫거절(원문미수집·격리재시도와최종2뷰포트성공)로그보존,상세미확인실패는후속재현시응답수집하도록QA보완. DB/계정/기존기록삭제없음·기존버전원본보존/최신버전공개표정책유지. 개발서버전부종료·실행명령세션차단없음. 실제iPhone/Android/저사양장시간 미검증. 다음2층청회군사회랑 일반방/파수꾼보스연병장/창거치대·깨진방패·찢어진깃발 PNG시안완료 docs/design-drafts/environment-20261018/floor2-environment-v1.png,정확prompt/설계같은폴더·내장imagegen1회·원본보존. 시안은runtime미반영/컨펌대기·문충돌/판정/6방수유지. 이번배포완료·이후평상시수정기록로컬커밋/새명시배포전테스트푸시배포공개검증금지.

# 랭킹 초반 지도 수정·주인공 캡처 배포 검증

원인: 게임의 초반 방 수5/6과 API 구7/8최소조건 불일치. API는 새지도와 기존8/10층지도 모두 허용하며 잘못된방수·타입·최종층 제한은 유지. DB/시즌/점수규칙 변경 없음. 주인공 런타임/PNG 변경 없음, QA는 heroSpriteReady+4frames를 필수로 확인.

로컬: 관련 회귀12/12(Python API/HTTP/SQLite 및 실제JS 생성6지도 포함), PC1280×800/가로터치844×390 승인주인공4프레임·58px·환경ready·오류0. 두 실제PNG를 육안 확인했다. local-tests.txt, local/result.json 및 hero-*.png.

다음: 검증기록/누적푸시→공식배포→공개147코드/PNG/TLS/API 및2캠페인 runs시작, PC/가로터치 실제새도전버튼과hero확인. 운영점수는 제출하지 않는다. 이전캡처를 정상주인공 증거로 사용하지 않는다. 실제기기/저사양장시간/전층수동플레이는 검증범위 아님.


## 첫 배포 공개 실패와 추가 수정

release-20261018-011942-f4a4d6 서버27검사와health는통과했으나 공개 실제 시작 버튼과새2캠페인검사에서 unsupported_version 발생. 클라이언트는0.39인데 api/config.json이0.38이었다. 첫계약회귀가허용버전을RELEASE로가짜생성한것도누락원인. config0.39동기화, 실제config계약회귀로변경, 공식배포전버전불일치차단가드추가, 로컬랭킹QA의하드코딩제거. 실제config계약1/1통과. public-browser.txt/public-https.txt 첫실패원본보존. DB/계정/기록삭제없음, 이전버전개인기록보존·최신버전만공개표시정책유지. 재배포 후실제버튼/API시작과hero를다시확인한다.


## 실패/정정 기록

- 첫실제config 계약은 제한환경 Temp SQLite권한으로실패했고 직전기록의1/1통과는잘못된판독이었다. actual-config-contract-final.txt에서허용환경1/1통과로정정했다.
- Windows PowerShell5 Get-Content 기본인코딩으로한글JSON파싱실패. UTF-8 ReadAllText로변경후실제powershell.exe에서가드통과, 공식최종재배포성공.
- 최종재배포첫공개PC는성공했으나가로터치한번거절, 응답원문은미수집으로원인미확정. public-touch에서성공하고마지막public-verified에서2뷰포트동시완주online=true/hero4frames/errors0. QA는후속실패시메시지와API응답상태·코드만수집하도록보완했다.
- 기존공개캡처의임시외형증거는보존한다. 정상주인공외형증거는이폴더local 및public-verified의 hero-*.png이다.
