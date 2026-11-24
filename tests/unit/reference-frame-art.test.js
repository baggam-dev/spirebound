import test from 'node:test';
import assert from 'node:assert/strict';
import {createReferenceFrameStore,referenceHeroFrame,referenceHeroMoveFrame,referenceMordoAttackFrame,referenceMordoFamily,referenceMordoAdvancedFrame} from '../../src/rendering/reference-frame-art.js';
import {referencePresentationFiles} from '../../src/rendering/presentation-assets.js';
import {existsSync} from 'node:fs';
const context=()=>({globalAlpha:1,calls:[],save(){},restore(){},translate(...a){this.calls.push(['translate',...a]);},scale(){},rotate(){},beginPath(){},rect(){},clip(){},drawImage(...a){this.calls.push(['draw',...a.slice(1)]);}});
test('landing art uses shared feet and refuses missing or incorrectly sized optional atlas',()=>{
 const images=[];class FakeImage{constructor(){images.push(this);}}
 const store=createReferenceFrameStore(FakeImage),c=context(),im=images.find(i=>i.src.includes('reference-hero-landing-'));
 assert.equal(store.draw(c,'heroLanding',0,0,22),false);
 im.naturalWidth=384;im.naturalHeight=207;im.onload();assert.equal(store.has('heroLanding'),false);
 im.naturalHeight=208;im.onload();assert.equal(store.draw(c,'heroLanding',5,0,22),true);
 assert.deepEqual(c.calls.find(v=>v[0]==='draw'),['draw',256,104,128,104,-64,-90,128,104]);
 im.onerror();assert.equal(store.draw(c,'heroLanding',0,0,22),false);
});
test('optional atlas validates dimensions and gracefully declines unloaded, corrupt or failed images',()=>{
 const images=[];class FakeImage{constructor(){images.push(this);}}
 const store=createReferenceFrameStore(FakeImage),c=context();assert.equal(images.length,8);assert.equal(store.draw(c,'hero',0,0,22),false);
 const image=images.find(im=>im.src.includes('reference-hero-'));
 image.naturalWidth=1;image.naturalHeight=1;image.onload();assert.equal(store.has('hero'),false);
 image.naturalWidth=384;image.naturalHeight=208;image.onload();assert.equal(store.draw(c,'hero',5,0,22),true);
 assert.deepEqual(c.calls.find(v=>v[0]==='draw'),['draw',256,104,128,104,-64,-90,128,104]);
 assert.equal(store.draw(c,'hero',6,0,22),false);image.onerror();assert.equal(store.draw(c,'hero',0,0,22),false);
});
test('hero poses keep movement and cast lower-body paths separate and use existing recoil only',()=>{
 const p={moving:false,recoil:0};assert.equal(referenceHeroFrame({...p,moving:true}),null);assert.equal(referenceHeroFrame(p,{preparing:true}),1);
 assert.equal(referenceHeroFrame({...p,recoil:1}),2);assert.equal(referenceHeroFrame({...p,recoil:.2}),3);
 assert.equal(referenceHeroFrame(p,{hit:true}),4);assert.equal(referenceHeroFrame(p,{hit:true,reduced:true}),0);
 assert.equal(referenceHeroFrame({moving:false,recoil:0}),0);
});
test('new king attack silhouettes apply only to skeletal melee without overriding spells or warnings',()=>{
 const e={variant:'king',kingStage:1,hp:100,max:100,darkAttack:{kind:'slash'}};
 const before=JSON.stringify(e);assert.equal(referenceMordoAttackFrame(e,{stage:'windup'}),1);assert.equal(referenceMordoAttackFrame(e,{stage:'strike'}),2);
 for(const patch of [{hp:50},{shadowBoss:1},{kingStage:3},{frozen:1},{opening:1},{kingTransition:1},{darkAttack:{kind:'fan'}}])assert.equal(referenceMordoAttackFrame({...e,...patch},{stage:'windup'}),null);
 assert.equal(referenceMordoAttackFrame(e,{stage:'windup'},{reduced:true}),null);assert.equal(referenceMordoAttackFrame(e,{stage:'windup'},{staticPose:true}),null);assert.equal(JSON.stringify(e),before);
});
test('optional atlas requests match live king rooms and never mutate saved run fields',()=>{
 const s={player:{},floor:0,room:0,floors:[[{enemies:[]}]]};assert.equal(referencePresentationFiles(s).length,4);
 s.floors[0][0].enemies=[{variant:'king',hp:100}];const before=JSON.stringify(s),files=referencePresentationFiles(s);assert.equal(files.length,8);
 for(const f of files)assert.ok(existsSync('assets/images/'+f));assert.equal(JSON.stringify(s),before);
 s.floors[0][0].enemies[0].shadowBoss=1;assert.equal(referencePresentationFiles(s).length,4);
 assert.deepEqual(referencePresentationFiles(null),[]);
});

