// Title-only presentation. No run state, RNG, save or audio side effects.
const root='assets/images/';
function asset(name){const img=new Image();img.src=root+name;return img;}
const art={background:asset('title-background-v1.png'),gate:asset('title-background-v2.png'),hero:asset('title-hero-idle-v1.png'),branch:asset('title-branch-v1.png')};
const night={background:asset('title-night-background-v1.png'),tree:asset('title-night-tree-v1.png'),hero:Array.from({length:3},(_,i)=>asset(`title-night-hero-${i}.png`)),leaves:Array.from({length:3},(_,i)=>asset(`title-night-leaves-${i}.png`)),fire:Array.from({length:4},(_,i)=>asset(`title-night-fire-${i}.png`))};
export const titleArt={...art,night};
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
  // Fit the full approved composition, including the hero's feet, on every aspect ratio.
  const scale=Math.min(w/1600,h/900),ox=(w-1600*scale)/2,oy=(h-900*scale)/2;
  ctx.setTransform(scale,0,0,scale,ox,oy);ctx.imageSmoothingEnabled=false;
  const t=still?0:elapsed;
  if([night.background,night.tree,...night.hero,...night.leaves,...night.fire].every(ready)){
   ctx.setTransform(scale*2.5,0,0,scale*2.5,ox,oy);
   drawNight(ctx,t,still);return;
  }
  const gate=ready(art.gate);
  if(gate)ctx.drawImage(art.gate,0,0,1600,900);
  else if(ready(art.background))ctx.drawImage(art.background,0,0,1600,900);
  // Anchors match the two unlit braziers of the clean background plate.
  for(const [i,x] of (gate?[750,1468]:[1003,1178]).entries()){
   const y=gate?591:458,flicker=still?1:1+Math.sin(t*9+i*2)*.12+Math.sin(t*17+i)*.06;
   const glow=ctx.createRadialGradient(x,y,1,x,y,72*flicker);
   glow.addColorStop(0,'#ffb15539');glow.addColorStop(1,'#ed802000');
   ctx.fillStyle=glow;ctx.fillRect(x-90,y-90,180,180);
   for(let k=0;k<6;k++){
    const flameHeight=((gate?24:10)+Math.sin(t*11+k*3+i)*(gate?7:4))*flicker;
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
   ctx.drawImage(art.hero,frame*cell,0,cell,art.hero.naturalHeight,gate?930:740,gate?570:597,295,295);
  }
  if(!gate&&ready(art.branch)){
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

function drawNight(ctx,t,still){
 ctx.drawImage(night.background,0,0);ctx.drawImage(night.tree,-40,0);
 ctx.drawImage(night.leaves[still?0:[0,1,2,1][Math.floor(t/.3)%4]],-40,0);
 const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
 for(let y=112;y<=270;y++){
  const q=Math.round((y-112)/159*7)/7;
  rect(457,y,9,1,`rgba(221,142,59,${(12+Math.round(q*24))/255})`);
  rect(460,y,3,1,`rgba(246,181,82,${(45+Math.round(q*83))/255})`);
  rect(461,y,1,1,`rgba(255,232,163,${(85+Math.round(q*150))/255})`);
 }
 for(let y=271;y<355;y+=3){const q=(y-271)/84,spread=3+Math.round(q*21),x=461-Math.round(q*12);rect(x-spread,y,spread*2+1,2,`rgba(201,130,60,${Math.round((1-q)*64)/255})`);}
 for(const [i,x] of [300,588].entries()){
  const y=240,flicker=still?0:Math.sin(t*7+i*2);
  rect(x-15,y-5,31,9,`rgba(210,126,49,${(40+Math.round(flicker*5))/255})`);
  ctx.drawImage(night.fire[still?0:(Math.floor(t/.12)+i*2)%4],x-29,y-53,58,58);
  rect(x+1,y-7,3,5,'rgba(255,241,180,.71)');
  for(let k=0;k<3;k++)rect(x-15+k*4,y+39+k*4,28-k*7,1,`rgba(205,134,57,${(30+Math.round(flicker*4))/255})`);
  if(!still)for(let k=0;k<3;k++){const life=(t*.38+k*.37+i*.21)%1;if(life>.62)continue;rect(Math.round(x+Math.sin(life*6+i+k)*5+life*6),Math.round(y-11-life*48),1,1,`rgba(225,154,71,${(1-life/.62)*180/255})`);}
 }
 if(!still&&t%6<2.1)for(let i=0;i<3;i++){
  const age=t%6-i*.4;if(age<0)continue;
  const x=Math.round(160+i*18+age*24+Math.sin(age*2+i)*8),y=Math.round(42+i*9+age*46);
  rect(x,y,3,2,'rgba(102,73,43,.75)');rect(x+1,y-1,1,1,'rgba(129,94,55,.67)');
 }
 ctx.drawImage(night.hero[still?0:[0,1,2,1][Math.floor(t/.6)%4]],386,238);
}
