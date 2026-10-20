// Plain data shared by presentation and save validation; no DOM or rendering imports.
export const BOSS_LINES=Object.freeze({
 warden:{intro:['.......']},
 prism:{intro:['미등록 개체 감지.','접근을 차단한다.'],death:['왕실 봉인…','유지… 명령…']},
 slime:{intro:['저 위는… 안 돼… 안 돼…'],death:['전하… 문을… 열지 마…']},
 kald:{intro:['폐하의 명이다.','이 문은 열지 않는다.'],death:['베라… 끝까지… 문을…']},
 vera:{intro:['우리가 지키는 건…','왕좌가 아니야.'],death:['칼드… 저 문은…'],last:['왕을… 깨우지 마…']},
 king:{intro:['아직도… 문밖에','사람이 남아 있느냐.'],phase2:['내 몸이… 내 말을 듣지 않는다.'],death:['왕좌 너머… 아직 놈이 있다.']},
 commander:{intro:['왕은 잠들었군.','하지만 봉인은 아직이다.'],phase2:['여기서 멈춰라.']},
 demon:{intro:['이 탑에서…','나갈 수 있을 것 같으냐.']}
});
export function validBossDialogueSeen(value){
 return value===undefined||Array.isArray(value)&&value.length<=128&&new Set(value).size===value.length&&value.every(k=>typeof k==='string'&&/^[0-9]:[0-9]{1,3}:(warden|prism|slime|kald|vera|king|commander|demon):(intro|phase2|phase3|death)$/.test(k));
}
