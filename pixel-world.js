import {objectPoint} from './object-positions.js';
import {interactionAge} from './interaction-visuals.js';
import {bossPose} from './boss-poses.js';
import {drawSkillTrail} from './skill-visuals.js';
// Presentation only: animation history never enters the saved run or combat RNG.
const motion = new WeakMap();
const ink = '#111720';
const palettes = {fire:['#ff713d','#ffe7a0'],frost:['#71c9ef','#e8fcff'],poison:['#73cc68','#d7ff99'],chain:['#a18aff','#f5e9ff']};
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function diamond(c,x,y,r,color){for(let i=-r;i<=r;i+=2)box(c,x-(r-Math.abs(i)),y+i,(r-Math.abs(i))*2+2,2,color);}
function pose(e,time,attack=0){
 let p=motion.get(e);if(!p){p={x:e.x,y:e.y,time,walk:0,face:1,attack,release:-10};motion.set(e,p);}
 if(time!==p.time){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d>.05&&d<40){p.walk+=d*.16;if(Math.abs(e.x-p.x)>.1)p.face=Math.sign(e.x-p.x);}if(attack>p.attack+.02)p.release=time;p.moving=d>.05&&d<40;p.x=e.x;p.y=e.y;p.time=time;p.attack=attack;}
 return {...p,step:p.moving?Math.round(Math.sin(p.walk)*3):0,recoil:Math.max(0,1-(time-p.release)/.2)};
}
function bow(c,x,y,pull=0){line(c,[[x,y-15],[x+5,y-11],[x+8,y],[x+5,y+11],[x,y+15]],ink,5);line(c,[[x,y-15],[x+5,y-11],[x+8,y],[x+5,y+11],[x,y+15]],'#c9a066',3);line(c,[[x,y-15],[x-pull,y],[x,y+15]],'#efe0b6',1);box(c,x-10-pull,y-1,23,2,'#f4deb0');diamond(c,x+14,y,3,'#d9e8df');}
export function drawPixelActor(c,e,time=0,run=null){
 const hero=e.type==='player',boss=e.type==='boss',p=pose(hero&&run?run.player:e,time,hero?run?.attack||0:0),red=!!run?.key;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));
 box(c,boss?-30:-15,17,boss?60:30,5,'#0005');
 if(hero){
  const shot=p.recoil>0&&run?.projectiles?.findLast(b=>!b.enemy&&!b.passive&&!(b.delay>0)&&b.life>2.7);
  if(shot&&Math.abs(shot.vx)>20){p.face=Math.sign(shot.vx);const history=motion.get(run.player);if(history)history.face=p.face;}
  c.scale(p.face,1);const bob=p.moving?Math.abs(p.step)*.5:Math.floor(Math.sin(time*2)*1.2);
  // Split boots, asymmetric quiver, layered cloak, leather tunic and hood.
  box(c,-10,10+p.step,8,11,ink);box(c,3,10-p.step,8,11,ink);box(c,-9,13+p.step,6,5,'#9a7652');box(c,4,13-p.step,6,5,'#9a7652');
  c.translate(0,-bob);box(c,-14,-13,27,28,ink);box(c,-16,2+p.step/2,7,15,'#243d43');box(c,-12,-12,22,27,'#365c60');box(c,-9,-10,5,22,'#527c76');box(c,7,-9,5,25,'#233d48');box(c,-5,-7,13,21,'#735b43');box(c,-3,-5,3,13,'#a18459');
  box(c,-15,-19,5,25,'#664c37');for(let i=0;i<3;i++){box(c,-16+i*3,-25-i%2*3,1,17,'#c6ab72');box(c,-17+i*3,-26-i%2*3,3,4,'#c5d4c7');}
  box(c,-11,-25,21,18,ink);box(c,-8,-28,15,4,ink);box(c,-9,-24,17,13,'#416967');box(c,-6,-26,11,4,'#719486');box(c,-7,-22,14,3,'#89aa8d');box(c,-6,-18,14,10,'#bf9871');box(c,-4,-17,12,4,'#edd0a0');box(c,3,-16,3,3,ink);box(c,7,-13,3,3,'#d2a77d');box(c,-10,-9,20,5,'#9b5647');box(c,-14,-7,7,6,'#703e39');
  box(c,-9,6,20,4,'#302c2b');box(c,1,6,4,4,'#e4bc75');box(c,8,-5,7,12,'#405b55');box(c,11,3,7,5,'#d8b386');bow(c,19-p.recoil*3,-2,p.recoil*6);
 }else if(boss){
  const attack=bossPose(e);c.translate(0,attack.bodyY-attack.lift);
  box(c,-25,-22,50,43,ink);box(c,-22,-20,44,39,red?'#763a47':'#454654');
  for(const side of [-1,1]){box(c,side<0?-26:10,16,16,13,'#282b35');box(c,side<0?-31:18,-22,17,21,'#988778');box(c,side<0?-29:20,-21,13,4,'#c7b697');box(c,side<0?-30:24,-44,6,23,'#d0b783');box(c,side<0?-34:28,-47,6,8,'#f0d49b');}
  box(c,-20,-38,40,25,ink);box(c,-17,-35,34,19,'#756c71');box(c,-17,-35,34,4,'#aba08e');box(c,-12,-26,24,6,'#252632');box(c,-10,-25,6,3,'#ffc087');box(c,5,-25,6,3,'#ffc087');box(c,-3,-35,6,22,'#a99377');
  for(let i=0;i<3;i++){box(c,-18,-12+i*9,36,6,'#726774');box(c,-17,-12+i*9,34,2,'#97868b');}diamond(c,0,-7,6,'#e0b06e');diamond(c,0,-7,2,'#fff1b2');
  c.save();c.translate(-34,-5-(attack.stage==='air'?30:attack.charge*24));c.rotate(attack.weapon);box(c,-3,-10,5,39,'#8d704a');box(c,-11,-23,22,17,ink);box(c,-9,-21,18,12,'#a6a397');box(c,-7,-21,14,3,'#dad4b0');c.restore();if(attack.stage==='windup'){diamond(c,0,-7,3+Math.round(attack.charge*2),'#fff0b9');}

 }else{
  c.scale(p.face,1);const cloth=red?'#9b4654':({archer:'#675981',charger:'#8d7152',scatter:'#977052',chaser:'#607b6d',ringcaster:'#854b72',ambusher:'#894b59',strafer:'#865569'})[e.type]||'#516175';
  box(c,-10,10+p.step,8,11,ink);box(c,3,10-p.step,8,11,ink);box(c,-8,12+p.step,5,5,'#777365');box(c,4,12-p.step,5,5,'#777365');
  box(c,-13,-12,26,28,ink);box(c,-11,-10,22,24,cloth);box(c,-8,-8,4,19,'#ffffff23');box(c,5,-8,5,21,'#0003');box(c,-12,7,24,4,'#352d31');box(c,-2,7,4,4,'#c6a574');
  box(c,-10,-24,20,17,ink);box(c,-8,-22,16,13,cloth);box(c,-5,-20,12,3,'#afac91');box(c,-6,-16,14,5,'#1b2028');box(c,-4,-15,3,2,red?'#ffb1a0':'#f1cf93');box(c,4,-15,3,2,red?'#ffb1a0':'#f1cf93');
  if(e.type==='archer'||e.type==='strafer')bow(c,16,-2);
  else if(e.type==='charger'){box(c,-15,-28,5,17,'#d8c399');box(c,11,-28,5,17,'#d8c399');box(c,15,-5,4,26,'#80654a');box(c,12,-14,10,13,'#bcb8a1');box(c,12,-14,3,12,'#ece4bd');}
  else if(e.type==='scatter'){box(c,8,-3,14,12,'#b49963');box(c,19,-1,7,8,'#343b43');box(c,20,0,3,6,'#e9ba7e');}
  else if(e.type==='chaser'||e.type==='ambusher'){box(c,14,-8,3,24,'#b9c6b7');box(c,12,9,8,3,'#c5a063');box(c,14,13,3,8,'#675039');}
  else{box(c,16,-24,3,43,'#a08a69');diamond(c,17,-25,6,red?'#f3a1b2':'#ba9de2');}
 }
 c.restore();
}
export function drawWorldDetails(c,s,r){
 const t=s.elapsed,group=Math.floor(s.floor/2),accent=['#6e8066','#827499','#899257','#96806a'][group]||'#728473';c.save();
 // Quiet floor detail, kept underneath entities and every combat telegraph.
 for(let i=0;i<65;i++){const x=40+(i*137+s.floor*43)%865,y=55+(i*79+s.floor*17)%425;box(c,x,y,5+i%7,1,'#a4a79513');if(i%6===0){box(c,x,y,2,6,'#0a12193b');box(c,x+2,y+5,7,2,'#0a12193b');}}
 for(const x of [32,918])for(let y=80;y<470;y+=75){box(c,x,y,10,31,'#151e23');box(c,x-2,y,14,4,accent);box(c,x+2,y+5,3,22,'#ffffff18');box(c,x-2,y+29,14,4,'#263438');}
 for(const x of [85,875])for(const y of [82,455]){box(c,x-10,y+12,20,5,ink);box(c,x-6,y-3,12,15,'#756b55');box(c,x-5,y,10,3,'#b49d6c');const f=Math.floor(t*9+x)%3;box(c,x-6,y-12-f*2,12,13+f*2,'#d66e3c');box(c,x-3,y-15+f,6,14,'#ffc56f');box(c,x-1,y-9,3,7,'#fff0b2');box(c,x+4-f*3,y-24-(t*17%12),2,3,'#f2b568');}
 c.restore();
}
function chest(c,x,y,used,age=Infinity){box(c,x-19,y-2,38,28,ink);box(c,x-17,y,34,23,used?'#514534':'#825a38');box(c,x-15,y+2,30,7,used?'#71634b':'#bf9354');box(c,x-17,y+10,34,3,ink);for(const dx of [-12,9]){box(c,x+dx,y,3,23,'#c2a363');box(c,x+dx,y+3,2,2,'#eee0aa');}box(c,x-3,y+9,6,8,'#e7c77c');box(c,x-1,y+12,2,3,ink);if(used){const lift=Math.round(12*Math.min(1,age/.25));box(c,x-15,y+1,30,8,'#171c22');box(c,x-17,y-lift,34,7,'#806443');box(c,x-15,y-lift+1,30,2,'#bca16b');for(const dx of [-12,9])box(c,x+dx,y-lift,3,7,'#c2a363');}}
export function drawObjectDetails(c,s,r){c.save();const t=s.elapsed;
 for(const o of r.obstacles||[]){const {x,y,w,h}=o;box(c,x+3,y+h-3,w-6,2,'#141c2580');if(o.type==='rock'){box(c,x+9,y+9,Math.max(3,w-23),2,'#cad1af77');line(c,[[x+w*.6,y+8],[x+w*.5,y+h*.4],[x+w*.65,y+h*.6]],'#283b37',2);box(c,x+3,y+h-11,9,5,'#4a624a');}if(o.type==='bookshelf'){for(let row=0;row<2;row++)for(let j=0;j<Math.floor((w-12)/10);j++)box(c,x+9+j*10,y+11+row*23,4,2,'#d7bd7e');}if(o.type==='table'){box(c,x+w/2+2,y+14,8,1,'#6a6557');box(c,x+10,y+8,5,9,'#d8c39a');box(c,x+11,y+5,3,4,'#ffcf7b');}}
 if(r.hasChest){const q=objectPoint(r,true);chest(c,q.x,q.y-20,r.chestUsed,interactionAge(s,r,'chest'));}
 const q=objectPoint(r);c.translate(q.x-480,q.y-115);
 if(r.type==='treasure')chest(c,480,95,r.used,interactionAge(s,r,'chest'));
 if(r.type==='shrine'||r.type==='event'){box(c,457,121,46,7,'#242532');box(c,460,119,40,3,'#a396a0');box(c,472,92,3,23,'#ffffff25');diamond(c,480,102,6,r.used?'#726c81':'#d3adf0');diamond(c,480,101,2,'#f2dbff');for(const x of [458,502]){box(c,x-2,108,4,12,'#d8c59e');if(!r.used)box(c,x-1,103-Math.floor(t*5)%2,2,5,'#e9a7ff');}}
 if(r.type==='fountain'){box(c,456,121,48,4,'#384e59');box(c,462,102,36,2,r.used?'#526565':'#afd8d2');if(!r.used){for(let i=0;i<3;i++){const x=465+(i*11+Math.floor(t*9))%30;box(c,x,109+i%2*5,6,1,'#ceeee3');}box(c,478,89,4,15,'#78bdbd');box(c,479,88,2,12,'#d3f5ed');}}
 if(['up','down','exit'].includes(r.type)){for(let i=0;i<5;i++){box(c,458+i*3,90+i*7,43-i*6,1,'#d6ceb077');box(c,455+i*3,91+i*7,2,4,'#273735');}box(c,451,87,4,39,'#4e5d58');box(c,505,87,4,39,'#4e5d58');box(c,450,85,6,3,'#a5ac8c');box(c,504,85,6,3,'#a5ac8c');}
 c.restore();}
