// Title-only presentation. No run state, RNG, save or audio side effects.
const root='assets/images/';
function asset(name){const img=new Image();img.src=root+name;return img;}
const art={background:asset('title-background-v1.png'),hero:asset('title-hero-idle-v1.png'),branch:asset('title-branch-v1.png')};
const ready=img=>img.complete&&img.naturalWidth>0;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');

export function titleSceneMarkup(){return '<div class="title-scene" aria-hidden="true"><canvas class="title-scene-canvas"></canvas></div>';}

// Use the game's existing frame loop; mounting never creates another RAF/listener.
export function createTitleScene(host){
 const canvas=host.querySelector('.title-scene-canvas'),ctx=canvas.getContext('2d');
 let elapsed=0,last=0,lastDraw=-1,wasHidden=true;
 return now=>{
  if(!canvas.isConnected)return;
  if(document.hidden){wasHidden=true;return;}
  const still=reduced.matches||document.documentElement.classList.contains('calm-effects');
  if(!wasHidden&&!still)elapsed+=Math.min((now-last)/1000,.05);
  last=now;wasHidden=false;
  if(now-lastDraw<1000/30)return;lastDraw=now;
  const box=canvas.parentElement.getBoundingClientRect();
  const width=Math.max(1,Math.round(box.width)),height=Math.max(1,Math.round(box.height));
  // Cap decorative rendering resolution even on high-DPI mobile displays.
  const ratio=Math.min(1,1600/width,1000/height),w=Math.round(width*ratio),h=Math.round(height*ratio);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#08090e';ctx.fillRect(0,0,w,h);
  const scale=Math.max(w/1600,h/900),ox=(w-1600*scale)/2,oy=(h-900*scale)/2;
  ctx.setTransform(scale,0,0,scale,ox,oy);ctx.imageSmoothingEnabled=false;
  if(ready(art.background))ctx.drawImage(art.background,0,0,1600,900);
  const t=still?0:elapsed;
  // Anchors match the two unlit braziers of the clean background plate.
  for(const [i,x] of [1003,1178].entries()){
   const y=458,flicker=still?1:1+Math.sin(t*9+i*2)*.12+Math.sin(t*17+i)*.06;
   const glow=ctx.createRadialGradient(x,y,1,x,y,72*flicker);
   glow.addColorStop(0,'#ffb15539');glow.addColorStop(1,'#ed802000');
   ctx.fillStyle=glow;ctx.fillRect(x-90,y-90,180,180);
   for(let k=0;k<6;k++){
    const flameHeight=(10+Math.sin(t*11+k*3+i)*4)*flicker;
    ctx.fillStyle=k%2?'#ffcd72':'#d67432';ctx.fillRect(x-9+k*3,y-flameHeight,3,flameHeight);
   }
   ctx.fillStyle='#ffe7a1';ctx.fillRect(x-3,y-8,6,8);
   if(!still)for(let k=0;k<4;k++){
    const life=(t*.4+k*.27+i*.13)%1;
    ctx.globalAlpha=(1-life)*.65;ctx.fillStyle='#eebc78';
    ctx.fillRect(Math.round(x+life*15+Math.sin(k+t)*4),Math.round(y-12-life*55),2,2);
   }
   ctx.globalAlpha=1;
  }
  if(!still)for(let i=0;i<5;i++){
   const x=((i*389+t*(7+i))%2000)-200,y=665+(i%3)*47;
   ctx.save();ctx.translate(x,y);ctx.scale(1,.22);
   const fog=ctx.createRadialGradient(0,0,0,0,0,220);
   fog.addColorStop(0,'#9a95ac10');fog.addColorStop(1,'#8d89a000');
   ctx.fillStyle=fog;ctx.fillRect(-220,-220,440,440);ctx.restore();
  }
  if(ready(art.hero)){
   const frame=still?0:[0,1,2,1][Math.floor(t/.65)%4],cell=art.hero.naturalWidth/3;
   ctx.drawImage(art.hero,frame*cell,0,cell,art.hero.naturalHeight,740,597,295,295);
  }
  if(ready(art.branch)){
   for(const side of [0,1]){
    ctx.save();ctx.translate(side?1600:0,side?16:-12);ctx.scale(side?-1:1,1);
    ctx.rotate(still?0:Math.sin(t*.55+side*1.7)*.008);
    ctx.drawImage(art.branch,0,0,side?430:580,side?160:205);ctx.restore();
   }
  }
  if(!still)for(let i=0;i<7;i++){
   const cycle=(t*(.016+i*.001)+i/7)%1,x=150+cycle*1500,y=-30+((cycle*1.7+i*.19)%1)*920;
   ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t+i)*.8);ctx.fillStyle=i%2?'#7b5436':'#4c3931';
   ctx.fillRect(-4,-2,8,4);ctx.fillRect(-1,-4,5,2);ctx.restore();
  }
 };
}
