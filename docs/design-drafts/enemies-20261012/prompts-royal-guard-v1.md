# 망령 근위병 v1 — 2026-10-14

- 내장 imagegen 1회. 참조: `star-knight-v2.png` (비율·재질만). 원본 생성 PNG를 `royal-guard-v1.png`로 복사, 원본 유지.
- 실제 코드: `src/combat/upper-floors.js` royalGuard는 이동78, 전방 베기155px/반각1.15rad, 준비0.5초, 피해9, 벽차단, 회복cd1.1. 현재 shield 없이 검/망령천 렌더링.
- 제안: 방패 없는 양손 장검, 왕실 붉은 천, 빈 갑옷 관절의 청록 망령빛. 왼쪽 대기/오른쪽 베기 준비. 승인 대기, runtime 미반영.
- 시각 확인: 두 자세 양손 파지/발 노출. 볏이 왕관처럼 큼, 오른쪽 검끝 여백 좁음, 요청한 세 갈래 천은 명확하지 않음. 정확 비율/52px 가독성/게임 crop 및 모션 미검증. 재생성 없음.

## 정확 프롬프트

```text
Use case: stylized-concept. Create a transparent PNG concept sheet for Spirebound enemy royalGuard, the spectral royal guard. Use the attached star knight image ONLY as reference for compact stocky ordinary-enemy proportions, painted worn dark-fantasy sprite finish, outline and material rendering; create a DIFFERENT character. Exactly two full-body poses side by side, same character and same weapon, same scale and baseline, generous margins. Left idle holding a long broad two-handed sword diagonally low; right attack windup, both gauntleted hands gripping the SAME sword hilt, sword drawn back horizontally across the shoulder ready for a wide frontal sweep. Body should have compact proportions suitable for 52px body height, large helmet, short legs, no heroic tall anatomy. Spectral empty suit of ancient royal plate armor: narrow battered crown-like three-prong helmet crest (not a king's large crown), hollow black face with small cold pale cyan eyes; tarnished charcoal iron and restrained aged brass trim; faded burgundy royal tabard torn into three distinct hanging strips, torn long cloth mantle; gaps between armor joints contain subtle desaturated cyan spectral mist, feet remain visible and solid for alignment. No shield, no hood, no bow, no gravity orb, no chest cosmic core, no stars on armor, no horns. Strong readable silhouette of sword-wielding royal revenant, distinct from reference shield knight. Keep glow restrained so armor remains readable. Weapon and hands anatomically coherent and consistent in both poses. Isolated figures, genuinely transparent background, no floor, no scene, no labels, no text, no watermark, no attack VFX arc. This is design preview only, not gameplay screenshot.
```
