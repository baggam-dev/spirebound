// Transient feedback only. Enemy coordinates, AI, collision and rewards are untouched.
function style(e){
 if(e.variant==='slime'||e.type==='minislime')return 'slime';
 if(e.variant==='prism'||e.type==='pulseTurret')return 'crystal';
 if(e.type==='flower')return 'petal';
 if(e.variant==='king'||['royalGuard','gravityMage','riftHunter','ringcaster'].includes(e.type))return 'spectral';
 return 'armor';
}
export function enemyHitEffects(before,enemies){return enemies.filter(e=>e.hp>0&&before.has(e)&&e.hp<before.get(e)).map(e=>({
 enemyFeedback:'hit',enemyId:e.id,x:e.x,y:e.y,boss:e.type==='boss',t:.28,duration:.28
}));}
export function enemyDeathEffect(e,returning=false){const split=e.variant==='slime'&&!e.summoned&&(e.stage||0)<2;
 return {enemyFeedback:'death',enemyId:e.id,x:e.x,y:e.y,style:style(e),boss:e.type==='boss',king:e.variant==='king',split,returning,
  scale:e.type==='boss'?(e.variant==='slime'?[1.5,1.1,.8][e.stage||0]:1.5):e.type==='minislime'?.55:1,t:split?.38:.55,duration:split?.38:.55};
}
export function mergeEnemyFeedback(current,incoming){
 const deaths=new Set(incoming.filter(f=>f.enemyFeedback==='death').map(f=>f.enemyId));
 const result=current.filter(f=>!(f.enemyFeedback==='hit'&&deaths.has(f.enemyId)));
 const active=new Set(result.filter(f=>f.enemyFeedback==='hit'&&f.t>0).map(f=>f.enemyId));
 for(const f of incoming){if(f.enemyFeedback==='hit'){if(active.has(f.enemyId)||deaths.has(f.enemyId))continue;active.add(f.enemyId);}result.push(f);}
 let hits=Math.max(0,result.filter(f=>f.enemyFeedback==='hit').length-32),dead=Math.max(0,result.filter(f=>f.enemyFeedback==='death').length-24);
 return result.filter(f=>f.enemyFeedback==='hit'?hits--<=0:f.enemyFeedback==='death'?dead--<=0:true);
}
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.stroke();}
function crystal(c,x,y,r,color){line(c,[[x-r,y],[x,y-r*1.7],[x+r,y],[x,y+r],[x-r,y]],color,2);}
export function drawEnemyFeedback(c,f){
 if(!f.enemyFeedback)return false;if(f.t<=0)return true;const age=1-Math.min(1,f.t/f.duration);
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.translate(Math.round(f.x),Math.round(f.y));
 if(f.enemyFeedback==='hit'){
  // A short glint followed by a quiet cooldown prevents DoT from strobing every tick.
  const brightness=Math.max(0,1-age/.36);c.globalAlpha=brightness*.85;const w=f.boss?20:11;
  line(c,[[-w-3,-14],[-w-6,-14],[-w-6,-5]],'#ffecc4',2);line(c,[[w+3,-14],[w+6,-14],[w+6,-5]],'#ffecc4',2);
  box(c,-5,-17,3,7,'#fff9e5');box(c,-7,-15,7,2,'#fff9e5');box(c,5,-6,4,2,'#e7d9b9');c.restore();return true;
 }
 c.scale(f.scale||1,f.scale||1);const fade=(1-age)**1.3,spread=1-(1-age)**2,red=f.returning;
 c.globalAlpha=fade*.85;
 if(f.style==='slime'){
  const color=red?'#cf7480':'#85b57a';box(c,-17-8*spread,4+age*8,34+16*spread,Math.max(2,13*(1-age)),color);
  if(f.split){for(const side of [-1,1]){box(c,side*(8+spread*17)-5,-8*Math.sin(age*Math.PI),10,7,color);box(c,side*(8+spread*17)-3,-2-8*Math.sin(age*Math.PI),3,2,'#daedb4');}}
  for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*(8+spread*24),y=Math.sin(a)*9-16*Math.sin(age*Math.PI)+age*17;box(c,x,y,4,3,color);box(c,x,y,2,1,'#dbe8b4');}
 }else if(f.style==='crystal'){
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9,r=5+spread*29,x=Math.cos(a)*r,y=-10+Math.sin(a)*r*.7+age*age*13;crystal(c,x,y,3+(i%2),red?'#e3a2bf':'#abdae4');box(c,x,y-3,1,5,'#f1edff');}
  if(age<.3)crystal(c,0,-10,8*(1-age),'#f4f0ff');
 }else if(f.style==='spectral'){
  const color=red?'#c982ab':'#a38dbd';for(let i=0;i<9;i++){const x=(i%3-1)*(8+spread*14)+Math.sin(i)*4,y=-7-i*2-age*(16+i*2);box(c,x,y,3+(i%2),8*(1-age)+2,color);box(c,x,y,2,2,'#e2c9ed');}
  if(f.king)for(const x of [-9,0,9]){box(c,x*(1+spread),-32+age*30,4,6,'#d7b675');box(c,x*(1+spread)-1,-27+age*30,6,2,'#f1d399');}
 }else if(f.style==='petal'){
  for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*(5+spread*23),y=-8+Math.sin(a)*10+age*age*25;box(c,x,y,6,3,red?'#d38e84':'#a1b075');box(c,x+2,y-2,3,3,'#d6ca96');}
 }else{
  // A broken armor silhouette collapses into pixels instead of leaving a collision-like corpse.
  const body=red?'#a76470':'#89948c',trim='#c3b58c';
  if(age<.55){c.globalAlpha=fade*(1-age/.55);box(c,-8-spread*5,-23+age*17,16,9,body);box(c,-11,-9+age*18,10,14,body);box(c,2+spread*4,-8+age*19,10,12,body);box(c,-10-spread*6,12,7,5,'#606e6a');box(c,5+spread*6,12,7,5,'#606e6a');c.globalAlpha=fade*.85;}
  for(let i=0;i<9;i++){const side=i%2?1:-1,x=side*(4+spread*(10+i)),y=-18+(i%4)*8-9*Math.sin(age*Math.PI)+age*age*23;box(c,x,y,i%3===0?5:3,3,i%3===0?trim:body);}
 }
 c.restore();return true;
}
