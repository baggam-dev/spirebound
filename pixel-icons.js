// Authored 16×16 pixel silhouettes; SVG rectangles keep them crisp at integer scales.
const cache=new Map();
export function iconSVG(id){
 if(cache.has(id))return cache.get(id);
 const pixels=new Map(),put=(x,y,c=1)=>{if(x>=0&&x<16&&y>=0&&y<16)pixels.set(`${x},${y}`,c);};
 const rect=(x,y,w,h,c=1)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)put(i,j,c);};
 const line=(x,y,xx,yy,c=1)=>{const dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1;let err=dx+dy;for(;;){put(x,y,c);if(x===xx&&y===yy)break;const twice=2*err;if(twice>=dy){err+=dy;x+=sx;}if(twice<=dx){err+=dx;y+=sy;}}};
 const circle=(cx,cy,r,c=1,fill=false)=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-cx,y-cy);if(fill?d<=r:Math.abs(d-r)<.6)put(x,y,c);}};
 const diamond=(cx,cy,r,c=1)=>{line(cx,cy-r,cx+r,cy,c);line(cx+r,cy,cx,cy+r,c);line(cx,cy+r,cx-r,cy,c);line(cx-r,cy,cx,cy-r,c);};
 const heart=(c=1)=>{for(const [y,row] of ['011100001110','111110011111','111111111111','111111111111','011111111110','001111111100','000111111000','000011110000','000001100000'].entries())for(let x=0;x<12;x++)if(row[x]==='1')put(x+2,y+3,c);};
 const arrow=(x=8,c=1)=>{line(x,2,x,13,c);line(x-3,5,x,2,c);line(x+3,5,x,2,c);};
 switch(id){
  case 'windSeal':circle(8,8,6,2);line(3,6,11,6,3);line(11,6,12,4,3);line(2,9,10,9);line(10,9,12,7);line(5,12,9,12,3);break;
  case 'turret':line(3,3,8,7);line(8,7,13,3);line(3,3,13,3,2);rect(7,2,2,10);rect(4,12,8,3,2);line(5,8,3,12);line(10,8,12,12);break;
  case 'sunFairy':circle(8,8,3,1,true);line(1,4,5,7,3);line(14,4,11,7,3);line(8,1,8,3);line(8,12,8,15);break;
  case 'snowFairy':diamond(8,8,4);line(1,4,5,7,3);line(14,4,11,7,3);line(8,2,8,14,2);break;
  case 'stormFairy':line(9,1,5,8);line(5,8,10,8);line(10,8,7,15);line(1,4,4,6,3);line(14,4,11,6,3);break;
  case 'afterimage':line(4,3,11,3);line(4,3,2,13);line(11,3,14,13);line(2,13,14,13);rect(6,4,3,7,2);break;
  case 'orbitBlades':circle(8,8,5,2);line(3,1,3,8);line(1,6,5,6);line(12,8,12,15);line(10,10,14,10);break;
  case 'voidBell':circle(8,6,4);rect(4,6,9,5);rect(2,11,13,2);rect(7,13,3,2,3);break;

  case 'exitKey':circle(5,5,3);rect(7,7,2,7);rect(9,10,3,2);rect(9,13,3,2);put(4,3,3);break;
  case 'lens':circle(6,6,4,1,true);circle(6,6,3,2);line(9,9,13,13);line(10,9,14,13);put(5,4,3);break;
  case 'boots':rect(4,2,5,8);rect(4,10,8,3);rect(3,13,10,1,2);rect(5,4,4,1,3);break;
  case 'iron':line(3,3,12,3);line(3,3,4,10);line(12,3,11,10);line(4,10,8,14);line(11,10,8,14);rect(7,5,2,5,2);rect(5,7,6,1,3);break;
  case 'ember':rect(4,5,8,8);rect(6,2,4,1,2);line(4,5,6,2);line(12,5,10,2);rect(6,7,4,4,2);rect(7,8,2,3,3);break;
  case 'rain':circle(8,6,4,1,true);rect(4,6,9,4);rect(2,10,12,2,2);rect(7,12,2,2,3);break;
  case 'fang':rect(5,2,7,3);rect(5,5,6,2);rect(6,7,4,3);rect(7,10,2,2);put(8,12);line(6,3,7,8,3);break;
  case 'ruby':diamond(8,8,6);diamond(8,8,4,2);line(8,3,8,13,3);line(3,8,13,8);break;
  case 'quiver':rect(5,6,7,8);rect(4,5,9,2,2);arrow(6,3);arrow(10,3);rect(7,9,3,4,2);break;
  case 'feather':line(3,13,12,2,2);for(let i=0;i<5;i++){line(5+i,10-i,3+i,6-i);line(5+i,10-i,10+i,9-i);}break;
  case 'hourglass':rect(3,2,10,2);rect(3,12,10,2);line(4,4,11,11,2);line(11,4,4,11,2);rect(6,10,4,2,3);put(8,7,3);break;
  case 'crown':rect(3,9,10,4);rect(3,4,2,5);rect(7,2,2,7);rect(11,4,2,5);put(8,11,3);rect(4,13,8,1,2);break;
  case 'comet':circle(5,10,3,1,true);line(7,8,13,2,2);line(8,11,14,5);line(4,7,10,1,3);break;
  case 'moon':circle(7,7,5,1,true);for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(Math.hypot(x-10,y-5)<4.6)pixels.delete(`${x},${y}`);put(12,11,3);break;
  case 'heart':heart();put(5,6,3);put(6,6,3);break;
  case 'chalice':rect(4,3,8,4);rect(5,7,6,2);rect(7,9,2,3);rect(4,12,8,2,2);rect(5,3,6,1,3);break;
  case 'bastion':rect(3,6,10,8);for(let x=3;x<14;x+=4)rect(x,2,2,5);rect(7,10,2,4,2);rect(5,7,1,2,3);rect(10,7,1,2,3);break;
  case 'blade':line(4,12,12,2);line(5,12,13,2,3);line(2,10,7,14,2);rect(2,13,2,2,2);break;
  case 'orbit':circle(8,8,5);circle(8,8,2,2,true);rect(11,3,3,3,3);break;
  case 'coal':rect(4,6,8,7);rect(6,3,4,3);line(5,10,9,6,2);line(8,12,11,9,3);break;
  case 'sun':circle(8,8,3,1,true);for(const [x,y] of [[8,1],[8,15],[1,8],[15,8],[3,3],[13,3],[3,13],[13,13]])line(8+(x-8)*.6|0,8+(y-8)*.6|0,x,y,2);put(7,7,3);break;
  case 'prism':line(8,2,2,13);line(2,13,14,13);line(14,13,8,2);line(8,3,8,12,2);line(8,8,13,12,3);break;
  case 'hunter':circle(8,8,4);line(8,1,8,5,2);line(8,11,8,15,2);line(1,8,5,8,2);line(11,8,15,8,2);put(8,8,3);break;
  case 'execution':line(4,14,10,2,2);rect(8,3,5,5);rect(11,4,3,3,3);line(6,7,10,9);break;
  case 'magnet':rect(3,3,3,8);rect(10,3,3,8);rect(5,10,6,3);rect(3,3,3,3,3);rect(10,3,3,3,2);break;
  case 'halo':circle(8,7,5);circle(8,7,3,2);line(8,1,8,3,3);line(2,12,4,10,3);line(12,10,14,12,3);break;
  case 'fire':line(8,1,4,8);line(4,8,5,12);line(5,12,10,14);line(10,14,13,9);line(13,9,10,5);rect(6,7,5,5);rect(7,9,2,4,3);break;
  case 'frost':line(8,1,8,14);line(2,4,14,11);line(2,11,14,4);for(const [x,y] of [[8,3],[8,12],[4,5],[12,10],[4,10],[12,5]])rect(x-1,y-1,2,2,3);break;
  case 'poison':circle(8,9,5,1,true);rect(6,3,4,2,2);rect(7,1,2,2,3);rect(5,7,2,2,2);rect(10,7,2,2,2);rect(7,11,3,1,2);break;
  case 'chain':line(10,1,4,8);line(4,8,10,7);line(10,7,5,14);line(11,1,5,8,3);break;
  case 'split':arrow(8);line(8,8,2,3,2);line(8,8,14,3,2);line(2,3,2,6);line(14,3,14,6);break;
  case 'pierce':arrow();rect(2,6,12,2,2);rect(2,10,12,2,2);arrow(8,3);break;
  case 'haste':for(let i=0;i<3;i++){line(2+i*4,4,5+i*4,8,i===1?3:1);line(5+i*4,8,2+i*4,12,i===1?3:1);}break;
  case 'power':rect(4,5,8,7);rect(4,3,2,4,3);rect(7,2,2,5,3);rect(10,3,2,4,3);rect(6,12,5,2,2);break;
  case 'repeat':arrow(5);arrow(11,2);break;
  case 'aura':circle(8,8,6,2);line(4,12,11,4);line(5,12,12,4,3);line(3,9,7,13);break;
  case 'homing':circle(10,5,3,2);line(2,13,3,8);line(3,8,10,5);line(6,5,10,5,3);line(10,5,9,9,3);break;
  case 'ultimate':for(let x=3;x<15;x+=4){line(x,2,x,12);line(x-2,10,x,13,3);line(x+2,10,x,13,3);}break;
  case 'blink':diamond(8,8,5,3);line(1,5,5,5);line(0,9,4,9,2);rect(7,6,3,4);break;
  case 'shield':line(3,3,12,3);line(3,3,4,10);line(12,3,11,10);line(4,10,8,14);line(11,10,8,14);line(6,7,8,9,3);line(8,9,11,5,3);break;
  default:diamond(8,8,5);put(8,8,3);
 }
 const palettes={fire:['#ef7843','#a03931','#fff0a9'],frost:['#a4e6ff','#3975ab','#ffffff'],poison:['#9bdd69','#35552f','#e7ff98'],chain:['#e3caff','#9270c8','#ffffff'],heart:['#ff6d91','#903a5d','#ffe0e9'],shield:['#cde5ee','#729cad','#fff'],aura:['#e1efac','#6d9983','#fff'],ruby:['#e46b77','#873b69','#ffcbc2'],sun:['#ffcb6b','#d98243','#fffad1']};
 const colors=palettes[id]||['#d7bd83','#88725e','#fff0c5'];
 const result='<svg class="pixel-icon" viewBox="0 0 16 16" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">'+[...pixels].map(([key,c])=>{const [x,y]=key.split(',');return `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[c-1]}"/>`;}).join('')+'</svg>';
 cache.set(id,result);return result;
}
