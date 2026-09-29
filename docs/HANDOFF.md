# 새 대화 인계

아래 블록을 새 챗/다른 AI에 붙여 넣는다. 세부 상태를 복사해 오래된 사실을 만드는 대신 저장소 문서를 현재 상태의 기준으로 삼는다.

```text
Spirebound 작업을 이어가자. 답변은 한국어, 기본 5줄 이내.
저장소: C:\baggam-dev\spirebound
GitHub: https://github.com/baggam-dev/spirebound

먼저 AGENTS.md와 git status --short를 확인하고,
docs/WORK_STATUS.md → docs/TODO.md → docs/WORK_LOG.md 최근 항목 → docs/HANDOFF.md를 읽어줘.
기존 미커밋/신규 파일을 보존하고 임의 초기화하지 마. 검증을 마친 의미 있는 수정 단위마다 관련 코드·테스트·문서를 커밋해줘. 푸시는 별도 요청이 있을 때만 해.
랭킹 5단계 HTTPS·백업·운영 검증은 완료했어. 최신 릴리스와 검증 근거는 WORK_STATUS.md를 기준으로 해.
공개 HTTPS·기존 HTTP 기록 이전·Secure 쿠키·랭킹 조회·예약 작업 검증까지 완료했으므로 초기 전환을 반복하지 마.
랭킹·HTTPS·리팩터링 완료 커밋은 사용자 요청으로 origin/main에 푸시했어(2026-09-29).
폴더 리팩터링도 검증·배포 완료했어. README 소스 탐색표와 docs/repository-structure.md를 참고해.
소스는 src/ 기능별 폴더, 테스트는 tests/, 배포는 tools/deploy/deploy.ps1, QA는 tools/qa/야.
서버 공통 랭킹은 독립 브라우저 공유 검증까지 완료했어. 상위 100명 확장/계정 연결은 별도 요청 없이 추가하지 마.
벽 개선도 docs/room-shapes.md의 합의대로 구현·공개 검증·배포 완료했어. 기존형 50%/얇은 동선형 50%, 연결 석조 외형 적용.
새 배치는 새 도전부터이며 기존 저장 지형은 유지돼. 벽 개선·PC 선택창·플레이 후기 커밋은 bc95e17까지 origin/main에 푸시 완료했어(2026-09-29). 최신 상태는 WORK_STATUS.md를 확인해.
PC 스킬 선택창 3/4개 폭 조정도 배포·검증 완료했어. 1100×600 이상은 최대 960px, 모바일 기존 배치는 유지해.
최신 플레이 후기 구현·배포·공개 검증 완료(전체356개·공개 점멸12조건/장판4화면). 최신 릴리스는 WORK_STATUS.md, 세부는 ground-effects.md 마지막 기록을 확인해. 첫 조우 HP51은 새 도전부터 적용돼. PC 점멸 원 보고 원인은 미확정이나 완전 막힘의 쿨다운 소비는 보완했어.
큰 벽체 버벅임은 검토 완료: 그리기와 적 길찾기 비용 증가 확인, 실제 사용자 끊김 원인은 미확정. room-shapes.md 마지막 성능 검토를 읽고 최적화는 구현 지시 후 진행해.
다음 개발은 사용자 요청 범위에 맞춰 진행하고 실제 iPhone·외부 백업·외부 알림은 선택 과제로 남겨줘.
완료된 작업을 반복하지 말고 TODO의 다음 미완료 항목부터 진행해줘.
개발 후 적절한 검증과 배포까지 이어가되, 사용자 정보가 필요한 외부 작업은 무엇이 부족한지 알려줘.
매 작업과 의미 있는 중간 단계마다 현재 상태/TODO/작업 이력을 repo에 갱신하고, 마지막에 이 인계 문서도 맞춰줘.
키·토큰·쿠키 원문은 출력하거나 문서에 적지 마.
```

## 재개 시 확인할 연결 정보
- 서버: Oracle Linux 9, Nginx, SSH 사용자 `opc`, IP `168.107.21.43`.
- 키 경로: `C:\baggam-dev\docs\spirebound-docs\ssh-key-2026-09-20.key` (내용 출력 금지).
- 배포: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools\deploy\deploy.ps1`.
- HTTPS 전환 시에만 `-EnableHttps`; 이미 활성화된 서버는 일반 배포에서도 HTTPS를 유지한다.
- DB·서비스·운영 경로와 최신 릴리스는 WORK_STATUS.md 및 ranking-operations.md에서 확인한다.
