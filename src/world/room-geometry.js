// Geometry access only. No migration, profile generation or mutation of a room.
const frame=Object.freeze({x:0,y:0,width:960,height:540});
const recovery=Object.freeze({minX:31,maxX:929,minY:49,maxY:491});
const legacy=Object.freeze({frame,recovery,center:Object.freeze({x:480,y:270})});
export function roomGeometry(){return legacy;}
export function roomDoorCenter(room,d){return room?.doorPositions?.[d]??(d%2?legacy.center.y:legacy.center.x);}
export function roomDoorArrival(room,d){const n=roomDoorCenter(room,d);return {x:d===1?912:d===3?48:n,y:d===0?63:d===2?477:n};}
export function roomDoorFrame(room,d){const n=roomDoorCenter(room,d);return {x:d===1?931:d===3?0:n-40,y:d===0?0:d===2?505:n-35};}
export function roomDoorEntryZone(room,d){const n=roomDoorCenter(room,d);return d%2?{x:d===1?780:25,y:n-75,w:155,h:150}:{x:n-90,y:d===0?40:383,w:180,h:d===0?129:125};}
