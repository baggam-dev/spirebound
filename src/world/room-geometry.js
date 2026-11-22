// Geometry access only. No migration, profile generation or mutation of a room.
const frame=Object.freeze({x:0,y:0,width:960,height:540});
const recovery=Object.freeze({minX:31,maxX:929,minY:49,maxY:491});
const legacy=Object.freeze({frame,recovery,center:Object.freeze({x:480,y:270})});
export const roomFootprints=Object.freeze({small:Object.freeze({x:100,y:50,width:760,height:440}),corridor:Object.freeze({x:0,y:90,width:960,height:360})});
export function roomGeometry(room){
 const footprint=roomFootprints[room?.footprint];if(!footprint)return legacy;
 return {frame,footprint,center:legacy.center,recovery:{minX:footprint.x+31,maxX:footprint.x+footprint.width-31,minY:footprint.y+49,maxY:footprint.y+footprint.height-49}};
}
export function roomDoorCenter(room,d){const n=room?.doorPositions?.[d]??(d%2?legacy.center.y:legacy.center.x),f=roomGeometry(room).footprint;return !f?n:Math.round(d%2?f.y+n*f.height/540:f.x+n*f.width/960);}
export function roomDoorArrival(room,d){const n=roomDoorCenter(room,d),f=roomGeometry(room).footprint||frame;return {x:d===1?f.x+f.width-48:d===3?f.x+48:n,y:d===0?f.y+63:d===2?f.y+f.height-63:n};}
export function roomDoorFrame(room,d){const n=roomDoorCenter(room,d),f=roomGeometry(room).footprint||frame;return {x:d===1?f.x+f.width-29:d===3?f.x:n-40,y:d===0?f.y:d===2?f.y+f.height-35:n-35};}
export function roomDoorEntryZone(room,d){const n=roomDoorCenter(room,d),f=roomGeometry(room).footprint;if(!f)return d%2?{x:d===1?780:25,y:n-75,w:155,h:150}:{x:n-90,y:d===0?40:383,w:180,h:d===0?129:125};return d%2?{x:d===1?f.x+f.width-180:25,y:n-75,w:d===1?935-(f.x+f.width-180):f.x+155,h:150}:{x:n-90,y:d===0?40:f.y+f.height-157,w:180,h:d===0?f.y+129:657-f.y-f.height};}
export function roomExitDirection(room,p){const b=roomGeometry(room).recovery;return p.y<b.minY-1?0:p.x>b.maxX+1?1:p.y>b.maxY+1?2:p.x<b.minX-1?3:-1;}
export function roomRollBounds(room){const f=roomGeometry(room).footprint||frame;return {minX:f.x+50,maxX:f.x+f.width-50,minY:f.y+65,maxY:f.y+f.height-65};}
export function roomProjectileInside(room,p){const f=roomGeometry(room).footprint;return f?p.x>f.x+25&&p.x<f.x+f.width-25&&p.y>f.y+40&&p.y<f.y+f.height-40:p.x>25&&p.x<935&&p.y>40&&p.y<500;}
