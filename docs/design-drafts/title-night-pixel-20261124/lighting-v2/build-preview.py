"""Standalone v2 design compositor; no game imports, preserves previous v1."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math,json,hashlib
ROOT=Path(__file__).resolve().parent;BASE=ROOT.parent;REPO=ROOT.parents[3]
N=ROOT/'native';N.mkdir(exist_ok=True)
def mask(im):return im.getchannel('A').point(lambda a:255 if a>192 else 0)
def normalize(frames,limit):
    pixels=[p[:3] for f in frames for p in f.getdata() if p[3]]
    pal=Image.new('RGB',(len(pixels),1));pal.putdata(pixels);pal=pal.quantize(colors=limit)
    result=[]
    for f in frames:
        q=f.convert('RGB').quantize(palette=pal,dither=Image.Dither.NONE).convert('RGBA');q.putalpha(f.getchannel('A'))
        q.putdata([p if p[3] else (0,0,0,0) for p in q.getdata()]);result.append(q)
    return result
heroes=[];hero_boxes=[]
im=Image.open(ROOT/'hero-rim-source.png').convert('RGBA');assert im.size==(2172,724)
for i in range(3):
    c=im.crop((i*724,0,(i+1)*724,724));c.putalpha(mask(c));b=c.getbbox();hero_boxes.append(b)
    scale=88/621 # Same v1 body scale and root, independent of new bright pixels.
    crop=c.crop(b).resize((round((b[2]-b[0])*scale),round((b[3]-b[1])*scale)),Image.Resampling.NEAREST)
    at=(48-round((370-b[0])*scale),104-crop.height);f=Image.new('RGBA',(96,112));f.alpha_composite(crop,at);heroes.append(f)
heroes=normalize(heroes,47)
foliage=[];leaf_boxes=[]
im=Image.open(ROOT/'leaves-source.png').convert('RGBA');assert im.size==(2172,724)
for i in range(3):
    c=im.crop((i*724,0,(i+1)*724,724));c.putalpha(mask(c));leaf_boxes.append(c.getbbox())
    # Map the leaf-only source to the same fixed 512px tree space as v1.
    small=c.resize((358,358),Image.Resampling.NEAREST);f=Image.new('RGBA',(384,360));f.alpha_composite(small,(0,19));foliage.append(f)
foliage=normalize(foliage,23)
for family,frames in [('hero',heroes),('leaves',foliage)]:
    for i,f in enumerate(frames):f.save(N/f'{family}-{i}.png')
background=Image.open(BASE/'native/background.png').convert('RGB')
tree=Image.open(BASE/'native/tree-0.png').convert('RGBA') # Wood never changes frame or transform.
fires=[Image.open(BASE/f'native/fire-{i}.png').convert('RGBA').resize((58,58),Image.Resampling.NEAREST) for i in range(4)]
logo=Image.open(REPO/'assets/images/title-logo-v1.png').convert('RGBA');top=round(logo.width*.43/5.8)
logo=logo.crop((0,top,logo.width,min(logo.height,top+round(logo.width/5.8))));logo.thumbnail((230,42),Image.Resampling.NEAREST)
font=lambda size:ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',size)
def scene(t,still=False):
    bg=background.copy();bg.paste(tree,(-40,0),tree)
    leaves=foliage[0 if still else [0,1,2,1][int(t/.3)%4]];bg.paste(leaves,(-40,0),leaves)
    d=ImageDraw.Draw(bg,'RGBA')
    # Stepped, localized gate seam. Each row is quantized to eight brightness levels.
    for y in range(112,271):
        q=round((y-112)/159*7)/7
        d.line((457,y,465,y),fill=(221,142,59,12+round(q*24)))
        d.line((460,y,462,y),fill=(246,181,82,45+round(q*83)))
        d.point((461,y),fill=(255,232,163,85+round(q*150)))
    # Floor spill points from the gate toward the archer, rather than lighting every wall.
    for y in range(271,355,3):
        q=(y-271)/84;spread=3+round(q*21);cx=461-round(q*12)
        d.rectangle((cx-spread,y,cx+spread,y+1),fill=(201,130,60,round((1-q)*64)))
    for i,(x,y) in enumerate([(300,240),(588,240)]):
        flicker=0 if still else math.sin(t*7+i*2)
        d.rectangle((x-15,y-5,x+15,y+3),fill=(210,126,49,40+round(flicker*5)))
        flame=fires[0 if still else (int(t/.12)+i*2)%4];bg.paste(flame,(x-29,y-53),flame)
        d.rectangle((x+1,y-7,x+3,y-3),fill=(255,241,180,180))
        for k in range(3):d.rectangle((x-15+k*4,y+39+k*4,x+12-k*3,y+39+k*4),fill=(205,134,57,30+round(flicker*4)))
        if not still:
            for k in range(3):
                life=(t*.38+k*.37+i*.21)%1
                if life>.62:continue
                d.point((round(x+math.sin(life*6+i+k)*5+life*6),round(y-11-life*48)),fill=(225,154,71,round((1-life/.62)*180)))
    # Only detached leaves move through the air. The underlying wood is invariant.
    if not still and t%6<2.1:
        for i in range(3):
            age=t%6-i*.4
            if age<0:continue
            x=round(160+i*18+age*24+math.sin(age*2+i)*8);y=round(42+i*9+age*46)
            d.rectangle((x,y,x+2,y+1),fill=(102,73,43,190));d.point((x+1,y-1),fill=(129,94,55,170))
    d.polygon([(429,340),(445,342),(427,359),(417,359)],fill=(2,4,9,70))
    actor=heroes[0 if still else [0,1,2,1][int(t/.6)%4]];bg.paste(actor,(386,238),actor)
    d=ImageDraw.Draw(bg,'RGBA');d.rectangle((20,52,274,271),fill=(4,7,13,88));bg.paste(logo,(25,65),logo)
    d.text((83,112),'살아서 내려와라.',font=font(9),fill='#a8adb7');d.line((30,136,260,136),fill='#535160')
    d.rectangle((37,150,258,179),fill=(24,26,34,190),outline='#a48c61');d.rectangle((39,152,256,177),outline='#554c40')
    d.text((49,155),'◆ 계속 탐험',font=font(12),fill='#d5c6a7')
    for label,y in [('새로운 원정',191),('기록실',224),('설정',253)]:d.text((51,y),label,font=font(11),fill='#b8b8ba')
    d.line((38,285,257,285),fill='#535160');d.text((42,300),'명예의 전당   ·   전투 훈련',font=font(8),fill='#999ba3')
    return bg
scene(0,True).resize((1280,720),Image.Resampling.NEAREST).save(ROOT/'main-menu-still.png')
frames=[scene(i/10) for i in range(60)];pal=frames[0].quantize(colors=255)
gifs=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
gifs[0].save(ROOT/'motion-preview.gif',save_all=True,append_images=gifs[1:],duration=100,loop=0,disposal=1,optimize=True)
contact=Image.new('RGB',(1920,360))
for slot,index in enumerate([0,20,40]):contact.paste(frames[index],(slot*640,0))
contact.save(ROOT/'motion-contact.png')
manifest={'status':'review-only; no runtime changes','generatedCalls':2,'parentSources':'../native background/tree-0/fire0..3 unchanged',
 'sources':[{'file':f,'sha256':hashlib.sha256((ROOT/f).read_bytes()).hexdigest()} for f in ['hero-rim-source.png','leaves-source.png']],
 'hero':{'boxes':hero_boxes,'scale':88/621,'root':[48,104],'paletteColors':47},'leaves':{'boxes':leaf_boxes,'native':[384,360],'treeCoordinateScale':.7,'paste':[0,19],'paletteColors':23},
 'tree':{'file':'../native/tree-0.png','sha256':hashlib.sha256((BASE/'native/tree-0.png').read_bytes()).hexdigest(),'staticPosition':[-40,0],'rotation':0,'frameChanges':False},
 'changes':{'doorSeam':[461,112,270],'floorSpill':True,'fireSize':[58,58],'fireSizeFactor':58/48,'embersMaxPerFire':3,'fallingLeavesMax':3,'leafStepSeconds':.3},
 'preview':{'size':[640,360],'still':[1280,720],'frames':60,'fps':10,'seconds':6,'gifBytes':(ROOT/'motion-preview.gif').stat().st_size},
 'limitations':['Leaf-only painted key poses, wood stays completely fixed.','Manual leaf placement and light planes are review composition, not game shader or live integration.','Actual browser/game QA, mobile performance, runtime fallback and deployment not performed.']}
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'sprites':6,'treeStatic':True,'gifBytes':manifest['preview']['gifBytes']}))
