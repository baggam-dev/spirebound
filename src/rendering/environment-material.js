// Approved environment v2: material-only caches; never applied to actors, HUD or telegraphs.
export const ENVIRONMENT_PIXEL=3;
function surface(w,h){
 const c=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):typeof document!=='undefined'?document.createElement('canvas'):null;
 if(c){c.width=w;c.height=h;}return c;
}
function palette(c){
 const g=c.getContext('2d'),pixels=g.getImageData(0,0,c.width,c.height),d=pixels.data;
 for(let i=0;i<d.length;i+=4){
  if(d[i+3]<64){d[i+3]=0;continue;}
  const grey=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722;
  for(let k=0;k<3;k++)d[i+k]=Math.round((grey+(d[i+k]-grey)*.65)*.78/8)*8;
  d[i+3]=Math.round(d[i+3]/85)*85;
 }
 g.putImageData(pixels,0,0);
}
export function environmentMaterial(source,prop=false){
 // Keep aspect ratios, including narrow flags and tall gates. Original PNGs stay intact.
 const scale=Math.min(1,(prop?32:44)/Math.max(source.width,source.height)),c=surface(Math.max(1,Math.round(source.width*scale)),Math.max(1,Math.round(source.height*scale)));
 if(!c)return source;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(source,0,0,c.width,c.height);palette(c);return c;
}
export function environmentSurface(source){
 // Run once when a static floor/wall cache is built, not per frame. World-aligned 3px grid.
 const small=surface(Math.ceil(source.width/ENVIRONMENT_PIXEL),Math.ceil(source.height/ENVIRONMENT_PIXEL));
 if(!small)return source;const g=small.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(source,0,0,small.width,small.height);
 const out=surface(source.width,source.height),c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(small,0,0,out.width,out.height);return out;
}
