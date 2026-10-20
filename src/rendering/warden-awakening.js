export function wardenShake(r,reduced=false){
 const remaining=r?.wardenArrival||0;if(reduced||remaining<=0)return {x:0,y:0};
 const age=1-remaining,strength=Math.sin(age*Math.PI)*1.5;
 return {x:Math.round(Math.sin(age*83)*strength),y:Math.round(Math.cos(age*67)*strength)};
}
export function drawWardenAwakening(c,r,reduced=false){
 const remaining=r.wardenArrival||0;if(remaining<=0)return;const age=1-remaining;
 c.save();c.beginPath();c.rect(26,45,908,455);c.clip();
 for(let i=0;i<(reduced?8:20);i++){
  const delay=(i*37%60)/100,life=Math.max(0,age-delay);if(life<=0)continue;
  const x=150+i*137%650,y=48+life*life*(260+i%4*60);
  c.globalAlpha=Math.min(.55,life*2)*(1-age*.5);c.fillStyle=i%3?'#a09b8b':'#6b6962';c.fillRect(Math.round(x),Math.round(y),i%3?2:3,2+i%2);
 }
 c.restore();
}
