from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,math,hashlib
R=Path(__file__).resolve().parent;N=R/'native';N.mkdir(exist_ok=True)
NEAR=Image.Resampling.NEAREST
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',n)
def palette(frames,colors):
 a=Image.new('RGB',(frames[0].width*len(frames),frames[0].height))
 for i,f in enumerate(frames):a.paste(f.convert('RGB'),(i*f.width,0))
 p=a.quantize(colors=colors,dither=Image.Dither.NONE);out=[]
 for f in frames:
  q=f.convert('RGB').quantize(palette=p,dither=Image.Dither.NONE).convert('RGBA');q.putalpha(f.getchannel('A'));out.append(Image.alpha_composite(Image.new('RGBA',q.size),q))
 return out
hero=Image.open(R/'hero-source.png').convert('RGBA')
# Generated frame3 extends past the nominal grid; frame4 is safely separated at x576.
boxes=[(0,0,512,512),(512,0,1024,512),(1024,0,1536,512),(0,512,576,1024),(576,512,1024,1024),(1024,512,1536,1024)]
anchors=[250,250,250,250,186,250];bodies=[];bounds=[];scale=80/434
for box,anchor in zip(boxes,anchors):
 c=hero.crop(box);c.putalpha(c.getchannel('A').point(lambda a:255 if a>=220 else 0));b=c.getbbox();bounds.append(b)
 body=c.crop(b);body=body.resize((round(body.width*scale),round(body.height*scale)),NEAR)
 f=Image.new('RGBA',(144,128));f.paste(body,(64+round((b[0]-anchor)*scale),112-body.height));bodies.append(f)
