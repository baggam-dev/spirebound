# 이펙트 2단계 구현 기록 — 2026-11-08

## 승인과 범위
사용자 ㄱㄱ로 f04a640 통합 시안 승인. 명중/정밀 약점강화·4원소피격·회피참격/망령검 베기를 구현했다. 시안의 CRITICAL은 현재 코드의 실제 정밀 약점강화 이벤트로 대응한다. 무작위 치명타 시스템은 없으며 추가하지 않는다. 착지/폭발/지속장판·오라/보조효과는 단계3/4이며 이번에는 변경하지 않았다.

## 변경
- arrow-impact-visuals.js: 기존 일반/정밀 .2초 명중 효과와 최대24 유지. 짧은 핵→전방 파편→어두운 감쇠. reduced 파편2개/기본5개. 기존 이벤트 생성 조건·좌표/방향 유지.
- progression.js: 기존 약점! 텍스트 이벤트에 precisionBurst/hitAngle 메타만 추가. 배율/임계값/명중카운터/이벤트수·순서 유지. 같은 이벤트의 첫 .2초만 접촉위치(y+28)에 두 방향 금빛 선을 표시하고 텍스트는 기존 .65초 유지. 렌더 drawPrecisionBurst가 actor나 저장필드를 변경하지 않는다.
- element-hit-visuals.js: 기존 .3/.34/.4/.22초 및 최대48 유지. 전방 불꽃편·낙하 결정편·포물선 독방울·각진 전기 가지로 구분하고 초반 핵/후반 감쇠 강화. 기본은 기존 레벨/분기 crown/mark 유지, reduced는 2~3개 형태/핵만·crown/mark 생략. 들어오는 globalAlpha를 곱해 보존. 전이 번개는 실제 toX/toY와 기존 중간 도형 유지, reduced에서 얇은 연결선과 작은 끝점만 표시.
- drawSlashRibbon: 기존 arrow-impact 모듈 안의 공통 Canvas 다각형 헬퍼. 14구간의 가는 꼬리/두꺼운 선두, 기본만 내측 잔상1겹. sweep 선두는 현재 진행률에 맞추며 판정반경을 변경하지 않는다. reduced 폭3/기본6px, 지속 파티클/새버퍼/새RNG 없음.
- skill-overhaul-effects.js: 회피참격의 기존 반경28~33/방향·진행시간으로 ribbon 표시, 기존 직선 검/손잡이는 유지.
- rendering/spectral-blade.js: 실제 swing local/aim/halfAngle과 기존 radius*.82 경로 사용. 검 PNG/위치/공격타이밍 유지. combat/spectral-blade.js는 기존 .14초 slash 피격 이벤트에 angle:state.aim만 추가, drawSlashContact가 기존 대각 고정선 대신 방향 ribbon을 단독 표시.
- game.js: reduced 전체스킵에서 arrowImpact/hitElement/slash만 예외로 통과시키고 reduced를 렌더에 전달. 다른 효과 스킵은 기존 유지. 약점강조는 기존 텍스트와 함께 통과, 라벨 패스 유지. 적 경계/보스경계·적탄 최상단 단일 표시 순서 유지. 모바일 readableEffects 밀도필터·기존상한 유지.

## pixelfx 활용 방식
pixelfx의 시간/형태 설계에서 착안한 독자적 Canvas 구현. 외부 코드·이미지·폰트·더미/act 복사 및 패키지 설치 없음. 따라서 이번 변경에 새 외부코드 고지는 추가하지 않았다. 향후 실제 코드/시트를 차용할 경우 MIT/NOTICE를 해당 사용분과 함께 보존한다. 이번 새모듈/생산PNG가 없어 서버/배포 공개목록 추가 불필요.

## 확인과 미확인
정적 소스/콜사이트/diff 대조 및 git diff --check만 수행. 실행 테스트·구문실행·서버·브라우저QA·원격푸시·배포·공개확인 0. 회귀 tests/unit/effects-stage2.test.js 4건을 작성했지만 실행하지 않았다. 렌더 opacity/동결객체불변·reduced간소화, 연쇄끝점, 실제약점주기/짧은강조, 베기반경/결정성을 다룬다. 기존 테스트통과 기록을 이번 검증으로 간주하지 않는다.

새 명시 배포 지시 후: 새4+기존 arrow-impact/skill-stage4/element-hit/skill-renewal/spectral/roll/가독성 관련 및 전체 테스트→실제 Canvas PC/가로모바일 기본/완화·정밀2/3번째/저격/치명처치·4원소/작은파편·전이/분기·회피/망령검두연타·벽/상하좌우·최대동시효과/적경계겹침·일시정지/동결/저장재개→프레임/메모리 비교·수정재검증→버전호환검토/푸시·배포·공개확인. 새시각효과가 명중점 중심/실제게임크기에서 얼마나 읽히는지와 reduced로 다시보이게 된 효과의 부하는 아직 미검증이다. 실제휴대폰 미확인. 기존0.49 운영은 이전기록이며 이번 재확인하지 않았다.