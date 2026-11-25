from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,math,hashlib
R=Path(__file__).resolve().parent;N=R/'native';N.mkdir(exist_ok=True)
NEAR=Image.Resampling.NEAREST;font=lambda n:ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',n)
paragraphs=[['왕국에는,','밤이 끝나지 않는 탑이 있었다.','','문을 지난 이들은','돌아오지 않았다.'],['돌아오지 않은 이들을 찾아','원정대가 떠났다.','','그러나 그들마저','소식을 끊었다.'],['당신은 그들의 마지막 흔적을','추적하라는 명을 받은 정찰병이다.','','활 하나와 남겨진 표식을 따라,','탑으로 향했다.'],['누가 아직 살아 있는지.','무엇이 귀환을 막고 있는지.','','답은 저 문 너머에 있었다.']]
titles=['밤에 잠긴 왕국','끊긴 원정대의 흔적','정찰병의 임무','탑 앞에 도착하다']
lines=[];offsets=[];offset=0
for paragraph in paragraphs:
 offsets.append(offset)
 for i,line in enumerate(paragraph):lines.append((line,offset+i*24))
 offset+=len(paragraph)*24+32
total=offset-32;speed=(320+total-45)/28
centers=[(320+off+len(p)*12-180)/speed for off,p in zip(offsets,paragraphs)]
switches=[(a+b)/2 for a,b in zip(centers,centers[1:])]
story={'status':'wording proposal; not runtime story data','paragraphs':paragraphs,'paragraphTitles':titles,'storySeconds':28,'entranceExcerptSeconds':2,'scrollPixelsPerSecond':speed,'lineHeight':24,'fontSize':14,'textAnchorX':52,'textWindow':[45,318],'backgroundSwitchSeconds':switches,'crossfadeSeconds':.8}
(R/'story.json').write_text(json.dumps(story,ensure_ascii=False,indent=2),encoding='utf-8')
(R/'narration.txt').write_text('\n\n'.join('\n'.join(p) for p in paragraphs)+'\n',encoding='utf-8')
source=Image.open(R/'background-source.png').convert('RGB');backgrounds=[];boxes=[]
for i in range(4):
 box=(round(i%2*source.width/2),round(i//2*source.height/2),round((i%2+1)*source.width/2),round((i//2+1)*source.height/2));boxes.append(box);backgrounds.append(source.crop(box).resize((640,360),NEAR))
atlas=Image.new('RGB',(1280,720))
for i,b in enumerate(backgrounds):atlas.paste(b,(i%2*640,i//2*360))
palette=atlas.quantize(colors=96,dither=Image.Dither.NONE)
backgrounds=[im.quantize(palette=palette,dither=Image.Dither.NONE).convert('RGB') for im in backgrounds]
for i,im in enumerate(backgrounds):im.save(N/f'background-{i}.png')
def shade(im):
 im=Image.blend(im,Image.new('RGB',im.size,'#080d16'),.1);d=ImageDraw.Draw(im,'RGBA')
 for x in range(470):d.line((x,0,x,359),fill=(4,8,14,round(135*(1-x/470)**.55)))
 for y in range(35):
  alpha=round(100*(1-y/35));d.line((0,y,639,y),fill=(4,8,14,alpha));d.line((0,359-y,639,359-y),fill=(4,8,14,alpha))
 return im
shaded=[shade(im.copy()) for im in backgrounds]
def scene(t):
 if t>=28:
  index=min(23,2+int((t-28)*10));entrance.seek(index);im=entrance.convert('RGB').resize((640,360),NEAR)
  if t<28.7:im=Image.blend(shaded[3],im,(t-28)/.7)
  if t>29.7:im=Image.blend(im,Image.new('RGB',im.size,'#080d16'),(t-29.7)/.3)
  return im
 index=sum(t>=at for at in switches);im=shaded[index].copy()
 for i,at in enumerate(switches):
  if at-.4<=t<at+.4:
   q=(t-at+.4)/.8;q=q*q*(3-2*q);im=Image.blend(shaded[i],shaded[i+1],q);break
 d=ImageDraw.Draw(im,'RGBA');y0=320-t*speed
 for line,off in lines:
  y=y0+off
  if not line or y<25 or y>318:continue
  fade=min(1,max(0,(y-25)/20),max(0,(318-y)/20));alpha=round(fade*255)
  d.text((52,round(y)),line,font=font(14),fill=(235,225,202,alpha),stroke_width=1,stroke_fill=(3,7,12,round(alpha*.85)))
 if t<.5:im=Image.blend(Image.new('RGB',im.size,'#080d16'),im,t/.5)
 return im
entrancePath=R.parent/'entrance-night-20261125/motion-preview.gif';entrance=Image.open(entrancePath)
frames=[scene(i/10) for i in range(300)]
contact=Image.new('RGB',(1280,720))
samples=[4.5,11.5,17,23]
for i,t in enumerate(samples):contact.paste(scene(t),(i%2*640,i//2*360))
contact.save(R/'motion-contact.png')
pal=contact.quantize(colors=255,dither=Image.Dither.NONE)
gifs=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
gifs[0].save(R/'motion-preview.gif',save_all=True,append_images=gifs[1:],duration=100,loop=0,disposal=1,optimize=True)
board=Image.new('RGB',(1280,720))
for i,(im,paragraph,title) in enumerate(zip(shaded,paragraphs,titles)):
 panel=im.copy();d=ImageDraw.Draw(panel,'RGBA');d.text((25,25),title,font=font(12),fill='#c4a977')
 for j,line in enumerate(paragraph):d.text((40,120+j*25),line,font=font(14),fill='#ebe1ca',stroke_width=1,stroke_fill='#03070c')
 board.paste(panel,(i%2*640,i//2*360))
board.save(R/'storyboard.png');scene(17).resize((1280,720),NEAR).save(R/'main-still.png')
gif=Image.open(R/'motion-preview.gif');duration=0
for i in range(gif.n_frames):gif.seek(i);duration+=gif.info.get('duration',0)
assert duration==30000
manifest={'status':'review-only; runtime unchanged','imageGenerationCalls':1,'source':{'file':'background-source.png','size':source.size,'sha256':hashlib.sha256((R/'background-source.png').read_bytes()).hexdigest()},'backgrounds':[{'file':f'native/background-{i}.png','sourceBox':boxes[i],'native':[640,360],'paletteMax':96,'technical_checks_passed':True,'approval':'pending'} for i in range(4)],'story':story,'entranceExcerpt':{'source':'../entrance-night-20261125/motion-preview.gif','sha256':hashlib.sha256(entrancePath.read_bytes()).hexdigest(),'sourceSeconds':[.2,2.2],'crossfadeSeconds':.7,'notFullEntrance':True},'preview':{'size':[640,360],'sourceFrames':300,'fps':10,'encodedFrames':gif.n_frames,'durationMs':duration,'gifBytes':(R/'motion-preview.gif').stat().st_size},'limitations':['Background art and new narration wording are proposals, not canonical runtime data.','No voice recording or TTS; text narration only.','The two-second entrance excerpt demonstrates a cut, not full new-run integration.','No game tests, browser QA, push or deployment.']}
(R/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(manifest['preview']))
