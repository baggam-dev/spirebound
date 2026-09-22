# Pixel visual refresh

- Galmuri11 is bundled locally as pixel-font.woff2. Upstream: https://github.com/quiple/galmuri . License and copyright notices: FONT-LICENSE.txt (SIL OFL 1.1).
- title-art.png is generated title artwork showing a lone adventurer before the tower, with the Spirebound logo.
- pixel-theme.css is loaded last, preserving desktop and mobile sizing rules while applying pixel typography and controls.
- Mobile collections are two horizontally scrollable icon rows. Tap an icon again, tap outside, or wait four seconds to dismiss its description.
- QA: 283 tests pass; touch-emulated 844×390, 667×375, 390×844 and desktop 1280×800 loaded without page errors or horizontal overflow. 667×375 upgrade cards fit; tooltip toggle and timeout verified. Real iPhone Safari still needs a play check.
- Deployment packaging now includes the font, its license, title artwork and theme stylesheet. Not automatically deployed as part of this visual edit.
