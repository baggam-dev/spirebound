import {DeferredImage} from './asset-requests.js';
const specs={
 hero:{file:'reference-hero-frames-v1.png',w:128,h:104,cols:3,count:6,pivot:[64,90]},
 heroMove:{file:'reference-hero-move-frames-v1.png',w:128,h:104,cols:4,count:16,pivot:[64,90]},
 heroLanding:{file:'reference-hero-landing-frames-v1.png',w:128,h:104,cols:3,count:6,pivot:[64,90]},
 mordo:{file:'reference-mordo-frames-v1.png',w:192,h:152,cols:3,count:6,pivot:[96,132]},
 mordo2:{file:'reference-mordo-phase2-frames-v1.png',w:192,h:152,cols:3,count:6,pivot:[96,132]},
 mordo3:{file:'reference-mordo-phase3-frames-v1.png',w:192,h:152,cols:3,count:6,pivot:[96,132]},
 mordoFx:{file:'reference-mordo-fx-frames-v1.png',w:128,h:128,cols:3,count:6,pivot:[64,64]},
 fx:{file:'reference-fx-frames-v1.png',w:128,h:128,cols:4,count:12,pivot:[64,64]}
};
// Optional images have no exported *Ready promise and cannot gate floor loading.
export function createReferenceFrameStore(ImageCtor=typeof Image==='undefined'?null:DeferredImage){
 const images=new Map();
 if(ImageCtor)for(const [key,s] of Object.entries(specs)){
  const im=new ImageCtor();im.onload=()=>{if(im.naturalWidth===s.w*s.cols&&im.naturalHeight===s.h*Math.ceil(s.count/s.cols))images.set(key,im);};
  im.onerror=()=>images.delete(key);im.src=new URL('../../assets/images/'+s.file,import.meta.url).href;
 }
 return {
  has:key=>images.has(key),
  state:()=>Object.fromEntries(Object.keys(specs).map(key=>[key,images.has(key)])),
  draw(c,key,index,x,y,{scale=1,face=1,angle=0,alpha=1,clip=false}={}){
   const im=images.get(key),s=specs[key];if(!im||!Number.isInteger(index)||index<0||index>=s.count||![x,y,scale,angle,alpha].every(Number.isFinite)||scale<=0)return false;
   c.save();if(clip){c.beginPath();c.rect(25,45,910,455);c.clip();}
   c.translate(Math.round(x),Math.round(y));if(angle)c.rotate(angle);if(face<0)c.scale(-1,1);
   c.globalAlpha*=Math.max(0,Math.min(1,alpha));c.imageSmoothingEnabled=false;
   c.drawImage(im,index%s.cols*s.w,Math.floor(index/s.cols)*s.h,s.w,s.h,-Math.round(s.pivot[0]*scale),-Math.round(s.pivot[1]*scale),Math.round(s.w*scale),Math.round(s.h*scale));c.restore();return true;
  }
 };
}
const art=createReferenceFrameStore();
export const drawReferenceHeroLanding=(c,frame)=>art.draw(c,'heroLanding',frame,0,22);
export const referenceFrameArtState=()=>art.state();
export function referenceHeroFrame(p,{preparing=false,hit=false,reduced=false}={}){
 if(p.moving)return null; // Moving poses use the separate gait family below.
 if(hit&&!reduced)return 4;
 if(p.recoil>.6)return 2;if(p.recoil>0)return 3;
 if(preparing)return 1;return 0;
}
export function drawReferenceHero(c,p,options={}){
 if(p.moving){const frame=referenceHeroMoveFrame(p,options);return frame!==null&&art.draw(c,'heroMove',frame,0,22);}
 const frame=referenceHeroFrame(p,options);if(frame===null||!art.has('hero'))return false;
 return art.draw(c,'hero',frame,0,22);
}
export function referenceHeroMoveFrame(p,{preparing=false,reduced=false}={}){
 if(!p.moving||!Number.isFinite(p.walk))return null;
 const tau=Math.PI*2,phase=((p.walk%tau)+tau)%tau;
 let step=Math.min(7,Math.floor(phase/tau*8));if(reduced)step=Math.floor(step/2)*2;
 // Static lower-leg comparison matches both four-pose shot rows to step % 4.
 // Recoil/preparation only selects the row, never resets the walking phase.
 if(p.recoil>0)return 12+step%4;
 if(preparing)return 8+step%4;
 return step;
}
export function referenceMordoAttackFrame(e,attack,{reduced=false,staticPose=false}={}){
 if(e.variant!=='king'||e.shadowBoss===1||!(e.hp/e.max>.65)||(e.kingStage??1)!==1||reduced||staticPose||e.kingTransition>0||e.frozen>0||e.kneel>0||e.opening>0)return null;
 const kind=e.darkAttack?.kind??e.darkFlash?.kind;if(kind!=='slash')return null;
 return attack.stage==='windup'?1:attack.stage==='strike'?2:null;
}
export function drawReferenceMordoAttack(c,e,attack,options={}){
 if(referenceMordoFamily(e)==='mordo2')return drawReferenceMordoAdvanced(c,e,attack,options);
 const frame=referenceMordoAttackFrame(e,attack,options);if(frame===null)return false;
 const angle=e.darkAttack?.aim??e.darkFlash?.aim??e.facing??0;
 return art.draw(c,'mordo',frame,e.x,e.y+21,{face:Math.cos(angle)<0?-1:1});
}
export function referenceMordoFamily(e){
 if(e?.variant!=='king'||e.shadowBoss===1||!(e.hp>0)||!(e.max>0))return null;
 const ratio=e.hp/e.max;
 if(ratio<=.65&&ratio>.3&&(e.kingStage===undefined||e.kingStage===2))return 'mordo2';
 if(ratio<=.3&&e.resurrectionVersion===1&&(e.kingStage===undefined||e.kingStage===3))return 'mordo3';
 return null;
}
export function referenceMordoAdvancedFrame(e,attack,{reduced=false,staticPose=false}={}){
 if(!referenceMordoFamily(e)||reduced||staticPose||e.kingTransition>0||e.frozen>0||e.kneel>0)return null;
 // finish() opens the punish window at the same instant it creates the flash.
 // Keep that real strike silhouette until the flash ends, then use old recovery.
 if(e.opening>0&&!(attack?.stage==='strike'&&e.darkFlash?.time>0))return null;
 if(!['windup','strike'].includes(attack?.stage))return null;
 // A new combo warning may coexist with the previous attack's fading flash.
 const kind=attack.stage==='windup'?e.darkAttack?.kind:(e.darkFlash?.time>0?e.darkFlash.kind:e.darkAttack?.kind);
 if(kind==='slash')return attack.stage==='windup'?1:2;
 if(['mark','fan','ring','judgment','blink'].includes(kind))return 3;
 return null;
}
export function drawReferenceMordoAdvanced(c,e,attack,options={}){
 const frame=referenceMordoAdvancedFrame(e,attack,options);if(frame===null)return false;
 const source=attack.stage==='windup'?e.darkAttack:(e.darkFlash?.time>0?e.darkFlash:e.darkAttack);
 const angle=source?.aim??e.facing??0,family=referenceMordoFamily(e);
 return art.draw(c,family,frame,e.x,e.y+(family==='mordo3'?29:21),{face:Math.cos(angle)<0?-1:1});
}
export function drawReferenceMordoSlash(c,e,a,{reduced=false}={}){
 if(reduced||!referenceMordoFamily(e)||a?.kind!=='slash'||!(a.time>0)||a.time>.18||e.kingTransition>0)return false;
 const x=a.x,y=a.y,angle=a.aim??e.facing??0;
 if(![x,y,angle].every(Number.isFinite))return false;
 const progress=1-a.time/.18,frame=Math.min(2,Math.floor(progress*3));
 return art.draw(c,'mordoFx',frame,x+Math.cos(angle)*48,y+Math.sin(angle)*48,{angle,alpha:.65,clip:true});
}
export function referenceMordoDeathPose(f,{reduced=false}={}){
 if(reduced||f?.enemyFeedback!=='death'||!f.king||f.shadowBoss===1||f.split||!(f.duration>0)||!Number.isFinite(f.duration)||!(f.t>0)||!Number.isFinite(f.t))return null;
 const family=f.kingPhase===2?'mordo2':f.kingPhase===3&&f.resurrection?'mordo3':null;
 return family?{family,frame:5,feet:family==='mordo3'?29:21,alpha:Math.min(1,f.t/f.duration*2)}:null;
}
export function drawReferenceMordoDeath(c,f,options={}){
 const pose=referenceMordoDeathPose(f,options);if(!pose)return false;
 return art.draw(c,pose.family,pose.frame,f.x,f.y+pose.feet,{face:f.face,alpha:pose.alpha,clip:true});
}
export function referenceMordoReleaseFrame(progress){
 if(!Number.isFinite(progress)||progress<0||progress>=1)return null;
 return progress<.24?3:progress<.62?4:5;
}
export function drawReferenceMordoRelease(c,progress,x,y,options={}){
 const frame=referenceMordoReleaseFrame(progress);if(frame===null)return false;
 return art.draw(c,'mordoFx',frame,x,y,{...options,clip:true});
}
export function drawReferenceMordoPose(c,phase,pose,x,y,face=1,alpha=1){
 const frame={light:3,heavy:3,death:4,rest:5}[pose];if(phase!==1||frame===undefined)return false;
 return art.draw(c,'mordo',frame,x,y+21,{face,alpha});
}
export function drawReferenceEffect(c,kind,progress,x,y,options={}){
 const row={impact:0,fracture:1,reward:2}[kind];if(row===undefined||!Number.isFinite(progress)||progress<0||progress>=1)return false;
 return art.draw(c,'fx',row*4+Math.min(3,Math.floor(progress*4)),x,y,{...options,clip:true});
}
