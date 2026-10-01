import {FINAL_ESCAPE_DURATION} from '../world/final-escape.js';

export function drawFinalEscape(c,room,time=0){
 const state=room.finalEscape;if(!state)return;
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
 c.restore();
}
