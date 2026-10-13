import {drawChaserWalk} from './chaser-walk.js';
import {drawArcherWalk} from './archer-walk.js';
import {characterSizes} from './character-sizes.js';
// Approved masked grunt originals; crop and downsample once, never modify saved actors.
const specs={
 chaser:{scale:characterSizes.grunt/716,frames:[{x:185,y:90,w:695,h:730,anchorX:440,feet:809},{x:938,y:169,w:830,h:655,anchorX:1242,feet:814}]},
 archer:{scale:characterSizes.grunt/768,frames:[{x:255,y:78,w:567,h:780,anchorX:495,feet:848},{x:1010,y:26,w:724,h:834,anchorX:1247,feet:851}]},
 charger:{scale:characterSizes.grunt/689,frames:[{x:134,y:123,w:724,h:701,anchorX:440,feet:818},{x:905,y:226,w:739,h:598,anchorX:1243,feet:818}]},
 scatter:{scale:characterSizes.grunt/703,frames:[{x:181,y:107,w:625,h:715,anchorX:440,feet:816},{x:921,y:158,w:802,h:666,anchorX:1250,feet:818}]},
 ricochet:{width:1773,scale:characterSizes.grunt/712,frames:[{x:153,y:108,w:649,h:724,anchorX:440,feet:824},{x:920,y:157,w:834,h:672,anchorX:1250,feet:821}]},
 laser:{scale:characterSizes.grunt/705,frames:[{x:96,y:124,w:610,h:717,anchorX:400,feet:833},{x:854,y:152,w:797,h:690,anchorX:1140,feet:834}]},
 brute:{scale:characterSizes.brute/772,feetOffset:24,frames:[{x:34,y:72,w:876,h:784,anchorX:463,feet:847},{x:981,y:214,w:782,h:644,anchorX:1340,feet:849}]}
};
const cached=new Map();
export const hasGruntSprite=type=>cached.has(type);
export const gruntSpriteState=()=>({ready:cached.size===Object.keys(specs).length,types:[...cached.keys()],frames:[...cached.values()].reduce((n,f)=>n+f.length,0),bodyHeight:characterSizes.grunt,bruteHeight:characterSizes.brute});
export const gruntSpriteReady=typeof Image==='undefined'?Promise.resolve(false):Promise.all(Object.entries(specs).map(([type,s])=>new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==(s.width||1774)||atlas.naturalHeight!==887){resolve(false);return;}
  const frames=s.frames.map(f=>{const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*s.scale);canvas.height=Math.ceil(f.h*s.scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*s.scale,f.h*s.scale);return {canvas,x:(f.x-f.anchorX)*s.scale,y:(s.feetOffset??21)-(f.feet-f.y)*s.scale};});
  cached.set(type,frames);resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL(`../../assets/images/${type}-masked-atlas.png`,import.meta.url).href;
}))).then(results=>results.every(Boolean));
export function gruntPose(e,p,run){
 const brute=e.type==='brute'&&['windup','swing','recover'].includes(e.phase);
 const aiming=['archer','scatter'].includes(e.type)&&['warning','firing'].includes(e.attackPhase);
 const charging=e.type==='charger'&&Number.isFinite(e.chargeAngle);
 const ranged=['laser','ricochet'].includes(e.type)&&['aim','beam'].includes(e.phase);
 const target=run?.player;
 const melee=e.type==='chaser'&&target&&Math.hypot(e.x-target.x,e.y-target.y)<65;
 const aim=aiming?e.patternAim:charging?e.chargeAngle:ranged?e.aim:NaN;
 return {index:brute||aiming||charging||melee||ranged&&!(e.type==='laser'&&e.phase==='aim')?1:0,face:Number.isFinite(aim)?(Math.cos(aim)<0?-1:1):p.face||1,bob:p.moving?Math.abs(p.step||0)*.35:0};
}
export function drawGruntSprite(c,e,p,run){
 const frames=cached.get(e.type);if(!frames)return false;const pose=gruntPose(e,p,run),f=frames[pose.index];
 c.save();c.scale(pose.face,1);c.imageSmoothingEnabled=false;const walking=pose.index===0&&(e.type==='chaser'?drawChaserWalk(c,p):e.type==='archer'?drawArcherWalk(c,p):false);if(!walking)c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y-pose.bob));
 // Return-trip rage remains identifiable without losing the approved grey clothes.
 if(run?.key||e.escapeDepth){c.strokeStyle='#ef858d';c.lineWidth=2;c.beginPath();c.moveTo(-17,17);c.lineTo(-21,12);c.moveTo(17,17);c.lineTo(21,12);c.stroke();}
 c.restore();return true;
}
