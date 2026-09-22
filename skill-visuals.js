import {evolutions} from './evolutions.js';
const colors={fire:['#ff874a','#fff0b5'],frost:['#87d8f3','#eaffff'],poison:['#85d469','#dff5a1'],chain:['#ad9bed','#f5e6ff']};
export function skillVisualProfile(element,player={}){
 const max=element==='frost'?4:3,level=Math.max(1,Math.min(max,Math.floor(player[element]||1))),candidate=player.evolutions?.[element];
 const branch=level>=3&&evolutions[element]?.some(e=>e.id===candidate)?candidate:null;
 return {level,branch,segments:level,particles:4+level*2};
}
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function line(c,points,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.stroke();}
// Extra detail stays behind the same arrowhead; it never advertises a larger hitbox.
export function drawSkillTrail(c,element,player,time){if(!colors[element])return;const v=skillVisualProfile(element,player),[color,light]=colors[element],phase=Math.floor(time*18)%3;
 for(let i=0;i<v.segments;i++){const x=-12-i*5,y=(i%2?1:-1)*(2+(phase+i)%3);box(c,x,y,3,2,color+(i?'88':'cc'));if(v.level>=3)box(c,x+2,-y,2,1,color+'66');}
 if(v.level>=2)line(c,[[-9,0],[-3,0]],light,1);
 if(element==='frost'&&v.level===4){line(c,[[-13,-3],[-7,3]],light,1);line(c,[[-13,3],[-7,-3]],light,1);}
 if(element==='fire'&&v.branch==='ember'){
  line(c,[[-26,-4],[-18,-3],[-10,0]],'#ee904977',2);line(c,[[-26,4],[-18,3],[-10,0]],'#ee904977',2);box(c,-22-phase,-5,2,2,light);box(c,-20-phase,4,2,2,color);
 }else if(element==='fire'&&v.branch==='flare'){
  line(c,[[-19,0],[-8,0],[3,0]],'#ffc779',3);line(c,[[-12,0],[3,0]],'#fff5da',1);box(c,-6,-2,4,4,'#ffce83');
 }else if(element==='frost'&&v.branch==='deep'){
  line(c,[[-17,-3],[-9,0],[-17,3]],'#e0ffff',2);line(c,[[-20,0],[1,0]],'#e0ffff',1);
 }else if(element==='frost'&&v.branch==='lasting'){
  for(let i=0;i<3;i++){const x=-13-i*7;c.globalAlpha*=.8;box(c,x-2,-1,5,1,color);box(c,x,-3,1,5,light);}
 }else if(element==='poison'&&v.branch==='ember'){
  for(let i=0;i<3;i++){const x=-12-i*7;box(c,x,-2,4,4,'#466a5488');box(c,x+1,-2,2,1,'#b5e78e');}
 }else if(element==='poison'&&v.branch==='flare'){
  line(c,[[-18,-2],[-9,0],[-18,2]],'#bd88d2',2);box(c,-2,-2,4,4,'#d4ef92');box(c,-1,-1,2,2,'#f4ffe0');
 }else if(element==='chain'&&v.branch==='surge'){
  line(c,[[-25,0],[-15,-2],[-10,1],[2,0]],'#f8db8d',3);line(c,[[-21,0],[2,0]],'#fff9dd',1);
 }else if(element==='chain'&&v.branch==='web'){
  for(const side of [-1,1])line(c,[[-27,side*3],[-21,-side*3],[-15,side*3],[-8,0]],'#b7b1fa',1);
 }
}
// Evolution accents are localized marks, not extra damage areas or fake chain targets.
export function drawSkillHitMark(c,f,age){const v=skillVisualProfile(f.hitElement,{[f.hitElement]:f.level,evolutions:{[f.hitElement]:f.branch}});if(!v.branch)return;
 const alpha=c.globalAlpha;c.globalAlpha*=Math.max(0,1-age);
 if(f.hitElement==='fire'&&v.branch==='flare'){box(c,-4,-2,9,4,'#fff3c8');box(c,-2,-4,4,9,'#ffe8ae');}
 if(f.hitElement==='fire'&&v.branch==='ember')for(const side of [-1,1])line(c,[[side*3,-2],[side*9,-6],[side*13,-4]],'#ffcb85',2);
 if(f.hitElement==='frost'&&v.branch==='deep'){line(c,[[-8,0],[0,-9],[8,0],[0,9],[-8,0]],'#edffff',2);}
 if(f.hitElement==='frost'&&v.branch==='lasting')for(const x of [-9,0,9]){box(c,x-3,-1,7,1,'#b9e5f6');box(c,x,-4,1,7,'#efffff');}
 if(f.hitElement==='poison'&&v.branch==='flare'){box(c,-4,-3,8,6,'#b08dc7');box(c,-2,-2,4,4,'#e8ffb7');}
 if(f.hitElement==='poison'&&v.branch==='ember')for(const x of [-7,3]){line(c,[[x,-3],[x+4,-3],[x+4,2],[x,2],[x,-3]],'#d7f3a4',1);}
 if(f.hitElement==='chain'&&v.branch==='surge')line(c,[[-10,0],[-3,-2],[3,2],[10,0]],'#fff2b1',3);
 if(f.hitElement==='chain'&&v.branch==='web')for(const side of [-1,1])line(c,[[-9,side*4],[-3,-side*3],[3,side*3],[9,-side*4]],'#ded4ff',1);
 c.globalAlpha=alpha;
}
