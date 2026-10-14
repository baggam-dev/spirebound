import {drawShadowAura} from './shadow-aura.js';
// Reuse the separate four-phase texture; the actor and its PNG stay unchanged.
export function drawFrostAura(c,e,time=0,{reduced=false,staticPose=false}={}){
 drawShadowAura(c,e,time,{mode:'mist',color:'#b7e6f4',width:116,height:94,opacity:staticPose ? .09 : .14,speed:.65,reduced,staticPose});
 if(reduced)return;
 const still=staticPose||e.frozen>0,t=still?0:time,phase=(e.id||0)*.173;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.beginPath();c.rect(-61,-89,122,99);c.clip();const alpha=c.globalAlpha;
 for(let i=0;i<6;i++){
  const progress=((t*.13+i/6+phase)%1+1)%1,side=i%2?1:-1,x=side*(30+(i%3)*8)+Math.sin(t*.6+i)*3,y=8-progress*88,fade=Math.sin(progress*Math.PI);
  c.globalAlpha=alpha*.24*fade;c.fillStyle='#d3f1fb';c.fillRect(Math.round(x),Math.round(y),2,2);
  if(i%3===0){c.strokeStyle='#b7e6f4';c.lineWidth=.7;c.beginPath();c.moveTo(x-2,y+1);c.lineTo(x+4,y+1);c.moveTo(x+1,y-2);c.lineTo(x+1,y+4);c.stroke();}
 }c.restore();
}
