# 몬스터 이동·근접 공격·위상 이펙트 통합 시안 정확 프롬프트

내장 imagegen 사용. 기존 캐릭터/오라 참조를 직접 확인한 뒤 승인 검토용 보드 1장 제작. runtime 자산 아님. 오라는 별도 레이어로 제시.

입력: assets/images/feedback-named-brute-v1.png / docs/design-drafts/enemies-20261012/charger-grip-v2.png / docs/design-drafts/enemies-20261012/shadow-aura-separate-v1.png

```text
Use case: stylized-concept.
Create ONE polished integrated approval concept board for the existing pixel-art dungeon game SPIREBOUND. Landscape 3:2, high resolution so small sprite poses remain readable, dark charcoal background, restrained parchment-silver captions, thin separators. This is a PREVIEW BOARD, not a replacement sprite atlas or actual game screenshot.
Reference images and invariants:
1 feedback-named-brute-v1.png: use ONLY bottom row's existing stocky dark-haired bearded armored brute for the brute poses. Keep steel shoulder armor, wrapped bare fists, brown belt, compact 4~5-head proportions, smaller hands. Upper-left armored sword shield knight may be used as the sample actor for the status badges below, preserving identity.
2 charger-grip-v2.png: existing masked axe charger, round iron helmet, frayed pale tunic and brown leather vest, ONE axe in right hand and round wooden shield in left. Preserve these exact clothes/weapons/proportions. No extra hands, no switching weapons, no redesign.
3 shadow-aura-separate-v1.png: reference ONLY for a separate animated aura material layer. Do not bake aura or magical paint into any character base artwork.
Use crisp coherent pixel clusters and dark game-floor textures, 3/4 slightly overhead game camera, existing compact bodies, no photorealism, no long-legged realistic anatomy, no new named monster.

Board composition:
TOP 17%: heading "SPIREBOUND · 몬스터 전투 개선". A narrow diagram of an existing small archer navigating around an L-shaped broken stone obstacle from a blocked shot position to a clear direct shot position. Player target is just a small blue marker (not a new character). Dashed cool path around the wall, crossed muted red blocked shot, clear thin gold arrow at the final position. Labels "우회 이동" and "사선 확보 후 공격". Distinguish path and actual shot. No arrow passes through stone.

MIDDLE 39%: two readable motion rows, each 3 equal panels showing same actor, same size and feet baseline, NO aura:
Row 1 heading "도약 거인 · 근접 내려치기", captions "예고 0.3초", "타격 1회", "회복". First winds back one wrapped fist, second punches downward/forward with compact pale warm impact crescent confined in front, third lowered arm and visible relaxed recovery. This is a grounded fist attack, NO jump, NO hammer, preserve bearded armored brute in reference1.
Row 2 heading "도끼 돌진병 · 밀착 베기", captions "예고 0.2초", "전방 베기", "회복". First retracts axe with shield protected, second swipes axe in a short forward horizontal 100~120-degree crescent, third lowers axe. NO rushing movement in these three panels. Shield and axe always anatomically gripped on consistent sides. Brief ground warning narrow outline under the front attack cone; no giant filled circular red puddle.

BOTTOM 33%: 5 equal columns comparing DIFFERENT SEPARATE status-effect silhouettes over the SAME small steel knight from reference1. All actors same size, identity and base colors, soles on same baseline, 52px-like game-scale inset included underneath each larger sample. Effects must frame rather than obscure body.
1 "하강 광포화": narrow dark crimson-magenta ember smoke rising behind sides, subtle pulsing eyes/rim, a faint short movement residue. Do not fill ground with red.
2 "정예": warm amber broken ankle ring, sparse ascending gold sparks, very thin lit rim.
3 "시련 용사": distinct violet runic magic circle on floor and sparse upright rune shards. Larger shape than elite, thin transparent strokes, recognizable gaps.
4 "수호자": silver icy-blue protective crest BEHIND head/shoulders, thin open floor seal; no new armor, no giant angel wings.
5 "열쇠 표식": small gold-white floating key sigil ABOVE head, two or three orbiting fragments, small light floor glyph. Caption is a marker concept, do not invent a key monster.
Show a tiny green poison puddle and red outlined enemy telegraph near lower edges, both still clearly readable through the very restrained effects. Avoid bright full-body tint, neon glow pools, dense particles.

BOTTOM FOOTER 11%: a CLEAR layer separation diagram: an unmodified no-aura knight sprite + aura-only ghost/embers silhouette on dark background + ground-circle-only sample = assembled preview. Caption "캐릭터 원본 + 별도 오라 + 바닥 문양". The aura-only cell contains NO body or armor. A tiny 3-thumbnail progression of the crimson smoke with different flame shapes suggests animation, separate from the character. Caption "오라만 일렁임".
Keep all captions short and legible Korean exactly as above. No fake numerical damage, UI stats, giant title logo, unrelated characters, approved designs changed, or actual runtime claims. All margins clean, no cropped weapon, no cropped feet. This is the single coherent package for one review.
```

출력/보존: C:/baggam-dev/spirebound/docs/design-drafts/monster-ai-20261021/monster-combat-effects-v1.png
생성원본: C:/Users/SDSPRO/.codex/generated_images/01a13828-0d36-7292-9c64-ff00ee502b14/exec-e75c9dae-fd3c-487a-aa2e-d5da7fb1430c.png
내장 imagegen 1회/원본 유지·무변환 복사. 실제 생성 PNG 직접확인, 재생성 없음.
