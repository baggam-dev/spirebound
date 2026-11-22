import {DeferredImage} from './asset-requests.js';
import {ordinaryPose} from './ordinary-presentation-state.js';
import {drawChaserWalk} from './chaser-walk.js';
import {drawArcherWalk} from './archer-walk.js';
import {drawFeedbackSprite} from './feedback-sprites.js';
import {characterSizes} from './character-sizes.js';
// Authored rows are not an even grid vertically. Never crop adjacent rows as limbs.
const specs={
 chaser:{row:0,top:25,feet:284,upperRow:846,upperEnd:1060,upperTop:867,belt:1015},
 archer:{row:300,top:310,feet:584,upperRow:1060,upperEnd:1310,upperTop:1083,belt:1235},
 brute:{row:600,top:614,feet:832,upperRow:1310,upperEnd:1536,upperTop:1330,belt:1465}
};
const frames=new Map();
if(typeof Image!=='undefined'){
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1024||atlas.naturalHeight!==1536)return;
  for(const [type,s] of Object.entries(specs)){
   const height=type==='brute'?characterSizes.brute:characterSizes.grunt,foot=type==='brute'?24:21,waist=type==='brute'?-7:-3;
   const pair={foot,waist,body:[],upper:[]};
   for(const kind of ['body','upper'])for(let col=0;col<4;col++){
    const upper=kind==='upper',y=upper?s.upperRow:s.row,h=upper?s.upperEnd-y:(type==='chaser'?300:type==='archer'?300:246);
    const scale=upper?(height-foot+waist)/(s.belt-s.upperTop):height/(s.feet-s.top);
    // Match the current named-brute body's broad silhouette at the same height.
    const scaleX=scale*(type==='brute'?1.28:1);
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(256*scaleX);canvas.height=Math.ceil(h*scale);
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,col*256,y,256,h,0,0,256*scaleX,h*scale);
    pair[kind].push({canvas,x:-128*scaleX,y:upper?waist-(s.belt-y)*scale:foot-(s.feet-y)*scale});
   }frames.set(type,pair);
  }
 }catch{frames.clear();}};atlas.onerror=()=>frames.clear();atlas.src=new URL('../../assets/images/enemy-hit-reactions-v1.png',import.meta.url).href;
}
export const enemyHitArtState=()=>({types:[...frames.keys()]});
export function drawEnemyHitSprite(c,e,p,run,{reduced=false}={}){
 const pose=ordinaryPose(e,{reduced}),pair=frames.get(e.type);
 if(pose?.kind!=='hit'||!pair)return false;
 const face=p.face||1;
 // Unknown/vertical/back contacts use the restrained absorption pose; no fake turn.
 const frontal=pose.direction===-face;
 const q=pose.progress,frame=!frontal?2:q<.08?0:q<.4?1:q<.72?2:3;
 const f=pair[p.moving?'upper':'body'][frame];
 c.save();c.scale(face,1);
 if(e.type==='brute'&&!p.moving){c.fillStyle='#0005';c.fillRect(-18,pair.foot-2,36,5);}
 if(p.moving){
  c.save();c.beginPath();c.rect(-25,pair.waist,50,pair.foot-pair.waist+1);c.clip();
  const ok=e.type==='chaser'?drawChaserWalk(c,p):e.type==='archer'?drawArcherWalk(c,p):drawFeedbackSprite(c,e,run?.elapsed||0,{local:true,face:1,attack:{stage:'idle'}});
  c.restore();if(!ok){c.restore();return false;}
 }
 c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));
 if(run?.key||e.escapeDepth){c.strokeStyle='#ef858d';c.lineWidth=2;c.beginPath();c.moveTo(-17,17);c.lineTo(-21,12);c.moveTo(17,17);c.lineTo(21,12);c.stroke();}
 c.restore();return true;
}
