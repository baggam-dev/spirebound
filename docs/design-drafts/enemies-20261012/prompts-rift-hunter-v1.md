# 균열 사냥꾼 v1 — 2026-10-14

- 내장 imagegen 1회. `star-knight-v2.png`는 비율/재질 참조만. 생성 원본 유지, `rift-hunter-v1.png` 복사 보존.
- 코드 역할: 접근78, 출현위치 반경35 예고0.85초, 순간이동/safeSpawn22, 이후0.5초 전방베기155px/반각1.15rad/피해9/벽차단/cd1.1. 기존 쌍검 외형. enemyGuide의 직선경로 설명은 후속 승인 구현 시 실제 출현예고에 맞춰 수정 필요.
- 시안: 쌍단검/낮은자세/가죽철갑/가면/회녹후드/작은보라균열빛. 왼쪽 대기, 오른쪽 베기 준비. 기사 방패/양손장검과 구분.
- 시각 확인: 각 손에 단검, 얼굴 가면, 발 노출. 요청보다 금속갑옷 비중이 크고 천 끝이 무릎 아래까지 내려옴. 오른쪽 단검끝 여백 좁음. 정확 동일성/52px 비율/crop/초상/게임모션 미검증. runtime 미반영·컨펌 대기, 재생성 없음.

## 정확 프롬프트

```text
Use case: stylized-concept. Create a transparent PNG concept sheet for Spirebound ordinary upper-floor enemy riftHunter, a sinister rift hunter who teleports to a marked location then slashes. Attached star knight image is ONLY a reference for compact stocky 52px ordinary enemy proportions, painterly worn dark fantasy sprite finish and strong outlines. NOT a knight design copy. Exactly two full-body poses side by side, same character, scale and ground baseline, ample margins around every weapon. Left idle low stalking stance, right poised to slash after teleport with one short sword raised diagonally and the other held forward low. A small brutal non-beautiful demonic assassin, large head and short sturdy legs, no heroic tall anatomy. Low angular leather cowl with iron cheek mask, face entirely covered in dark iron mask with two small cold purple eye slits, no human face or pretty hair. Worn charcoal leather armor, compact asymmetrical iron shoulder plates, wrapped forearms, short split ragged grey-green shoulder cape ending above knees, sturdy visible boots. Two matching SHORT broad single-edged hunting blades, one held in each hand in coherent conventional grips, chipped iron edges and tiny desaturated violet rune at the hilt. Make blades visibly much shorter than royal guard greatsword. Restrained faint purple fracture glow only on a small belt charm and a few cape edge cracks; no large orb and no chest core. No shield, no crown, no full plate suit, no long robe, no bow, no stars, no antlers or large horns. Compact agile menacing silhouette, ordinary mob rather than boss. Keep identity, hands, weapon lengths and equipment consistent across both poses. No portal behind character, no attack arc, no ground plane, no scene, no text, no labels, no watermark. Genuinely transparent background. Design preview, not gameplay screenshot.
```
