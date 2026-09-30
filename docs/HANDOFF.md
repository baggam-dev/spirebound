# 새 대화 인계

아래 블록을 새 챗/다른 AI에 붙여 넣는다. 세부 상태는 저장소 문서를 기준으로 다시 확인한다.

```text
Spirebound 작업을 이어가자. 답변은 한국어, 기본 5줄 이내.
저장소: C:\baggam-dev\spirebound
GitHub: https://github.com/baggam-dev/spirebound

먼저 AGENTS.md와 git status --short를 확인하고,
docs/WORK_STATUS.md → docs/TODO.md → docs/WORK_LOG.md 최근 항목 → docs/HANDOFF.md 순서로 읽어줘.
기존 미커밋·신규 파일을 보존하고 reset/clean/stash 하지 마. 의미 있는 수정 단위로 검증 후 커밋하고, 푸시는 별도 요청에만 해.

통합 개선 순위 0~4번은 구현·검증·배포 완료했다. 5번 전면 비주얼 개선은 진행 중이며 첫 세로 조각까지 완료했다. 현재 운영 릴리스와 완료 근거는 WORK_STATUS.md를 기준으로 확인해.
4번은 무속성 정밀 사격 메인·직격 전용 보조·3레벨 분기와 4레벨 유틸 액티브 1칸(집중/응급 처치/수호 환영), PC G/모바일 버튼·저장 호환이다. 상세는 docs/skill-stage4.md.
5번 첫 단위는 1층 영웅 얼굴/상체, 9·10층 현무암 바닥·벽·횃불, 9층 악마 적, 귀환 도약 거인 부분 발광을 적용했다. 코드 aa71935 / 운영 release-20260930-230723-cd53ab. 전체 node --test 396개·서버 Python24개·로컬/공개 Edge PC/모바일 1·9·10층 화면·공개 HTTPS QA 통과, 운영 점수 제출 없음. 상세와 캡처는 docs/visual-stage5.md.
새 도전은 기본 BETA-3/ranking-v7, 확장 ASCENT-5/ranking-v8이다. 이전 BETA-1/2·ASCENT-1~4는 조회 전용이다. 기존 저장은 이어갈 수 있으나 종료 시즌 점수 신규 제출은 안 된다.
사용자 요청으로 3번까지 origin/main 푸시 완료(889e959). 그 뒤 4번 코드·문서 및 5번 첫 코드 커밋은 아직 푸시하지 않았다. 배포와 푸시를 혼동하지 마.
다음은 **같은 5번의 나머지 확장**이다: 2층 첫 보스와 기본 적, 다른 층·보스·물리/속성 화살·HUD/결과 화면을 공통 재질/실루엣 규칙으로 확장하고 PC/모바일 가독성과 전체 프레임 p95/p99를 확인한다. 실제 iPhone 검증은 에뮬레이션과 구분해. 순서는 docs/TODO.md와 docs/visual-stage5.md를 확인해.
실제 iPhone, 사람 조작 난이도, 장시간 FPS는 아직 검증하지 않았다. 외부 백업·알림과 기기 간 본인 식별은 선택 과제다.

완료된 단계를 반복하지 말고 TODO의 다음 미완료 항목부터 진행해줘. 개발 후 적절한 검증과 배포까지 이어가되, 외부 정보가 필요한 과제는 부족한 내용을 알려줘.
매 작업과 의미 있는 중간 단계마다 WORK_STATUS/TODO/WORK_LOG를 갱신하고 마지막에 이 인계 문서도 맞춰줘. 키·토큰·쿠키 원문을 출력하거나 문서에 적지 마.
```

## 재개 시 확인할 연결 정보
- 서버: Oracle Linux 9, Nginx, SSH 사용자 `opc`, IP `168.107.21.43`.
- 키 경로: `C:\baggam-dev\docs\spirebound-docs\ssh-key-2026-09-20.key` (내용 출력 금지).
- 배포: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools\deploy\deploy.ps1`.
- HTTPS 전환 시에만 `-EnableHttps`; 이미 활성화된 서버는 일반 배포에서도 HTTPS 유지.
- DB·서비스·운영 경로와 최신 릴리스는 WORK_STATUS.md 및 ranking-operations.md에서 확인.
