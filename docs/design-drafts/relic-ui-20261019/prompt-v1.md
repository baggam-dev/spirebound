# 유물 선택·획득 시안 정확 프롬프트

내장 imagegen, 기존 승인 레벨업 UI를 스타일 참조. 원본 경로는 design-v1.md에 보존.

```text
Use case: ui-mockup
Asset type: review-only PNG concept board for Spirebound relic selection and acquisition UI.
Primary request: Redesign the existing relic chest modal to match the supplied approved parchment skill-selection UI, with a desktop view, a compact LANDSCAPE mobile view, and a small non-blocking acquisition banner in one polished coherent board. Preserve the game flow: at most three actual offered relics, click or tap a whole card once to claim immediately; no extra confirmation, no equip slots, no reroll, no purchase, no new relic or currency.
Reference image is style only: restrained worn cream parchment, dark oxblood backing, aged brass frames, crisp pixel-art accents, legible dark Korean text. Do not copy the reference skill names, level-up title, or reroll button. No game characters anywhere.
Composition: large desktop modal occupying the upper two-thirds, three equal parchment cards horizontally. Lower strip left shows the same THREE cards in a compact 844x390 landscape phone composition, shorter icons and typography, adequate button touch space, no portrait mockup. Lower strip right shows a small acquisition banner on unobscured dark stone floor, no full-screen success modal. Keep all sections inside the canvas, no cropped cards.
Desktop header exact Korean: "수호자의 유물함"; subtitle "하나를 선택하세요 · 획득한 유물은 누적 적용"; a compact ownership row "보유 유물 2" with two small generic current-item glyphs. Avoid a long list of ownership text.
Card 1: an aged horseshoe magnet glyph, existing icon-style concept, no huge new illustration; name "수집 자석"; tag "유물"; description "경험치·정수 획득 반경 +70"; comparison row "획득 반경 30 → 100". Give this card a thin warm brass keyboard-focus border as an example, NOT a recommended/best choice badge.
Card 2: small leather travel boots glyph; name "순례자의 장화"; tag "유물"; description "이동속도 +8%"; lower note "획득 즉시 적용". No invented before-and-after speed number.
Card 3: small violet-black bell glyph; name "공허의 종"; tag "유니크" in muted violet, this actual item is unique; description "12초마다 적을 끌어모음"; condition "보스 제외". No level/rank upgrades.
Show numbers 1 / 2 / 3 as quiet card-order decoration only, not a keyboard shortcut promise. Cards feel like one-tap actions, no distinct select-then-confirm control. At bottom a subdued but clear button "유물함 지나가기" with readable note "이번 유물함 보상을 받지 않고 진행합니다". Passing does not claim any relic. Do not show a close/back button that suggests returning later.
Phone view: same three horizontal choices, compact and readable, no portrait, no joystick/combat action buttons competing with modal.
Acquisition banner: one small magnet glyph with "유물 획득 · 수집 자석" and second line "경험치·정수 획득 반경 +70". A tiny one-time warm bracket glint only at banner edge. No new character, no full-body aura, no continuing glow, no confirm button, no interruption.
Background: dim top-down medieval dungeon stone floor, minimal blur, no copied characters, no giant treasure chest obscuring UI. Design should remain implementable with existing UI glyphs plus CSS; all glyphs are layout placeholders, not a new generated runtime icon asset set.
Constraints: no new loot rules, rarity tiers other than the existing unique label, refresh/reroll button, price, level up, equipment comparison slots, extra confirm step, invented buffs or gameplay stats. Fewer ornamental curls, strong spacing, readable labels and cards. Korean text as provided, avoid extra prose.
```
