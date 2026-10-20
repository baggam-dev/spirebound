# 머리 위 대사 통합 PNG 정확 프롬프트 v1

2026-10-20, imagegen 스킬 내장 도구. 성공 생성1회/재생성 없음. 첫 시도는 입력이미지6개로 도구의 최대5개 제한에서 생성 전 거부되어, 파수꾼 참조를 외형 설명으로 바꾸고 참조5개로 호출했다. 이 실패는 결과물 생성/오프라인 편집/대체 경로 실행이 아니다. 파수꾼 원화도 직접 확인했으며 실제 무기는 양손 사각 망치다.

원본: C:/Users/SDSPRO/.codex/generated_images/01a13828-0d36-7292-9c64-ff00ee502b14/exec-0b740fa4-3b7c-411d-b2dd-0bb6bd64f02e.png
최종: C:/baggam-dev/spirebound/docs/design-drafts/narrative-20261020/overhead-dialogue-v1.png

최종 참조 순서:
1. docs/qa-feedback-20261020/floors-confirmed/floor-2-1280.png — 기존 저장화면의 카메라·바닥/벽·크기 참고. 새 QA 실행 아님.
2. assets/images/prism-reference-atlas.png — 프리즘 정체성.
3. assets/images/slime-reference-atlas.png — 군체 정체성.
4. assets/images/feedback-named-brute-v1.png — 상단 칼드/중단 베라만 참조.
5. assets/images/demon-presentation-body-v1.png — 상단벽 대악마 정체성.

```text
Use case: ui-mockup. Asset: one integrated OVERHEAD DIALOGUE UI DESIGN REVIEW BOARD for Spirebound pixel-art top-down action roguelike. This is a game-view mockup, NOT a cinematic painting and NOT a new character design. Create a 2 COLUMN x 3 ROW board of six small landscape game-room views, viewed from the same slightly top-down gameplay camera as reference1. All panels use subtle dark fine-pixel grey stone floor/walls and small warm torches, existing compact 4-5 heads tall actors. Preserve room floor visibility and quiet dark contrast; no ornate cinematic frame or giant close-up character portrait. Use one small simple dark charcoal nearly opaque speech plaque just ABOVE the speaking character's HEAD, thin muted grey edge, tiny downward tail, warm ivory clear Korean pixel-font text, at most TWO lines. Names appear only as small external panel label/boss HUD, NOT repeated inside speech bubble. Bubbles should be readable with no text errors and should not span whole room or obscure bodies. No white comic bubbles, long bottom text boxes, chat avatars or new menu designs.
Input1 stored actual gameplay screenshot: locks camera, room palette, object scale; don't copy its existing ordinary enemies as named bosses. Input2 approved crystal prism asset. Input3 approved slime boss asset. Input4 approved Kald/Vera/brute sheet: TOP ROW armored enclosed helmet sword+large shield is Kald, MIDDLE ROW blond uncovered monocle-eye purple scarf bow archer is Vera, do NOT use bottom brute. Warden identity: enclosed dark horned steel helmet, heavy dented bloodstained steel armor, large square-headed two-handed HAMMER held low, compact proportions; no sword. Input5 approved wall archdemon body locks upper-wall monstrous torso anatomy and palette.
Top-left panel small label "파수꾼": small horned armored warden stands upper-middle; bubble above with EXACT ".......". Small blond hero with red scarf stands lower-middle, NOT speaking.
Top-right label "프리즘": blue violet crystal levitating guardian upper-middle matching reference, bubble above EXACT two lines: "미등록 개체 감지." / "접근을 차단한다.". Hero lower-left.
Middle-left label "독성 군체": big olive-green crowned gelatinous blob matching reference with embedded debris, bubble above EXACT "저 위는… 안 돼… 안 돼…". Hero lower-middle, empty visible floor below.
Middle-right label "칼드": show BOTH Kald left and Vera right guarding a doorway, compact similar human proportions, only KALD speaks. Bubble tail points to helmet Kald; EXACT two lines "폐하의 명이다." / "이 문은 열지 않는다.". Vera is silent.
Bottom-left label "베라": SAME two guardians at same gate, only VERA speaks. Bubble tail points to blond monocle-eye archer, EXACT two lines "우리가 지키는 건…" / "왕좌가 아니야.". Kald silent.
Bottom-right label "상단벽 보스": same archdemon upper torso emerging through top wall front-facing slightly seen from above, long arms to sides, keep SMALL top boss healthbar area clear. Bubble slightly to side of head if needed to stay inside viewport and below HUD, tail still points to head. EXACT two lines "이 탑에서…" / "나갈 수 있을 것 같으냐.". Small hero far below with an EMPTY safe floor zone. Mouth/eyes/hands are the approved demon design, don't add new humanoid full body.
Within EACH panel place a tiny muted narrow boss health bar along top center, small minimap at upper right, leave clear space between dialogue and HUD. No invented unreadable auxiliary text/HUD stats. The panel labels are for design comparison, not a changed runtime HUD. A subtle red attack telegraph may be placed on floor in lower-right of one panel to demonstrate it is NOT covered by a speech bubble, with no active projectile rain. Keep all speech bubble visual styles consistent across these SIX panels. This board reviews speech anchoring, text readability and one-speaker rule; no simulation claims. No extra prose, no story rewrite, no new logo, no watermark.
```

