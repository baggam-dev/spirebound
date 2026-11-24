"""Art-only deterministic normalization. Does not import or run game modules."""
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,json
ROOT=Path(__file__).resolve().parent
(ROOT/'native').mkdir(exist_ok=True)
families=[('phase2','phase2-source.png',92.4,[240,250,275,245,255,290]),
          ('phase3','phase3-padding-v2.png',104,[270,270,275,260,270,290]),
          ('fx','fx-source.png',None,[256]*6)]
all_frames={};records=[]
for name,file,height,roots in families:
    source=Image.open(ROOT/file).convert('RGBA');assert source.size==(1536,1024)
    assert source.getchannel('A').getextrema()[0]==0
    cells=[source.crop((i%3*512,i//3*512,(i%3+1)*512,(i//3+1)*512)) for i in range(6)]
    boxes=[c.getchannel('A').point(lambda a:255 if a>192 else 0).getbbox() for c in cells]
    scale=height/(boxes[0][3]-boxes[0][1]) if height else .25
    size=(192,152) if height else (128,128);pivot=(96,132) if height else (64,64)
    pieces=[];entries=[]
    for i,(cell,b,root) in enumerate(zip(cells,boxes,roots)):
        margin=min(b[0],b[1],512-b[2],512-b[3]);assert margin>0,(name,i,b)
        cell.putalpha(cell.getchannel('A').point(lambda a:255 if a>192 else 0))
        crop=cell.crop(b);small=crop.resize(tuple(max(1,round(n*scale)) for n in crop.size),Image.Resampling.NEAREST)
        at=(pivot[0]-round((root-b[0])*scale),pivot[1]-small.height) if height else (round(b[0]*scale),round(b[1]*scale))
        assert at[0]>=0 and at[1]>=0 and at[0]+small.width<=size[0] and at[1]+small.height<=size[1]
        native=Image.new('RGBA',size);native.alpha_composite(small,at);pieces.append(native)
        entries.append({'frame':i,'cell':[i%3*512,i//3*512,512,512],'coreBox':b,'sourceRoot':[root,b[3]-1] if height else [256,256],'minimumCoreMargin':margin,'paste':at})
    opaque=Image.new('RGB',(sum(sum(p[3]>0 for p in f.getdata()) for f in pieces),1))
    opaque.putdata([p[:3] for f in pieces for p in f.getdata() if p[3]>0]);palette=opaque.quantize(colors=47)
    final=[]
    for i,f in enumerate(pieces):
        colored=f.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');colored.putalpha(f.getchannel('A'))
        colored.putdata([p if p[3] else (0,0,0,0) for p in colored.getdata()]);colored.save(ROOT/f'native/{name}-{i:02}.png');final.append(colored)
    atlas=Image.new('RGBA',(size[0]*3,size[1]*2))
    for i,f in enumerate(final):atlas.alpha_composite(f,(i%3*size[0],i//3*size[1]))
    atlas.save(ROOT/f'{name}-review-atlas.png');all_frames[name]=final
    records.append({'family':name,'file':file,'sourceSha256':hashlib.sha256((ROOT/file).read_bytes()).hexdigest(),'sourceAlpha':source.getchannel('A').getextrema(),'scale':scale,'idleFullSilhouetteHeight':height,'nativeSize':size,'pivot':pivot,'frames':entries})
sheet=Image.new('RGB',(1152,540),'#141b24');draw=ImageDraw.Draw(sheet)
for row,(name,frames) in enumerate(all_frames.items()):
    for i,f in enumerate(frames):
        x=i*192;y=row*180
        sheet.paste(f,(x,y),f);draw.text((x+5,y+156),f'{name} / {i}',fill='#ddd0b2')
sheet.save(ROOT/'contact-1x.png');sheet.resize((2304,1080),Image.Resampling.NEAREST).save(ROOT/'contact-2x.png')
light=Image.new('RGBA',(1152,304),'#e5dfd0')
for row,name in enumerate(['phase2','phase3']):
    for i,f in enumerate(all_frames[name]):light.alpha_composite(f,(i*192,row*152))
light.convert('RGB').save(ROOT/'light-background.png')
def gif(file,family,sequence,fx=False):
    frames=[]
    for n,idx in enumerate(sequence):
        bg=Image.new('RGBA',(256,192),'#141b24');bg.alpha_composite(all_frames[family][idx],(32,20))
        if fx and idx in [2,3]:bg.alpha_composite(all_frames['fx'][n%3 if idx==2 else 3+n%3],(110,26))
        frames.append(bg.convert('RGB').resize((512,384),Image.Resampling.NEAREST))
    frames[0].save(ROOT/file,save_all=True,append_images=frames[1:],duration=110,loop=0)
for name in ['phase2','phase3']:
    gif(name+'-attack.gif',name,[0,1,1,2,2,0],True)
    gif(name+'-spell.gif',name,[0,3,3,3,0],True)
manifest={'status':'review only; no runtime integration','tool':'built-in imagegen','calls':4,'prompt':'prompts.md','families':records,'rejected':[{'file':'phase3-source.png','sha256':hashlib.sha256((ROOT/'phase3-source.png').read_bytes()).hexdigest(),'reason':'core pixels touch cell boundaries in frames 1,2,4,5'}],'staticReport':'image-report.json','gameVerified':False,'deployed':False,'limitations':['Key poses only; no in-betweens, walking or directional family.','Manual body roots and common scale do not guarantee motion volume continuity.','Phase2 final draw is feedback at height92.4/feet21; phase3 resurrection first draw uses variable frame boxes/feet29.','GIF timing and FX placement are review compositions, not combat or phase transition clocks.']}
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'nativeFrames':18,'margins':{r['family']:min(f['minimumCoreMargin'] for f in r['frames']) for r in records},'scales':{r['family']:r['scale'] for r in records}}))
