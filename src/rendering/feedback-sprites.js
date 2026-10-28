import {DeferredImage} from './asset-requests.js';
import {locomotion,drawWalkingFrame,drawGlidingFrame} from './locomotion.js';
import {applyRemainingBossPose} from './remaining-boss-presentation.js';
import {veraFrame,veraSpriteState} from './vera-sprite.js';

// Native imagegen originals; only crop/downsample here. Feet anchors are independent
// of weapon/horn extents. No actor, combat clock, save or RNG writes.
const sheets={
 upper:{width:1024,height:1536,split:548,rows:[0,278,533,813,1090,1345,1536],tops:[20,282,540,818,1094,1348],feet:[274,529,812,1089,1342,1527],ax:[320,320,320,315,310,310],bx:[735,730,730,730,735,740],keys:['astralSniper','gravityMage','starKnight','starBearer','royalGuard','riftHunter']},
 'named-brute':{width:1330,height:1182,split:665,rows:[0,439,824,1182],tops:[32,446,824],rightTops:[75,460,858],feet:[435,824,1172],ax:[400,390,350],bx:[1010,970,1000],keys:['kald','vera','brute']},
 demons:{width:1024,height:1536,split:512,rows:[0,269,521,817,1040,1288,1536],tops:[15,272,530,819,1045,1293],feet:[265,520,816,1037,1285,1525],ax:[300,300,290,300,295,295],bx:[735,735,740,750,740,740],keys:['demonSoldier','demonArcher','demonCaptain','ambusher','ringcaster','strafer']},
 bosses:{width:1024,height:1536,split:548,rows:[0,307,608,925,1230,1536],tops:[28,319,617,936,1238],feet:[300,601,919,1222,1525],ax:[260,260,260,270,280],bx:[725,725,735,745,750],keys:['king1','king2','king3','commander1','commander2']}
};
const frames=new Map(),motion=new WeakMap();
// Adjacent source poses occasionally leave a detached one-pixel speck at a crop
// edge after downsampling. Discard only tiny isolated components, not anatomy.
function cleanCrop(canvas){
 const c=canvas.getContext('2d'),image=c.getImageData(0,0,canvas.width,canvas.height),d=image.data,w=canvas.width,h=canvas.height,seen=new Uint8Array(w*h);
 for(let start=0;start<w*h;start++){
  if(seen[start]||d[start*4+3]<24)continue;
  const stack=[start],part=[];seen[start]=1;
  while(stack.length){const n=stack.pop();part.push(n);const x=n%w,y=Math.floor(n/w);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,j=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&!seen[j]&&d[j*4+3]>=24){seen[j]=1;stack.push(j);}}
  }
  if(part.length<6)for(const n of part)d[n*4+3]=0;
 }
 c.putImageData(image,0,0);
}
export const feedbackBodyHeight=key=>key==='brute'?67:key==='demonCaptain'?66:key.startsWith('king')?92.4:key.startsWith('commander')?75.6:['kald','vera'].includes(key)?69.6:52;
export function feedbackSpriteKey(e){
 if(e.variant==='king')return 'king'+(e.hp/e.max>.65?1:e.hp/e.max>.3?2:3);
 if(e.variant==='commander')return 'commander'+(e.hp/e.max<=.5||e.commander?.phase===2?2:1);
 if(e.gateTitle&&e.type==='starKnight')return 'kald';
 if(e.gateTitle&&e.type==='astralSniper')return 'vera';
 return e.type;
}
export const feedbackSpriteState=()=>({ready:frames.size===20,keys:[...frames.keys()].sort(),veraReady:veraSpriteState().ready});
const sheetReady=Object.fromEntries(Object.entries(sheets).map(([name,s])=>[name,typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new DeferredImage();image.onload=()=>{try{
  if(image.naturalWidth!==s.width||image.naturalHeight!==s.height){resolve(false);return;}
  for(const [row,key] of s.keys.entries()){
   const pair=[];
   for(let col=0;col<2;col++){
    const x=col?s.split:0,y=s.rows[row],w=col?s.width-s.split:s.split,h=s.rows[row+1]-y;
    const top=col?(s.rightTops?.[row]??s.tops[row]):s.tops[row],scale=feedbackBodyHeight(key)/(s.feet[row]-top);
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,x,y,w,h,0,0,w*scale,h*scale);
    cleanCrop(canvas);
    const foot=key.startsWith('commander')?29:key==='brute'?24:21;
    pair.push({canvas,x:(x-(col?s.bx[row]:s.ax[row]))*scale,y:foot-(s.feet[row]-y)*scale});
   }frames.set(key,pair);
  }resolve(true);
 }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL(`../../assets/images/feedback-${name}-v1.png`,import.meta.url).href;
})]));
export const feedbackSpritesReady=Promise.all(Object.values(sheetReady)).then(ok=>ok.every(Boolean));
export const feedbackSpritesReadyFor=groups=>Promise.all(groups.map(name=>sheetReady[name])).then(ok=>ok.every(Boolean));
export function drawFeedbackSprite(c,e,time=0,{reduced=false,staticPose=false,attack=null,local=false,face:forcedFace}={}){
 const key=feedbackSpriteKey(e),pair=frames.get(key),named=key==='vera'?veraFrame(e,{staticPose}):null;if(key==='vera'?!named:!pair)return false;
 const state=e.commander||{},active=!!(key==='vera'&&(e.darkAttack||e.darkFlash?.time>0||e.eliteWarning>0||e.elite==='volley'&&e.opening>0&&e.eliteCooldown>2.82)||e.highAttack&&e.highAttack.stage!=='recover'||e.meleeAttack&&e.meleeAttack.stage!=='recover'||attack&&['windup','strike','channel','air'].includes(attack.stage)||state.volley||state.snipe||state.ricochet||state.rain||e.gravity||e.phase==='swing'||e.phase==='windup'||e.phase==='air'||['warning','dash','firing','strike','windup'].includes(e.attackPhase));
 const f=named||pair[active?1:0];let m=motion.get(e);if(!m){m={x:e.x,time,face:1};motion.set(e,m);}
 if(time!==m.time){if(Math.abs(e.x-m.x)>.1&&Math.abs(e.x-m.x)<36)m.face=Math.sign(e.x-m.x);m.x=e.x;m.time=time;}
 const aim=e.highAttack?.aim??e.meleeAttack?.aim??e.darkAttack?.aim??e.darkFlash?.aim??state.volley?.aim??state.snipe?.aim??state.ricochet?.aim??e.aim??e.facing;
 const face=forcedFace??(active&&Number.isFinite(aim)?(Math.cos(aim)<0?-1:1):staticPose?1:m.face);
 const blocked=active||e.kingTransition>0||e.kneel>0||state.transition>0||state.blinkFlash>0;
 const g=locomotion(e,time,{reduced,staticPose,blocked,stride:key==='brute'?30:24}),foot=key.startsWith('commander')?29:key==='brute'?24:21;
 c.save();if(!local)c.translate(Math.round(e.x),Math.round(e.y));
 const shadowWidth=['kald','vera'].includes(key)?43.2:36;c.fillStyle='#0005';c.fillRect(-shadowWidth/2,foot-2,shadowWidth,5);c.translate(0,(attack?.bodyY||0)-(attack?.lift||0));c.scale(face,1);c.imageSmoothingEnabled=false;
 applyRemainingBossPose(c,e,{reduced,staticPose},foot);
 if(['gravityMage','royalGuard'].includes(key))drawGlidingFrame(c,f,g,{feet:foot});else drawWalkingFrame(c,f,g,{feet:foot,hip:foot-15,weight:key==='brute'?.6:1});
 if(e.escapeDepth){c.strokeStyle='#ed9aab';c.lineWidth=1.5;c.beginPath();c.moveTo(-16,foot-2);c.lineTo(-21,foot-7);c.moveTo(16,foot-2);c.lineTo(21,foot-7);c.stroke();}
 c.restore();return true;
}
