# 새 대화 인계

아래 블록을 새 챗/다른 AI에 붙여 넣는다. 세부 상태는 저장소 문서를 기준으로 다시 확인한다.

```text
Spirebound 작업을 이어가자. 답변은 한국어, 기본 5줄 이내.
저장소: C:\baggam-dev\spirebound
GitHub: https://github.com/baggam-dev/spirebound

먼저 AGENTS.md와 git status --short를 확인하고,
docs/WORK_STATUS.md → docs/TODO.md → docs/WORK_LOG.md 최근 항목 → docs/HANDOFF.md 순서로 읽어줘.
기존 미커밋·신규 파일을 보존하고 reset/clean/stash 하지 마. 의미 있는 수정 단위로 검증 후 커밋하고, 푸시는 별도 요청에만 해.
사용자가 강조한 출시 품질 우선순위는 **1. 플레이의 재미 2. 디자인의 유려함**이다. 앱 빌드/스토어 심사/운영 개선을 먼저 진행하지 마. 기존 완주 후기·현재 게임 코드·대표 화면에서 재미와 시각 문제를 진단하고, 작은 개선 단위를 정해 검증해. 상세 docs/app-store-readiness-review.md와 TODO 상단을 확인해.
사용자 레퍼런스는 Shattered Pixel Dungeon(절제된 도트·탐험), Hades 1/2(속도감·이펙트·캐릭터), The Binding of Isaac(한 판을 바꾸는 조합)이다. 적용/비적용 원칙은 docs/quality-reference-direction.md. 조합 선택 안내 `8dc1517`, 전투 시너지 `ea3f584`(운영 release-20261006-160216-75ee74), 첫 디자인 단위 `c7ac277`(운영 release-20261006-195007-317806) 완료. 최신 디자인은 1·2층 석조 바닥/보스 판석과 모바일 가로 HUD 가독성 개선이며 `docs/quality-design-slice.md`에 전후 화면이 있다. 새 도전 기본 BETA-5/ranking-v11·확장 ASCENT-7/ranking-v12, 기존 BETA-4/ASCENT-6은 로컬 이어하기/조회 전용. 최신 전체407개, 로컬·공개 Edge 4크기×2장면 및 공개 HTTPS 파일10개/운영 QA 통과. 다음은 사격/피격/점멸 전투 리듬이다. 사람 플레이·실기기 재미/가독성은 미검증이다.

통합 개선 순위 0~4번과 6번 결말 전투는 구현·검증·배포 완료했다. 5번 전면 비주얼 개선은 여덟 단위를 완료했고, 7번 출시 품질 사운드·설정, 입력·모달 포커스, 31분 저장·재개 내구성, 브라우저 데이터·복구 안내 네 단위도 완료했다. 실제 iPhone 가독성·음량·장시간 성능은 대기한다. 현재 운영 릴리스와 완료 근거는 WORK_STATUS.md를 기준으로 확인해.
4번은 무속성 정밀 사격 메인·직격 전용 보조·3레벨 분기와 4레벨 유틸 액티브 1칸(집중/응급 처치/수호 환영), PC G/모바일 버튼·저장 호환이다. 상세는 docs/skill-stage4.md.
5번 첫 단위는 1층 영웅 얼굴/상체, 9·10층 현무암 바닥·벽·횃불, 9층 악마 적, 귀환 도약 거인 부분 발광을 적용했다. 코드 aa71935 / 운영 release-20260930-230723-cd53ab. 전체 node --test 396개·서버 Python24개·로컬/공개 Edge PC/모바일 1·9·10층 화면·공개 HTTPS QA 통과, 운영 점수 제출 없음. 상세와 캡처는 docs/visual-stage5.md.
5번 둘째 단위는 2층 파수꾼·기본 적 재질, 정밀 화살 궤적, PC HUD 가독성을 개선했다. 코드 809a9ab / 운영 release-20261001-172601-940a52. 전체396개·서버 Python24개·로컬/공개 Edge PC/모바일 보스·화살 화면·공개 HTTPS QA 통과, 운영 점수 제출 없음. 상세 docs/visual-stage5.md.
5번 셋째 단위는 3~8층 외곽/내부 벽에 층별 저채도 재질을 적용했다. 코드 438acda / 운영 release-20261001-175511-d82f08. 전체397개·서버 Python24개·로컬/공개 Edge PC/모바일 1~10층20장면씩·공개 HTTPS QA 통과, 운영 점수 제출 없음. 상세 docs/visual-stage5.md.
5번 넷째 단위는 9층 군단장 화살통·판금과 2페이즈 균열/빙결 견갑을 추가했다. 코드 385e452 / 운영 release-20261001-180645-af23e1. 전체397개·서버 Python24개·로컬/공개 Edge PC/모바일 도전·저장·페이즈 화면 및 공개 HTTPS QA 통과, 운영 점수 제출 없음. 비교 캡처 docs/visual-stage5-commander-phases.png.
5번 다섯째 단위는 10층 대악마 손·발/눈·코·입/상반신의 재질과 실루엣을 구분했다. 코드 05e62fb / 운영 release-20261001-184251-7b8ede. 전체397개·서버 Python24개·로컬/공개 Edge PC/모바일 3페이즈/6부위 및 공개 HTTPS QA 통과, 운영 점수 제출 없음. 비교 캡처 docs/visual-stage5-demon-parts.png.
5번 여섯째 단위는 속성 화살 4종에 실제 자동 사격 직전 작은 활 표식, 속성별 비행 잔상, 독 피격 비말 균형을 적용했다. 코드 2425f3a / 운영 release-20261001-203004-1b7f2d. 전체398개·서버 Python24개·로컬/공개 Edge 4속성 12장면·PC/모바일 전투/공개 HTTPS QA 통과, 운영 점수 제출 없음. 비교 캡처 docs/visual-stage5-element-shots.png.
5번 일곱째 단위는 결과 화면을 제목/핵심 수치/탈출 점수·사망 원인/주요 행동/빌드 상세로 정리했다. 코드 b50d783 / 운영 release-20261001-211430-e79701. 전체398개·서버 Python24개·로컬/공개 Edge PC/모바일 기본·확장 완주/사망 12장면씩·공개 HTTPS QA 통과, 운영 점수 제출 없음. 캡처 docs/visual-stage5-result-win.png 및 visual-stage5-result-death-mobile.png.
새 도전은 기본 BETA-5/ranking-v11, 확장 ASCENT-7/ranking-v12이다. BETA-1~4·ASCENT-1~6은 조회 전용이다. 기존 저장은 이어갈 수 있으나 종료 시즌 점수 신규 제출은 안 된다.
사용자 요청으로 595f4d5까지 origin/main 푸시 완료. 첫 디자인 코드 c7ac277와 이후 문서 커밋은 별도 푸시 요청 전까지 로컬에 둔다. 배포와 푸시를 혼동하지 마.
5번 여덟째 단위는 비주얼 직전 25f2248과 현재의 실제 게임 루프 p95/p99 및 PC·모바일 전후 화면을 같은 시드로 비교했다. 15장면×240프레임 오류·가로 넘침0, 큰 미로 벽의 지속 버벅임 근거 없음. 모바일 가로 HUD 글자는 작다. 상세 수치·전후 캡처·재현 도구: docs/visual-stage5-frame-qa.md. 게임 변경이 없어 배포 없음.
6번 1층 결말 전투는 코드 aa86f0b / 운영 release-20261002-034334-aaeb84로 완료했다. 새 도전은 1층 출구에서 봉인을 깨고 36초 동안 3차 추격을 버틴 뒤 탈출한다. 전체401개·서버 Python24개, 로컬/공개 Edge PC·모바일 결말/시즌/HTTPS QA 통과, 운영 점수 제출 없음. 상세 docs/final-escape-stage6.md.
7번 첫 단위 사운드·설정은 코드 539237b / 운영 release-20261002-040023-d91cc6으로 완료했다. 짧은 전투 효과음과 브라우저별 음량·음소거·화면 효과 완화 설정을 더했다. 전체403개·서버 Python24개, 로컬/공개 Edge PC·모바일 설정/재개 및 HTTPS QA 통과, 운영 점수 제출 없음. 상세 docs/release-quality-stage7-sound.md.
7번 둘째 단위 키보드·터치 입력/모달 포커스는 코드 3ba6e24 / 운영 release-20261006-082556-0955b6으로 완료했다. 버튼 Space와 점멸 분리, 모달 Tab/Escape, 모바일 메뉴 접근성, 무음 강공격 경고 문구를 검증했다. 전체403개·서버 Python24개, 로컬/공개 Edge PC·모바일 및 HTTPS QA 통과. 상세 docs/release-quality-stage7-controls.md.
7번 셋째 단위는 코드 13dacde / 운영 release-20261006-093256-0c56f3으로 완료했다. Edge PC 실제 경과 31분·게임 30분55초, 저장/재개 전환5종 오류0, 모바일 에뮬레이션 회전/재개, 전체403개·서버 Python24개·공개 HTTPS/안내 화면 QA 통과, 운영 점수 제출 없음. 상세 docs/release-quality-stage7-durability.md. 7번 넷째 단위 브라우저 데이터·복구 안내는 코드 e944243 / 운영 release-20261006-095311-d3940d로 완료했다. 백업/가져오기·손상 저장 원본·모바일·기존 HTTP 이전 및 전체403개·서버 Python24개·공개 HTTPS QA 통과, 운영 점수 제출 없음. 상세 docs/release-quality-stage7-data.md. 현재 백업은 같은 서버 디스크에만 있고 실패는 journal에만 남는다. 외부 목적지/접근 권한·알림 수신처, 공개 기록 삭제·문의 경로가 필요하나 사용자 요청으로 운영 개선은 후순위다.
2026-10-06 Apple App Store·Google Play 출시 품질 검토 완료. 웹 베타 기능은 확보했지만 앱 프로젝트/빌드, 실제 iPhone·Android 조작·고부하 성능, 처음 보는 사람의 완주 경험이 없어 정식 출시 후보 판정은 보류한다. 상세 판정·공식 기준·다음 게이트는 docs/app-store-readiness-review.md. **다음은 게임 품질 우선: 신규 플레이어의 기본/확장 캠페인 첫 10분·사망·보스·완주 문제 수집, 실제 기기 가로 HUD/터치 확인.** 문서 검토만 했고 런타임 배포 없음. 실제 iPhone, 사람 조작 난이도, 장시간 고부하 FPS는 아직 검증하지 않았다. 외부 백업·알림과 공개 기록 문의/삭제 정책은 출시 전 남은 운영 과제다. 기기 간 본인 식별은 별도 선택 과제다.
최신 게임 품질 단위의 운영 릴리스는 release-20261006-195007-317806. 코드 c7ac277 이후 공개 HTTPS QA가 통과했고 QA 스크립트·상태/TODO/작업 이력·인계 문서를 갱신한다. 다음은 TODO 최상단의 사격/피격/점멸 전투 리듬 개선이다.

완료된 단계를 반복하지 말고 TODO의 다음 미완료 항목부터 진행해줘. 개발 후 적절한 검증과 배포까지 이어가되, 외부 정보가 필요한 과제는 부족한 내용을 알려줘.
매 작업과 의미 있는 중간 단계마다 WORK_STATUS/TODO/WORK_LOG를 갱신하고 마지막에 이 인계 문서도 맞춰줘. 키·토큰·쿠키 원문을 출력하거나 문서에 적지 마.
```

## 재개 시 확인할 연결 정보
- 서버: Oracle Linux 9, Nginx, SSH 사용자 `opc`, IP `168.107.21.43`.
- 키 경로: `C:\baggam-dev\docs\spirebound-docs\ssh-key-2026-09-20.key` (내용 출력 금지).
- 배포: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools\deploy\deploy.ps1`.
- HTTPS 전환 시에만 `-EnableHttps`; 이미 활성화된 서버는 일반 배포에서도 HTTPS 유지.
- DB·서비스·운영 경로와 최신 릴리스는 WORK_STATUS.md 및 ranking-operations.md에서 확인.
