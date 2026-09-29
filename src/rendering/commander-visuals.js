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
 c.restore();
}
export function drawCommander(c,e,time=0){
 if(e.variant!=='commander')return;
 const state=e.commander||{},facing=Math.cos(state.volley?.aim??Math.atan2(0,1))<0?-1:1;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(facing,1);
 c.fillStyle='#07151a55';c.fillRect(-27,18,54,6);
 c.fillStyle='#101926';c.fillRect(-18,-23,36,43);
 c.fillStyle='#273746';c.fillRect(-15,-19,30,36);
 c.fillStyle='#172735';c.beginPath();c.moveTo(-13,-12);c.lineTo(-30,24);c.lineTo(-9,17);c.lineTo(0,-5);c.lineTo(14,20);c.lineTo(29,24);c.lineTo(11,-14);c.fill();
 c.fillStyle='#0f1821';c.fillRect(-12,11,9,14);c.fillRect(4,11,9,14);
 c.fillStyle='#6b8796';c.fillRect(-13,12,7,4);c.fillRect(6,12,7,4);
 c.fillStyle='#a9c4c5';c.fillRect(-15,-17,30,6);c.fillRect(-11,-4,22,3);
 c.fillStyle='#e4d0b2';c.fillRect(-10,-36,20,16);c.fillStyle='#19212a';c.fillRect(-13,-42,26,9);
 c.fillStyle='#9bc9df';c.fillRect(-8,-31,5,3);c.fillRect(5,-31,5,3);
 c.fillStyle='#bcdef2';c.fillRect(-17,-12,7,16);c.fillRect(11,-12,7,16);
 c.strokeStyle='#b7e4f5';c.lineWidth=3;c.beginPath();c.moveTo(23,-26);c.quadraticCurveTo(39,-2,23,23);c.stroke();
 c.strokeStyle='#e5f8ff';c.lineWidth=1;c.beginPath();c.moveTo(23,-26);c.lineTo(18,0);c.lineTo(23,23);c.stroke();
 if(state.volley){c.strokeStyle='#dcf8ff';c.beginPath();c.moveTo(9,0);c.lineTo(35,0);c.stroke();}
 if(state.transition>0||state.blinkFlash>0){drawSoftField(c,0,-7,58,'#9bdaf1',state.transition>0?.6:.35);}
 c.restore();
}
