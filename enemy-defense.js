const groups=new WeakMap();
export function bindDefenses(enemies){for(const e of enemies)groups.set(e,enemies);}
export function prismShielded(e,enemies=groups.get(e)||[]){return e.variant==='prism'&&enemies.some(n=>n.hp>0&&n.summoned&&n.summoner===e.id);}
export function enemyDamageFactor(e,source){const base=e.variant==='king'&&e.hp/e.max<=.3?1.2:prismShielded(e)?1/3:e.protected?.5:1;if(e.type==='starKnight'&&e.darkAttack?.kind==='slash'&&source&&Number.isFinite(source.x)&&Number.isFinite(source.y)){const a=Math.atan2(source.y-e.y,source.x-e.x)-e.darkAttack.aim;if(Math.cos(a)>.35)return base*.65;}return base;}
