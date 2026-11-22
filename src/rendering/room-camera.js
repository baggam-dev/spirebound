import {roomGeometry} from '../world/room-geometry.js';
export const ROOM_VOID_COLOR='#050608';
const dimension=n=>Number.isFinite(n)&&n>0?n:1;
// The common combat frame is never cropped or stretched to match a device.
export function createRoomCamera(width,height,room=null){
 width=dimension(width);height=dimension(height);
 const {frame}=roomGeometry(room),scale=Math.min(width/frame.width,height/frame.height);
 return Object.freeze({width,height,scale,x:(width-frame.width*scale)/2-frame.x*scale,y:(height-frame.height*scale)/2-frame.y*scale});
}
export const worldToScreen=(camera,point)=>({x:point.x*camera.scale+camera.x,y:point.y*camera.scale+camera.y});
export const screenToWorld=(camera,point)=>({x:(point.x-camera.x)/camera.scale,y:(point.y-camera.y)/camera.scale});
// Explicit scope keeps HUD/cutscene transforms independent, including failed draws.
export function withRoomCamera(c,camera,draw){
 c.save();try{
  c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
  c.fillStyle=ROOM_VOID_COLOR;c.fillRect(0,0,camera.width,camera.height);
  c.setTransform(camera.scale,0,0,camera.scale,camera.x,camera.y);return draw(c);
 }finally{c.restore();}
}
