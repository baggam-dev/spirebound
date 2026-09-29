// Mercenary archer: grounded stride, counter-rotating torso and trailing short cape.
const ink='#111720';
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function drawHero(c,p,time,bow){
 const gait=p.moving?Math.sin(p.walk):0,step=gait*3,settle=p.moving?Math.abs(Math.cos(p.walk))*.6:Math.sin(time*1.5)*.3;
 const lean=p.moving?.055:0,swing=p.moving?Math.sin(p.walk-.7)*2:Math.sin(time*1.5)*.3;
 // Boots plant alternately; knees shift forwards instead of bouncing the whole body.
 for(const side of [-1,1]){const stride=step*side,x=side<0?-9:3;box(c,x+stride*.35,8,7,12,ink);box(c,x+stride*.35+1,9,5,8,'#444d51');box(c,x+stride*.5,18-Math.max(0,stride)*.3,9,4,'#272e34');box(c,x+stride*.5+1,18-Math.max(0,stride)*.3,6,1,'#778185');}
 c.save();c.translate(0,-settle);c.rotate(lean+gait*.018);
 // Short heavy cape and quiver trail behind the shoulder.
 box(c,-15-swing,-13,17,29,ink);box(c,-14-swing,-12,14,26,'#293b49');box(c,-12-swing,-10,3,23,'#435563');box(c,-16-swing,9,9,7,'#26323d');
 box(c,-15,-19,5,24,'#51463c');for(let i=0;i<3;i++){box(c,-16+i*3,-25-i%2*3,1,15,'#a49a7d');box(c,-17+i*3,-26-i%2*3,3,4,'#bcc8c8');}
 box(c,-11,-12,23,27,ink);box(c,-9,-10,19,23,'#46535c');box(c,-8,-10,16,3,'#8a9698');box(c,-7,-6,14,10,'#596a73');box(c,-5,-5,3,10,'#819293');box(c,7,-7,3,15,'#303e48');
 box(c,-13,-12,9,8,'#2d3942');box(c,-13,-12,9,2,'#9aa7a6');box(c,-11,-9,6,3,'#60747c');box(c,-9,7,20,4,'#352e29');box(c,0,7,4,4,'#c6ae77');box(c,-5,11,11,5,'#34424b');
 // Unhooded, narrow eyes and a clean jaw, with swept dark hair.
 box(c,-8,-29,18,19,ink);box(c,-6,-26,14,14,'#b7957c');box(c,-4,-25,12,10,'#d1b298');box(c,-3,-24,10,3,'#e2c4a5');box(c,-7,-30,16,7,'#263039');box(c,-8,-27,5,12,'#263039');box(c,-5,-30,11,2,'#4b5358');box(c,2,-27,7,2,'#303840');
 box(c,1,-22,7,2,'#343238');box(c,3,-20,3,1,'#d7e1d8');box(c,5,-20,2,2,'#22292e');box(c,8,-19,2,4,'#c4a086');box(c,1,-14,7,2,'#8e7366');box(c,-5,-11,16,4,'#655047');box(c,-5,-11,13,1,'#a08b78');
 // Bow arm leads; the drawing arm follows the gait and snaps back on release.
 c.save();c.translate(0,-p.recoil*1.5);c.rotate(-gait*.025);box(c,8,-7,7,11,'#3a4853');box(c,10,-7,7,3,'#84938f');box(c,12,1,8,5,'#715d4a');box(c,15,1,5,3,'#bca181');bow(c,20-p.recoil*3,-2+gait*.5,p.recoil*6);c.restore();
 c.restore();
}
