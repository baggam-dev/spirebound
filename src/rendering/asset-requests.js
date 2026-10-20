// Register native images without starting network work until a pack is requested.
// Each original onload handler still owns its crop/validation and Ready promise.
const enabled=new Set(),waiting=new Map();
const fileOf=url=>String(url).split(/[?#]/)[0].split('/').at(-1);
export function DeferredImage(){
 const image=new Image();let source='';
 Object.defineProperty(image,'src',{
  configurable:true,get:()=>source,
  set(url){
   source=String(url);const file=fileOf(source);
   const start=()=>{if(source===String(url))image.setAttribute('src',source);};
   if(enabled.has(file))start();
   else{const jobs=waiting.get(file)||[];jobs.push(start);waiting.set(file,jobs);}
  }
 });return image;
}
export function activateAssetFiles(files){
 for(const file of files){
  enabled.add(file);const jobs=waiting.get(file);waiting.delete(file);
  if(jobs)for(const start of jobs)start();
 }
}
export const assetRequestState=()=>({enabled:[...enabled].sort(),waiting:[...waiting.keys()].sort()});
