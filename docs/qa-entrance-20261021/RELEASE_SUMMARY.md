# 새 원정 입장 연출 — 배포·공개 검증 완료

2026-10-21 KST · main · 0.43.0-prebeta. 사용자 진행 및 배포 승인.
runtime794ea76(ed987df 구현/2de34d6 표현/794ea76 여백clip). 운영 release-20261021-052348-539ee6/318 runtime파일 활성, 서버27/nginx/health/index/TLS 성공. 이전211711 릴리스와 DB·저장·랭킹 보존.

## 구현
- 새 원정에만3.6초: 탑앞0~1초 → 문틈진입1~2.4초 → 안쪽문닫힘2.4~3.6초. 자막 돌아갈 길은 닫혔다. 를1.4초부터표시. 우하단44px이상 건너뛰기/Esc/Space,기본자동종료/다음버튼없음.
- 기존title배경/후면hero3frame을공유하고새2배경plate와분리문짝을내장imagegen으로제작. 문짝이동/빛줄기·먼지/불티·얇은안개/부드러운카메라,효과완화는이동을멈추거나줄임. 별도gate3효과음은기존무음/볼륨/gesture/throttle설정존중. BGM없음.
- 메모리token만사용/새저장필드없음. 온라인/로컬연결·첫저장성공뒤예약,기존첫층실자산warmup끝나야전투시작전에재생. 저장실패시pause안내/연출미예약. 이어하기/연습/중도reload에서는재생안함. 연출중전투·탄/장판·스폰·쿨타임·elapsed정지,기존단일RAF에서독립시계만진행.
- 이미지준비는신규run선택뒤만시작(타이틀4PNG유지),실패/15초상한은연출생략/플레이진행. 로딩중스킵/입구복귀가능,늦은완료는run/mode/token검사. 스킵입력소비·reset/화면숨김·blur/세로/resize·lease상실은자동pause우선,숨겨진동안자동으로게임시작하지않음.
- 전투·보상·열쇠·스킬·랭킹·현재운영버전0.43불변. 격파/열쇠하강·최종생환은아직미구현후속. 새입장만이번범위.

## 자산/정확 프롬프트
- assets/images/entrance-plates-v1.png:1182×1330/2,780,214B,2장면. assets/images/entrance-doors-v1.png:1182×1330/2,005,131B/실제alpha,2문짝. 합4,785,345B 원본크기. 신규run에서만추가요청되며이수치를전송시간으로해석하지않는다.
- 시안 docs/design-drafts/entrance-20261020/entrance-storyboard-v1.png,프로덕션복사/정확prompt docs/design-drafts/entrance-20261021/production-prompts-v1.md. 내장image_gen__imagegen 사용/생성원본각각 .codex/generated_images/…/exec-de071aa6-580d-4d38-80e7-c1b422ef5277.png 및exec-50b8ba7f-d682-4d0c-b385-3a6ad1d669ab.png 보존. Python/SVG이미지편집/기존PNG덮어쓰기없음. 런타임canvas가atlas분리·alpha경계crop·arch clip/움직임을처리한다.

## 로컬 검증
- 전체593/593 통과(67초). 이후표현추가집중11/11·local-final입장11·마지막안개clip보완후local-visual-final PC/모바일자동·효과완화3경우통과. 전체593을최종clip뒤다시실행한것으로표시하지않는다.
- local-final 실제Edge11경우: PC1280×720/가로844×390자동3컷,약3.6초자동종료/랭킹실패재시도취소→로컬성공,Space/Q입력누수없음,queued자산보류중스킵/늦은완료무시,이미지실패,blur정지/시간0,세로회전/복귀,저장lease상실,저장실패,무음·효과완화/Esc,연습·reload이어하기미재생. 오류0/점수제출0.
- local-hud 기존5장면/물약·메뉴·액션/타이틀4PNG/투명도정렬 및local-loading PC/모바일실자산대기시간정지·절차맵미노출·상행·실패복구통과.
- 캡처직접확인. 실제iPhone/하드웨어음질·safearea/장시간은미검증. 화면숨김은blur이벤트공통pause경로와회전·lease재현범위이며실제모바일OS백그라운드테스트가아님.

## 발견/보완
초기QA의reload후새document관찰변수미설정으로undefined카운터실패→관찰재등록후통과(제품실패아님/로그보존). 마지막직접PNG확인에서안개가letterbox까지번지는것을발견해장면rectclip과soft radial fog로보완/재검증.

## 공개 최종 결과
- public-online: 실제 UI 온라인 시작 PC/모바일2, session/runs200·오류0·점수0. public-https의 API 직접 시작2와 별도다.
- 공개 입장 총12경우: public-entrance의 초기 자동PC/모바일·Space3 통과 + public-recovery9 통과. 단일12경우 일괄 실행이 아니다. cold 첫층 준비 중 입장 art15초 상한이 먼저 끝나 정상 생략된 뒤 도구가 사라진 대기창을 기다린 초기 실패는 보존했다. queued skip은 첫층만 prewarm해 독립 검사하고, 별도 cold timeout으로15초 생략·늦은 콜백 무시를 검증했다. 제품 추가 수정 없음.
- public-hud5 통과/오류0. public-loading은 PC/모바일 cold 대기·clock동결·불투명화면·상행 검사 통과 후 마지막 이미지 실패복구의 도구 기본30초 한도를 넘겨 종료됐다(원본로그와2PNG 보존). 기존 앞선 검사와 같은360초 한도로 맞추고 --failure-only로 해당 경우만 public-loading-recovery에서 성공/오류0. 단일 전체 재실행으로 표시하지 않는다.
- public-https: 코드·스타일189개 및 대상 PNG 전체 바이트 일치, TLS/HTTP308·랭킹·Secure/HttpOnly·쿠키갱신·기존 HTTP 기록 이관/원본 보존 모두 통과. 점수 제출0. public-https.log 참조.
- 실제 공개 장면 scene-844-2.png 직접 확인. 최종 추가는 QA 도구와 문서/증거뿐이므로 runtime794ea76 재배포 불필요. 모든 명령/서버 종료. 다음은 열쇠획득/하강 전환·생환 연출 검토, 이번에는 구현하지 않았다. BGM 보류.