export function drawProjectile(c,b,time=0,player={}){if(b.delay>0)return;const [color,light]=palettes[b.element]||[({sunFairy:'#ff993f',snowFairy:'#99ddff',stormFairy:'#ffe16a',turret:'#cfb786'})[b.passive]|| (b.dark?'#c792ee':b.ricochet?'#74e1dd':b.poisonShot?'#d59bea':b.enemy?'#ed8877':'#d9c492'),'#fff2cd'];
 c.save();c.translate(Math.round(b.x),Math.round(b.y));c.rotate(Math.atan2(b.vy??0,b.vx??1));
 if(b.enemy){const size=b.poisonShot==='orb'?6:3;diamond(c,0,0,size+1,ink);diamond(c,0,0,size,color);box(c,-1,-1,2,2,light);}
 else{box(c,-17,-2,14,4,color+'44');box(c,-10,-1,16,2,light);diamond(c,5,0,b.frostShard?4:3,color);box(c,-9,-3,3,2,color);box(c,-9,2,3,2,color);
  if(b.element){c.save();drawSkillTrail(c,b.element,player,time);c.restore();
   if(b.element==='chain')line(c,[[-20,0],[-14,-4],[-11,2],[-5,-2]],color,1);
   if(b.element==='fire'){box(c,-7,-3,9,6,color);box(c,-3,-1,7,2,light);box(c,-11,-2,4,3,'#e64f36');}
   if(b.element==='frost'){diamond(c,3,0,4,color);line(c,[[-3,0],[7,0]],light,1);box(c,-12,-4,2,8,color+'88');box(c,-15,-1,8,2,color+'88');}
   if(b.element==='poison'){diamond(c,3,0,4,color);box(c,1,-2,3,2,light);box(c,-9,3,3,3,color);}
  }
 }c.restore();}
