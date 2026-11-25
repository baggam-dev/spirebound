from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math,json,hashlib
R=Path(__file__).resolve().parent;N=R/'native';N.mkdir(exist_ok=True)
NEAR=Image.Resampling.NEAREST;font=lambda n:ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',n)
scale=64/290;records=[];raw=[]
for family in ['warrior','archer']:
 im=Image.open(R/f'{family}-source.png').convert('RGBA');frames=[]
 for i in range(8):
  box=(i%4*384,i//4*512,(i%4+1)*384,(i//4+1)*512);anchor=192
  if family=='warrior' and i==4:box=(0,512,408,1024)
  if family=='warrior' and i==5:box=(408,512,768,1024);anchor=168
  if family=='warrior' and i==7:box=(1152,780,1536,1024)
  c=im.crop(box)
  if family=='warrior' and i==6:
   c=Image.new('RGBA',(432,512));c.paste(im.crop((768,512,1152,1024)),(0,0));c.paste(im.crop((1152,512,1200,780)),(384,0))
  c.putalpha(c.getchannel('A').point(lambda a:255 if a>=220 else 0));b=c.getbbox();body=c.crop(b).resize((round((b[2]-b[0])*scale),round((b[3]-b[1])*scale)),NEAR)
  f=Image.new('RGBA',(144,128));f.paste(body,(64+round((b[0]-anchor)*scale),112-body.height));frames.append(f)
  records.append({'family':family,'frame':i,'sourceBox':box,'bounds':b,'anchorX':anchor,'extraRegion':(1152,512,1200,780) if family=='warrior' and i==6 else None})
 raw.extend(frames)
def quantize(frames,colors):
 atlas=Image.new('RGB',(frames[0].width*len(frames),frames[0].height))
 for i,f in enumerate(frames):atlas.paste(f.convert('RGB'),(i*f.width,0))
 palette=atlas.quantize(colors=colors,dither=Image.Dither.NONE);out=[]
 for f in frames:
  q=f.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');q.putalpha(f.getchannel('A'));out.append(Image.alpha_composite(Image.new('RGBA',q.size),q))
 return out
raw=quantize(raw,47);actors={'warrior':raw[:8],'archer':raw[8:]}
for name,frames in actors.items():
 for i,f in enumerate(frames):f.save(N/f'{name}-{i}.png')
im=Image.open(R/'fx-source.png').convert('RGBA');effects=[]
for i in range(6):
 c=im.crop((i%3*512,i//3*512,i%3*512+512,i//3*512+512));c.putalpha(c.getchannel('A').point(lambda a:255 if a>=220 else 0));c=c.resize((88,88),NEAR);f=Image.new('RGBA',(96,96));f.paste(c,(4,4));effects.append(f)
effects=quantize(effects,31)
for i,f in enumerate(effects):f.save(N/f'fx-{i}.png')
def effect(bg,i,x,y,alpha=1,size=96,angle=0):
 f=effects[i].resize((size,size),NEAR)
 if angle:f=f.rotate(-angle*180/math.pi,resample=NEAR,expand=True)
 if alpha<1:f=f.copy();f.putalpha(f.getchannel('A').point(lambda a:round(a*max(0,alpha))))
 bg.paste(f,(round(x-f.width/2),round(y-f.height/2)),f)
def actor(bg,family,index,x,feet,elite=False,t=0):
 if elite:effect(bg,2,x,feet-10,.85);effect(bg,3,x,feet-37,.45+.12*math.sin(t*5))
 f=actors[family][index];bg.paste(f,(round(x-64),round(feet-112)),f)
def base():
 bg=Image.new('RGB',(640,360),'#0d141e');d=ImageDraw.Draw(bg);d.line((20,179,620,179),fill='#394252');return bg
def scene(t):
 bg=base();d=ImageDraw.Draw(bg,'RGBA');d.text((22,12),'해골 전사 · 일반 베기 / 대시 베기',font=font(12),fill='#d9c8a5');d.text((22,191),'해골 궁수 · 부채꼴 / 반사탄 / 일자 연사',font=font(12),fill='#d9c8a5')
 if t<.8:
  for y in [143,329]:effect(bg,0 if t<.4 else 1,216,y-11,min(1,t*2))
  return bg
 x=210;pose=0
 if t<1.8:x=210+(t-.8)*60;pose=1+int(t/.14)%2
 elif t<2.2:x=270;pose=3;d.line((278,116,334,116),fill='#e7af77',width=2)
 elif t<2.45:x=270;pose=4;effect(bg,4,x+30,110,max(0,1-(t-2.2)/.25),80)
 elif t<3:x=270
 elif t<3.4:x=270;pose=5;d.line((276,116,446,116),fill='#da8b6a',width=2);d.polygon([(446,116),(435,111),(435,121)],fill='#da8b6a')
 elif t<3.6:x=270+(t-3.4)/.2*140;pose=6;effect(bg,4,x+30,110,.75,76)
 elif t<4.7:x=410
 else:x=410;pose=7
 actor(bg,'warrior',pose,x,151,elite=True,t=t)
 x=210;pose=0;label='접근 / 거리 유지'
 if t<1.6:x=210+(t-.8)*50;pose=1+int(t/.14)%2
 elif t<2.1:x=250;pose=3;label='부채꼴 예고'
 elif t<2.35:x=250;pose=4;label='부채꼴'
 elif t<3.1:x=250
 elif t<3.5:x=250;pose=5;label='반사탄 예고'
 elif t<3.8:x=250;pose=4;label='반사탄'
 elif t<4.5:x=250
 elif t<4.9:x=250;pose=6;label='일자 연사 예고'
 elif t<5.3:x=250;pose=6;label='일자 3연사'
 else:x=250;pose=0
 actor(bg,'archer',pose,x,336,t=t);d.text((445,206),label,font=font(10),fill='#c9a8d5')
 if 1.6<=t<2.1:
  for a in [-.3,0,.3]:d.line((x+25,304,x+90*math.cos(a),304+90*math.sin(a)),fill='#d7bd91',width=1)
 for a in [-.3,0,.3]:
  age=t-2.1
  if 0<=age<1.3:effect(bg,5,280+age*170*math.cos(a),302+age*170*math.sin(a),size=40,angle=a)
 if 3.1<=t<3.5:d.line((280,304,565,304),fill='#bda7d8',width=1);d.line((565,304,525,280),fill='#bda7d8')
 age=t-3.5
 if 0<=age<1.3:
  travel=age*300;px=280+travel if travel<=285 else 565-(travel-285);effect(bg,5,px,302 if travel<=285 else 302-(travel-285)*.4,size=40,angle=0 if travel<=285 else -2.76)
 for i in range(3):
  age=t-4.9-i*.12
  if 0<=age<.9:effect(bg,5,280+age*300,303,size=40)
 return bg
frames=[scene(i/20) for i in range(120)];contact=Image.new('RGB',(1280,720))
for i,j in enumerate([20,43,69,102]):contact.paste(frames[j],(i%2*640,i//2*360))
pal=contact.quantize(colors=255,dither=Image.Dither.NONE);gifs=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
gifs[0].save(R/'motion-preview.gif',save_all=True,append_images=gifs[1:],duration=50,loop=0,disposal=1,optimize=True);contact.save(R/'motion-contact.png')
board=Image.new('RGB',(640,420),'#0d141e');d=ImageDraw.Draw(board)
for phase in range(1,4):
 top=(phase-1)*140;d.rectangle((8,top+5,631,top+135),outline='#394252');d.text((22,top+15),f'{phase}페이즈',font=font(13),fill='#d9c8a5')
 if phase==1:d.text((22,top+45),'5초마다 1체',font=font(10),fill='#b6bbc7');d.text((22,top+65),'전사 또는 궁수 · 정예',font=font(10),fill='#b6bbc7');actor(board,'warrior',0,355,top+120,True)
 if phase==2:d.text((22,top+45),'5초마다 2체',font=font(10),fill='#b6bbc7');d.text((22,top+65),'전사1 + 궁수1 · 정예1',font=font(10),fill='#b6bbc7');actor(board,'warrior',0,300,top+120,True);actor(board,'archer',0,425,top+120)
 if phase==3:
  d.text((22,top+45),'3초마다 4체',font=font(10),fill='#b6bbc7');d.text((22,top+65),'전사2 + 궁수2 · 정예1',font=font(10),fill='#b6bbc7')
  for i,(name,x) in enumerate([('warrior',265),('warrior',345),('archer',435),('archer',525)]):actor(board,name,0,x,top+120,i==2)
board.resize((1280,840),NEAR).save(R/'phase-board.png')
sheet=Image.new('RGB',(144*8,152*2),'#111a26');d=ImageDraw.Draw(sheet)
labels=[['대기','왼발','오른발','베기 예고','일반 베기','대시 예고','대시 베기','사망'],['대기','왼발','오른발','부채꼴 예고','발사','반사탄 예고','연사 자세','사망']]
for row,name in enumerate(['warrior','archer']):
 for i,f in enumerate(actors[name]):sheet.paste(f,(i*144,row*152),f);d.text((i*144+8,row*152+128),labels[row][i],font=font(10),fill='#d5c7ab')
sheet.save(R/'actor-contact.png')
sheet=Image.new('RGB',(96*6,115),'#111a26')
for i,f in enumerate(effects):sheet.paste(f,(i*96,0),f)
sheet.save(R/'fx-contact.png')
entries=[]
for p in sorted(N.glob('*.png')):
 im=Image.open(p);b=im.getchannel('A').getbbox();assert b[0]>0 and b[1]>0 and b[2]<im.width and b[3]<im.height,(p,b)
 entries.append({'file':'native/'+p.name,'size':im.size,'alphaBounds':b,'technical_checks_passed':True,'status':'review-only','sourceTool':'builtin image_gen plus deterministic slicing/palette/scale'})
gif=Image.open(R/'motion-preview.gif');ms=0
for i in range(gif.n_frames):gif.seek(i);ms+=gif.info.get('duration',0)
manifest={'status':'review-only; runtime unchanged','generatedCalls':5,'rejectedAlphaSources':['warrior-alpha-failed.png','warrior-alpha-retry-failed.png'],'sources':[{'file':f,'sha256':hashlib.sha256((R/f).read_bytes()).hexdigest()} for f in ['warrior-source.png','archer-source.png','fx-source.png']],'actorNative':[144,128],'actorPaletteColors':47,'scale':scale,'pivot':[64,112],'sourceRegions':records,'effectNative':[96,96],'effectPaletteColors':31,'effectInset':4,'alphaThreshold':220,'assets':entries,'preview':{'size':[640,360],'sourceFrames':120,'fps':20,'encodedFrames':gif.n_frames,'durationMs':ms},'limitations':['Two stride poses plus action key poses are a design proposal, not final AI animation blending.','Archer projectiles and warning lines are scripted demonstrations, not actual combat logic.','Phase composition board shows requested counts; caps, HP and spawn timing implementation pending.','No game tests, browser QA, push or deployment.']}
(R/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'nativeSprites':len(entries),'gifFrames':gif.n_frames,'gifMs':ms}))
