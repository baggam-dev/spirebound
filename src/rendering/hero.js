// Mercenary archer: grounded stride, counter-rotating torso and trailing short cape.
const ink='#111720';
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function drawHero(c,p,time,bow){
 const gait=p.moving?Math.sin(p.walk):0,step=gait*3,settle=p.moving?Math.abs(Math.cos(p.walk))*.6:Math.sin(time*1.5)*.3;
 const lean=p.moving?.055:0,swing=p.moving?Math.sin(p.walk-.7)*2:Math.sin(time*1.5)*.3;
 // Boots plant alternately; knees shift forwards instead of bouncing the whole body.
 for(const side of [-1,1]){const stride=step*side,x=side<0?-9:3;box(c,x+stride*.35,8,7,12,ink);box(c,x+stride*.35+1,9,5,8,'#665040');box(c,x+stride*.5,18-Math.max(0,stride)*.3,9,4,'#302b2a');box(c,x+stride*.5+1,18-Math.max(0,stride)*.3,6,1,'#9e7650');}
 c.save();c.translate(0,-settle);c.rotate(lean+gait*.018);
 // Short heavy cape and quiver trail behind the shoulder.
 box(c,-15-swing,-13,17,25,ink);box(c,-14-swing,-12,14,22,'#293b49');box(c,-12-swing,-10,3,19,'#435563');box(c,-16-swing,7,9,5,'#26323d');
 box(c,-15,-19,5,24,'#51463c');for(let i=0;i<3;i++){box(c,-16+i*3,-25-i%2*3,1,15,'#a49a7d');box(c,-17+i*3,-26-i%2*3,3,4,'#bcc8c8');}
 box(c,-11,-12,23,23,ink);box(c,-9,-10,19,19,'#303439');box(c,-8,-10,16,3,'#768287');box(c,-7,-6,14,9,'#444d51');box(c,-5,-5,3,9,'#8b9797');box(c,7,-7,3,12,'#3a3636');
 box(c,-13,-12,9,8,'#384149');box(c,-13,-12,9,2,'#a2aeaa');box(c,-11,-9,6,3,'#687982');box(c,-9,5,20,4,'#533e35');box(c,0,5,4,4,'#d9b36a');box(c,-5,9,11,4,'#574539');
 // A larger honey-blond silhouette and softer face read at the game's small scale.
 box(c,-10,-32,22,24,ink);box(c,-7,-27,16,16,'#ae8066');box(c,-5,-26,14,13,'#e0b89a');box(c,-3,-25,11,10,'#f0c9a9');
 box(c,-10,-34,18,4,'#a76d2f');box(c,-12,-32,23,6,'#d4a044');box(c,-10,-34,12,3,'#f2c969');box(c,-8,-30,17,4,'#edbd5c');box(c,-10,-27,5,9,'#c38a37');box(c,-9,-24,3,7,'#f3c86a');
 box(c,-2,-29,10,3,'#f8d77e');box(c,1,-26,7,2,'#d69b43');box(c,8,-28,3,10,'#b97c35');box(c,9,-24,2,5,'#efbf61');box(c,-9,-16,3,6,'#d6a14c');
 box(c,0,-23,7,1,'#674b3e');box(c,1,-21,5,1,'#edf0e8');box(c,5,-21,1,2,'#384a50');box(c,7,-18,1,2,'#ce9e81');box(c,2,-15,5,1,'#9e665c');box(c,-3,-12,12,3,'#d3a28b');
 box(c,-6,-11,17,4,'#614541');box(c,-5,-10,11,2,'#a8484c');
 // Bow arm leads; the drawing arm follows the gait and snaps back on release.
 c.save();c.translate(0,-p.recoil*1.5);c.rotate(-gait*.025);box(c,8,-7,7,11,'#3a4853');box(c,10,-7,7,3,'#84938f');box(c,12,1,8,5,'#715d4a');box(c,15,1,5,3,'#bca181');bow(c,20-p.recoil*3,-2+gait*.5,p.recoil*6);c.restore();
 c.restore();
}
