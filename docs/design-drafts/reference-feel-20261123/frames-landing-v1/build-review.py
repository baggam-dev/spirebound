"""Deterministic art-file normalization only; never imports game code."""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib,json
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[3]
source=Image.open(ROOT/'landing-source.png').convert('RGBA')
assert source.size==(1536,1024)
reference=Image.open(REPO/'assets/images/reference-hero-frames-v1.png').convert('RGBA')
colors=sorted({p[:3] for p in reference.getdata() if p[3]>192})
palette=Image.new('P',(1,1));flat=[n for rgb in colors for n in rgb]
palette.putpalette(flat+[0]*(768-len(flat)))
cells=[source.crop((i%3*512,i//3*512,(i%3+1)*512,(i//3+1)*512)) for i in range(6)]
boxes=[c.getchannel('A').point(lambda a:255 if a>192 else 0).getbbox() for c in cells]
# One common scale based on final upright body height, never enlarge a crouch.
scale=58/(boxes[5][3]-boxes[5][1])
roots=[252,260,262,264,262,262]
frames=[];entries=[]
(ROOT/'native').mkdir(exist_ok=True)
for i,(cell,bbox,root) in enumerate(zip(cells,boxes,roots)):
    assert bbox and min(bbox[0],bbox[1],512-bbox[2],512-bbox[3])>0
    crop=cell.crop(bbox);size=tuple(max(1,round(n*scale)) for n in crop.size)
    small=crop.resize(size,Image.Resampling.NEAREST)
    rgb=small.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA')
    alpha=small.getchannel('A').point(lambda a:255 if a>192 else 0)
    rgb.putalpha(alpha)
    rgb.putdata([p if p[3] else (0,0,0,0) for p in rgb.getdata()])
    native=Image.new('RGBA',(128,104))
    at=(64-round((root-bbox[0])*scale),90-size[1])
    assert at[0]>=0 and at[0]+size[0]<=128 and at[1]>=0
    native.alpha_composite(rgb,at);native.save(ROOT/f'native/landing-{i:02}.png');frames.append(native)
    entries.append({'frame':i,'sourceCell':[i%3*512,i//3*512,512,512],'coreBox':bbox,'sourceRoot':root,'paste':at,'pivot':[64,90],'scale':scale})
atlas=Image.new('RGBA',(384,208))
for i,f in enumerate(frames):atlas.alpha_composite(f,(i%3*128,i//3*104))
atlas.save(ROOT/'landing-review-atlas.png')
sheet=Image.new('RGB',(768,488),'#131b20');d=ImageDraw.Draw(sheet)
for i,f in enumerate(frames):
    x=i%3*256;y=i//3*244
    sheet.paste(f.resize((256,208),Image.Resampling.NEAREST),(x,y),f.resize((256,208),Image.Resampling.NEAREST))
    d.line((x+100,y+180,x+156,y+180),fill='#608b7b');d.text((x+12,y+215),f'{i}: pivot 64,90',fill='#dccb9c')
sheet.save(ROOT/'contact-2x.png')
sheet.resize((384,244),Image.Resampling.NEAREST).save(ROOT/'contact-1x.png')
idle=reference.crop((0,0,128,104))
comparison=Image.new('RGBA',(256,104),'#dcd7ce')
comparison.alpha_composite(frames[-1],(0,0));comparison.alpha_composite(idle,(128,0))
comparison.resize((768,312),Image.Resampling.NEAREST).convert('RGB').save(ROOT/'idle-comparison.png')
gifs=[]
for f in frames:
    bg=Image.new('RGBA',(128,104),'#131b20');bg.alpha_composite(f);gifs.append(bg.convert('RGB').resize((384,312),Image.Resampling.NEAREST))
gifs[0].save(ROOT/'landing.gif',save_all=True,append_images=gifs[1:],duration=[60,60,60,60,60,500],loop=0)
idlebg=Image.new('RGBA',(128,104),'#131b20');idlebg.alpha_composite(idle)
gifs[0].save(ROOT/'landing-to-idle.gif',save_all=True,append_images=gifs[1:]+[idlebg.convert('RGB').resize((384,312),Image.Resampling.NEAREST)],duration=[60]*6+[500],loop=0)
manifest={'status':'review-only; not integrated; not game-tested','source':'built-in imagegen; original archer reference owned by project','sourceSha256':hashlib.sha256((ROOT/'landing-source.png').read_bytes()).hexdigest(),'sourceAlphaExtrema':source.getchannel('A').getextrema(),'nativeSize':[128,104],'scale':scale,'palette':'existing reference-hero-frames-v1.png opaque palette','frames':entries,'previewTimingMs':[60,60,60,60,60,500],'limitations':['Timing is a review proposal, not game clock.','Manual source roots; no in-engine gait/volume validation.','No production atlas installed.']}
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'alpha':manifest['sourceAlphaExtrema'],'coreBoxes':boxes,'scale':scale}))
