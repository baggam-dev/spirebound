export const ENEMY_COOLDOWN_FACTOR=.85;
export const CHARGE_DURATION=.54;
export const CHARGE_WARNING=.32;
export const MELEE_REACH=61;
export function strengthenEnemy(e){
 if(e.balanceVersion===1)return e;
 if(e.type!=='boss'){const ratio=e.max>0?e.hp/e.max:1;e.max=Math.ceil(e.max*1.25);e.hp=e.hp<=0?0:Math.ceil(e.max*ratio);}
 e.balanceVersion=1;return e;
}
export function migrateEnemies(s){for(const [tier,rooms] of s.floors.entries())for(const r of rooms)for(const e of r.enemies){strengthenEnemy(e);if(tier>0)e.tier??=tier;if(s.key&&e.type!=='boss')e.escapeDepth??=s.floors.length-tier;if(e.type==='boss'&&!e.bossHealthVersion&&e.variant!=='slime'){const ratio=e.hp/e.max;e.max=Math.ceil(e.max*1.5);e.hp=e.hp<=0?0:Math.ceil(e.max*ratio);e.bossHealthVersion=1;}}for(const r of s.floors.flat())for(const e of r.enemies)if(e.type==='boss'&&!e.bossPowerVersion){const ratio=e.hp/e.max;e.max=Math.ceil(e.max*(e.variant==='slime'?1.5:1.4));e.hp=Math.ceil(e.max*ratio);e.bossPowerVersion=18;}return s;}

export function attackProfile(e){const depth=e.escapeDepth||0,tier=depth?5:(e.tier||0);return {speed:(1.12+tier*.035+depth*.035)*(e.trialChampion?1.15:1),count:(e.trialChampion?1:0)+Math.floor(tier/2)+(depth?1+Math.floor(depth/2):0),recovery:Math.max(.42,1-tier*.065-depth*.06)*(e.trialChampion?.6:1)};}

export const chargeProfile=e=>({duration:e.trialChampion?.65:CHARGE_DURATION,warning:e.trialChampion?.28:CHARGE_WARNING,speed:e.trialChampion?305:235});
