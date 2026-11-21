# 생환의 아침 — 로컬 제작 기록 (2026-11-21)

승인된 storyboard-v1 기반 7초 4컷. 런타임 구현 완료, 실행 검증·푸시·배포 전이다. 운영은 0.59.0-prebeta/runtime968802c 그대로다.

|구간|구현|
|---|---|
|0–1.2|내부 후면, 별도 경첩 문과 봉인 선 해제|
|1.2–3|외부 역각, 기존 앞4보행으로 문턱 통과 후 접지|
|3–4.8|같은 외부 카메라, 새4포즈로 활 내림/가슴끈 짚음/숨/시선|
|4.8–7|새벽 넓은 후면, 새4보행으로 출발, 4.9–6.85 자막|

장면 내 인물 높이 고정, 접지 구간을 둔 이동. 프레임별 PNG 본문/별도 투영 그림자 사용. 문은 경첩 기준 스트립 원근, 배경에 그려진 문짝 제거. 왼손 활/오른쪽 화살통은 앞·후면 시트에서 반대로 보여야 한다. 작은 합성 하강음은 호흡 타이밍 보조이며 사람 음성 녹음이 아니다. reduced는 대표 자세/정적 개방/입자·투영 생략. 고정 카메라 컷 전환이며 회전 중간 포즈는 없다.

## 생성 원본과 재현
Built-in imagegen 사용. PNG 원본 복사만, 재인코딩/픽셀 후처리 없음. 프롬프트는 같은 폴더 prompt-*.txt. 공통 참조는 기존 주인공/프롤로그 및 기존 새벽 배경. 아래 소스는 C:/Users/SDSPRO/.codex/generated_images/01a1bb35-6f0c-7421-914b-8beb67028949/ 내부다.

|배포 자산|생성 소스|SHA256|
|---|---|---|
|escape-threshold-v2.png|exec-bd05ceba-1b29-4659-ae72-c3baf18ef621.png|554CF8AB4F8E932E025EBDB73135A41AEABB6AE71C0F2ECB2EECE1F635A694B5|
|escape-hero-actions-v2.png|exec-3ac7299c-3343-4e55-95fb-e0516a8ad449.png|9D254956C1DFA58BE3DEBFE1D62D6EB36AC075D551354B26A33584F101F6F4CA|
|escape-hero-rearwalk-v2.png|exec-59f30d76-0f9c-4d28-8c3f-7670423d5783.png|7A9822BDBE8B2E65ECC2D68C3B0EAE2077B5EF2015E61643ECE8B8A51ED631A0|
|escape-dawn-v2.png|exec-ed04858a-6d29-4e83-94a9-febe318e99a8.png|8C09DB388E88566B9A5F9DD9CF352744DD38422DB17F5B7A1C05C7A036194361|

앞보행 entrance-hero-frontwalk-v3.png, 문 entrance-doors-v1.png 재사용. 전용 자산은 귀환 floor0 미리 준비하며 타이틀/일반 층 팩에 추가하지 않았다. server/deploy 허용목록 추가. 기존 dawn-v1 보존.

## 검증과 다음 단계
원본 이미지 육안·시트 규격/알파·해시·정적 코드/diff만 확인. 새 motion 회귀2개 작성, 기존 토큰 시계7초/브라우저4컷 캡처 기대값 수정했으나 실행하지 않았다. 완료 저장과 토큰/0.8초 대기 코드는 유지. 렌더 실패는 기존 game try/catch 결과 복귀 경로를 사용한다.

명시 배포 지시 시 누적 전체/API 테스트와 엔딩 기존17케이스 QA를 실행할 것. 4컷 PC/모바일·완화 캡처에서 포즈 크기/발 접지/활 손/문 clipping/인물 배경 합성/최종 자막/실제 음향 확인, 콜드 로딩과 0.8초 포기/늦은 응답·skip·기록 1회도 재확인. 신규 이미지 증가로 콜드 귀환에서 대기 제한에 걸릴 가능성은 아직 측정하지 않았다. 이전 운영876 통과는 이번 변경 검증이 아니다.

2026-11-21 통합 마감: 첫 프레임 뒤 오류도 game frame에서 finishEscape로 복귀하도록 보강. escape-release-qa에 render-fail 1흐름 추가하여 총18개 준비·미실행. 공개core3 유지. 룰렛 별도6흐름은 tools/qa/utility-release-qa.mjs에 준비·미실행.
