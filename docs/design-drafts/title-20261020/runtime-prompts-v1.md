# 승인 타이틀 런타임 자산 프롬프트 — 2026-10-20

내장 imagegen, main-menu-v1.png 참조. 사용자 통합안 승인 후 배경 톤만 조금 더 어둡게 요청. 아래 네 생성 원본과 이전 시안을 유지하고 출력 PNG를 무편집 복사했다. 이미지 편집용 Python/SVG 사용 없음. 배경에 잔류한 정적 얇은 안개/진입구 온광은 원화이며 별도 안개/불꽃은 런타임 움직임이다. 투명 자산의 가장자리 색점은 원본에 존재하며 로고만 런타임 grayscale로 회백 톤을 맞춘다.

## title-background-v1.png
원본: C:/Users/SDSPRO/.codex/generated_images/01a13828-0d36-7292-9c64-ff00ee502b14/exec-92d10349-fa90-4e8a-a7fe-de34440dbbd2.png
최종: assets/images/title-background-v1.png

```text
Use case: precise-object-edit. Production clean background plate for approved Spirebound pixel-art title. Input image is approved concept board; use ONLY its upper main scene. Recreate its identical tower framing, monumental gothic tower on center-right, doorway, stone path, statues, broken foreground walls, framing old trees, moon and purple-grey sky. Full 16:9 landscape single scene, no board panels. Remove ALL text, logo, UI, lines, menus, and hero from the scene, restore plausible background beneath. Left 43 percent stays quiet dark tree/sky for live menu. Remove hanging foreground leafy branches from the upper left/right (they will be separate moving layers), but preserve solid framing trunks. Torches remain as unlit braziers without baked flame or glow; no floating particles, leaves or moving fog baked in. Darken overall environmental midtones moderately (about 15 percent) as user requested, especially sky and stone, preserve visible pixel-art masonry and silhouette readability, purple charcoal palette, restrained warm entrance accents. Match approved image pixel-art style, not smooth high resolution illustration. No new characters, no HUD, no words or watermark. Clean seamless full-bleed background only.
```

## title-logo-v1.png
원본: C:/Users/SDSPRO/.codex/generated_images/01a13828-0d36-7292-9c64-ff00ee502b14/exec-eb16b189-a1a3-4187-bee1-fc98c8373a97.png
최종: assets/images/title-logo-v1.png

```text
Use case: background-extraction. Production transparent logo asset for Spirebound, match exactly the SPIREBOUND lettering in the upper left of the supplied approved concept. Single horizontal word SPIREBOUND only, large worn pale grey stone serif letters with pointed tower-like I, subtly chipped pixel edges. Same silhouette and restrained weathered ivory as reference, no yellow/gold. Transparent canvas closely framing letters with small safe margin. No Korean subtitle, no rule lines, no scene, no black rectangle, no mockup, no glow, no shadow outside letter edge, no panels. Crisp pixel-art display logo with all eleven letters correctly spelled and horizontally aligned, readable at small sizes. This is isolated runtime logo, not a new design.
```

## title-hero-idle-v1.png
원본: C:/Users/SDSPRO/.codex/generated_images/01a13828-0d36-7292-9c64-ff00ee502b14/exec-8711eb05-a25f-4c70-a478-c2fef938239f.png
최종: assets/images/title-hero-idle-v1.png

```text
Use case: identity-preserve. Production transparent pixel-art rear hero idle sprite sheet for approved Spirebound title. Input is approved title concept; match its foreground rear-facing hero EXACTLY: uncovered sandy blond tousled hair, burgundy red scarf, short blue-grey ragged cape, leather and small silver shoulder armor, brown boots, quiver on left shoulder and curved wooden bow held down in right hand, 4-5 heads tall. Seen entirely from behind looking toward distant tower, both feet firmly planted. ONE HORIZONTAL ROW OF THREE EQUAL-WIDTH CELLS, each contains full same-sized hero facing away, identical feet baseline and same horizontal center relative to each cell. Cell1 restful; cell2 tiny raised shoulders inhaling and scarf/cape drifting slightly right; cell3 shoulders settling and cape drifting farther right. Feet, head identity, bow and overall body scale must align; very subtle breathing, no stepping, no turning. Each cell has generous transparent margin, no overlap between cells, no scene, floor, shadows, labels, borders, numbers, panels, checkerboard painted into image. Actual transparent background. Crisp dark fantasy pixel art with exact costume palette; no hood, no helmet, no sword, no aura. This is idle production sheet, not concept board.
```

## title-branch-v1.png
원본: C:/Users/SDSPRO/.codex/generated_images/01a13828-0d36-7292-9c64-ff00ee502b14/exec-eba62656-0d30-417e-81e5-74927aed7b50.png
최종: assets/images/title-branch-v1.png

```text
Use case: background-extraction. Production isolated transparent foreground branch asset for approved Spirebound title. Match the supplied approved title pixel-art old tree branches at upper left: dark twisted charcoal bark, thin angular branching limbs with very sparse muted rust-brown small autumn leaves. One SINGLE long branch grows horizontally from thick cut-off LEFT EDGE toward right, forked thin twig tips ending on the right. Branches occupy a shallow wide horizontal strip, clearly visible silhouette at dark but readable charcoal midtones. True transparent background everywhere around and between limbs. No scene, trunk, ground, fog, sky, words, border, labels or panels. Crisp detailed pixel-art texture matching approved style. This separate branch will be anchored at left and gently swayed by runtime; don't bake motion blur or effects.
```

