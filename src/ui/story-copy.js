// Approved story, presentation only. No quests, run flags or gameplay clocks.
export const STORY_COPY=Object.freeze({
 opening:'돌아오지 않은 이들의 흔적을 따라.',
 closed:'돌아갈 길은 닫혔다.',
 key:'왕의 열쇠를 얻었습니다 · 살아서 1층 출구로 돌아가세요.',
 lastSeal:'왕의 마지막 명령이 문을 붙잡습니다 · 36초를 버티세요.',
 returned:'기다리는 이들에게, 살아 돌아왔습니다.'
});
export function storyGuideMarkup(run){
 if(run&&run.bossLayoutVersion!==1)return '';
 return '<p><b>왕에게 남은 밤</b> 돌아오지 않은 원정대의 흔적을 찾아 정찰병이 탑에 들어섰습니다. 한때 나라를 구했던 왕은 죽음을 거부했고, 탑의 문은 닫혔습니다. 정상의 열쇠를 얻어 살아서 내려오세요.</p>';
}
export function storyGoalText(run){
 const revised=!run||run.bossLayoutVersion===1,expanded=!run||run.campaign==='expanded';
 const summit=revised?(expanded?'8층 봉인의 잔해, 9층 벨카르와 10층 모르도':'8층 봉인의 잔해'):(expanded?'8층 타락한 왕, 9층 군단장과 10층 대악마':'8층 타락한 왕');
 return '2·4·6층 보스와 7층 정예 관문을 통과하고, '+summit+(!expanded&&!revised?'을':'를')+' 처치해 열쇠를 얻어 1층 출구로 돌아오세요.';
}
