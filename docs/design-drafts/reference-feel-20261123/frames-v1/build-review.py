"""Deterministic draft slicing/nearest scaling/palette previews, NOT game QA.
Never overwrites source art or writes production assets. Requires Pillow.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'native'
OUT.mkdir(exist_ok=True)
FONT = 'C:/Windows/Fonts/malgun.ttf'
def font(size):
    return ImageFont.truetype(FONT, size)

SPECS = {
 'hero': dict(file='hero-poses-source.png', grid=(3,2), names=['대기','당김','발사','회수','피격','착지'],
              feet=[470,470,470,466,460,460], anchor=256, size=(128,104), pivot=(64,90), target=58),
 'mordo':dict(file='mordo-poses-alpha-v2.png',grid=(3,2), names=['대기','공격 준비','공격 회수','피격','균열','붕괴'],
              feet=[472,472,472,458,446,430],anchor=256,size=(192,152),pivot=(96,132),target=92.4),
 'door': dict(file='door-states-source.png',grid=(2,2),names=['봉인','해제','개방','붕괴'],
              feet=[480,480,480,480],anchor=384,size=(128,128),pivot=(64,118),target=92),
 'fx':dict(file='fx-source.png',grid=(4,3),names=[f'{row} {i+1}' for row in ['명중','파열','보상'] for i in range(4)],
           size=(128,128),pivot=(64,64))
}
def checker(size, step=8):
    im=Image.new('RGBA',size,(22,26,34,255));d=ImageDraw.Draw(im)
    for y in range(0,size[1],step):
        for x in range(0,size[0],step):
            if (x//step+y//step)%2:d.rectangle((x,y,x+step-1,y+step-1),fill=(32,37,47,255))
    return im

report={'review_only':True,'production_ready':False,'threshold':192,'palette_limit':48,'families':{}}
families={}
for family,spec in SPECS.items():
    source=Image.open(ROOT/spec['file']).convert('RGBA');cols,rows=spec['grid'];pieces=[];records=[]
    for i,name in enumerate(spec['names']):
        col,row=i%cols,i//cols
        rect=(col*source.width//cols,row*source.height//rows,(col+1)*source.width//cols,(row+1)*source.height//rows)
        tile=source.crop(rect)
        core=tile.getchannel('A').point(lambda a:255 if a>192 else 0)
        bbox=core.getbbox()
        if not bbox:raise ValueError(f'Empty {family} {i}')
        tile.putalpha(core)
        # Shared standing-frame scale, not a per-pose bounding-box fit.
        if family!='fx':
            if i==0:scale=spec['target']/(bbox[3]-bbox[1])
            pivot=(spec['anchor'],spec['feet'][i])
        else:
            scale=[32,96,64][row]/tile.width;pivot=(tile.width/2,tile.height/2)
        resized=tile.resize((round(tile.width*scale),round(tile.height*scale)),Image.Resampling.NEAREST)
        canvas=Image.new('RGBA',spec['size'])
        offset=(round(spec['pivot'][0]-pivot[0]*scale),round(spec['pivot'][1]-pivot[1]*scale))
        canvas.paste(resized,offset)
        clean=Image.new('RGBA',canvas.size);clean.paste(canvas,(0,0),canvas.getchannel('A'));pieces.append(clean)
        edge=bool(bbox[0]<=1 or bbox[1]<=1 or bbox[2]>=tile.width-1 or bbox[3]>=tile.height-1)
        records.append(dict(index=i,name=name,source_rect=list(rect),core_bounds=list(bbox),scale=round(scale,6),
                            source_pivot=list(pivot),output_pivot=list(spec['pivot']),edge_content=edge))
    # One palette per family; alpha is binary only in these draft derivatives.
    master=Image.new('RGB',(spec['size'][0]*len(pieces),spec['size'][1]),(0,0,0))
    for i,piece in enumerate(pieces):master.paste(piece.convert('RGB'),(i*piece.width,0))
    palette=master.quantize(colors=47,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
    ready=[]
    for i,piece in enumerate(pieces):
        q=piece.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');q.putalpha(piece.getchannel('A'))
        # All transparent RGB is canonical so reports count palette colors fairly.
        canonical=Image.new('RGBA',q.size);canonical.paste(q,(0,0),q.getchannel('A'));q=canonical
        filename=f'{family}-{i:02}.png';q.save(OUT/filename);records[i]['native']='native/'+filename
        records[i]['native_bounds']=list(q.getchannel('A').getbbox() or (0,0,0,0));ready.append(q)
    families[family]=ready
    report['families'][family]=dict(source=spec['file'],source_size=list(source.size),source_alpha=source.getchannel('A').getextrema(),
                                  native_canvas=list(spec['size']),frames=records)
    # A 2x nearest preview showing fixed ground anchors, not a production atlas.
    zoom=2;cell=(spec['size'][0]*zoom+28,spec['size'][1]*zoom+48)
    sheet=checker((cols*cell[0],rows*cell[1]),16);draw=ImageDraw.Draw(sheet)
    for i,piece in enumerate(ready):
        x=(i%cols)*cell[0]+14;y=(i//cols)*cell[1]+32
        draw.text((x,y-26),spec['names'][i],font=font(17),fill='#e6d6b3')
        sheet.alpha_composite(piece.resize((piece.width*zoom,piece.height*zoom),Image.Resampling.NEAREST),(x,y))
        if family!='fx':
            ground=y+spec['pivot'][1]*zoom;draw.line((x,ground,x+piece.width*zoom,ground),fill='#49616b')
    sheet.convert('RGB').save(ROOT/f'{family}-review.png')

# Native-size summary, deliberately not enlarged: all families share one board.
summary=checker((1152,1100));draw=ImageDraw.Draw(summary)
y=8
for family in ['hero','mordo','door','fx']:
    spec=SPECS[family];draw.text((12,y),{'hero':'주인공 · 몸체 58px 기준','mordo':'모르도 · 현재 몸체 92.4px 기준','door':'큰 봉인문 · 높이 92px 제안','fx':'별도 이펙트 · 32 / 96 / 64px 셀 기준'}[family],font=font(18),fill='#e6d6b3');y+=30
    for i,piece in enumerate(families[family]):
        row=i//6;x=(i%6)*192+(192-piece.width)//2;top=y+row*(piece.height+24)
        summary.alpha_composite(piece,(x,top));draw.text((x,top+piece.height),spec['names'][i],font=font(13),fill='#adb9c8')
    y+=(1+(len(families[family])-1)//6)*(spec['size'][1]+24)+12
summary.crop((0,0,1152,min(summary.height,y))).convert('RGB').save(ROOT/'native-contact.png')

contrast=Image.new('RGBA',(768,720));d=ImageDraw.Draw(contrast)
for row,(family,indices) in enumerate([('hero',[0,2]),('mordo',[0,5]),('door',[0,2]),('fx',[2,6,10])]):
    for side,(bg,fg) in enumerate([('#111722','#d5c6a8'),('#e7e1d5','#302b28')]):
        left=side*384;top=row*180;d.rectangle((left,top,left+383,top+179),fill=bg)
        d.text((left+8,top+3),family+' / '+('dark' if side==0 else 'light'),font=font(14),fill=fg)
        width=sum(families[family][i].width for i in indices);x=left+(384-width)//2
        for i in indices:
            piece=families[family][i];contrast.alpha_composite(piece,(x,top+24));x+=piece.width
contrast.convert('RGB').save(ROOT/'contrast-check.png')

def gif(name,family,sequence,durations):
    frames=[]
    for i in sequence:
        piece=families[family][i];bg=checker(piece.size);bg.alpha_composite(piece)
        frames.append(bg.resize((piece.width*3,piece.height*3),Image.Resampling.NEAREST).convert('RGB'))
    frames[0].save(ROOT/name,save_all=True,append_images=frames[1:],duration=durations,loop=0,disposal=2)
gif('hero-attack.gif','hero',[0,1,2,3,0],[260,130,60,100,350])
gif('mordo-attack.gif','mordo',[0,1,2,0],[350,260,140,450])
gif('mordo-collapse.gif','mordo',[0,3,4,5],[450,100,250,850])
for row,name in enumerate(['impact','fracture','reward']):gif(f'fx-{name}.gif','fx',list(range(row*4,row*4+4)),[50,60,90,200])
(ROOT/'frame-map.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({family:len(pieces) for family,pieces in families.items()}))
print('Draft image slicing and previews complete; no game source executed.')