export function drawImpact(c,f){
 if(f.text||f.thunder||f.slash)return;const progress=Math.max(0,Math.min(1,1-f.t));c.save();c.globalAlpha=Math.max(0,Math.min(1,f.t));
 if(f.toX!==undefined){const dx=f.toX-f.x,dy=f.toY-f.y,len=Math.hypot(dx,dy)||1;const pts=[];for(let i=0;i<=8;i++){const jitter=i===0||i===8?0:(i%2?1:-1)*6;pts.push([f.x+dx*i/8-dy/len*jitter,f.y+dy*i/8+dx/len*jitter]);}line(c,pts,f.color||'#baacff',4);line(c,pts,'#f4efff',1);}
 else if(Number.isFinite(f.r)){for(let i=0;i<8;i++){const a=i*Math.PI/4,rad=f.r*progress;box(c,f.x+Math.cos(a)*rad-2,f.y+Math.sin(a)*rad-2,3,3,f.color||'#f7d7a5');}}
 c.restore();}
export function drawSpellDetails(c,r,time){c.save();
 for(const e of r.enemies){if(e.frozen>0){for(const side of [-1,1]){line(c,[[e.x+side*16,e.y+12],[e.x+side*12,e.y-20],[e.x+side*5,e.y-12]],'#d1f5ff',2);}}if(e.poisonStacks?.length){for(let i=0;i<3;i++){const y=e.y+10-(time*15+i*11)%28;box(c,e.x-13+i*12,y,3,3,'#9ce17899');}}}
 c.restore();}
