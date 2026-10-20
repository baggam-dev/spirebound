[2026-10-20 최신] 통합안 승인·다크톤 보완 구현 완료/미검증·미배포. 현재 구현은 docs/design-drafts/title-20261020/implementation-v1.md 및 runtime-prompts-v1.md 참조. 아래는 승인 전/이전 배포 이력이며 현재 상태보다 우선하지 않는다.

# Title screen reference layout

- Reuse the existing tower artwork as a full-screen desktop background; hide the redundant page header on the title screen.
- Center the dark menu under the artwork logo. Group lore, saved-run details, two main actions, and three secondary actions inside it.
- Keep existing save, confirmation, and navigation handlers unchanged. Touch buttons have a minimum height of 44px.
- Portrait screens show the complete artwork above the menu to avoid cropping the embedded logo. Short landscape screens use a compact menu.
- Verification: Edge desktop 1146x762 and 1280x800, touch-emulated 844x390, 667x375, and 390x844; saved and fresh states (10 screenshots), unobstructed buttons, guide/boss-test navigation, no page errors. Actual iPhone Safari remains unverified.
- Reproduce with tools/title-layout-qa.mjs while the local server runs on port 5173 and PLAYWRIGHT_PATH points to the installed package.