test('moving aim and release preserve the actual distance-driven gait phase across both half cycles',()=>{
 for(let step=0;step<8;step++){
  const p={moving:true,walk:(step+.1)/8*Math.PI*2,recoil:0},before=JSON.stringify(p);
  assert.equal(referenceHeroMoveFrame(p),step);assert.equal(referenceHeroMoveFrame(p,{preparing:true}),8+step%4);
  assert.equal(referenceHeroMoveFrame({...p,recoil:.8}),12+step%4);assert.equal(referenceHeroMoveFrame({...p,recoil:.1}),12+step%4);
  assert.equal(JSON.stringify(p),before);
 }
});
test('moving pose selection wraps, reduces visual density and rejects stationary or invalid clocks',()=>{
 assert.equal(referenceHeroMoveFrame({moving:false,walk:0}),null);assert.equal(referenceHeroMoveFrame({moving:true,walk:NaN}),null);
 assert.equal(referenceHeroMoveFrame({moving:true,walk:Math.PI*4}),0);
 assert.equal(referenceHeroMoveFrame({moving:true,walk:-.01}),7);
 assert.equal(referenceHeroMoveFrame({moving:true,walk:Math.PI*.8},{reduced:true}),2);
});

test('advanced Mordo maps only the current second and resurrected third forms to real attack poses',()=>{
 for(const e of [{variant:'king',hp:50,max:100,kingStage:2},{variant:'king',hp:20,max:100,kingStage:3,resurrectionVersion:1}]){
  const before=JSON.stringify(e);assert.equal(referenceMordoFamily(e),e.kingStage===2?'mordo2':'mordo3');
  assert.equal(referenceMordoAdvancedFrame({...e,darkAttack:{kind:'slash'}},{stage:'windup'}),1);
  assert.equal(referenceMordoAdvancedFrame({...e,darkFlash:{kind:'slash',time:.1}},{stage:'strike'}),2);
  for(const kind of ['mark','fan','ring','judgment','blink'])assert.equal(referenceMordoAdvancedFrame({...e,darkAttack:{kind}},{stage:'windup'}),3);
  assert.equal(referenceMordoAdvancedFrame(e,{stage:'idle'}),null);assert.equal(JSON.stringify(e),before);
 }
});
test('advanced frames preserve old third forms, shadows, transition and existing interruption paths',()=>{
 const e={variant:'king',hp:50,max:100,kingStage:2,darkAttack:{kind:'slash'}};
 for(const patch of [{hp:100},{hp:0},{hp:20},{hp:20,resurrectionVersion:1,kingStage:2},{shadowBoss:1},{frozen:1},{opening:1},{kneel:1},{kingTransition:1}])assert.equal(referenceMordoAdvancedFrame({...e,...patch},{stage:'windup'}),null);
 assert.equal(referenceMordoAdvancedFrame(e,{stage:'windup'},{reduced:true}),null);
 assert.equal(referenceMordoAdvancedFrame(e,{stage:'windup'},{staticPose:true}),null);
 assert.equal(referenceMordoAdvancedFrame(e,{stage:'recover'}),null);
});
test('combo windup chooses the new action while the previous spell or slash flash fades',()=>{
 const e={variant:'king',hp:50,max:100,darkAttack:{kind:'slash',step:1},darkFlash:{kind:'fan',time:.1}};
 assert.equal(referenceMordoAdvancedFrame(e,{stage:'windup'}),1);
 assert.equal(referenceMordoAdvancedFrame({...e,darkAttack:{kind:'judgment',step:1},darkFlash:{kind:'slash',time:.1}},{stage:'windup'}),3);
 assert.equal(referenceMordoAdvancedFrame(e,{stage:'strike'}),3);
 assert.equal(referenceMordoAdvancedFrame({...e,darkAttack:null,darkFlash:{kind:'slash',time:.18},opening:.4},{stage:'strike'}),2);
 assert.equal(referenceMordoAdvancedFrame({...e,darkAttack:null,darkFlash:null,opening:.4},{stage:'recover'}),null);
});
test('advanced optional atlases use native cells and fail independently from old boss art',()=>{
 const images=[];class FakeImage{constructor(){images.push(this);}}
 const store=createReferenceFrameStore(FakeImage),c=context();
 for(const [key,file,w,h,last,coords] of [['mordo2','phase2',576,304,5,[384,152,192,152]],['mordo3','phase3',576,304,5,[384,152,192,152]],['mordoFx','mordo-fx',384,256,2,[256,0,128,128]]]){
  const im=images.find(i=>i.src.includes(file));assert.equal(store.draw(c,key,0,10,20),false);
  im.naturalWidth=w;im.naturalHeight=h;im.onload();c.calls.length=0;assert.equal(store.draw(c,key,last,10,20),true);
  assert.deepEqual(c.calls.find(v=>v[0]==='draw').slice(1,5),coords);im.onerror();assert.equal(store.has(key),false);
 }
});
test('moving atlas uses the same logical feet and a separate optional failure fallback',()=>{
 const images=[];class FakeImage{constructor(){images.push(this);}}const store=createReferenceFrameStore(FakeImage),c=context();
 const im=images.find(i=>i.src.includes('reference-hero-move-'));assert.equal(store.draw(c,'heroMove',15,0,22),false);
 im.naturalWidth=512;im.naturalHeight=416;im.onload();assert.equal(store.draw(c,'heroMove',15,0,22),true);
 assert.deepEqual(c.calls.find(v=>v[0]==='draw'),['draw',384,312,128,104,-64,-90,128,104]);
 im.onerror();assert.equal(store.draw(c,'heroMove',0,0,22),false);
});
