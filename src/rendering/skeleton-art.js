import {DeferredImage} from './asset-requests.js';
import {isSkeleton,SKELETON} from '../combat/skeleton-profile.js';
const art={warrior:[],archer:[],fx:[]};
function load(family,i){return typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{const im=new DeferredImage();im.onload=()=>{const expected=family==='fx'?[96,96]:[144,128];if(im.naturalWidth===expected[0]&&im.naturalHeight===expected[1]){art[family][i]=im;resolve(true);}else resolve(false);};im.onerror=()=>resolve(false);im.src=new URL(`../../assets/images/skeleton-${family}-${i}.png`,import.meta.url).href;});}
export const skeletonArtReady=Promise.all(['warrior','archer','fx'].flatMap(f=>Array.from({length:f==='fx'?6:8},(_,i)=>load(f,i))));
export const skeletonArtState=()=>Object.fromEntries(Object.entries(art).map(([k,v])=>[k,v.filter(Boolean).length]));
function effect(c,index,x,y,size=90,alpha=1){const im=art.fx[index];if(!im)return false;c.save();c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;c.drawImage(im,x-size/2,y-size/2,size,size);c.restore();return true;}
export function drawSkeletonSprite(c,e,time=0,reduced=false){
 if(!isSkeleton(e))return false;
 const a=e.skeletonAttack,warrior=e.type==='skeletonWarrior';let index=e.skeletonMoving&&!(e.frozen>0)&&!(e.spawnGrace>0)?1+Math.floor((e.skeletonWalk||0)/.12)%2:0;
 if(a&&a.stage!=='recover')index=warrior?(a.kind==='dash'?(a.stage==='windup'?5:6):a.stage==='windup'?3:4):a.kind==='burst'?6:a.stage==='active'?4:a.kind==='ricochet'?5:3;
 const im=art[warrior?'warrior':'archer'][index];if(!im)return false;
 if(e.elite){effect(c,2,e.x,e.y+10,85,.8);if(!reduced)effect(c,3,e.x,e.y-20,80,.35+.1*Math.sin(time*5));}
 c.save();if(e.spawnGrace>0)c.globalAlpha*=.4+.6*(1-Math.min(1,e.spawnGrace/.6));c.translate(Math.round(e.x),Math.round(e.y+18));if(Math.cos(e.facing||0)<0)c.scale(-1,1);c.imageSmoothingEnabled=false;c.drawImage(im,-60,-105,135,120);c.restore();if(warrior&&a?.stage==='active'){c.save();c.translate(e.x,e.y-12);c.rotate(a.aim);effect(c,4,28,0,reduced?55:72,reduced?.4:.7);c.restore();}return true;
}
export function drawSkeletonProjectile(c,b){if(!b.skeletonShot||!art.fx[5])return false;c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));c.imageSmoothingEnabled=false;c.drawImage(art.fx[5],-20,-20,40,40);c.restore();return true;}
export function drawSkeletonDeath(c,f){
 if(!f.skeletonType)return false;const im=art[f.skeletonType==='skeletonWarrior'?'warrior':'archer'][7];if(!im)return false;
 c.save();c.globalAlpha*=Math.max(0,f.t/f.duration);c.translate(f.x,f.y+18);if(f.face<0)c.scale(-1,1);c.imageSmoothingEnabled=false;c.drawImage(im,-60,-105,135,120);c.restore();return true;
}
export function drawSkeletonWarnings(c,r,time=0,reduced=false){
 c.save();
 for(const e of r.enemies){
  if(e.variant==='king'&&e.hp>0)for(const p of e.skeletonPortals||[]){if(!effect(c,e.skeletonPortalTime>.4?0:1,p.x,p.y+7,94,reduced?.55:.9)){c.strokeStyle='#b29bd1';c.beginPath();c.ellipse(p.x,p.y,30,12,0,0,Math.PI*2);c.stroke();}}
  const a=e.skeletonAttack;if(!isSkeleton(e)||e.hp<=0||a?.stage!=='windup')continue;
  c.strokeStyle=a.kind==='dash'?'#e3a17b':a.kind==='ricochet'?'#d2b0ef':'#e2c9a2';c.lineWidth=2;
  if(a.kind==='dash'){const reach=SKELETON.dashSpeed*SKELETON.dashDuration,rad=SKELETON.dashRadius;c.save();c.translate(e.x,e.y);c.rotate(a.aim);c.fillStyle='#e3a17b22';c.fillRect(-rad,-rad,reach+2*rad,2*rad);c.strokeRect(-rad,-rad,reach+2*rad,2*rad);c.restore();}
  if(a.kind==='slash'){c.save();c.fillStyle='#e2c9a222';c.strokeStyle='#e2c9a244';c.lineWidth=28;c.beginPath();c.moveTo(e.x,e.y);c.arc(e.x,e.y,SKELETON.slashRange,a.aim-SKELETON.slashHalfAngle,a.aim+SKELETON.slashHalfAngle);c.closePath();c.fill();c.stroke();c.restore();}
  for(const offset of a.kind==='fan'?[-.3,0,.3]:[0]){const aim=a.aim+offset,length=a.kind==='dash'?145:a.kind==='slash'?68:260;c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x+Math.cos(aim)*length,e.y+Math.sin(aim)*length);c.stroke();}
  c.font='10px Galmuri,monospace';c.textAlign='center';c.fillStyle='#e8d1aa';c.fillText(({dash:'대시 베기',slash:'베기',fan:'부채꼴',ricochet:'반사탄',burst:'3연사'})[a.kind],e.x,e.y-72);
 }
 c.restore();
}
