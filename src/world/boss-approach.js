import {segmentBlocked} from './terrain.js';
import {challengeKing} from '../combat/upper-floors.js';
import {challengeCommander} from '../combat/commander.js';
import {challengeDemon} from '../combat/demon.js';

// Shared by the floor mark and the actual activation test; no saved state.
export const BOSS_APPROACH=Object.freeze({x:480,y:190,rx:165,ry:90});
export function pendingBoss(s,r){
 if(!s||s.status!=='playing'||s.practice||s.key||r?.type!=='boss'||r.used||r.enemies.length)return null;
 return r.demonPending?'demon':r.commanderPending?'commander':r.kingPending?'king':null;
}
export function approachIntersection(from,to,zone=BOSS_APPROACH){
 const x=(from.x-zone.x)/zone.rx,y=(from.y-zone.y)/zone.ry;
 const dx=(to.x-from.x)/zone.rx,dy=(to.y-from.y)/zone.ry,A=dx*dx+dy*dy,C=x*x+y*y-1;
 if(C<=0)return {x:from.x,y:from.y};
 if(!A)return null;
 const B=2*(x*dx+y*dy),D=B*B-4*A*C;
 if(D<0)return null;
 const t=(-B-Math.sqrt(D))/(2*A);
 return t>=0&&t<=1?{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t}:null;
}
export function startApproachedBoss(s,r,from,to=s.player){
 const kind=pendingBoss(s,r);if(!kind)return null;
 const crossing=approachIntersection(from,to);if(!crossing||segmentBlocked(crossing,BOSS_APPROACH,r.obstacles,2))return null;
 return ({king:challengeKing,commander:challengeCommander,demon:challengeDemon})[kind](s)?kind:null;
}
