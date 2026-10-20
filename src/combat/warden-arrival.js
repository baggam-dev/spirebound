export const WARDEN_ARRIVAL_SECONDS=1;
export const isWarden=e=>e.type==='boss'&&(!e.variant||e.variant==='warden');
export const wardenArriving=s=>!!(s?.floors?.[s.floor]?.[s.room]?.wardenArrival>0);
export function beginWardenArrival(s,r,first){
 if(s.floor!==1||!first||s.practice||s.key||r.type!=='boss'||r.used||!r.enemies.some(e=>isWarden(e)&&e.hp>0))return;
 r.wardenArrival=WARDEN_ARRIVAL_SECONDS;
 r.wardenRise=.4;
}
// Keep only normal movement alive. Every offensive simulation path is bypassed.
export function tickWardenArrival(r,dt){
 if(!(r.wardenArrival>0)){if(r.wardenRise>0)r.wardenRise=Math.max(0,r.wardenRise-dt);return false;}
 r.wardenArrival=Math.max(0,r.wardenArrival-dt);
 return true;
}