export function drawArmorDetail(c,time=0,royal=false){
 box(c,-9,-30,18,2,'#e4d2bb77');box(c,-11,-18,22,3,ink);box(c,-8,-15,16,3,'#dfc6a366');
 for(const side of [-1,1]){box(c,side<0?-19:12,-16,6,3,'#ead6bc88');box(c,side<0?-19:14,-10,3,6,'#191d2e');box(c,side<0?-9:5,14,4,7,'#a69aaa55');}
 for(let i=0;i<3;i++)box(c,-8,-5+i*6,16,1,'#c4aec14d');box(c,-12,10,24,3,'#181c29');diamond(c,0,11,3,royal?'#edc785':'#b4a1d3');
 if(royal){box(c,-14,-39,28,2,'#f7db93');diamond(c,0,-37,3,'#f5c9ed');for(let i=0;i<3;i++)box(c,-16+i*13,22+Math.round(Math.sin(time*3+i)*2),5,3,'#bd875e');}
}
export function drawCrystalBody(c,e,time=0){const attack=bossPose(e);c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(e.scale??1,e.scale??1);
 box(c,-29,17,58,7,'#0005');box(c,-27,-18,54,37,ink);box(c,-25,-16,50,32,e.escapeDepth?'#7b3b61':'#423c60');
 for(const side of [-1,1]){box(c,side<0?-27:17,-16,10,29,'#817196');box(c,side<0?-26:18,-16,8,3,'#c9b5ce');for(let i=0;i<3;i++)box(c,side<0?-24:20,-9+i*8,3,3,'#c9a4ef');}
 const y=-12+Math.round(Math.sin(time*2.4)*2)-Math.round(attack.charge*9)+attack.bodyY;diamond(c,0,y,23,ink);diamond(c,0,y,20,e.escapeDepth?'#e087ac':'#71b8c3');
 for(let i=0;i<18;i+=2)box(c,-i/2,y-18+i,i/2+1,2,'#d5f5ea');line(c,[[0,y-19],[0,y+18],[16,y]],'#f2f7ff',1);diamond(c,0,y,attack.stage==='strike'?8:5,attack.stage==='strike'?'#fff7d5':'#f1e4ff');
 for(let i=0;i<3;i++){const a=(attack.stage==='idle'?time*.8:attack.charge*1.5+(e.prismShot||0)*.5)+i*Math.PI*2/3,orbit=attack.stage==='recover'?27:34+attack.charge*9;diamond(c,Math.cos(a)*orbit,Math.sin(a)*12-10,4,attack.stage==='strike'?'#fff0cf':'#bcb4e5');}c.restore();}
