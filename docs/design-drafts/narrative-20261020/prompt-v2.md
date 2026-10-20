# 서사 스토리보드 방향/사건상태 보완 정확 프롬프트 v2

내장 imagegen 편집1회. 대상 storyboard-v1.png를 직접 본 후 수정. v1과 생성 원본은 모두 보존한다. 다른 새 스타일/캐릭터 재생성 대신 하강 계단과 격파상태/오라소실·발접촉만 보완했다.

원본: C:/Users/SDSPRO/.codex/generated_images/01a13828-0d36-7292-9c64-ff00ee502b14/exec-3382f96c-9c9e-447f-a359-a43c4fd176e6.png
최종: C:/baggam-dev/spirebound/docs/design-drafts/narrative-20261020/storyboard-v2.png
입력: C:/baggam-dev/spirebound/docs/design-drafts/narrative-20261020/storyboard-v1.png

직접 육안확인: 여섯 한글명패/주인공 정체성/모르도 무릎·약해진 오라/벨카르 발 지면/꺼진 대악마 핵과 축 늘어진 몸/위에서 내려다보는 하강 계단/문 밖 새벽.2번 할버드는 완전히 눕지 않고 지지대로 세워 잡고 있어, 이 보드는 정확 사망프레임 승인이 아닌 이야기 구도 검토용이다. 최종 구현 시 기존 승인 사망모션을 사용한다. 장면별 원근 보스 크기는 실제 런타임 크기/밸런스 변경이 아니다. 보드만으로 실제 이동/오라/반짝임이 재생되는 것은 아니다.

```text
Use case: precise-object-edit. Edit the provided SIX-PANEL Spirebound storyboard with ONLY these corrections; preserve overall grid, captions, all approved character identities, fine pixel art, palette, and panel01/panel06 unchanged. Panel02 "왕의 진실": this is AFTER the defeated king's aura is fading, so reduce the black-purple smoke behind him by about 80%, show only a few faint dissolving wisps; keep skeleton king visibly kneeling, halberd lowered rather than ready to attack. Panel03 "마지막 문지기": keep Velkar's existing identity but plant both boots onto the stair landing, no hovering, reduce character's staged size slightly. Panel04 "봉인 해방": unmistakable AFTERMATH of archdemon defeat; keep same wall-emerging upper torso front view slightly top-down, but head and long arms slump, hands relaxed, eyes dim and chest core visibly DARK/inert rather than bright alive orange; broken bindings and faint disappearing fragments; glowing small key stays readable below at center; no attack pose. Panel05 "하강": MUST clearly show descent, not a hero climbing stairs. Change the camera to high viewpoint looking DOWN a long stairwell: small rear-view blond scout with red scarf and blue-grey cloak running AWAY from viewer DOWN descending steps, back and top of head seen slightly from above, step risers visible on foreground-facing sides, vanishing point BELOW camera viewpoint toward a small sealed exit door far BELOW at bottom of stairwell. Foreground stairs near camera start HIGH and slope DOWN to distant low door. Put pursuit shadows high behind/along the upper stair edge rather than ahead by exit. Extinguished/tiny warm key in scout hand, muted crimson ring on distant low door. Preserve caption "05 하강". No outdoor teleport or new NPC. Only these corrections, don't redesign costumes/face/hands/weapons, no extra text or panels.
```

