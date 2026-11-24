import {activateAssetFiles} from './asset-requests.js';
export function presentationAssetFiles(s){
 const files=[];
 if(s?.player?.utility)files.push('hero-utility-casts-v1.png','hero-utility-upper-v1.png');
 if(s?.floors?.[s.floor]?.[s.room]?.enemies?.some(e=>e.hp>0&&['chaser','archer'].includes(e.type)))files.push('enemy-hit-reactions-v1.png');
 if(s?.floors?.[s.floor]?.[s.room]?.enemies?.some(e=>e.hp>0&&e.type==='brute'))files.push('brute-redesign-v1.png');
 return files;
}
export function referencePresentationFiles(s){
 if(!s?.player)return [];
 const files=['reference-hero-frames-v1.png','reference-hero-move-frames-v1.png','reference-fx-frames-v1.png'];
 if(s.floors?.[s.floor]?.[s.room]?.enemies?.some(e=>e.variant==='king'&&e.hp>0&&e.shadowBoss!==1))files.push('reference-mordo-frames-v1.png');
 return files;
}
// Optional art never enters a floor's mandatory pack or blocks play.
export const preparePresentationAssets=s=>activateAssetFiles([...presentationAssetFiles(s),...referencePresentationFiles(s)]);
