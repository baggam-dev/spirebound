# 모션 시안 v1 정확 프롬프트

## 발도 주변 음영 제거 편집
원본 v1의 원치 않은 주변 갈색 halo를 제거하는 내장 image_gen 추가1회. v1/원본은 보존하고 결과는 v2 별도 파일로 저장.
```text
Edit target: the attached four-frame blond adventurer sword-draw dash sprite sheet. Change ONLY the unwanted soft brown/grey glow, haze, backdrop and ground-like shadow around each character. Remove ALL those surrounding pixels to clean true transparency. Preserve EXACTLY all four character poses, face, outfit, sword, scabbard, stowed bow, hand positions, sprite placement and scale, canvas aspect ratio and four-cell row. No aura, no rim glow, no smoke, no shadows, no background tint. Do not redraw or restyle any character. Keep every character detail and the entire sword unchanged. Deliver the same sheet with clean transparent background.
```

도구: 내장 image_gen. 두 시안은 기존 외형 참조의 새 생성이며 원본 편집/덮어쓰기 아님. 투명배경 요청. Hero/warden 각각 별도1회.

## 발도4자세
```text
Use case: stylized-concept
Asset type: compact transparent game sprite sheet, four phases of ONE existing character's draw-sword dash.
Input image 1 is an IDENTITY and COSTUME reference only, not an edit target. Preserve the same young blond male adventurer, red scarf, blue-grey cape, leather/metal archer armor, boots and quiver. No redesign. Same slim stylized proportions and pixel-art material language. Crucial: this is a SWORD DRAW dash, never a bow shot. A modest straight steel side sword in right hand and plain scabbard at waist; the bow is stowed behind him, never held in the hands and never an extended shooting arm.
Composition: ONE horizontal row, EXACTLY FOUR equal-width cells, centered within every cell with generous transparent margins. Recommended canvas 1024 by 384, each cell 256 by 384. Crisp limited-pixel clusters, each character only about 128 pixels tall, clean transparent padding. Entire body and entire sword must fit inside its cell, no clipping or neighboring overlap. All face right in same three-quarter side perspective. Same character scale, same face, same hands, same sword length, same ground baseline about 80% down canvas. No text, no labels, no grids, no background, no ground shadow, no slash arcs, no magic, no aura, no extra weapons.
Frame 1: knees flexed, torso inclined forward, right hand already gripping hilt at left hip and left hand stabilizing scabbard, sword tip slightly drawn and visible.
Frame 2: explosive sword draw, low forward lunge, right hand sweeps the clearly visible straight blade across the front, blade ends pointing forward-right, left hand holds empty scabbard at hip, no archery pose.
Frame 3: low dash follow-through, blade clearly extended diagonally forward-right from the right hand below chest height, back leg extended, front knee bent, cape trails a little.
Frame 4: recovered compact stance, weight settles on forward foot, right hand brings visible sword down and toward the waist for resheathing, left hand near scabbard, no arrow release.
No cinematic glow; the character body and its later effects will be separate. This sheet is a design proposal, not a claim of production-ready anatomy. Transparent background is mandatory.
```

## 파수꾼8보행
```text
Use case: stylized-concept
Asset type: compact transparent EIGHT-frame walk-cycle sheet for ONE existing heavy armored boss.
Input image 1 is the exact IDENTITY/COSTUME reference: closed horned helmet, rust-orange asymmetrical heavy armor, existing dark red weathered stains, chain joints, ragged brown hip cloth and massive block-headed hammer. Preserve silhouette, armor design, colors and hammer. Do NOT add a face, a crown, new horns, magic, glow or brighter blood. Same three-quarter orientation as the reference. The hammer head stays on the LEFT side of every cell and held low across the front by BOTH hands. This is calm continuous WALKING, never a flinch, hit, windup or attack.
Composition: EXACTLY EIGHT equal cells, FOUR columns and TWO rows, read left-to-right across top then bottom. Recommended canvas 1024 by 512, each cell 256 by 256, boss about 175 pixels tall. Same helmet center/shoulder width/hip height in ALL cells, same foot baseline at 90% of each cell. Entire hammer and both feet fit inside every cell with transparent padding, no spill. Sparse crisp pixels suited to about 92-pixel display. No labels, no grids, no shadow, no background or effects. True transparent background.
Gait: frame1 left foot forward heel contact/right behind; frame2 left foot planted weight transfer/right heel lifting; frame3 right leg passing under pelvis and left supporting; frame4 right leg swings forward with the right knee slightly raised; frame5 right foot forward heel contact/left behind; frame6 right planted weight transfer/left heel lifting; frame7 left leg passing under pelvis/right supporting; frame8 left swings forward ready to connect seamlessly to frame1.
Upper body: head and torso stay upright and steady, NOT alternate hunched and straight. Vertical bob at most TWO SOURCE PIXELS. No head jerks, leaning backward, shoulder shrinking or alternating weapon angles. Hammer and hands move together as one consistent grip with only tiny gait sway. Leg motion and planted weight carry the walking, rather than whole-body rocking. Keep the body mass and hammer dimensions consistent across all eight frames.
```
