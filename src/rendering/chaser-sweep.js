import {CHASER_WINDUP} from '../combat/chaser.js';
import {CHASER_SLASH} from '../combat/chaser-slash-area.js';
import {drawEnemySector} from './enemy-attack-vfx.js';
// Caller is at actor origin without facing reflection; aim stays a world angle.
export function drawChaserSweep(c,e,reduced=false){
 if(!(e.chaserStrike>0||e.chaserWindup>0)||!Number.isFinite(e.chaserAim))return;
 const {radius,halfAngle,duration}=CHASER_SLASH;
 drawEnemySector(c,0,0,radius,e.chaserAim,halfAngle,{warning:e.chaserWindup>0,progress:1-e.chaserWindup/CHASER_WINDUP,fade:Math.min(1,e.chaserStrike/duration),reduced});
}
