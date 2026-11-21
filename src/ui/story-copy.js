// Approved story, presentation only. No quests, run flags or gameplay clocks.
export const STORY_COPY=Object.freeze({
 opening:'돌아오지 않은 이들의 흔적을 따라.',
 closed:'돌아갈 길은 닫혔다.',
 key:'왕의 열쇠를 얻었습니다 · 살아서 1층 출구로 돌아가세요.',
 lastSeal:'왕의 마지막 명령이 문을 붙잡습니다 · 36초를 버티세요.',
 returned:'기다리는 이들에게, 살아 돌아왔습니다.'
});
export function returnStoryCopy(run){
 if(run?.bossLayoutVersion!==1)return {title:'탈출 열쇠 획득',hint:'1층 입구로 돌아가세요. 내려가는 계단은 적을 전멸해야 열립니다.'};
 return {title:'열쇠를 들고, 살아서 내려가라.',hint:'1층 출구로 귀환하세요 · 적을 전멸하면 내려가는 계단이 열립니다.'};
}
export function returnResultText(run){
 return run?.bossLayoutVersion===1?STORY_COPY.returned:'열쇠를 가지고 1층 출구로 돌아왔습니다.';
}
export function returnEpilogueMarkup(run){
 if(run?.bossLayoutVersion!==1||run.status!=='won'||run.practice)return '';
 const night=run.campaign==='expanded'?'왕이 붙잡던 마지막 밤을 뒤로하고, 정찰병은 문턱을 넘었다.':'봉인의 잔해를 지나 얻은 열쇠가 마침내 바깥으로 향하는 문을 열었다.';
 return '<details><summary>문밖의 아침</summary><p>'+night+'</p><p>탑에 남은 이들의 이야기를 모두 알게 된 것은 아니다. 그래도 이번 원정에는 돌아오는 발자국이 남았다.</p><p>멀리서 아침빛이 번진다. 기다리는 이들에게 전할 말은 짧았다. 살아서 내려왔다.</p></details>';
}
export function storyGuideMarkup(run){
 if(run&&run.bossLayoutVersion!==1)return '';
 return '<p><b>왕에게 남은 밤</b> 돌아오지 않은 원정대의 흔적을 찾아 정찰병이 탑에 들어섰습니다. 한때 나라를 구했던 왕은 죽음을 거부했고, 탑의 문은 닫혔습니다. 정상의 열쇠를 얻어 살아서 내려오세요.</p>';
}
export function storyGoalText(run){
 const revised=!run||run.bossLayoutVersion===1,expanded=!run||run.campaign==='expanded';
 const summit=revised?(expanded?'8층 봉인의 잔해, 9층 벨카르와 10층 모르도':'8층 봉인의 잔해'):(expanded?'8층 타락한 왕, 9층 군단장과 10층 대악마':'8층 타락한 왕');
 return '2·4·6층 보스와 7층 정예 관문을 통과하고, '+summit+(!expanded&&!revised?'을':'를')+' 처치해 열쇠를 얻어 1층 출구로 돌아오세요.';
}
