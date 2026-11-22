import {activateAssetFiles} from './asset-requests.js';
export function presentationAssetFiles(s){
 const files=[];
 if(s?.player?.utility)files.push('hero-utility-casts-v1.png','hero-utility-upper-v1.png');
 if(s?.floors?.[s.floor]?.[s.room]?.enemies?.some(e=>e.hp>0&&['chaser','archer','brute'].includes(e.type)))files.push('enemy-hit-reactions-v1.png');
 return files;
}
// Optional art never enters a floor's mandatory pack or blocks play.
export const preparePresentationAssets=s=>activateAssetFiles(presentationAssetFiles(s));
