export function heal(p,amount){p.hp=Math.min(p.max,p.hp+amount);}
export function heartContainer(p){if(p.max>=10)return false;p.max++;heal(p,1);return true;}
export function migrateHealth(s){if(s.healthVersion===1)return s;const p=s.player,ratio=p.hp/p.max;p.max=Math.max(5,Math.min(10,Math.ceil(p.max/20)));p.hp=Math.max(0,Math.min(p.max,Math.ceil(ratio*p.max)));s.healthVersion=1;return s;}
export function damageHearts(raw){return raw>=24?3:raw>=12?2:1;}
export function healthDisplay(p){return '♥'.repeat(Math.max(0,Math.ceil(p.hp)))+'♡'.repeat(Math.max(0,p.max-Math.ceil(p.hp)))+' · '+'◇'.repeat(10-p.max);}
