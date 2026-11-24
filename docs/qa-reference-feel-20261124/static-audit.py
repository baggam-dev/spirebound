"""Read-only source/PNG/manifest audit, NOT JS parsing or game execution."""
from pathlib import Path
import subprocess,re,json,hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
base='012f972'
paths=subprocess.check_output(['git','diff','--name-only',base,'--','src'],cwd=ROOT,text=True).splitlines()
paths=[p for p in paths if p.endswith('.js')]
imports=[];missing=[]
for file in paths:
    text=(ROOT/file).read_text(encoding='utf-8-sig')
    for target in re.findall(r'''(?:\bfrom\s*|\bimport\s*\(\s*)['"]([^'"]+)['"]''',text):
        if not target.startswith('.'):continue
        resolved=((ROOT/file).parent/target.split('?')[0]).resolve()
        imports.append({'file':file,'target':target,'exists':resolved.is_file()})
        if not resolved.is_file():missing.append({'file':file,'target':target})
spec_text=(ROOT/'src/rendering/reference-frame-art.js').read_text(encoding='utf-8-sig')
specs=re.findall(r"(\w+):\{file:'([^']+)',w:(\d+),h:(\d+),cols:(\d+),count:(\d+),pivot:\[(\d+),(\d+)\]",spec_text)
atlases=[]
for key,file,w,h,cols,count,px,py in specs:
    w,h,cols,count=map(int,[w,h,cols,count]);path=ROOT/'assets/images'/file
    im=Image.open(path).convert('RGBA');expected=[w*cols,h*((count+cols-1)//cols)]
    alpha=im.getchannel('A').getextrema();colors=len(set(im.getdata()))
    atlases.append({'key':key,'file':str(path.relative_to(ROOT)).replace('\\','/'),'size':list(im.size),'expected':expected,'alpha':alpha,'colors':colors,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'ok':list(im.size)==expected and alpha[0]==0 and colors<=48})
hashes=[]
def walk(value,manifest):
    if isinstance(value,dict):
        if isinstance(value.get('file'),str) and value['file'].startswith('assets/') and value.get('sha256'):
            file=value['file'];path=ROOT/file
            actual=hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None
            hashes.append({'manifest':str(manifest.relative_to(ROOT)).replace('\\','/'),'file':file,'ok':actual==value['sha256'].lower()})
        for v in value.values():walk(v,manifest)
    elif isinstance(value,list):
        for v in value:walk(v,manifest)
for path in (ROOT/'docs/design-drafts/reference-feel-20261123').rglob('*manifest.json'):
    walk(json.loads(path.read_text(encoding='utf-8-sig')),path)
test_declarations=[]
for file in subprocess.check_output(['git','diff','--name-only',base,'--','tests/unit'],cwd=ROOT,text=True).splitlines():
    now=(ROOT/file).read_text(encoding='utf-8-sig')
    old=subprocess.run(['git','show',base+':'+file],cwd=ROOT,capture_output=True,text=True,encoding='utf-8')
    pattern=r'(?m)^test\('
    test_declarations.append({'file':file,'netNewDeclarations':len(re.findall(pattern,now))-(len(re.findall(pattern,old.stdout)) if old.returncode==0 else 0)})
report={'scope':'Static file metadata/text inspection only. No JS parser, module import, test runner, server, browser, network or deployment executed.',
        'base':base,'reviewedHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
        'includesUncommittedWorkingTree':True,'changedRuntimeFiles':paths,'localImportCount':len(imports),'missingImports':missing,
        'runtimeSourceHashes':{file:hashlib.sha256((ROOT/file).read_bytes()).hexdigest() for file in paths},
        'testDeclarationInventory':test_declarations,'netNewTestDeclarations':sum(v['netNewDeclarations'] for v in test_declarations),
        'optionalAtlases':atlases,'productManifestHashes':hashes,
        'optionalLoaderHasNoReadyExport':not bool(re.search(r'export[^\n]*\wReady\b',spec_text)),
        'limitations':['Regex imports only: not a syntax or binding check.','PNG checks do not prove runtime loading, animation, readability or performance.','This report is a checkpoint, not verification of later commits.']}
report['ok']=not missing and len(atlases)==8 and all(v['ok'] for v in atlases+hashes) and report['optionalLoaderHasNoReadyExport']
(OUT/'static-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'ok':report['ok'],'runtimeFiles':len(paths),'localImports':len(imports),'atlases':len(atlases),'manifestHashes':len(hashes),'netNewTestDeclarations':report['netNewTestDeclarations']}))
raise SystemExit(0 if report['ok'] else 1)
