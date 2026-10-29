import {drawShadowAura} from './shadow-aura.js';
// Distinct open tongues of corruption. Kept behind the body and all warnings.
export function drawKingAura(c,e,time=0,{reduced=false,staticPose=false}={}){
 if(e.variant!=='king'||e.hp/e.max>.65)return false;
 const final=e.hp/e.max<=.3,still=reduced||staticPose||e.frozen>0,t=still?0:time;
 const height=final?125:96,width=final?65:50;
 drawShadowAura(c,e,time,{mode:'mist',color:final?'#b487e8':'#9a76ce',opacity:final?.28:.23,width:final?165:132,height:final?140:112,speed:final?1.2:.9,reduced,staticPose});
 c.save();c.translate(Math.round(e.x),Math.round(e.y));
 for(let side=-1;side<=1;side+=2)for(let i=0;i<(final?4:3);i++){
  const shift=still?0:Math.sin(t*2.4+i*1.8+side)*4,x=side*(width-i*8),rise=height-i*9;
  c.beginPath();c.moveTo(x*.65,18);c.bezierCurveTo(x+shift,-18,x*.5-shift,-rise*.6,x+shift,-rise);
  c.bezierCurveTo(x*.35+shift,-rise*.56,x+side*9,-20,x*.65,18);
  c.fillStyle=final?'#ba8de530':'#a47cd22a';c.fill();
 }
 if(!reduced&&!staticPose)for(let i=0;i<(final?10:6);i++){
  const p=((t*.42+i*.167)%1+1)%1,x=Math.sin(i*3.9+t*.65)*(width-9),y=18-p*height;
  c.globalAlpha=(1-p)*.45;c.fillStyle=i%2?'#d6acf3':'#a57cdb';c.fillRect(Math.round(x),Math.round(y),2,3);
 }
 c.restore();return true;
}
