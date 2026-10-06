# 첫 디자인 세로 조각 — 2026-10-06

대상은 같은 시드419의 1층 일반방과 2층 첫 보스다. 기존 [1층 PC](quality-baseline/room1-pc.png)·[모바일 가로](quality-baseline/room1-mobile.png), [첫 보스 PC](quality-baseline/boss2-pc.png)·[모바일 가로](quality-baseline/boss2-mobile.png)를 기준으로 삼았다.

## 변경

- 1·2층 일반방/보스방 중심에 낮은 대비의 깨진 석조 줄눈을 배치했다. 첫 보스 뒤에는 직선 판석 홈을 더해 무대의 중심을 만들었다. 원형 위험 예고나 이동 가능한 경계처럼 보이는 도형은 추가하지 않았다. 방·층·시드에서 결정되는 장식만 사용하고 충돌/전투/저장/시즌은 바꾸지 않았다.
- 높이 500px 이하 모바일 가로에서 능력치 글자를 8→11px, 경험치 글자를 8→10px로 키우고 글자 뒤 어두운 배경을 강화했다. 미니맵 제목은 10px. 데스크톱/모바일 세로의 규칙은 유지한다.

변경 후 화면: [1층 PC](quality-design/room1-pc.png)·[모바일 가로](quality-design/room1-mobile.png), [첫 보스 PC](quality-design/boss2-pc.png)·[모바일 가로](quality-design/boss2-mobile.png). 화면 비교에서 1층 중앙 줄눈과 첫 보스 뒤 판석이 보이고, 모바일 능력치/경험치가 더 잘 읽힌다. 적 위치는 렌더 시점의 움직임에 따라 조금 달라질 수 있다. 실제 iPhone/Android 실기기와 사람의 아트 선호도는 확인 전이다.

검증은 `tools/qa/quality-design-qa.mjs`에서 PC1280×800/모바일 에뮬레이션844×390·667×375·390×844의 두 장면·가로 넘침·HUD 영역·글자 크기·페이지 오류를 검사한다. 최종 테스트와 운영 배포 결과는 `WORK_STATUS.md`에 기록한다.
