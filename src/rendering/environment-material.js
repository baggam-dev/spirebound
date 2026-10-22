import {DeferredImage} from './asset-requests.js';
// Approved environment v2: material-only caches; never applied to actors, HUD or telegraphs.
export const ENVIRONMENT_PIXEL=2;
let reference=null;
export const environmentReferenceReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const im=new DeferredImage();im.onload=()=>{reference=im;resolve(true);};im.onerror=()=>resolve(false);im.src=new URL('../../assets/images/environment-stone-reference-v1.png',import.meta.url).href;
});
function surface(w,h){
 const c=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):typeof document!=='undefined'?document.createElement('canvas'):null;
 if(c){c.width=w;c.height=h;}return c;
}
function palette(c,prop){
 const g=c.getContext('2d'),pixels=g.getImageData(0,0,c.width,c.height),d=pixels.data;
 let total=0,count=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>=64){total+=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722;count++;}
 // Bright greenhouse/archive tiles must not compete with the actors. Already-dark themes stay dark.
 const average=total/Math.max(1,count)||1;
 const center=Math.min(prop?66:53,average*.72);
 for(let i=0;i<d.length;i+=4){
  if(d[i+3]<64){d[i+3]=0;continue;}
  const grey=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722;
  // Compress local contrast as well as average luminance: black seams and bright caps
  // must not dominate poison telegraphs or the actors, even in a bright source atlas.
  const tone=center+(grey-average)*(prop?.48:.38);
  for(let k=0;k<3;k++)d[i+k]=Math.round(Math.max(10,Math.min(prop?102:84,tone+(d[i+k]-grey)*.36))/4)*4;
  d[i+3]=Math.round(d[i+3]/85)*85;
 }
 g.putImageData(pixels,0,0);
}
export function environmentMaterial(source,prop=false,wall=false,{preserve=false}={}){
 // Keep aspect ratios, including narrow flags and tall gates. Original PNGs stay intact.
 const scale=Math.min(1,(prop?64:96)/Math.max(source.width,source.height)),c=surface(Math.max(1,Math.round(source.width*scale)),Math.max(1,Math.round(source.height*scale)));
 if(!c)return source;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(source,0,0,c.width,c.height);
 if(reference&&!prop&&!preserve){
  // Reuse the approved raster material sample itself, rather than amplifying the
  // old atlas noise. Original theme chroma survives in this derived render cache.
  const old=g.getImageData(0,0,c.width,c.height).data,mean=[0,0,0];let count=0;
  for(let i=0;i<old.length;i+=4)if(old[i+3]>64){for(let k=0;k<3;k++)mean[k]+=old[i+k];count++;}
  for(let k=0;k<3;k++)mean[k]/=Math.max(1,count);const grey=mean[0]*.2126+mean[1]*.7152+mean[2]*.0722;
  const crop=wall?[358,738,172,72]:[50,704,160,144];g.drawImage(reference,...crop,0,0,c.width,c.height);
  const pixels=g.getImageData(0,0,c.width,c.height),d=pixels.data;
  for(let i=0;i<d.length;i+=4){const l=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722;for(let k=0;k<3;k++)d[i+k]=l+(mean[k]-grey)*.5;}
  g.putImageData(pixels,0,0);
 }
 palette(c,prop);return c;
}
export function environmentSurface(source){
 // Run once when a static floor/wall cache is built, not per frame. World-aligned 2px grid.
 const small=surface(Math.ceil(source.width/ENVIRONMENT_PIXEL),Math.ceil(source.height/ENVIRONMENT_PIXEL));
 if(!small)return source;const g=small.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(source,0,0,small.width,small.height);
 const out=surface(source.width,source.height),c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(small,0,0,out.width,out.height);return out;
}
