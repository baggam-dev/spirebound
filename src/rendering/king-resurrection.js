// Only an observed live stage transition starts this view-local cinematic.
let actors=new WeakMap();
export const clearKingResurrection=()=>{actors=new WeakMap();};
export function tickKingResurrection(enemies,dt){
 const events=[];
 for(const e of enemies){
  if(e.variant!=='king'||e.resurrectionVersion!==1)continue;
  let v=actors.get(e);if(!v){actors.set(e,{stage:e.kingStage??1,age:null,bell:false});continue;}
  const stage=e.kingStage??1;
  if(e.hp>0&&v.stage<3&&stage===3&&e.kingTransition>0){v.age=0;v.bell=false;events.push('kingResurrection');}
  // Entry grace can freeze the combat transition even while updates continue.
  // Follow the actual transition clock so the reveal cannot end early.
  if(v.age!==null)v.age=Math.max(0,1.4-(e.kingTransition||0));
  v.stage=stage;
  if(e.hp<=0||!(e.kingTransition>0)||v.age>=1.4){v.age=null;continue;}
  if(v.age!==null&&v.age>=.55&&!v.bell){v.bell=true;events.push('kingResurrectionBell');}
 }return events;
}
export function kingResurrectionAge(e){return actors.get(e)?.age??null;}
export function drawKingResurrection(c,enemies,{reduced=false}={}){
 for(const e of enemies){const age=kingResurrectionAge(e);if(age===null||e.hp<=0)continue;
  const fade=Math.min(1,age/.2,(1.4-age)/.25);c.save();c.beginPath();c.rect(25,45,910,455);c.clip();
  c.fillStyle=`rgba(10,12,25,${Math.max(0,fade)*(reduced?.12:.32)})`;c.fillRect(25,45,910,455);
  c.translate(e.x,e.y-35);c.globalAlpha*=Math.max(0,fade);
  if(!reduced){const beam=c.createLinearGradient(-48,0,48,0);beam.addColorStop(0,'#fff5d500');beam.addColorStop(.5,'#fff5d58a');beam.addColorStop(1,'#fff5d500');c.fillStyle=beam;c.fillRect(-48,-450,96,520);}
  if(age>.42){c.strokeStyle='#f5e7b5';c.lineWidth=reduced?1:2;const radius=reduced?65:70+Math.min(1,(age-.42)/.3)*34;c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,radius*.83,0,Math.PI*2);c.stroke();
   for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(Math.cos(a)*radius*.75,Math.sin(a)*radius*.75);c.lineTo(Math.cos(a)*radius*1.13,Math.sin(a)*radius*1.13);c.stroke();}
  }
  if(!reduced&&age>.9){const p=Math.min(1,(age-.9)/.35);c.globalAlpha*=1-p;c.beginPath();c.ellipse(0,59,40+p*280,12+p*55,0,0,Math.PI*2);c.stroke();}
  c.restore();
 }
}