export function drawOrganicBody(c,e,r,time=0,room={}){const attack=bossPose(e,room);c.save();c.translate(Math.round(e.x),Math.round(e.y));const red=!!e.escapeDepth;
 if(e.type==='flower'){
  box(c,-4,-4,8,27,'#374e38');box(c,-1,-3,3,25,'#849458');for(const side of [-1,1]){box(c,side<0?-16:4,12,12,4,'#69834b');box(c,side<0?-12:6,8,8,5,'#405d3c');}
  for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.sin(time*2)*.06,x=Math.cos(a)*13,y=-12+Math.sin(a)*11;diamond(c,x,y,9,ink);diamond(c,x,y,7,red?'#c96669':'#88945d');diamond(c,x-1,y-2,3,red?'#f5a38a':'#bfbd77');}diamond(c,0,-12,8,'#342f39');box(c,-5,-15,10,7,'#d7ad71');box(c,-4,-13,2,3,ink);box(c,2,-13,2,3,ink);
 }else{
  const pulse=e.frozen>0?0:Math.sin(time*3+(e.id||0))*.035,ry=r*(.72+pulse-attack.charge*.1+attack.release*.07),rx=r*(1-pulse),body=red?'#b85b64':'#6b9d65';
  for(let y=-Math.ceil(ry/2)*2;y<=ry;y+=2){const width=Math.sqrt(Math.max(0,1-(y/ry)**2))*rx;box(c,-width-2,y,width*2+4,2,ink);box(c,-width,y,width*2,2,y>ry*.4?(red?'#833a51':'#3d6d54'):body);}
  box(c,-r*.55,-ry*.55,r*.42,3,red?'#f2a290':'#bad99b');box(c,-r*.65,-ry*.3,r*.18,3,'#ffffff77');box(c,-r*.36,-5,4,6,ink);box(c,r*.22,-5,4,6,ink);box(c,-r*.34,-5,2,2,'#fff3c7');box(c,r*.24,-5,2,2,'#fff3c7');box(c,-3,4,6,attack.stage==='strike'?7:attack.stage==='windup'?3+Math.round(attack.charge*3):2,ink);if(attack.stage==='strike')box(c,-2,6,4,3,'#c3e58f');
  if(e.variant==='slime'){diamond(c,0,11,Math.max(4,Math.round(r/5)),red?'#ed9bad':'#b9cb75');for(let i=0;i<3;i++)box(c,-10+i*8,-ry-3-(i===1?4:0),5,7,'#ccb978');}
 }c.restore();}
