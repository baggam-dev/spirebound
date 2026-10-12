import {drawHeroSprite} from './hero-sprite.js';
// Loading/offline fallback only. The active reference-style art is in hero-sprite.js.
export const HERO_PROPORTIONS=Object.freeze({headHeight:13,height:65,top:-43,feet:22});
const ink='#111923';
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const shape=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
export function drawHero(c,p,time,bow){
 if(drawHeroSprite(c,p))return; // Keep a safe loading/offline fallback.
 const gait=p.moving?Math.sin(p.walk):0,step=gait*3.5,settle=p.moving?Math.abs(Math.cos(p.walk))*.5:Math.sin(time*1.5)*.25,swing=p.moving?Math.sin(p.walk-.6)*2:.4*Math.sin(time*1.5);
 c.save();
 // Long articulated legs: thigh, knee, shin and planted toe, rather than blocks.
 for(const side of [-1,1]){const stride=step*side,x=side<0?-6:2,heel=Math.max(0,stride)*.35;
  shape(c,[[x,-5],[x+6,-5],[x+5+stride*.4,9],[x+6+stride*.65,20-heel],[x+stride*.65,20-heel],[x-1+stride*.4,8]],ink);
  box(c,x+1,-4,4,11,'#594a43');box(c,x+1,-3,1,8,'#867563');box(c,x+stride*.4,7,5,4,'#354653');box(c,x+stride*.4+1,7,3,1,'#9aa89d');
  box(c,x+stride*.65+1,11,3,8-heel,'#493e36');box(c,x+stride*.65+1,12,1,5,'#8c7759');box(c,x+stride*.65,19-heel,8,3,ink);box(c,x+stride*.65+1,19-heel,6,2,'#77614a');box(c,x+stride*.65+1,19-heel,4,1,'#b89d73');
 }
 c.save();c.translate(0,-settle);c.rotate(gait*.018);
 // Narrow cape and quiver give the slim torso a readable outline.
 shape(c,[[-9,-27],[-16,-20],[-14-swing,1],[-8-swing,6],[-3,-8],[-2,-25]],ink);
 shape(c,[[-9,-25],[-14,-19],[-12-swing,1],[-8-swing,3],[-4,-10]],'#293f51');box(c,-12-swing,-18,1,18,'#54728a');box(c,-11-swing,-8,1,8,'#384f64');
 shape(c,[[-11,-31],[-6,-30],[-7,-10],[-12,-11]],'#5a4433');box(c,-10,-29,1,15,'#b59764');for(let i=0;i<3;i++){box(c,-12+i*2,-35-i%2*2,1,12,'#a5ada2');box(c,-13+i*2,-36-i%2*2,3,2,'#d5ded5');}
 // Drawing arm rests across the waist and pulls back on release.
 shape(c,[[-8,-25],[-12,-22],[-10,-11],[-3,-5],[8-p.recoil*3,-2],[9-p.recoil*3,-6],[-5,-10],[-6,-20]],ink);
 shape(c,[[-8,-23],[-10,-21],[-8,-12],[-3,-8],[4-p.recoil*3,-5],[-4,-11],[-5,-20]],'#526373');box(c,-10,-20,1,6,'#a3b0b0');box(c,2-p.recoil*3,-6,6,4,'#b59a76');
 // Tailored cuirass: 1px seams and small highlights, light from upper left.
 shape(c,[[-7,-28],[7,-28],[9,-21],[7,-7],[4,-3],[-5,-3],[-9,-9],[-9,-21]],ink);
 shape(c,[[-6,-26],[6,-26],[7,-20],[5,-7],[-4,-5],[-7,-9],[-7,-20]],'#455763');box(c,-6,-25,11,2,'#93a4a4');box(c,-6,-22,2,11,'#6c858b');box(c,-3,-21,7,9,'#354550');box(c,-2,-20,1,7,'#91a1a0');box(c,5,-20,1,12,'#293840');
 shape(c,[[-6,-21],[6,-12],[5,-9],[-7,-18]],'#79614b');box(c,-5,-19,2,1,'#c0a47b');box(c,1,-14,2,1,'#baa079');box(c,-7,-7,14,3,'#46372d');box(c,-6,-7,11,1,'#ae8b5a');box(c,-1,-7,3,3,'#d8b77c');box(c,0,-6,1,1,'#5d4431');
 box(c,-6,-4,12,4,'#514943');box(c,-5,-3,3,2,'#73665b');box(c,3,-3,2,3,'#353d44');
 // 13px head at a total standing height of 65px: approximately five heads.
 box(c,-3,-31,6,5,'#9c7660');box(c,-2,-31,4,3,'#e2bfa1');
 shape(c,[[-6,-42],[3,-43],[7,-39],[6,-33],[3,-30],[-3,-31],[-6,-35]],ink);
 box(c,-4,-39,9,7,'#ba9075');box(c,-2,-38,7,6,'#e5c3a2');box(c,0,-37,5,4,'#f2d5b5');
 shape(c,[[-6,-40],[-5,-42],[2,-43],[6,-40],[6,-37],[3,-39],[-1,-38],[-3,-36],[-5,-33]],'#a77839');box(c,-4,-41,5,1,'#f6d28b');box(c,-4,-40,7,1,'#dab368');box(c,-2,-39,4,1,'#eed092');box(c,-5,-38,2,5,'#c3954f');box(c,-5,-37,1,3,'#f1cc83');
 box(c,1,-36,4,1,'#615044');box(c,2,-35,3,1,'#f5f5df');box(c,4,-35,1,1,'#31515f');box(c,5,-34,1,1,'#c89c7d');box(c,1,-32,3,1,'#9d6e60');box(c,-2,-29,7,3,'#6e363c');box(c,-2,-29,5,1,'#c17769');box(c,-3,-26,2,7,'#a45450');
 // Long bow arm descends naturally to the existing arrow/nock anchor.
 c.save();c.translate(0,-p.recoil*.6);c.rotate(-gait*.015);
 shape(c,[[7,-25],[12,-23],[14,-12],[20,-5],[20,2],[15,3],[10,-8],[8,-16]],ink);
 shape(c,[[8,-23],[11,-21],[12,-12],[17,-6],[16,-2],[11,-8],[9,-16]],'#526575');box(c,9,-23,3,2,'#b0bcb5');box(c,12,-11,2,4,'#87988e');box(c,16,-3,4,5,'#ad9070');box(c,17,-3,2,3,'#debf94');bow(c,20-p.recoil*3,-2+gait*.3,p.recoil*6);c.restore();
 c.restore();c.restore();
}
