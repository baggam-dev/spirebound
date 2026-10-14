# 군단장 2페이즈 냉기 오라 미리보기 — 2026-10-14

- 사용자2페이즈v1외형 좋음/냉기오라 요청. 활손 차이는 방향표현으로 허용한 최신 지시가 이전 필수보완보다 우선. 외형2v1은 승인, 오라 시각방향은 이번미리보기 컨펌 대기.
- 내장 imagegen 편집1회, `commander-phase2-frost-preview-v1.png`/생성원본/오라없는2v1 유지. 결과 요청보다 매우 넓고 밝은 연무, 두 인물 오라가 이어지고 발까지 번져 ‘옅음/발보존’ 제약 미충족. 외형재질/서리도 일부 달라져 그대로 runtime 캐릭터원본으로 사용하지 않음. 자동 재생성 없음.
- 실제 제안: 오라없는 승인2v1 캐릭터 + 분리된 공통 효과. 옅은 청백색 연무 후면 레이어, 작은 느린 서리입자, 발/예고영역 제외, 낮은 농도 .12~.18 제안. 기존 shadow-aura는 검보라 어두운 질감이라 색만 바꾸면 밝은 냉기와 차이가 있을 수 있음; 밝기/알파 모드 또는 별도 냉기 텍스처가 필요한지 컨펌 후 구현 선택. 실제움직임/색/가독성 미검증. 이번에 runtime 수정 없음.
- 1페이즈 기존로컬구현 미검증·미배포, 운영release-20261014-201910-449d0e 유지. 테스트/푸시/배포 없음.

## 정확 프롬프트

```text
Edit the attached Spirebound demon commander phase-two v1 sheet as an AURA APPEARANCE PREVIEW only. Keep ALL character shapes, grey demon faces, horns, worn armor, existing ice crystal shoulders/chest fissures, muted blue-grey cloak, bows, strings, arrows, hand positions, poses and placements unchanged as closely as possible. User accepts bow hand differences between poses; do NOT change hands or bow direction. Add a subtle FROST AURA around both figures: thin translucent pale icy blue-white cold mist wisps drifting behind shoulders and along outer cape edges, a few tiny sparse crystalline snow specks, small cool vapor curls by forearms, no giant clouds. Ground feet and boots must remain clear: mist fades away above foot baseline, no ground disk/ring and no snow pile. Stronger in the aimed pose only slightly. Frost aura should feel chilly and softly drifting, NOT dark black/purple shadow, NOT neon electric glow, NOT flame or lightning, NOT huge opaque halo. Keep eyes, face, hands, bowstring, arrow and all weapon outlines unobscured; aura sits BEHIND body, with sparse near-edge accents only. Do not lighten or recolor original cloak/armor. No new exterior ice spikes (existing crystals unchanged), no additional weapons or body parts. This preview illustrates a later SEPARATE runtime VFX layer; do not imply finished animation. Transparent background with soft semi-transparent aura edges, no floor, environment, text, labels or watermark. Preserve two-pose sheet and give aura room inside borders, no large new silhouette.
```
