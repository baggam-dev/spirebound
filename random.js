export function seededRandom(seed){let state=seed>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function runRandom(s){s.randomState=(Math.imul((s.randomState??s.seed??1)>>>0,1664525)+1013904223)>>>0;return s.randomState/4294967296;}
