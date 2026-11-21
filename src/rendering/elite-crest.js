// Existing death feedback owns the clock; no damage, drops or random numbers here.
export const eliteCrest=e=>!e.summoned&&!e.selfDestruct&&e.type!=='boss'?(e.trialChampion?'trial':e.type==='pursuer'?'pursuer':e.roamingElite?'guardian':e.elite||null):null;
export function drawEliteCrest(c,f,{reduced=false}={}){
 if(!f.crest||!(f.t>0))return;
 const age=f.duration-f.t,life=.6;if(age>=life)return;
 const p=age/life,fade=(1-p)**1.4,trial=f.crest==='trial',heavy=f.crest==='pursuer';
 const color=trial?'#cab2eb':f.crest==='explosive'?'#dca36e':f.crest==='volley'?'#d7c49d':'#e7cd8d';
 const radius=(heavy?18:13)+p*(reduced?9:21),x=Math.round(f.x),y=Math.round(f.y+6);
 c.save();c.translate(x,y);c.globalAlpha*=fade*(reduced?.65:.9);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2;
 // A broken, low crest; its center stays empty and never resembles a damage circle.
 for(let side=0;side<2;side++){
  const sign=side?1:-1;c.beginPath();c.moveTo(sign*(3+p*10),-9);c.lineTo(sign*(9+p*12),-3);c.lineTo(sign*(6+p*11),5);c.lineTo(sign*(2+p*10),9);c.stroke();
 }
 if(age<.07){c.globalAlpha*=.75;c.fillRect(-2,-15,4,20);c.fillRect(-7,-7,14,3);}
 else for(let i=0,n=reduced?3:heavy?10:7;i<n;i++){
  const a=i*2.39996,dx=Math.cos(a)*radius,dy=Math.sin(a)*radius*.46+p*p*15;
  c.fillRect(Math.round(dx),Math.round(dy),i%3?2:3,2);
 }
 c.restore();
}
