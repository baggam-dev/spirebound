# 공용 게임 개발 스킬 (2026-11-22)

사용자 지시로 https://github.com/gamedev-skills/awesome-gamedev-agent-skills 전체를 설치했다.

- 원본 commit: `c6ca6c41c839b68319ffc08430b99ab768debc32`
- 공용 위치: `C:/Users/SDSPRO/.codex/skills`
- 설치 내용: 79개 개발 스킬 + `router`, 총 80개 디렉터리의 `SKILL.md` 존재 확인.
- 설치 방식: Codex 번들 skill-installer의 GitHub 설치 스크립트. 기존 스킬은 보존한다.
- 다음 턴부터 사용 가능. 새 게임도 같은 사용자 환경에서 공용 스킬을 활용한다.

## 사용 원칙

전체 스킬을 보관하되 작업에 관련된 스킬만 읽고 적용한다. 새 게임은 엔진·장르·작업에 맞춰 선택한다. Spirebound는 순수 JavaScript + Canvas이므로 Unity/Godot 등 엔진 전용 API를 임의로 도입하지 않는다. 우선 후보는 roguelike, procedural-gen, game-ai, game-feel, audio-design, save-systems, performance-optimization, create-game-assets 등이다.

스킬의 일반적인 테스트·아트 제작·배포 안내보다 프로젝트 AGENTS.md와 사용자 지시를 우선한다. 디자인은 승인 전 구현하지 않으며 테스트·푸시·배포는 별도 명시 배포 지시를 기다린다. 스킬 설치 자체는 게임 코드·자산 변경이나 배포가 아니다. 자동 라우팅의 실제 품질은 아직 확인하지 않았다.

## 재설치와 업데이트

`tools/install-gamedev-skills.ps1`는 upstream 목록을 조회하고 누락된 스킬만 번들 installer로 설치한다. 같은 이름의 기존 디렉터리는 덮어쓰지 않으며, 기존 스킬의 최신 버전 동기화 도구는 아니다. 전체 설치 완료 후 원본 commit과 개수를 출력한다. 네트워크 및 공용 폴더 쓰기 권한이 필요하다.

게임 테스트·서버·브라우저 QA·원격 푸시·배포는 실행하지 않았다. 설치 파일 존재 확인만 수행했다.
