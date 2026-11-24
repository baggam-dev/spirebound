"""Art normalization and standalone design composition; no game code imports."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math,json,hashlib
ROOT=Path(__file__).resolve().parent;REPO=ROOT.parents[2]
NATIVE=ROOT/'native';NATIVE.mkdir(exist_ok=True)
def core(im):return im.getchannel('A').point(lambda a:255 if a>192 else 0)
def palette_frames(frames,colors):
    pixels=[p[:3] for f in frames for p in f.getdata() if p[3]>0]
    line=Image.new('RGB',(len(pixels),1));line.putdata(pixels);pal=line.quantize(colors=colors)
    result=[]
    for f in frames:
        q=f.convert('RGB').quantize(palette=pal,dither=Image.Dither.NONE).convert('RGBA');q.putalpha(f.getchannel('A'))
        q.putdata([p if p[3] else (0,0,0,0) for p in q.getdata()]);result.append(q)
    return result
background=Image.open(ROOT/'background-source.png').convert('RGB').resize((640,360),Image.Resampling.NEAREST).quantize(colors=96,dither=Image.Dither.NONE).convert('RGBA')
background.save(NATIVE/'background.png')
hero_source=Image.open(ROOT/'hero-source.png').convert('RGBA');hero_cells=[hero_source.crop((i*724,0,(i+1)*724,724)) for i in range(3)]
hero_boxes=[core(c).getbbox() for c in hero_cells];hero_scale=88/(hero_boxes[0][3]-hero_boxes[0][1]);heroes=[]
for i,(c,b) in enumerate(zip(hero_cells,hero_boxes)):
    c.putalpha(core(c));crop=c.crop(b).resize((round((b[2]-b[0])*hero_scale),round((b[3]-b[1])*hero_scale)),Image.Resampling.NEAREST)
    f=Image.new('RGBA',(96,112));at=(48-round((370-b[0])*hero_scale),104-crop.height)
    assert at[0]>=0 and at[0]+crop.width<=96
    f.alpha_composite(crop,at);heroes.append(f)
heroes=palette_frames(heroes,31)
effects=Image.open(ROOT/'effects-source.png').convert('RGBA');cells=[effects.crop((i%3*512,i//3*512,(i%3+1)*512,(i//3+1)*512)) for i in range(6)]
boxes=[core(c).getbbox() for c in cells];fires=[];trees=[]
for i,(c,b) in enumerate(zip(cells,boxes)):
    assert min(b[0],b[1],512-b[2],512-b[3])>0
    c.putalpha(core(c)) # Separate soft generated glow from opaque flame/tree art.
    if i<4:
        scale=.15;size=(48,48);pivot=(24,44);root=256
    else:
        scale=.70;size=(384,360);pivot=(56,359);root=80
    crop=c.crop(b).resize((round((b[2]-b[0])*scale),round((b[3]-b[1])*scale)),Image.Resampling.NEAREST)
    f=Image.new('RGBA',size);at=(pivot[0]-round((root-b[0])*scale),pivot[1]-crop.height)
    assert at[0]>=0 and at[1]>=0 and at[0]+crop.width<=size[0]
    f.alpha_composite(crop,at);(fires if i<4 else trees).append(f)
fires=palette_frames(fires,15);trees=palette_frames(trees,23)
for name,frames in [('hero',heroes),('fire',fires),('tree',trees)]:
    for i,f in enumerate(frames):f.save(NATIVE/f'{name}-{i}.png')
font_path=Path('C:/Windows/Fonts/malgun.ttf')
font=lambda size:ImageFont.truetype(str(font_path),size)
logo=Image.open(REPO/'assets/images/title-logo-v1.png').convert('RGBA')
top=round(logo.width*.43/5.8);logo=logo.crop((0,top,logo.width,min(logo.height,top+round(logo.width/5.8))))
logo.thumbnail((230,42),Image.Resampling.NEAREST)
def scene(t,still=False):
    bg=background.convert('RGB')
    # The tree root stays anchored; only a tiny rigid sway is proposed here.
    tree=trees[0 if still else [0,1,0,0][int(t/.8)%4]]
    if not still:tree=tree.rotate(math.sin(t*.8)*.22,resample=Image.Resampling.NEAREST,center=(56,359))
    bg.paste(tree,(-40,0),tree)
    d=ImageDraw.Draw(bg,'RGBA')
    for i,(x,y) in enumerate([(300,240),(588,240)]):
        q=0 if still else math.sin(t*7+i*2)
        # Sparse, hard-edged reflected glints, with no full-scene lighting pulse.
        d.rectangle((x-12,y-4,x+12,y+3),fill=(176,97,40,28+round(q*4)))
        for k in range(3):d.rectangle((x-13+k*4,y+39+k*4,x+10-k*3,y+39+k*4),fill=(168,104,54,22+round(q*4)))
        flame=fires[0 if still else (int(t/.12)+i*2)%4];bg.paste(flame,(x-24,y-44),flame)
        if not still:
            for k in range(3):
                life=(t*.38+k*.37+i*.21)%1
                if life>.62:continue
                xx=round(x+math.sin(life*6+i+k)*5+life*6);yy=round(y-9-life*48)
                d.point((xx,yy),fill=(219,142,65,round((1-life/.62)*170)))
    # Intermittent leaves: a short breeze followed by a quiet interval.
    if not still and t%6<2.1:
        for i in range(3):
            age=(t%6)-i*.32
            if age<0:continue
            x=round(90+age*70+i*16);y=round(26+age*40+i*12+math.sin(age*3+i)*5)
            d.rectangle((x,y,x+2,y+1),fill=(91,66,47,180));d.point((x+1,y-1),fill=(112,80,54,160))
    actor=heroes[0 if still else [0,1,2,1][int(t/.6)%4]];bg.paste(actor,(386,238),actor)
    # UI stays independent, still and high contrast; no invented save data.
    d=ImageDraw.Draw(bg,'RGBA');d.rectangle((20,52,274,271),fill=(4,7,13,88))
    bg.paste(logo,(25,65),logo);d.text((83,112),'살아서 내려와라.',font=font(9),fill='#a8adb7')
    d.line((30,136,260,136),fill='#535160',width=1)
    d.rectangle((37,150,258,179),fill=(24,26,34,190),outline='#a48c61');d.rectangle((39,152,256,177),outline='#554c40')
    d.text((49,155),'◆ 계속 탐험',font=font(12),fill='#d5c6a7')
    for label,y in [('새로운 원정',191),('기록실',224),('설정',253)]:d.text((51,y),label,font=font(11),fill='#b8b8ba')
    d.line((38,285,257,285),fill='#535160');d.text((42,300),'명예의 전당   ·   전투 훈련',font=font(8),fill='#999ba3')
    return bg.convert('RGB')
still=scene(0,True);still.resize((1280,720),Image.Resampling.NEAREST).save(ROOT/'main-menu-still.png')
frames=[scene(i/10) for i in range(60)]
# One shared GIF palette avoids per-frame palette flicker.
pal=frames[0].quantize(colors=255)
gif=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
gif[0].save(ROOT/'motion-preview.gif',save_all=True,append_images=gif[1:],duration=100,loop=0,optimize=True,disposal=1)
decoded=Image.open(ROOT/'motion-preview.gif');motion_contact=Image.new('RGB',(1920,360))
for slot,index in enumerate([0,20,40]):
    decoded.seek(index);motion_contact.paste(decoded.convert('RGB'),(slot*640,0))
motion_contact.save(ROOT/'motion-contact.png')
(ROOT/'motion-metadata.json').write_text(json.dumps({'size':decoded.size,'frames':decoded.n_frames,'durationMsPerFrame':100,'loop':0,'bytes':(ROOT/'motion-preview.gif').stat().st_size,'kind':'Static GIF decode/file inspection; no game execution'},indent=2),encoding='utf-8')
contact=Image.new('RGBA',(640,160),'#151b27')
for i,f in enumerate(heroes):contact.alpha_composite(f,(i*100,20))
for i,f in enumerate(fires):contact.alpha_composite(f,(320+i*55,75))
contact.convert('RGB').save(ROOT/'asset-contact.png')
manifest={'status':'review-only; runtime untouched','tool':'builtin imagegen','calls':3,'nativeScene':[640,360],'preview':[1280,720],'gifNative':[640,360],
 'sources':[{ 'file':name,'sha256':hashlib.sha256((ROOT/name).read_bytes()).hexdigest()} for name in ['user-tone-reference.jpg','background-source.png','hero-source.png','effects-source.png']],
 'hero':{'cells':[724,724],'boxes':hero_boxes,'sourceRootX':370,'nativePivot':[48,104],'commonScale':hero_scale},
 'effects':{'boxes':boxes,'fireScale':.15,'treeScale':.70,'coreAlphaThreshold':192},
 'motion':{'duration':6,'fps':10,'heroStep':.6,'flameStep':.12,'treeRotationDegrees':.22,'embersPerBrazierMax':3,'leavesMax':3,'leavesWindowSeconds':2.1,'stillOption':True},
 'limitations':['Design composition, not game QA or runtime integration.','Manual placement/roots; tree rigid sway and sparse leaf/ember motion are proposed timing.','Flame glow is removed from opaque art; reflected light uses independent tiny pixel patches.','Logical background quantized96/hero31/fire15/tree23 colors; full UI preview/GIF not a 48-color production atlas.']}
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'frames':60,'heroSourceBoxes':hero_boxes,'nativeFiles':10}))
