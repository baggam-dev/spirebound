"""Build an original vector geometry proposal. Does not import or execute game code."""
from pathlib import Path
import json

root = Path(__file__).parent
themes = [('석조', '#a49b83', '#dbca8c'), ('기록보관소', '#9889a4', '#dfcbef'),
          ('프리즘', '#73949a', '#a2e4de'), ('상층 철문', '#9b7c7a', '#e5b481')]
states = ['봉인', '해제 중', '개방']
directions = ['북', '동', '남', '서']
parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1160" viewBox="0 0 1200 1160">',
         '<rect width="1200" height="1160" fill="#101619"/>',
         '<style>text{fill:#e0d8c4;font:14px sans-serif} .small{font-size:11px;fill:#a5b0af}</style>',
         '<text x="24" y="28">일반문 · 방향 / 봉인 상태 비교 — 기하 시안, 제품 미반영</text>']
def rect(x,y,w,h,color):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"/>'
for ti,(name,stone,light) in enumerate(themes):
    for di,direction in enumerate(directions):
        row=ti*4+di
        y=48+row*68
        parts.append(f'<text x="18" y="{y+28}">{name} · {direction}</text>')
        for si,state in enumerate(states):
            ox=210+si*328
            # Local inward direction +Y; authored in horizontal coordinates.
            # Side variants use their own 70x29 body, not a stretched 80x35 sprite.
            side=di%2
            w,h=(70,29) if side else (80,35)
            parts.append(rect(ox-8,y-5,300,62,'#252d30'))
            parts.append(f'<text class="small" x="{ox+175}" y="{y+21}">{state} · {29 if side else w}×{70 if side else h}</text>')
            transform = [f'translate({ox},{y+4})', f'translate({ox+35},{y-5}) rotate(90)',
                         f'translate({ox+80},{y+39}) rotate(180)', f'translate({ox+6},{y+65}) rotate(-90)'][di]
            # Display side tiles at 0.7 solely to fit the contact sheet; HTML has zoom.
            if side:
                transform += ' scale(.7)'
            parts.append(f'<g transform="{transform}" shape-rendering="crispEdges">')
            parts += [rect(-6,-3,w+12,h+6,'#080e12'), rect(-5,-2,9,h+4,stone),
                      rect(w-4,-2,9,h+4,stone), rect(0,-3,w,5,stone),
                      rect(-4,0,2,h,light), rect(w+2,0,2,h,light), rect(4,h-3,w-8,3,stone)]
            if si<2:
                gap=0 if si==0 else 12
                parts += [rect(5,4,(w-10-gap)//2,h-10,'#3d4143'),
                          rect((w+gap)//2,4,(w-10-gap)//2,h-10,'#3d4143')]
                if si==0:
                    parts += [rect(7,h//2-3,w-14,6,'#b09562'),rect(w//2-5,h//2-7,10,14,'#302a30'),
                              f'<path d="M{w//2},{h//2-5} l4,5 -4,5 -4,-5 Z" fill="{light}"/>']
                else:
                    parts += [rect(7,h//2-3,w//2-15,5,'#b09562'),rect(w//2+8,h//2-3,w//2-15,5,'#b09562'),
                              rect(w//2-1,4,2,h-9,light)]
            else:
                # Stair/threshold stripes point into the traversable opening.
                parts += [rect(w//2-10,8,20,2,'#465a59'),rect(w//2-15,15,30,2,'#637a72'),
                          rect(w//2-19,h-6,38,2,light)]
            parts.append('</g>')
parts += ['<text x="24" y="1148" class="small">측면은 비교표에서만70% 표시. 치수는 게임 논리px. 빗장 / 분리 / 빈 통로의 형태로 상태 구분.</text>', '</svg>']
(root/'comparison.svg').write_text('\n'.join(parts),encoding='utf-8')
(root/'manifest.json').write_text(json.dumps({
    'status':'review-only; no runtime integration; no in-game verification',
    'source':'Original code-authored SVG geometry, no third-party art or generated raster',
    'generator':'build-preview.py','variants':48,
    'logicalSizes':{'northSouth':[80,35],'eastWest':[29,70],'environmentFloor0Exception':[80,40]},
    'collisionChanges':False,'gameTestsRun':False,
    'reviewNotes':['Side contact-sheet display is 70%; dimensions are logical game pixels.',
                   'This is a shape/state proposal, not finished pixel art or an animation quality claim.']
},ensure_ascii=False,indent=2),encoding='utf-8')
