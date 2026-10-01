import {drawSoftField} from './ground-visuals.js';

export function drawCommanderGround(c,e,time=0){
 if(e.variant!=='commander')return;
 const state=e.commander;
 c.save();
 if(state?.rain){
  const a=state.rain,progress=1-a.time/1.05;
  drawSoftField(c,a.x,a.y,a.radius,'#9cdcf2',.55+progress*.28);
  c.strokeStyle='#c9f2ff99';c.lineWidth=1;
  for(let i=0;i<7;i++){const x=a.x-75+i*25,y=a.y-45+(i%3)*30;c.beginPath();c.moveTo(x-4,y-16-progress*12);c.lineTo(x+4,y-2-progress*12);c.stroke();}
 }
 if(state?.rainFlash)drawSoftField(c,state.rainFlash.x,state.rainFlash.y,state.rainFlash.radius,'#d5f6ff',state.rainFlash.time/.4*.65);
 if(state?.blink){drawSoftField(c,state.blink.x,state.blink.y,40,'#9bdaf1',.6);c.fillStyle='#ddf4ffbb';c.fillRect(state.blink.x-2,state.blink.y-10,4,20);c.fillRect(state.blink.x-10,state.blink.y-2,20,4);}
 if(state?.volley?.fired===0){
  const a=state.volley;c.strokeStyle='#a9d9ed88';c.lineWidth=1;
  for(const offset of a.count===2?[-.15,.15]:[-.23,0,.23]){const angle=a.aim+offset;c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x+Math.cos(angle)*220,e.y+Math.sin(angle)*220);c.stroke();}
 }
 if(state?.snipe){
  const a=state.snipe,progress=1-a.time/.72;
  c.strokeStyle=`rgba(195,230,246,${.22+progress*.32})`;c.lineWidth=1;
  c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x+Math.cos(a.aim)*920,e.y+Math.sin(a.aim)*920);c.stroke();
  drawSoftField(c,e.x,e.y,26,'#9bdaf1',.18+progress*.2);
 }
 c.restore();
}
export function drawCommander(c,e,time=0){
 if(e.variant!=='commander')return;
 const state=e.commander||{},second=state.phase===2,facing=Math.cos(state.volley?.aim??state.snipe?.aim??0)<0?-1:1;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(facing,1);
 c.fillStyle='#07151a55';c.fillRect(-27,18,54,6);
 // The quiver and fletching keep this silhouette unmistakably an archer.
 c.fillStyle='#101722';c.fillRect(-26,-30,11,31);c.fillStyle='#688291';c.fillRect(-24,-23,7,20);
 for(const x of [-24,-21,-18]){c.fillStyle=second?'#d6f5ff':'#9ebbc6';c.fillRect(x,-37-(x+24)%2*4,2,15);}
 c.fillStyle='#101926';c.fillRect(-18,-23,36,43);
 c.fillStyle='#273746';c.fillRect(-15,-19,30,36);
 c.fillStyle='#172735';c.beginPath();c.moveTo(-13,-12);c.lineTo(-30,24);c.lineTo(-9,17);c.lineTo(0,-5);c.lineTo(14,20);c.lineTo(29,24);c.lineTo(11,-14);c.fill();
 if(second){c.fillStyle='#6f9aac';c.fillRect(-28,17,6,2);c.fillRect(17,17,7,2);c.fillStyle='#101926';c.fillRect(-12,15,8,6);c.fillRect(12,17,7,5);}
 c.fillStyle='#0f1821';c.fillRect(-12,11,9,14);c.fillRect(4,11,9,14);
 c.fillStyle='#6b8796';c.fillRect(-13,12,7,4);c.fillRect(6,12,7,4);
 c.fillStyle='#a9c4c5';c.fillRect(-15,-17,30,6);c.fillRect(-11,-4,22,3);
 c.fillStyle='#537184';c.fillRect(-12,-11,24,5);c.fillStyle='#c7e4e7';c.fillRect(-10,-11,20,2);c.fillStyle='#243b4a';c.fillRect(-9,1,18,11);
 for(const x of [-15,11]){c.fillStyle='#c8e5e9';c.fillRect(x,-14,5,3);c.fillStyle='#789ead';c.fillRect(x,-11,4,9);}
 if(second){
  c.fillStyle='#8fc4d1';c.beginPath();c.moveTo(-16,-15);c.lineTo(-27,-30);c.lineTo(-24,-9);c.fill();
  c.beginPath();c.moveTo(16,-15);c.lineTo(25,-29);c.lineTo(23,-9);c.fill();
  c.fillStyle='#e3fbff';c.fillRect(-26,-20,2,8);c.fillRect(23,-20,2,7);
 }
 c.fillStyle='#e4d0b2';c.fillRect(-10,-36,20,16);c.fillStyle='#19212a';c.fillRect(-13,-42,26,9);
 c.fillStyle='#6f8796';c.fillRect(-10,-43,20,3);c.fillStyle='#d4ecec';c.fillRect(-3,-44,6,2);
 c.fillStyle='#9bc9df';c.fillRect(-8,-31,5,3);c.fillRect(5,-31,5,3);
 c.fillStyle='#bcdef2';c.fillRect(-17,-12,7,16);c.fillRect(11,-12,7,16);
 c.strokeStyle='#b7e4f5';c.lineWidth=3;c.beginPath();c.moveTo(23,-26);c.quadraticCurveTo(39,-2,23,23);c.stroke();
 c.strokeStyle='#e5f8ff';c.lineWidth=1;c.beginPath();c.moveTo(23,-26);c.lineTo(18,0);c.lineTo(23,23);c.stroke();
 if(second){
  // Phase two reveals fractured ice under the cuirass; no extra attack area is drawn.
  c.fillStyle='#bcecf2';c.fillRect(-8,-7,4,2);c.fillRect(-4,-5,2,5);c.fillRect(-2,0,7,2);c.fillRect(4,2,2,5);
  c.fillStyle='#e2fbff';c.fillRect(-2,8,4,3);c.fillRect(-16,-16,4,3);c.fillRect(12,-16,4,3);
  c.fillStyle='#9dd6e4';c.fillRect(-11,-45,4,3);c.fillRect(7,-45,4,3);
  c.fillStyle='#8cbecf';c.fillRect(23,-23,4,5);c.fillRect(28,-12,3,5);c.fillRect(29,9,4,5);
 }
 if(state.volley||state.snipe){c.strokeStyle='#dcf8ff';c.beginPath();c.moveTo(9,0);c.lineTo(35,0);c.stroke();}
 if(state.transition>0||state.blinkFlash>0){drawSoftField(c,0,-7,58,'#9bdaf1',state.transition>0?.6:.35);}
 c.restore();
}
