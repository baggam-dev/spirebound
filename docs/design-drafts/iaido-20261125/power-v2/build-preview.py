from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math,json,hashlib
R=Path(__file__).resolve().parent;BASE=R.parent;NEAR=Image.Resampling.NEAREST
heroes=[Image.open(BASE/f'native/hero-{i}.png').convert('RGBA') for i in range(6)]
effects=[Image.open(BASE/f'native/fx-{i}.png').convert('RGBA') for i in range(6)]
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',n)
def faded(im,alpha):
 out=im.copy();out.putalpha(out.getchannel('A').point(lambda a:round(a*max(0,min(1,alpha)))));return out
def actor(bg,pose,x,feet,alpha=1):
 f=heroes[pose].resize((115,102),NEAR)
 if alpha<1:f=faded(f,alpha)
 bg.paste(f,(round(x-51.2),round(feet-89.6)),f)
def fx(bg,index,x,y,size,alpha=1):
 f=effects[index].resize(size,NEAR)
 if alpha<1:f=faded(f,alpha)
 bg.paste(f,(round(x-size[0]/2),round(y-size[1]/2)),f)
def scene(t):
 bg=Image.new('RGB',(640,360),'#0b111a');d=ImageDraw.Draw(bg,'RGBA')
 for rank in range(1,4):
  top=(rank-1)*120;feet=top+110
  lane=Image.new('RGB',(640,120),'#121a25');ld=ImageDraw.Draw(lane,'RGBA')
  ld.rectangle((10,4,629,116),outline='#333e4c');ld.text((20,12),f'{rank}단계 · {rank}회',font=font(11),fill='#d5c7ab')
  ld.line((114,112,608,112),fill='#34404b');ld.text((20,88),'고속 발도 · 긴 잔상',font=font(8),fill='#8593a2')
  starts=[.45+k*.26 for k in range(rank)];used=sum(t>=start+.02 for start in starts)
  for k in range(rank):
   cx=552+k*22;ld.polygon([(cx,15),(cx+6,21),(cx,27),(cx-6,21)],fill='#e8d39b' if k>=used else '#27323d',outline='#8b7b59')
  # A ghost is a past pose at a past world position, not an offset copy following the actor.
  for k,start in enumerate(starts):
   for sample in [.02,.036,.052,.068,.084]:
    age=t-start-sample
    if 0<=age<.24:
     x=150+k*104+104*(sample-.02)/.08
     actor(lane,2 if sample<.06 else 3,x,110,.46*(1-age/.24)**1.3)
  x=150;pose=0
  for k,start in enumerate(starts):
   age=t-start
   if age>=.1:x+=104;pose=4 if age<.16 else 5 if age<.22 else 0
   elif age>=0:
    x+=104*max(0,min(1,(age-.02)/.08));pose=1 if age<.02 else 2 if age<.06 else 3;break
  actor(lane,pose,x,110)
  for k,start in enumerate(starts):
   age=t-start;base=150+k*104
   if 0<=age<.04:fx(lane,0,base+13,76,(72,72),.9*(1-age/.04))
   if .02<=age<.13:fx(lane,1,base+53,76,(204,44),.72*(1-(age-.02)/.15))
   if .04<=age<.2:
    q=(age-.04)/.16;cut=2 if k%2==0 else 3
    # Broad primary cut and delayed smaller echo; keep all flashes local to the cut.
    fx(lane,cut,base+103,62,(160,136),1 if q<.4 else (1-q)/.6)
    if age>=.065:fx(lane,3 if cut==2 else 2,base+87,66,(125,106),.32*(1-q))
   if .075<=age<.145:
    q=(age-.075)/.07;fx(lane,4,base+143,65,(100,100),(1-q)*.95)
   if .1<=age<.3:
    q=(age-.1)/.2
    fx(lane,5,base+120+q*18,63,(142,116),.8*(1-q))
    fx(lane,4,base+150+q*35,64-q*20,(35,35),.5*(1-q))
  bg.paste(lane,(0,top))
 return bg
frames=[scene(i/50) for i in range(150)]
contact=Image.new('RGB',(1280,720))
for i,j in enumerate([27,41,54,70]):contact.paste(frames[j],(i%2*640,i//2*360))
pal=contact.quantize(colors=255,dither=Image.Dither.NONE)
gifs=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
gifs[0].save(R/'motion-preview.gif',save_all=True,append_images=gifs[1:],duration=20,loop=0,disposal=1,optimize=True)
scene(.54).resize((1280,720),NEAR).save(R/'main-still.png');contact.save(R/'motion-contact.png')
compare=Image.new('RGB',(1280,720))
old=Image.open(BASE/'main-still.png').convert('RGB').resize((640,360),NEAR)
compare.paste(old,(0,180));compare.paste(scene(.54),(640,180))
d=ImageDraw.Draw(compare);d.text((35,130),'이전 · 0.12초',font=font(20),fill='#b6bdc8');d.text((675,130),'수정 · 0.08초 / 큰 참격 / 잔상',font=font(20),fill='#d5c7ab');compare.save(R/'comparison.png')
g=Image.open(R/'motion-preview.gif');ms=0
for i in range(g.n_frames):g.seek(i);ms+=g.info.get('duration',0)
assert ms==3000
manifest={'status':'review-only; runtime unchanged','newImageGenerationCalls':0,'source':'../native/hero0..5 and fx0..5 unchanged','sourceSha256':[{'file':'../native/'+f.name,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted((BASE/'native').glob('*.png'))],'changes':{'dashSeconds':.08,'previousDashSeconds':.12,'speedMultiplierSameDistance':1.5,'primarySlashSize':[160,136],'previousSlashSize':[96,96],'echoSlashSize':[125,106],'ghostSamples':5,'ghostLifeSeconds':.24,'ghostInitialAlpha':.46,'inputDemoGapSeconds':.26,'impactSparkSize':[100,100],'fullScreenFlash':False},'preview':{'size':[640,360],'sourceFrames':150,'fpsGrid':50,'encodedFrames':g.n_frames,'durationMs':ms,'gifBytes':(R/'motion-preview.gif').stat().st_size},'limitations':['Time-sampled fixed ghosts and layered pixel FX are an offline composition proposal.','Charges consume on separate scripted inputs; recharge, damage, immunity, collision and audio not implemented.','No new raster source or runtime assets; no game/browser tests, push or deploy.']}
(R/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(manifest['preview']))
