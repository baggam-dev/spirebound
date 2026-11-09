# 석궁 4자세 프롬프트

내장 image_gen.imagegen 생성1회+픽셀 처리 편집1회, 모두 transparent_background=true. 최초 입력은 assets/images/hero-reference-atlas.png(스타일/재질 참고용). 원본 C:/Users/SDSPRO/.codex/generated_images/01a1bb35-6f0c-7421-914b-8beb67028949/exec-d01df768-8e6a-4f23-9aa1-cee05da21d3b.png 보존, crossbow-poses-v1.png로 무변환 사본. 선호1024 요청 대비 실제1254×1254 출력. 모델/CLI 대체 없음.

```text
Use case: stylized-concept.
Asset type: game pixel sprite animation concept sheet, true transparent background, preferred canvas 1024 by 1024.
Primary request: design a substantial automated medieval royal crossbow turret for the existing Spirebound archer game. Four consistent animation poses in a precise 2 columns by 2 rows equal-cell sheet, isolated in the center of each cell, generous transparent gutters. Top-left deploying its three sturdy feet, top-right fully deployed and loaded, bottom-left firing with the stock recoiled and bow limbs flexed, bottom-right unloading and folding for disappearance. This is ONE same machine, identical camera, scale, pivot and ground contact across all poses. All face to the right, long forward rail horizontal, visible above/front three-quarter game camera matching the reference hero.
Input image: the supplied hero atlas is STYLE AND MATERIAL REFERENCE ONLY. Do not redraw or include the hero, people or bows held by hands.
Subject: recognizable heavy crossbow silhouette, dark walnut stock and limbs, aged brass mechanical clamps, steel-tipped oversized bolt, taut clearly visible string, wide raised bow limbs, a rotatable upper rail mounted above a stable three-legged deployment base. The head should read separately from the feet, ready for later rotation. Strong readable shapes when displayed 70 pixels wide in gameplay.
Style: crisp 2D painted pixel game art with deliberate chunky pixel clusters, limited warm walnut/brass/steel palette matching the supplied archer; compact detail, no photorealism, no soft blur, no neon sci-fi.
Composition: each of four poses fits inside its own cell without touching boundaries; same central base pivot and ground baseline. No background, no checkerboard drawing, no frame borders, no labels, no text, no watermarks. No muzzle flash or dust baked into the sprites; all VFX will be separate. No lasers, firearms, wheels, extra objects or creatures. Real transparent alpha outside the machine, no colored halo, no drop shadow baked into the sheet.
```

## v2 픽셀 클러스터 편집

v1을 입력으로 사용. 원본 exec-7110c14b-e5a1-4cb3-8524-1d4bb5559107.png 보존/무변환 crossbow-poses-v2.png 사본.

```text
Use case: precise-object-edit.
Edit target: the four-pose medieval automated crossbow sprite atlas.
Change only the raster-art treatment: remake this same 2-by-2 animation sheet as genuinely compact, hard-edged pixel art, ideally 512 by 512 output, with roughly 96 to 128 logical pixels per machine. Use chunky deliberate pixel clusters and a compact palette of at most 24 wood/brass/steel colors; flat shaded clusters, not brush texture. Preserve all four machines, their same design, camera, right-facing orientation, same grid positions and same animation meanings: unfolding, loaded, recoil, folded. Fix pivots and feet to one consistent anchor per equal cell. Improve readability at 70px gameplay size. Preserve the warm royal material identity and the clear bolt/string/limbs/three-legged base. No added text, no scene, no shadows, no haze, no particles or flashes baked in. Real transparent background. Do not make a poster, no gradients or painterly noise, no new props.
```
