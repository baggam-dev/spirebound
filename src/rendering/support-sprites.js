import {DeferredImage} from './asset-requests.js';
import {supportActorTypes,SUPPORT} from '../combat/support-profile.js';
import {validSupportHeal} from '../combat/support-casters.js';
import {drawGroundContact} from './arrow-impact-visuals.js';
const frames=new Map(),errors={},motion=new WeakMap();
const specs={
 ossuarySummoner:{file:'ossuary-summoner-atlas-v1.png',columns:3,rows:3,scale:64/281,anchor:264,feet:[319,321,321],boxes:[[173,38,360,319],[117,39,356,319],[132,35,370,319],[115,50,379,321],[120,31,361,321],[91,36,402,320],[164,48,366,321],[102,110,370,321],[40,196,437,321]]},
 choirCantor:{file:'choir-cantor-atlas-v1.png',columns:3,rows:3,scale:64/275,anchor:264,feet:[318,318,321],boxes:[[168,15,367,318],[109,15,355,316],[103,15,342,314],[127,17,385,318],[97,2,362,318],[78,9,372,318],[156,19,382,319],[75,41,368,317],[47,178,433,321]]},
 ossuaryMinion:{file:'ossuary-minion-atlas-v1.png',columns:4,rows:2,scale:42/285,anchor:192,feet:[413,385],boxes:[[44,124,340,409],[29,125,356,408],[34,125,352,413],[27,123,359,406],[23,114,379,381],[35,114,347,381],[29,159,349,385],[17,197,366,379]]}
};
export const supportSpriteState=()=>({ready:supportActorTypes.every(type=>frames.has(type)),frames:Object.fromEntries([...frames].map(([k,v])=>[k,v.length])),errors:{...errors}});
export const supportSpritesReady=typeof Image==='undefined'?Promise.resolve(false):Promise.all(Object.entries(specs).map(([type,spec])=>new Promise(resolve=>{
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1536||atlas.naturalHeight!==1024)throw Error('Unexpected atlas dimensions');const list=[];
  for(let i=0;i<spec.boxes.length;i++){const row=Math.floor(i/spec.columns),col=i%spec.columns,[x,y,right,bottom]=spec.boxes[i],w=right-x,h=bottom-y,canvas=document.createElement('canvas');canvas.width=Math.ceil(w*spec.scale);canvas.height=Math.ceil(h*spec.scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,col*1536/spec.columns+x,Math.floor(row*1024/spec.rows)+y,w,h,0,0,w*spec.scale,h*spec.scale);list.push({canvas,x:(x-spec.anchor)*spec.scale,y:13-(spec.feet[row]-y)*spec.scale});}
  frames.set(type,list);resolve(true);
 }catch(error){errors[type]=String(error);resolve(false);}};atlas.onerror=()=>{errors[type]='Atlas request failed';resolve(false);};atlas.src=new URL('../../assets/images/'+spec.file,import.meta.url).href;
}))).then(results=>results.every(Boolean));
export function supportPose(e,{distance=0,moving=false,staticPose=false}={}){
 const minion=e.type==='ossuaryMinion',face=Math.cos(e.attackPhase&&e.aim!==undefined?e.aim:(e.facing??0))<0?-1:1;
 if(staticPose)return {index:0,face};if(e.hp<=0)return {index:minion?7:8,face};
 if(minion){if(e.attackPhase==='minionWarning')return {index:3,face};if(e.attackPhase==='minionStrike')return {index:4,face};if(e.attackPhase==='minionRecover')return {index:5,face};}
 else{if(e.attackPhase==='supportCast')return {index:e.attackTime>(e.type==='ossuarySummoner'?SUPPORT.cast:SUPPORT.healCast)*.55?3:4,face};if(e.attackPhase==='supportBolt')return {index:3,face};if(e.attackPhase==='supportRelease')return {index:5,face};if(e.attackPhase==='supportRecover')return {index:6,face};}
 return {index:moving?1+Math.floor(distance/9)%2:0,face};
}
function frame(c,type,index,x,y,face=1,alpha=1){const f=frames.get(type)?.[index];if(!f)return false;c.save();c.translate(Math.round(x),Math.round(y));c.scale(face,1);c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;}
export function drawSupportSprite(c,e,time=0,reduced=false,staticPose=false){
 if(!supportActorTypes.includes(e.type))return false;if(!frames.has(e.type))return true;
 let state=motion.get(e);if(!state){state={x:e.x,y:e.y,distance:0,movedAt:-1};motion.set(e,state);}const delta=Math.hypot(e.x-state.x,e.y-state.y);if(delta>0&&delta<50){state.distance+=delta;state.movedAt=time;}state.x=e.x;state.y=e.y;
 const pose=supportPose(e,{distance:state.distance,moving:time-state.movedAt<.12,staticPose});c.save();c.fillStyle='#11192355';c.beginPath();c.ellipse(e.x,e.y+13,e.type==='ossuaryMinion'?17:15,5,0,0,Math.PI*2);c.fill();c.restore();frame(c,e.type,pose.index,e.x,e.y,pose.face);return true;
}
export function drawSupportDeath(c,f,{reduced=false}={}){
 if(!supportActorTypes.includes(f.bodyType))return false;const age=1-f.t/f.duration,minion=f.bodyType==='ossuaryMinion';frame(c,f.bodyType,reduced||age>.4?(minion?7:8):(minion?6:7),f.x,f.y,f.face||1,Math.min(1,Math.max(0,1-age)*2));return true;
}
export function drawSupportEffects(c,e,room,reduced=false){
 if(!supportActorTypes.includes(e.type)||e.hp<=0)return;c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.lineWidth=1.5;c.setLineDash([]);
 const glyph=(x,y,color)=>{c.strokeStyle=color;c.beginPath();c.ellipse(x,y,18,8,0,0,Math.PI*2);c.moveTo(x-5,y);c.lineTo(x,y-5);c.lineTo(x+5,y);c.lineTo(x,y+5);c.closePath();c.stroke();};
 if(e.attackPhase==='supportCast'){
  if(e.type==='ossuarySummoner'&&e.supportSpawn){glyph(e.supportSpawn.x,e.supportSpawn.y,'#c3a8dc');c.strokeStyle='#bca2cf';c.setLineDash([3,5]);c.beginPath();c.moveTo(e.x,e.y-24);c.lineTo(e.supportSpawn.x,e.supportSpawn.y);c.stroke();}
  if(e.type==='choirCantor'){const target=room.enemies.find(n=>n.id===e.supportTarget);if(validSupportHeal(e,target,room)){c.strokeStyle='#b7d4ad';c.beginPath();c.moveTo(e.x,e.y-27);c.lineTo(target.x,target.y-15);c.stroke();glyph(target.x,target.y,'#b7d4ad');}}
 }else if(e.attackPhase==='supportBolt'){c.strokeStyle='#dfb0b8';c.setLineDash([4,4]);c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x+Math.cos(e.aim)*120,e.y+Math.sin(e.aim)*120);c.stroke();}
 else if(e.attackPhase==='minionWarning'){c.strokeStyle='#e8b8b0';c.beginPath();c.moveTo(e.x,e.y);c.arc(e.x,e.y,48,e.aim-.9,e.aim+.9);c.closePath();c.stroke();}
 else if(e.attackPhase==='minionStrike')drawGroundContact(c,{x:e.x+Math.cos(e.aim)*35,y:e.y+Math.sin(e.aim)*35,age:.18-e.attackTime,reduced});
 if(e.supportFlash){const f=e.supportFlash;c.globalAlpha*=Math.min(1,f.time/.35);c.setLineDash([]);if(f.kind==='interrupt'){c.strokeStyle='#e6d1b0';c.beginPath();c.moveTo(e.x-6,e.y-58);c.lineTo(e.x+6,e.y-46);c.moveTo(e.x+6,e.y-58);c.lineTo(e.x-6,e.y-46);c.stroke();}else{glyph(f.x,f.y,f.kind==='heal'?'#b7d4ad':'#c3a8dc');if(f.kind==='heal'){c.font='bold 12px Galmuri, monospace';c.textAlign='center';c.fillStyle='#c8e3be';c.fillText('+'+Math.ceil(f.amount),f.x,f.y-38);}}}
 c.restore();
}
