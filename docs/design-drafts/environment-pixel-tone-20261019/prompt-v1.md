# 환경 도트·톤 비교 — 정확 프롬프트

Mode: built-in image_gen, style-transfer, opaque, 1 call. No CLI/Python/SVG editing.
Reference/edit target order:
1. docs/qa-relics-20261019/public-opening/hero-1280.png — actual current room canvas captured during previous approved deployment QA. No new QA executed.
2. reference-user-v1.jpg — user supplied XP pickup concept, material/palette reference only.

Original output preserved: C:\Users\SDSPRO\.codex\generated_images\01a13828-0d36-7292-9c64-ff00ee502b14\exec-5e35ea16-a9cd-4a69-b3c0-a3346efe1168.png

```text
Use case: style-transfer
Asset type: Spirebound environment-only before/after art-direction comparison PNG; concept draft, NOT a screenshot of an implemented change.
Input images: Image 1 is the exact CURRENT game canvas and layout to preserve. Image 2 is the USER'S style reference; use ONLY its lower dungeon-floor pixel-art material, dark muted palette and chunky broken stone style, not its infographic layout, XP text, isometric architecture, or player marker.
Primary request: Create one clean wide comparison image, two equally sized 16:9 room panels side by side, a small label above each: "CURRENT" and "PROPOSED". Left panel accurately reproduces Image 1. Right panel redraws ONLY the environmental surfaces of the SAME room to resemble the dark, chunky, deliberately low-resolution pixel-art dungeon materials seen in Image 2.
Invariants: Preserve the exact room silhouette, same north/south/east/west openings, wall rectangles, floor geometry, same gates, same four torch positions and room scale as Image 1. Keep the existing small central brown-haired archer character recognizably identical in pose, clothing, scale, position and brightness. Do not replace the character with the diamond from Image 2. Do not add monsters, props, HUD, particles or new gameplay objects. Preserve door readability. Do not tilt the room to an isometric view.
Proposed environment: simplify the floor stones and wall bricks into broad hand-placed pixel clusters on a coherent low-resolution grid (appearance of roughly 480x270 game-world drawing scaled 2x with crisp nearest-neighbor edges), no smooth high-resolution texture or thin photographic stone veins. Muted soot-charcoal and dark grey-green slate. Floor about 20-25 percent darker and less saturated than current, wall highlights quieter, recessed cracks dark but silhouettes legible; not crushed black. Distinct chunky broken edges and occasional existing-looking wear in the stone, sparse low-contrast patches. Floor and wall share one pixel scale. Existing iron gates and torch sconces also in the same coarse pixel style. Warm tiny torch flames remain bright focal accents, lighting local and restrained. Archer remains clearly brighter than environment, no screen-wide black filter over character. Keep everything sharp.
Composition: left CURRENT, right PROPOSED, equal side-by-side panels with thin neutral separator and only those two readable labels. No extra text, swatches, inset art, fake HUD or decorative illustration frame. This is a direct comparison of the same live-game room art direction, not new architecture.
Avoid: painterly brush texture, photographic material, bloom haze, blur, antialiasing, smooth gradients, new statues/columns, changes to collisions or camera, overbright moss, total-black unreadable floor.
```