bodies=palette(bodies,47)
fxsrc=Image.open(R/'fx-source.png').convert('RGBA');effects=[]
for i in range(6):
 f=fxsrc.crop((i%3*512,i//3*512,i%3*512+512,i//3*512+512))
 f.putalpha(f.getchannel('A').point(lambda a:255 if a>=220 else 0));effects.append(f.resize((96,96),NEAR))
effects=palette(effects,23)
for family,frames in [('hero',bodies),('fx',effects)]:
 for i,f in enumerate(frames):f.save(N/f'{family}-{i}.png')
def faded(im,alpha):
 out=im.copy();out.putalpha(out.getchannel('A').point(lambda a:round(a*alpha)));return out
def actor(bg,pose,x,feet,alpha=1):
 f=bodies[pose];f=f.resize((round(f.width*.8),round(f.height*.8)),NEAR)
 if alpha<1:f=faded(f,alpha)
 bg.paste(f,(round(x-64*.8),round(feet-112*.8)),f)
def fx(bg,index,x,y,alpha=1):
 f=effects[index]
 if alpha<1:f=faded(f,alpha)
 bg.paste(f,(round(x-48),round(y-48)),f)
def scene(t):
 bg=Image.new('RGB',(640,360),'#0b111a');d=ImageDraw.Draw(bg,'RGBA')
 for rank in range(1,4):
  top=(rank-1)*120;feet=top+110
  d.rectangle((10,top+4,629,top+116),fill=(18,26,37,255),outline=(51,62,76,255))
  d.text((20,top+12),f'{rank}단계 · {rank}회',font=font(11),fill='#d5c7ab')
  d.line((114,feet+2,608,feet+2),fill='#34404b')
  starts=[.45+k*.34 for k in range(rank)];x=150;pose=0;active=None;used=0
  for k,start in enumerate(starts):
   age=t-start
   if age>=.04:used+=1
   if age>=.16:x+=104;pose=5
   elif age>=0:
    active=(k,age);pose=1 if age<.04 else 2 if age<.10 else 3
    x+=104*max(0,min(1,(age-.04)/.12));break
  # Short recovery is visual-only; it never represents an input lock in this mock-up.
  last=max((start for start in starts if t>=start),default=None)
  if active is None and last is not None:
   age=t-last;pose=4 if age<.23 else 5 if age<.34 else 0
  for k in range(rank):
   cx=552+k*22;remaining=k>=used
   d.polygon([(cx,top+15),(cx+6,top+21),(cx,top+27),(cx-6,top+21)],fill='#e8d39b' if remaining else '#27323d',outline='#8b7b59')
  d.text((20,top+88),'연속 입력 시연',font=font(8),fill='#8593a2')
  if active:
   k,age=active
   if .04<=age<.16:
    actor(bg,pose,x-23,feet,.18);actor(bg,pose,x-11,feet,.32)
    fx(bg,1,x-8,feet-33,.8)
  actor(bg,pose,x,feet)
  if active:
   k,age=active
   if age<.04:fx(bg,0,x+11,feet-30,.7)
   if .07<=age<.16:
    fx(bg,2 if k%2==0 else 3,x+27,feet-40)
    if .10<=age<.15:fx(bg,4,x+43,feet-39,.85)
  if last is not None and .16<=t-last<.29:fx(bg,5,x+28,feet-40,max(0,1-(t-last-.16)/.13))
 return bg
frames=[scene(i/25) for i in range(75)]
sample=Image.new('RGB',(1280,720))
for i,j in enumerate([14,22,31,50]):sample.paste(frames[j],(i%2*640,i//2*360))
p=sample.quantize(colors=255,dither=Image.Dither.NONE)
gifs=[f.quantize(palette=p,dither=Image.Dither.NONE) for f in frames]
gifs[0].save(R/'motion-preview.gif',save_all=True,append_images=gifs[1:],duration=40,loop=0,disposal=1,optimize=True)
scene(.56).resize((1280,720),NEAR).save(R/'main-still.png')
contact=Image.new('RGB',(144*6,160),'#111a26');dc=ImageDraw.Draw(contact)
for i,(f,label) in enumerate(zip(bodies,['준비','몸 낮추기','발도 돌입','큰 베기','착지','납도'])):
 contact.paste(f,(i*144,0),f);dc.text((i*144+12,136),label,font=font(11),fill='#d5c7ab')
contact.save(R/'actor-contact.png')
contact=Image.new('RGB',(96*6,112),'#111a26');dc=ImageDraw.Draw(contact)
for i,(f,label) in enumerate(zip(effects,['칼빛','속도선','상향 참격','하향 참격','적중 섬광','소멸'])):
 contact.paste(f,(i*96,0),f);dc.text((i*96+8,96),label,font=font(9),fill='#d5c7ab')
contact.save(R/'fx-contact.png');sample.save(R/'motion-contact.png')
assets=[]
for f in sorted(N.glob('*.png')):
 im=Image.open(f);b=im.getchannel('A').getbbox();assert b[0]>0 and b[1]>0 and b[2]<im.width and b[3]<im.height,(f,b)
 assets.append({'file':'native/'+f.name,'size':im.size,'alphaBounds':b,'paletteMax':48 if f.name.startswith('hero') else 24,'status':'review-only','technical_checks_passed':True,'sourceTool':'builtin image_gen; deterministic normalization'})
manifest={'status':'review-only; no runtime integration','sourceTool':'builtin image_gen','generatedCalls':2,'sources':[{'file':f,'sha256':hashlib.sha256((R/f).read_bytes()).hexdigest()} for f in ['hero-source.png','fx-source.png']],'hero':{'sourceBoxes':boxes,'sourceBounds':bounds,'sourceAnchorsX':anchors,'scale':scale,'pivot':[64,112],'native':[144,128],'paletteColors':47},'effects':{'grid':[3,2],'native':[96,96],'paletteColors':23,'alphaThreshold':220},'preview':{'size':[640,360],'frames':75,'fps':25,'seconds':3,'perDashSeconds':.12,'inputGapSeconds':.34,'scriptedInputNotAutomaticCombo':True},'nativeAssets':assets,'limitations':['Single facing pose proposal; mirrored/vertical directions and actual input/collision not implemented.','Local spark is effect demonstration, not verified combat impact or damage.','Charge UI demonstrates consumption only; recharge mechanics and timing not implemented.','No game tests, browser QA, push or deployment.']}
(R/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
g=Image.open(R/'motion-preview.gif');ms=0
for i in range(g.n_frames):g.seek(i);ms+=g.info.get('duration',0)
(R/'motion-metadata.json').write_text(json.dumps({'frames':g.n_frames,'durationMs':ms,'size':g.size},indent=2),encoding='utf-8')
manifest['preview']['encodedFrames']=g.n_frames
manifest['preview']['encodedDurationMs']=ms
manifest['preview']['encoding']='Identical frames coalesced with their display durations preserved.'
(R/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'sprites':len(assets),'gifFrames':g.n_frames,'durationMs':ms}))
