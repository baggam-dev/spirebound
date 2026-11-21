// Labels follow enemyName() combat terminology. Omitted run means the current catalog.
export const remnantParts=Object.freeze(['hand','foot','eye','nose','mouth','core']);
const revised=Object.freeze({hand:'잔해의 손',foot:'잔해의 발',eye:'봉인 눈가면',nose:'봉인 코가면',mouth:'봉인 입가면',core:'봉인의 거상'});
const legacy=Object.freeze({hand:'대악마의 손',foot:'대악마의 발',eye:'대악마의 눈',nose:'대악마의 코',mouth:'대악마의 입',core:'대악마 본체'});
export const remnantPartName=(part,run)=>((!run||run.bossLayoutVersion===1)?revised:legacy)[part]||'';
