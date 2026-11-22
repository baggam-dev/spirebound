import {FINAL_ESCAPE_DURATION,finalEscapeDuration} from '../world/final-escape.js';

export function drawFinalEscape(c,room,time=0,reduced=false){
 const state=room.finalEscape;if(!state)return;
 if(state.shadowVersion===1){
  c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.setLineDash([]);
  c.globalAlpha=state.ready?.25:reduced?.65:.65+Math.sin(time*2)*.08;c.fillStyle='#03020899';c.strokeStyle='#786087';c.lineWidth=2;
  const radius=155,x=480,y=275;c.beginPath();c.arc(x,y,radius+18,0,Math.PI*2);c.fill();c.stroke();
  for(const offset of [-Math.PI/2,Math.PI/2]){c.beginPath();for(let i=0;i<3;i++){const a=offset+i*Math.PI*2/3,px=x+Math.cos(a)*radius,py=y+Math.sin(a)*radius;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.stroke();}
  c.globalAlpha=1;c.font='bold 12px Galmuri, monospace';c.textAlign='center';c.fillStyle=state.ready?'#d5edbc':'#e2c9ec';
  c.fillText(state.ready?'출구 개방 · 적을 피해 탈출하세요':'그림자 출현 '+state.wave+'/5 · 개문까지 '+Math.ceil(finalEscapeDuration(state)-state.elapsed)+'초',480,170);
  for(let i=0;i<5;i++){c.fillStyle=i<state.wave?'#b594cd':'#231b2c';c.fillRect(445+i*15,145,10,8);}
  c.restore();return;
 }
 const progress=state.elapsed/FINAL_ESCAPE_DURATION;
 c.save();
 c.fillStyle='#0b1518';c.fillRect(415,144,130,11);
 c.fillStyle=state.ready?'#d3e5b3':'#b76a6b';c.fillRect(418,147,124*progress,5);
 for(let index=0;index<3;index++){
  const open=state.ready||state.elapsed>=(index+1)*12;
  c.fillStyle=open?'#d5e8ba':'#653f4d';
  c.fillRect(458+index*15,102,10,18);
  if(open){c.fillStyle='#f3e4a8';c.fillRect(461+index*15,106,4,9);}
 }
 c.globalAlpha=state.ready?.5:.2+.15*Math.sin(time*5);
 c.fillStyle=state.ready?'#bde4c4':'#db7b7e';
 c.fillRect(448,84,64,5);c.fillRect(448,122,64,4);
 c.globalAlpha=1;c.textAlign='center';c.font='11px Galmuri, monospace';c.fillStyle=state.ready?'#d6e8c7':'#f2c4b4';
 c.fillText(state.ready?'봉인 파괴 · 출구 개방':`봉인 붕괴 ${Math.ceil(FINAL_ESCAPE_DURATION-state.elapsed)}초`,480,170);
 if(!state.ready&&state.pressureVersion===1){for(const p of state.pending){c.strokeStyle='#f4aa72';c.lineWidth=2;c.strokeRect(p.x-22,p.y-22,44,44);c.beginPath();c.arc(p.x,p.y,17,0,Math.PI*2);c.stroke();c.fillStyle='#efb78b';c.fillText('소환',p.x,p.y-29);}}
 c.restore();
}
