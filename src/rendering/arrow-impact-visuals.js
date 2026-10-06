// A contact accent for plain and precision arrows, including lethal hits.
// Elemental arrows already have dedicated contact visuals.
export function arrowImpactEffect(arrow,point){
 if(arrow.frostShard||['fire','frost','poison','chain'].includes(arrow.element))return null;
 return {arrowImpact:true,x:point.x,y:point.y,angle:Math.atan2(arrow.vy,arrow.vx),precision:arrow.element==='precision',t:.2,duration:.2};
}
export function limitArrowImpacts(effects,max=24){
 let skip=Math.max(0,effects.reduce((n,f)=>n+!!f.arrowImpact,0)-max);
 return effects.filter(f=>!f.arrowImpact||skip--<=0);
}
export function drawArrowImpact(c,f){
 if(!f.arrowImpact)return false;
 const life=Math.max(0,Math.min(1,f.t/f.duration));
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();
 c.translate(Math.round(f.x),Math.round(f.y));c.rotate(f.angle);
 c.globalAlpha*=life*.9;
 const light=f.precision?'#fff0bf':'#f4e6c4',shade=f.precision?'#d4b775':'#baa88e';
 c.fillStyle=shade;c.fillRect(-4,-3,6,6);
 c.fillStyle=light;c.fillRect(-2,-2,5,4);
 c.fillRect(3+Math.round((1-life)*5),-1,6,2);
 c.fillRect(-6,-7-Math.round((1-life)*3),2,4);
 c.fillRect(-6,3+Math.round((1-life)*3),2,4);
 c.restore();return true;
}
