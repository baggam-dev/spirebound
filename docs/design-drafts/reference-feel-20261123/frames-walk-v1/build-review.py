"""Static image preparation only: no game imports, test run or server."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageChops
import json, hashlib
ROOT=Path(__file__).resolve().parent
NATIVE=ROOT/'native';NATIVE.mkdir(exist_ok=True)
GAME=ROOT.parents[3]
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',n)
sources=[Image.open(ROOT/name).convert('RGBA') for name in ['walk-source.png','moving-shot-source.png']]
def core(im):return im.getchannel('A').point(lambda a:255 if a>192 else 0)
standing=core(sources[0].crop((0,0,384,512))).getbbox()
scale=58/(standing[3]-standing[1])
# Match the already integrated stationary family rather than invent a new ramp.
palette=Image.open(GAME/'assets/images/reference-hero-frames-v1.png').convert('RGB').quantize(colors=47,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
frames=[];records=[]
for index in range(16):
    source=sources[index//8];i=index%8;rect=(i%4*384,i//4*512,(i%4+1)*384,(i//4+1)*512)
    tile=source.crop(rect);alpha=core(tile);bbox=alpha.getbbox()
    if not bbox:raise ValueError('Empty cell')
    tile.putalpha(alpha)
    # Draft belt/root estimates; all frames retain one scale and a shared feet line.
    anchor=[225,210,216,215,225,210,216,215][i] if index<8 else 216
    foot=bbox[3]-1
    small=tile.resize((round(384*scale),round(512*scale)),Image.Resampling.NEAREST)
    canvas=Image.new('RGBA',(128,104));canvas.paste(small,(round(64-anchor*scale),round(90-foot*scale)))
    clear=Image.new('RGBA',canvas.size);clear.paste(canvas,(0,0),canvas.getchannel('A'))
    colored=clear.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');colored.putalpha(clear.getchannel('A'))
    result=Image.new('RGBA',colored.size);result.paste(colored,(0,0),colored.getchannel('A'));frames.append(result)
    name=f'hero-move-{index:02}.png';result.save(NATIVE/name)
    records.append(dict(index=index,source=['walk-source.png','moving-shot-source.png'][index//8],source_rect=list(rect),core_bounds=list(bbox),source_root=[anchor,foot],native_root=[64,90],scale=round(scale,6),
                        native='native/'+name,minimum_source_margin=min(bbox[0],bbox[1],384-bbox[2],512-bbox[3]),touches_source_boundary=bbox[0]==0 or bbox[1]==0 or bbox[2]==384 or bbox[3]==512))
footprints=[im.getchannel('A').crop((32,73,100,93)) for im in frames];pairs=[]
for i in range(8):
    rows=[]
    for base in [8,12]:
        scores=[sum(n*a for a,n in enumerate(ImageChops.difference(footprints[i],footprints[j]).histogram()))/255 for j in range(base,base+4)]
        rows.append({'scores':scores,'nearest_phase':min(range(4),key=lambda k:scores[k])})
    pairs.append({'walk':i,'draw':rows[0],'release':rows[1]})
(ROOT/'phase-correspondence.json').write_text(json.dumps({'region':[32,73,100,93],'method':'Alpha-silhouette difference; static phase hint, not motion QA','frames':pairs},indent=2),encoding='utf-8')
atlas=Image.new('RGBA',(512,416))
for i,im in enumerate(frames):atlas.paste(im,(i%4*128,i//4*104))
product=GAME/'assets/images/reference-hero-move-frames-v1.png';atlas.save(product)

def checker(size,light=False):
    out=Image.new('RGBA',size,'#ded8cc' if light else '#151b25');d=ImageDraw.Draw(out)
    for y in range(0,size[1],8):
        for x in range(0,size[0],8):
            if (x//8+y//8)%2:d.rectangle((x,y,x+7,y+7),fill='#e9e4da' if light else '#222a36')
    return out
contact=checker((1024,620));d=ImageDraw.Draw(contact)
for i,im in enumerate(frames):
    row=0 if i<8 else 1 if i<12 else 2; x=(i%8 if i<8 else (i-8)%4)*128;y=row*140+32
    contact.alpha_composite(im,(x,y));d.text((x+4,y-24),('보행 ' if i<8 else '당김 ' if i<12 else '발사 ')+str((i%8 if i<8 else i%4)+1),font=font(15),fill='#ded1ad')
    d.line((x,y+90,x+127,y+90),fill='#52606e')
# Remaining rows: four gait pairs, side by side on light/dark grounds.
for j in range(4):
    for k,idx in enumerate([8+j,12+j]):
        x=j*256+k*128;bg=checker((128,104),light=True);bg.alpha_composite(frames[idx]);contact.alpha_composite(bg,(x,480))
contact.convert('RGB').save(ROOT/'native-contact.png')
zoom=Image.new('RGB',(1024,992),'#151b25');d=ImageDraw.Draw(zoom)
for i,im in enumerate(frames):
    x=i%4*256;y=i//4*248+28;piece=checker((128,104));piece.alpha_composite(im)
    zoom.paste(piece.resize((256,208),Image.Resampling.NEAREST),(x,y));d.text((x+8,y-24),f'{i:02}',font=font(16),fill='#decba7')
zoom.save(ROOT/'pose-review.png')
def gif(name,sequence):
    images=[]
    for i in sequence:
        bg=checker((128,104));bg.alpha_composite(frames[i]);images.append(bg.resize((384,312),Image.Resampling.NEAREST).convert('RGB'))
    images[0].save(ROOT/name,save_all=True,append_images=images[1:],duration=90,loop=0,disposal=2)
gif('walk.gif',list(range(8)))
gif('draw-walk.gif',list(range(8,12)))
gif('release-walk.gif',list(range(12,16)))
gif('continuous-shot.gif',[8+i%4 if i in [2,3] else 12+i%4 if i in [4,5] else i for i in range(8)])
manifest={'source_kind':'generated','tool':'built-in image_gen.imagegen','calls':2,'reference':'../frames-v1/hero-poses-source.png','prompt':'prompts.md','body_height_target':58,'common_scale':scale,'palette':'Existing integrated reference-hero-frames-v1.png','threshold':192,'atlas':{'file':'assets/images/'+product.name,'size':[512,416],'cell':[128,104],'columns':4,'count':16,'sha256':hashlib.sha256(product.read_bytes()).hexdigest()},'frames':records,'technical_checks_passed':False,'game_verified':False,'deployment':False,'limitations':'Key-pose gait extension, single view. Manual draft roots and remaining gait/aim transitions require engine review on explicit deployment. No walk speed or attack time changes.'}
manifest['source_metadata']=[{'file':name,'size':list(im.size),'alpha':im.getchannel('A').getextrema(),'sha256':hashlib.sha256((ROOT/name).read_bytes()).hexdigest()} for name,im in zip(['walk-source.png','moving-shot-source.png'],sources)]
manifest['phase_correspondence']='phase-correspondence.json'
manifest['integration']='Authorized unchanged hero direction extension; optional local runtime atlas, game validation pending'
(ROOT/'asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'frames':len(frames),'source_boundary_contacts':sum(r['touches_source_boundary'] for r in records),'minimum_source_margin':min(r['minimum_source_margin'] for r in records),'atlas':[512,416]}))