export function drawTurretDetail(c,t,time){
 c.save();c.translate(t.x,t.y);box(c,-14,13,28,4,'#171c24');for(const side of [-1,1]){box(c,side<0?-13:8,7,5,8,'#786247');box(c,side<0?-12:9,8,2,3,'#cbbb8a');}c.rotate(t.aim||0);
 box(c,-9,-4,28,8,'#372e2a');box(c,-9,-3,27,2,'#e0c889');box(c,3,1,14,2,'#8e7553');box(c,-4,-7,5,14,'#ba9861');diamond(c,-2,0,3,'#e5dfa6');box(c,15,-1,8,2,'#e9e8d3');
 for(const side of [-1,1])box(c,-8,side*12-2,4,4,'#e0bf7c');c.restore();
}
export function drawDoorFrame(c,x,y,side,locked){c.save();const w=side?29:80,h=side?70:35;
 if(side){for(const dy of [-6,h]){box(c,x,y+dy,w,6,'#171e24');box(c,x,y+dy,w,2,'#858674');}if(locked){for(let i=0;i<4;i++)box(c,x+4,y+8+i*16,15,3,'#ccb27b');box(c,x+10,y+29,8,12,'#493d34');}}
 else{for(const dx of [-7,w]){box(c,x+dx,y,7,h,'#171e24');box(c,x+dx,y,3,h,'#858674');}if(locked){for(let i=0;i<5;i++)box(c,x+6+i*15,y+3,3,17,'#c2a16e');box(c,x+35,y+5,10,11,'#493d34');box(c,x+39,y+8,2,4,'#dbc086');}}
 c.restore();}
