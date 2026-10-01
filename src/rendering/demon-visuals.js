import {drawSoftField} from './ground-visuals.js';

const color={hand:'#b75c96',foot:'#9a698d',eye:'#d7a4e5',nose:'#9a608f',mouth:'#bd6c9e',core:'#9b4e82'};
function box(c,x,y,w,h,fill){c.fillStyle=fill;c.fillRect(Math.round(x),Math.round(y),w,h);}
function oval(c,x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
export function drawDemonGround(c,r,time=0){
 const d=r.demon;if(!d)return;c.save();
 if(d.phase===3){box(c,353,72,254,72,'#0a0913');for(let i=0;i<8;i++){const x=365+i*32,y=72+(i%3)*5;box(c,x,y,27,7,'#48504c');box(c,x+4,145+(i%2)*3,24,5,'#4e5151');if(d.recovery>0)box(c,x+12,92+((time*80+i*23)%65),5,4,'#a38a9a');}}
 for(const o of r.obstacles)if(o.demonHole){
  const x=o.x,y=o.y;
  oval(c,x+27,y+35,22,17,'#634967');oval(c,x+27,y+34,18,14,'#090914');
  oval(c,x+25,y+22,18,15,'#634967');oval(c,x+25,y+22,14,12,'#090914');
  for(let i=0;i<5;i++){const tx=x+9+i*9,ty=y+10-Math.sin(i/4*Math.PI)*4;oval(c,tx,ty,6,7,'#634967');oval(c,tx,ty,4,5,'#090914');}
  c.strokeStyle='#9b759a88';c.lineWidth=1;for(const [sx,sy,ex,ey] of [[3,30,10,27],[45,34,53,38],[19,50,13,54],[43,12,50,7]]){c.beginPath();c.moveTo(x+sx,y+sy);c.lineTo(x+ex,y+ey);c.stroke();}
 }
 for(const t of d.trails)drawSoftField(c,t.x,t.y,t.radius,'#aa75bc',Math.min(.58,t.time/4*.58));
 if(d.force){drawSoftField(c,d.force.x,d.force.y,180,'#c883b6',.2*d.force.time/.8);c.strokeStyle='#e4a9d077';c.lineWidth=1;for(let i=0;i<8;i++){const angle=i*Math.PI/4+time*.3,x=d.force.x+Math.cos(angle)*100,y=d.force.y+Math.sin(angle)*100,sign=d.force.kind==='mouthPull'?-1:1;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(angle)*20*sign,y+Math.sin(angle)*20*sign);c.stroke();}}
 const a=d.attack;if(a){
  const shade=a.kind.startsWith('foot')?'#d2a0c9':a.kind.startsWith('mouth')?'#e4a0c8':'#cc96df';
  if(['footJump','noseTrail'].includes(a.kind))drawSoftField(c,a.tx,a.ty,a.kind==='footJump'?95:80,shade,.63);
  if(['eyeRay','footDash','mouthTongue'].includes(a.kind)){
   c.strokeStyle=shade+'99';c.lineWidth=a.kind==='eyeRay'?1:2;
   const offsets=a.kind==='eyeRay'?[-.22,0,.22]:[0];
   for(const offset of offsets){const angle=a.aim+offset;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(a.x+Math.cos(angle)*850,a.y+Math.sin(angle)*850);c.stroke();}
  }
  if(['hand','eyeOrb','coreBurst'].includes(a.kind))drawSoftField(c,a.x,a.y,a.kind==='coreBurst'?82:44,shade,.42);
  if(['mouthPull','mouthPush'].includes(a.kind))drawSoftField(c,a.x,a.y,245,shade,.22);
  c.fillStyle='#f4d9f2';c.font='11px Galmuri, monospace';c.textAlign='center';
  const finger=['엄지 부채','검지 저격','중지 관통','약지 곡사','새끼 산탄'];
  c.fillText(a.kind==='hand'?finger[a.finger]:({footJump:'발 착지',footDash:'발 돌진',eyeRay:'눈 광선',eyeOrb:'눈 탄환',noseTrail:'독길',mouthPull:'흡입',mouthPush:'밀어내기',mouthTongue:'혀 공격',coreBurst:'심연 탄막'})[a.kind],a.x,a.y-65);
 }
 c.restore();
}
export function drawDemon(c,e,time=0){
 if(e.variant!=='demon')return;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));const pulse=Math.round(Math.sin(time*4)*2),part=e.part;
 oval(c,0,24,part==='core'?75:36,7,'#07091088');
 if(part==='hand'){
  oval(c,0,0,30,20,'#211726');oval(c,0,-2,24,15,'#a9689b');
  for(let i=0;i<5;i++){const x=-23+i*11,h=24+(i===2?12:i===0?4:0);box(c,x,-12-h+pulse,8,h,'#281826');box(c,x+2,-10-h+pulse,5,h-3,'#c078ae');box(c,x+3,-11-h+pulse,3,5,'#e4c0dc');}
  box(c,-15,0,30,7,'#6d416d');
  // Tendons and five separate nail tips keep the crawling hand readable at game scale.
  for(let i=0;i<5;i++){const x=-23+i*11,h=24+(i===2?12:i===0?4:0);box(c,x+3,-10-h+pulse,3,3,'#f5d8e5');box(c,x+2,-6-h+pulse,1,12,'#8e4b82');box(c,x+1,-14,6,2,'#e0a6c7');}
  for(const x of [-15,-5,5,15])box(c,x,-1,2,5,'#542d60');
 }
 if(part==='foot'){
  box(c,-14,-46+pulse,28,51,'#24192a');box(c,-11,-42+pulse,22,43,'#9c6b9a');oval(c,0,15,31,18,'#231923');oval(c,0,12,27,14,'#b781ac');
  for(let i=0;i<3;i++){box(c,-26+i*17,12,13,16,'#9e668f');box(c,-25+i*17,21,11,4,'#edbed7');}
  box(c,-9,-37+pulse,18,3,'#d1a9c7');box(c,-5,-32+pulse,10,25,'#754a80');box(c,-13,-3,26,4,'#e1b6d0');
  for(let i=0;i<3;i++){const x=-25+i*17;box(c,x+2,15,9,2,'#d9a8c7');box(c,x+4,24,7,4,'#f3d5df');box(c,x+2,18,2,8,'#5e366a');}
 }
 if(part==='eye'){
  for(const side of [-1,1]){c.fillStyle='#332447';c.beginPath();c.moveTo(0,-7);c.lineTo(side*55,-29+pulse);c.lineTo(side*30,11);c.fill();}
  oval(c,0,-3,23,19,'#2e2138');oval(c,0,-4,17,13,'#f3d1ea');oval(c,0,-4,8,12,'#b55ab5');oval(c,0,-4,3,10,'#181126');
  for(const side of [-1,1]){c.strokeStyle='#98719e';c.lineWidth=2;c.beginPath();c.moveTo(side*16,-6);c.lineTo(side*34,-20+pulse);c.lineTo(side*46,-22+pulse);c.stroke();box(c,side*38-(side<0?3:0),-14,3,4,'#5a3a6a');}
  box(c,-15,-17,30,3,'#7f5a88');box(c,-2,-10,2,11,'#fbebf7');box(c,3,-9,2,4,'#e4a9e5');
 }
 if(part==='nose'){
  oval(c,0,0,30,21,'#352136');oval(c,0,-3,24,16,'#a96791');
  for(const side of [-1,1]){box(c,side<0?-28:15,-22,13,9,'#6d426f');box(c,side<0?-23:17,-19,7,5,'#e0b3d3');}
  oval(c,0,13,16,11,'#dc95bd');for(const x of [-7,7])oval(c,x,14,4,5,'#271726');
  for(const side of [-1,1]){c.strokeStyle='#ecd6c7';c.lineWidth=4;c.beginPath();c.moveTo(side*16,11);c.lineTo(side*27,4);c.lineTo(side*28,-4);c.stroke();box(c,side*20-(side<0?3:0),-15,4,2,'#dfb5d0');}
  box(c,-10,-9,20,2,'#d79ac0');box(c,-7,10,4,3,'#4a284e');box(c,4,10,4,3,'#4a284e');
 }
 if(part==='mouth'){
  for(const side of [-1,1])for(let i=0;i<3;i++){c.strokeStyle='#6c416b';c.lineWidth=4;c.beginPath();c.moveTo(side*13,-1+i*7);c.lineTo(side*(31+i*4),8+i*8);c.stroke();}
  oval(c,0,-5,25,21,'#321d36');oval(c,0,-3,19,15,'#b66b9c');oval(c,0,2,14,8,'#110c1a');for(const x of [-10,10])box(c,x,2,4,8,'#efc9dd');
  for(const side of [-1,1])for(let i=0;i<3;i++){const y=-4+i*9;c.strokeStyle='#a675a4';c.lineWidth=2;c.beginPath();c.moveTo(side*19,y);c.lineTo(side*(29+i*3),y-7);c.lineTo(side*(40+i*4),y+5);c.stroke();}
  box(c,-5,8,10,7,'#a64576');box(c,-3,9,6,3,'#ed91b8');box(c,-13,-11,5,3,'#edd3e1');box(c,8,-11,5,3,'#edd3e1');
 }
 if(part==='core'){
  c.fillStyle='#251a2d';c.beginPath();c.moveTo(-115,-76);c.lineTo(-75,46);c.lineTo(75,46);c.lineTo(115,-76);c.fill();
  box(c,-48,-64,96,100,'#261b31');box(c,-40,-59,80,90,'#633a68');box(c,-26,-44,52,47,'#a9629b');
  for(const side of [-1,1]){box(c,side<0?-79:43,-35,35,61,'#3b2443');box(c,side<0?-71:49,-28,23,43,'#99638d');}
  for(const side of [-1,1]){
   c.fillStyle='#744871';c.beginPath();c.moveTo(side*57,-42);c.lineTo(side*104,-18);c.lineTo(side*92,20);c.lineTo(side*68,9);c.fill();
   for(let i=0;i<3;i++){const x=side*(90+i*7);box(c,x-(side<0?8:0),12+i*3,8,27-i*4,'#321d39');box(c,x-(side<0?6:0),33-i,5,7,'#e0b7d2');}
  }
  oval(c,0,-80,29,33,'#2b1d34');oval(c,0,-76,22,24,'#b6779e');
  for(const side of [-1,1]){c.fillStyle='#d3a1cf';c.beginPath();c.moveTo(side*15,-100);c.lineTo(side*50,-130);c.lineTo(side*30,-86);c.fill();box(c,side<0?-17:9,-82,8,5,'#fcdded');}
  box(c,-15,-65,30,5,'#4d274c');for(let i=0;i<5;i++)box(c,-13+i*6,-64,3,5,'#f4d0e4');
  for(const side of [-1,1])for(let i=0;i<3;i++){c.strokeStyle='#d494bb';c.lineWidth=3;c.beginPath();c.moveTo(side*23,-30+i*14);c.lineTo(side*36,-19+i*14);c.stroke();}
  oval(c,0,-15,15,22,'#e8b6dc');oval(c,0,-15,8,15,'#4e194f');
  oval(c,0,-15,3,11,'#f5d8ef');
  // Obsidian plates frame the chest eye while leaving its center exposed.
  for(const side of [-1,1]){box(c,side<0?-42:24,-45,18,6,'#312536');box(c,side<0?-49:31,-33,16,5,'#8d638b');box(c,side<0?-51:34,-21,13,4,'#d3a0c6');}
  box(c,-37,8,74,4,'#251a2b');box(c,-31,13,62,3,'#8c5a83');
  for(const x of [-28,26]){box(c,x,-61,3,11,'#c08db0');box(c,x+2,-50,8,2,'#6c3e70');}
 }
 if(part!=='core')drawSoftField(c,0,-5,43,color[part],.16);
 c.restore();
}
