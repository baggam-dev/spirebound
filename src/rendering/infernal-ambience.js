import {outerWalls} from './stone-walls.js';
const layouts=new WeakMap();
function layout(obstacles){
 const walls=[...outerWalls,...obstacles.filter(o=>o.type==='wall')];
 const stamp=walls.map(o=>[o.x,o.y,o.w,o.h].join(',')).join(';');let cached=layouts.get(obstacles);
 if(cached?.stamp===stamp)return cached;
 const vents=[{x:112,y:40},{x:304,y:40},{x:656,y:40},{x:848,y:40},{x:14,y:148},{x:14,y:398},{x:946,y:148},{x:946,y:398},{x:208,y:535},{x:752,y:535}];
 for(const o of obstacles)if(o.type==='wall'&&o.w>=24&&o.h>=24&&vents.length<16)vents.push({x:Math.round(o.x+o.w*.5),y:Math.round(o.y+Math.min(o.h-4,30))});
 cached={stamp,walls,vents};layouts.set(obstacles,cached);return cached;
}
// Wall decoration only: no RNG, saved state, hazards or collision changes.
export function drawInfernalAmbience(c,obstacles,floor,time=0,reduced=false){
 if(floor<8||reduced)return;
 const {walls,vents}=layout(obstacles),deep=floor>=9;
 c.save();c.beginPath();for(const o of walls)c.rect(o.x,o.y,o.w,o.h);c.clip();
 for(const [i,v] of vents.entries()){
  const phase=Math.floor(time*7+i*1.7)%3,height=12+phase*3;
  c.fillStyle=deep?'#a63e4380':'#e9643180';c.fillRect(v.x-7,v.y-height,14,height);
  c.fillStyle=deep?'#e16b588c':'#ffac5ea6';c.fillRect(v.x-4,v.y-height+4,8,height-4);
  c.fillStyle=deep?'#f2ac798c':'#ffe0a8a6';c.fillRect(v.x-1,v.y-7,3,7);
  for(let n=0;n<2;n++){const age=(time*15+i*11+n*19)%32,x=Math.round(v.x+Math.sin(i*3+n+age*.1)*5),y=Math.round(v.y-9-age);c.fillStyle=deep?'#e8856c88':'#efb77099';c.fillRect(x,y,2,2);}
 }
 c.restore();
}
