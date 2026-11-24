from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math,json,hashlib
R=Path(__file__).resolve().parent
N=R/'native';N.mkdir(exist_ok=True)
NEAR=Image.Resampling.NEAREST
def normalize(frames,colors):
    atlas=Image.new('RGB',(frames[0].width*len(frames),frames[0].height))
    for i,f in enumerate(frames):atlas.paste(f.convert('RGB'),(i*f.width,0))
    palette=atlas.quantize(colors=colors,dither=Image.Dither.NONE)
    result=[]
    for f in frames:
        q=f.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA')
        q.putalpha(f.getchannel('A'));q=Image.alpha_composite(Image.new('RGBA',q.size),q);result.append(q)
    return result
sources=[]
for file in ['background-source.png','walk-source.png','actions-front-source.png']:
    p=R/file;im=Image.open(p);sources.append({'file':file,'size':im.size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
bg=Image.open(R/'background-source.png').convert('RGB')
backgrounds=[]
for i in range(4):
    box=(round(i%2*bg.width/2),round(i//2*bg.height/2),round((i%2+1)*bg.width/2),round((i//2+1)*bg.height/2))
    backgrounds.append(bg.crop(box).resize((640,360),NEAR))
allbg=Image.new('RGB',(1280,720))
for i,f in enumerate(backgrounds):allbg.paste(f,(i%2*640,i//2*360))
pal=allbg.quantize(colors=96,dither=Image.Dither.NONE)
backgrounds=[f.quantize(palette=pal,dither=Image.Dither.NONE).convert('RGB') for f in backgrounds]
for i,f in enumerate(backgrounds):f.save(N/f'background-{i}.png')
records=[];families={}
def actors(file,rows,indices,name,anchor):
    im=Image.open(R/file).convert('RGBA');out=[];bounds=[]
    for i in indices:
        box=(round(i%4*im.width/4),round(i//4*im.height/rows),round((i%4+1)*im.width/4),round((i//4+1)*im.height/rows))
        c=im.crop(box);c.putalpha(c.getchannel('A').point(lambda a:255 if a>=192 else 0));bounds.append(c.getbbox());out.append(c)
    factor=96/max(b[3]-b[1] for b in bounds)
    result=[]
    for c,b in zip(out,bounds):
        body=c.crop(b);body=body.resize((round(body.width*factor),round(body.height*factor)),NEAR)
        f=Image.new('RGBA',(128,128));f.paste(body,(64+round((b[0]-anchor)*factor),120-body.height));result.append(f)
    result=normalize(result,47)
    for j,f in enumerate(result):f.save(N/f'{name}-{j}.png')
    records.append({'family':name,'source':file,'grid':[4,rows],'indices':list(indices),'alphaThreshold':192,'sourceBounds':bounds,'scale':factor,'sourceAnchorX':anchor,'pivot':[64,120],'native':[128,128],'colorsMax':48})
    families[name]=result
actors('walk-source.png',2,range(8),'rear',235)
actors('actions-front-source.png',3,range(4),'pause',183)
actors('actions-front-source.png',3,range(4,12),'front',160)
fireRoot=R.parent/'title-night-pixel-20261124/native'
fires=[Image.open(fireRoot/f'fire-{i}.png').convert('RGBA') for i in range(4)]
anchors=[[(239,195),(396,195)],[(153,184),(603,263)],[(48,173),(151,190),(489,190),(588,173)],[(48,173),(151,190),(489,190),(588,173)]]
def lerp(a,b,q):return a+(b-a)*q
def ease(q):return q*q*(3-2*q)
def paste_actor(bg,name,frame,x,feet,height):
    f=families[name][frame];s=height/96
    f=f.resize((round(128*s),round(128*s)),NEAR)
    ImageDraw.Draw(bg,'RGBA').ellipse((x-height*.15,feet-2,x+height*.15,feet+3),fill=(1,3,8,120))
    bg.paste(f,(round(x-64*s),round(feet-120*s)),f)
def scene(t):
    if t<2.4:phase=0
    elif t<3.8:phase=1
    elif t<6.4:phase=2
    else:phase=3
    bg=backgrounds[phase].copy();d=ImageDraw.Draw(bg,'RGBA')
    for i,(x,y) in enumerate(anchors[phase]):
        size=25 if phase==0 else 31 if phase==1 else 26
        f=fires[(int(t/.12)+i)%4].resize((size,size),NEAR)
        bg.paste(f,(x-size//2,y-round(size*.9)),f)
        for k in range(2):
            age=(t*.4+k*.43+i*.17)%1
            if age<.65:d.point((round(x+math.sin(age*7+i)*3),round(y-7-age*30)),fill=(231,159,76,round((1-age/.65)*160)))
    if phase==0:
        q=t/2.4;paste_actor(bg,'rear',int(t/.1)%8,lerp(267,319,q),lerp(345,307,q),lerp(102,94,q))
    elif phase==1:
        a=t-2.4;frame=0 if a<.25 else 1 if a<.55 else 2 if a<1.05 else 3
        paste_actor(bg,'pause',frame,292,338,120)
    elif phase==2:
        a=t-3.8;q=min(a/2.4,1);paste_actor(bg,'front',int(a/.1)%8,320,lerp(306,479,q),lerp(103,138,q))
    # Closed-door panel is a review endpoint cut; not a simulated physical hinge animation.
    if 6.4<=t<6.6:
        bg=Image.blend(backgrounds[2],bg,(t-6.4)/.2)
    if t<.2:bg=Image.blend(Image.new('RGB',bg.size,'#080d16'),bg,t/.2)
    if t>7.6:bg=Image.blend(bg,Image.new('RGB',bg.size,'#080d16'),min((t-7.6)/.4,1))
    return bg
frames=[scene(i/10) for i in range(80)]
paletteBoard=Image.new('RGB',(1280,720))
for i,j in enumerate([10,30,42,70]):paletteBoard.paste(frames[j],(i%2*640,i//2*360))
palette=paletteBoard.quantize(colors=255,dither=Image.Dither.NONE)
gifs=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
gifs[0].save(R/'motion-preview.gif',save_all=True,append_images=gifs[1:],duration=100,loop=0,disposal=1,optimize=True)
board=Image.new('RGB',(1280,720))
for i,j in enumerate([10,30,42,70]):board.paste(frames[j],(i%2*640,i//2*360))
board.save(R/'storyboard.png')
sheet=Image.new('RGB',(128*8,128*3),'#101722')
for row,name in enumerate(['rear','pause','front']):
    for col,f in enumerate(families[name]):sheet.paste(f,(col*128,row*128),f)
sheet.save(R/'actor-contact.png')
manifest={'status':'review-only; runtime unchanged','sourceTool':'builtin image_gen','generationCalls':4,'layoutStudyRejected':'background-layout-study.png has portrait panels; preserved as diagnostic only','sources':sources,'nativeBackground':[640,360],'backgroundPaletteMax':96,'actors':records,'fireSource':'../title-night-pixel-20261124/native/fire-0..3.png','preview':{'size':[640,360],'frames':80,'fps':10,'seconds':8,'gifBytes':(R/'motion-preview.gif').stat().st_size},'timing':{'approach':[0,2.4],'pause':[2.4,3.8],'frontEntry':[3.8,6.4],'closedEndpoint':[6.4,8]},'limitations':['Animation pose proposal, not runtime integration or mobile performance proof.','Foot-root normalization and common scale; hand/bow and exact contact need final frame QA.','Closed panel is an endpoint cut, not a replacement for existing hinged door implementation.','No game tests, browser QA, push or deployment.']}
(R/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
gif=Image.open(R/'motion-preview.gif');ms=0
for i in range(gif.n_frames):gif.seek(i);ms+=gif.info.get('duration',0)
(R/'motion-metadata.json').write_text(json.dumps({'size':gif.size,'frames':gif.n_frames,'durationMs':ms},indent=2),encoding='utf-8')
print(json.dumps({'actors':20,'backgrounds':4,'gifFrames':gif.n_frames,'gifMs':ms}))
