# 생환 여명 배경 파생판 정확 프롬프트

사용자 승인 escape-storyboard-v1.png를 직접 확인한 후 내장 imagegen 1회. 배경판만 새로 준비하며 hero/문짝은 기존 PNG 재사용. 원본/버전 파일 보존, Python/SVG 이미지 편집 없음.

입력: C:/baggam-dev/spirebound/docs/design-drafts/escape-20261021/escape-storyboard-v1.png
출력 예정: C:/baggam-dev/spirebound/assets/images/escape-dawn-v1.png
보존 사본 예정: C:/baggam-dev/spirebound/docs/design-drafts/escape-20261021/escape-dawn-v1.png

```text
Use case: game background production derivative. From the APPROVED SPIREBOUND escape storyboard supplied as the reference, make ONE CLEAN LANDSCAPE 16:9 BACKGROUND PLATE for runtime, especially its middle and bottom panels. ONE scene only, NOT a storyboard, NOT an atlas. NO captions, NO letters or interface, NO hero or other characters, NO bow, NO key, NO floating particles, NO magical effects. Reuse the same fine dark pixel-art gothic stone entrance, same warm torches, worn mossy floor and muted violet/gold dawn valley/city beyond. Camera is from INSIDE the tower looking OUT through the open central gateway; preserve this escape direction.
Composition designed for 1600x900 normalized coordinates: fully open central gateway spans approximately x=430 to x=1170 (46% of frame), top of opening cropped above image top, side jambs are vertical, threshold/floor at y=760. The portal opening is a simple tall rectangular unobstructed view bounded by left/right jambs (pointed arch can be above the frame), so separate existing door leaves can be animated over it. Both door LEAVES are ABSENT from the opening, folded completely out of frame; no half-closed doors or painted leaf in the view. Near black carved stone and bronze hardware frame the sides; two small warm torch/brazier accents near x=250 and x=1350 at y=540. Flat walkable foreground floor extends continuously from y=760 to bottom, slightly reflective stones with quiet dawn edge highlights; leave center-bottom floor clear for a separately composited existing hero.
Beyond opening show the SAME quiet valley with layered mist, distant medieval city silhouettes, bridges, mountains and pale golden dawn as the approved final panel. Sun around x=1000,y=330, natural subdued warmth; do not bleach the view. Preserve pixel clusters and palette, avoid smooth photorealistic rendering or oversaturated bright orange. No extra tower, new foreground buildings or NPCs. Opaque image, no transparency. This derivative is only the approved scene's clean plate for independent hero, door motion and particles. Do not bake in any character or effect.
```

완료: 내장 imagegen 1회, 원본 exec-939cc0aa-4912-43df-8e43-5a33a5e376e8.png 보존. 1672×940 / 2,788,985 bytes. 위 두 출력 경로에 변환 없이 복사. 실제 PNG 직접 확인: 중앙 통로/여명 풍경, 주인공·문구·별도 효과 없음. 기존 hero/doors를 Canvas에서 합성.

생성 원본 절대경로: C:/Users/SDSPRO/.codex/generated_images/01a13828-0d36-7292-9c64-ff00ee502b14/exec-939cc0aa-4912-43df-8e43-5a33a5e376e8.png
