import {DeferredImage} from './asset-requests.js';
// Approved native transparent atlas. Source metadata measured without rewriting PNG.
export const VERA_BODY_HEIGHT=69.6;
const width=2172,height=724,cell=724,heads=[124,126,126],feet=[708,707,708],anchors=[327.5,1017.5,1752];
const frames=[];
export const veraSpriteState=()=>({ready:frames.length===3,frames:frames.length,bodyHeight:VERA_BODY_HEIGHT});
export function veraPoseIndex(e,{staticPose=false}={}){
 if(staticPose)return 0;
 if(e.darkFlash?.time>0||e.elite==='volley'&&e.opening>0&&e.eliteCooldown>2.82)return 2;
 return e.darkAttack||e.eliteWarning>0?1:0;
}
export const veraFrame=(e,options)=>frames[veraPoseIndex(e,options)]||null;
export const veraSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new DeferredImage();image.onload=()=>{try{
  if(image.naturalWidth!==width||image.naturalHeight!==height){resolve(false);return;}
  const next=[];
  for(let i=0;i<3;i++){
   const scale=VERA_BODY_HEIGHT/(feet[i]-heads[i]),canvas=document.createElement('canvas');canvas.width=Math.ceil(cell*scale);canvas.height=Math.ceil(height*scale);
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,i*cell,0,cell,height,0,0,cell*scale,height*scale);
   next.push({canvas,x:(i*cell-anchors[i])*scale,y:21-feet[i]*scale});
  }
  frames.push(...next);resolve(true);
 }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/vera-royal-eye-atlas-v1.png',import.meta.url).href;
});
