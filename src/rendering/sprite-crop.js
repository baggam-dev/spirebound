// Remove disconnected fragments from adjacent atlas cells after downsampling.
// Retain substantial accessories and nearby anti-aliased edges; no art redraw.
export function cleanDetachedCrop(canvas){
 const c=canvas.getContext('2d'),image=c.getImageData(0,0,canvas.width,canvas.height),d=image.data,w=canvas.width,h=canvas.height,n=w*h,seen=new Uint8Array(n),parts=[];
 for(let start=0;start<n;start++){
  if(seen[start]||d[start*4+3]<16)continue;
  const stack=[start],part=[];seen[start]=1;
  while(stack.length){const at=stack.pop();part.push(at);const x=at%w,y=Math.floor(at/w);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,j=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&!seen[j]&&d[j*4+3]>=16){seen[j]=1;stack.push(j);}}
  }parts.push(part);
 }
 const threshold=Math.max(12,Math.max(0,...parts.map(p=>p.length))*.03),keep=new Uint8Array(n),near=new Uint8Array(n);
 for(const part of parts)if(part.length>=threshold)for(const at of part)keep[at]=1;
 function dilate(source,target,radius){for(let at=0;at<n;at++)if(source[at]){const x=at%w,y=Math.floor(at/w);for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h)target[yy*w+xx]=1;}}}
 dilate(keep,near,3);for(const part of parts)if(part.some(at=>near[at]))for(const at of part)keep[at]=1;
 const edges=new Uint8Array(n);dilate(keep,edges,1);for(let at=0;at<n;at++)if(!keep[at]&&!(d[at*4+3]<16&&edges[at]))d[at*4+3]=0;
 c.putImageData(image,0,0);
}
