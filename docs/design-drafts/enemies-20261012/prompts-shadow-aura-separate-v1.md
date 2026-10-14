# 재사용 분리 오라 v1 — 2026-10-14

- 사용자 분리/색변경 재사용 제안과 시안진행 승인. 내장 imagegen 신규1회. `shadow-aura-separate-v1.png`에 원본 복사, 생성 원본 유지. 캐릭터/런타임 자산 수정 없음.
- 좌상→우상→좌하→우하 일렁임 4단계 정지 PNG 시안. 실제 애니메이션 재생/연결은 미확인. 연무가 요청보다 두껍고 상단이 아치로 연결됨. 프레임 크기/기준점/외곽이 완전히 동일하지 않음. 매끄러운 루프·52px 가독성·투명도·배경에서의 대비 미검증. 컨펌 대기, 자동 재생성 없음.

## 승인 후 연결 제안 (현재 미구현)

- 캐릭터는 오라 없는 `rift-hunter-v1.png`, v2 내포 오라와 중복하지 않음. 캐릭터 v1 외형도 이 조합으로 사용자 승인 후 반영.
- 프레임별 외곽에 맞춰 크기를 각각 바꾸지 않고 동일 셀 크기/앵커로 캐시. 약1.8~2.4초 주기로 인접 프레임 crossfade와 작은 위치 변화를 조합하여 일렁임 제안. 실제 자연스러움은 배포 지시 후 QA 대상으로 남김.
- 설정: color, opacity, width/height, speed, intensity. 일반 사냥꾼은 검보라/낮은 농도(.18~.28 제안), 공격 준비 때 소폭 증가. 수치는 컨펌/실게임 확인 전 임시 제안.
- 원본은 이미 보라색이므로 tint만으로 모든 색이 정확히 나오지는 않음. 승인 후 Canvas 캐시에서 밝기/알파를 사용한 색 레이어와 어두운 연무 레이어를 분리해 검정 그림자는 유지하고 색만 교체하는 방안. 원본 PNG 보존. Python/SVG 편집 대체 없음.
- 렌더 순서: 기존 ground 공격예고 → 후면 오라 → 캐릭터 → 기존 피드백. 발 아래/바닥표식 영역은 오라에서 제외; 얼굴/칼 실루엣은 캐릭터가 위에 그려짐. 초상에서는 낮은 농도의 한 상태만 사용 제안.
- 시간과 id로 개체별 위상차, actor/저장 필드 변경 없음. 동결/효과완화는 정지 또는 낮은 농도로 제안. 로드 실패 시 오라 없이 캐릭터 fallback.
- 정예/시련 하강몹은 이 설정을 재사용할 수 있게 설계하되 이번에는 일괄 적용하지 않음. 각각 적용대상/색/농도 승인 필요.

## 정확 프롬프트

```text
Use case: stylized-concept. Make a transparent PNG 2x2 sprite sheet showing FOUR sequential phases of a subtle looping dark smoke aura effect, standalone VFX with NO character. For Spirebound compact 52px ordinary fantasy enemy: aura will be rendered BEHIND a character, never cover its face, blades or feet. Each of four equal square cells must have exactly the same anchor, scale and outer envelope with generous cell margins. Order top-left, top-right, bottom-left, bottom-right. Shape: two sparse vertical irregular strands of soft curling shadow smoke flanking an EMPTY transparent central body space, joined loosely behind shoulders at upper middle but keep the head center clear; bottom ends fade away above foot baseline, no floor ring. Charcoal black with muted violet edges, low-density translucent whorls, only a few tiny embers, no luminous neon, no lightning, no portal, no closed circular halo, no huge opaque clouds. Four phases show the SAME smoke strands slowly curling and rising with small changes of curl placement and density, final phase close to first for loop. Polished hand-painted dark fantasy VFX texture with soft alpha edges. Design useful as a reusable aura texture that can later be tinted, while black shadow remains dark. NO creatures, people, silhouettes, armor, weapons, background scene, floor, grids, cell borders, labels, numbers, text or watermark. Genuinely transparent background and central void. This is a four-phase motion design sheet, not a claim of a pixel-perfect seamless animation.
```
