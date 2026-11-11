import {DeferredImage} from './asset-requests.js';
// Bake small alpha-trimmed cells once, not a full-resolution readback per draw.
export function bossAtlas(filename,sizes){
 const frames=[];
 const ready=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
  const atlas=new DeferredImage();atlas.onload=()=>{try{
   if(atlas.naturalWidth!==1536||atlas.naturalHeight!==1024){resolve(false);return;}
   const scratch=document.createElement('canvas');scratch.width=scratch.height=512;
   const c=scratch.getContext('2d',{willReadFrequently:true});
   for(let i=0;i<6;i++){
    c.clearRect(0,0,512,512);c.drawImage(atlas,i%3*512,Math.floor(i/3)*512,512,512,0,0,512,512);
    const data=c.getImageData(0,0,512,512).data;let left=512,top=512,right=0,bottom=0;
    for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(data[(y*512+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(left>right||top>bottom)throw Error('Empty boss atlas cell');
    const [maxW,maxH]=sizes[i],w=right-left+1,h=bottom-top+1,scale=Math.min(maxW/w,maxH/h),canvas=document.createElement('canvas');
    canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);const target=canvas.getContext('2d');target.imageSmoothingEnabled=true;target.imageSmoothingQuality='high';target.drawImage(scratch,left,top,w,h,0,0,canvas.width,canvas.height);
    frames.push(canvas);
   }resolve(true);
  }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/'+filename,import.meta.url).href;
 });
 return {frames,ready,state:()=>({ready:frames.length===6})};
}
