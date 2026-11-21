// Optional observations, derived from existing exploration state; no new unlock flags.
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const revised=s=>s?.bossLayoutVersion===1&&!s.practice;
const traces=Object.freeze([
 '문 안쪽에 원정대의 표식이 남아 있다. 들어온 발자국 옆에, 돌아간 발자국은 없다.',
 '낡은 통행 기록에는 입장 시각만 적혀 있다. 귀환을 허가하는 칸은 비어 있다.',
 '끊어진 짐끈이 벽 틈에 걸려 있다. 누군가 여기까지는 함께 걸어왔다.',
 '봉인석 아래 왕국의 문장이 보인다. 이 탑은 처음부터 감옥이었던 것은 아니다.',
 '지워진 기도문에 한 구절이 남았다. 「왕이여, 우리에게 아침을 돌려주소서.」',
 '바닥의 의식선이 위층으로 이어진다. 지키기 위해 모은 힘은 어디로 흘러가는가.',
 '수호자들의 명령서에는 같은 문장이 반복된다. 「더 이상의 힘을 왕좌로 보내지 말 것.」',
 '부서진 봉인 장치에도 왕국의 문장이 새겨져 있다. 무너진 것은 적의 성벽이 아니라, 한때 모두를 지키던 경계였다.',
 '군단의 깃발은 닳았어도 왕관의 문양만은 새로 꿰매져 있다. 충성은 아직 끝나지 않았다.',
 '왕좌 뒤에는 동이 트는 창이 없다. 왕은 마지막 밤이 끝나지 않기를 바랐던 것일까.'
]);
const enemies=Object.freeze({
 prism:'허가를 묻는 장치는 오래전에 대답할 사람을 잃었다. 검문 명령만 남아 빛을 돌린다.',
 slime:'뒤엉킨 목소리 사이에서 문을 열어 달라는 말이 들린다. 이름을 구별할 수는 없다.',
 kald:'방패의 문장은 닳았지만 지키는 자리는 변하지 않았다. 그가 막는 것은 침입일까, 누군가의 선택일까.',
 vera:'왕좌로 향하는 길목을 겨눈다. 경고하는 목소리와 놓지 못한 명령이 같은 화살 끝에 걸려 있다.',
 commander:'벨카르는 무너진 나라보다 남아 있는 왕을 택했다. 찢긴 군기 아래에서도 그의 자세는 흐트러지지 않는다.',
 king:'한때 나라를 구했던 왕. 왕좌를 지키는 세월이 길어질수록, 그를 기다리는 사람들의 밤도 길어졌다.',
 demon:'봉인의 잔해는 부서진 수호 장치다. 떨어져 움직이는 부위마다 아직 경계를 지키려는 명령이 남아 있다.',
 ossuarySummoner:'흩어진 봉인 조각에 오래된 명령을 엮는다. 일어나는 수호체에는 새 생명 대신 같은 명령이 되풀이된다.',
 choirCantor:'지킬 이를 잃은 성가는 멈추지 않았다. 지금도 쓰러져 가는 탑의 병력을 붙잡는다.',
 ossuaryMinion:'봉인돌을 엮어 만든 몸. 부서지면 빌려 온 명령도 함께 흩어진다.',
 pursuer:'왕의 열쇠를 회수하라는 마지막 명령. 육중한 몸은 출구를 향하는 발자국을 끝까지 따라온다.',
 roamingElite:'다른 원정의 흔적을 두른 사냥꾼. 탑에서 얻은 것이 많아질수록 돌아갈 길도 멀어진다.'
});
const relics=Object.freeze({
 openingWhetstone:'첫 교전 전에 날을 갈던 병사의 습관이 남아 있다. 준비할 수 있는 순간은 짧다.',
 thornBuckle:'물러서는 동료의 등을 지키던 버클. 남은 흠집은 모두 바깥을 향한다.',
 ritualKnot:'끝을 묶지 않은 의식의 매듭. 같은 기도를 다시 시작할 자리를 남겨 두었다.',
 fairyWhistle:'소리를 잃지 않은 은빛 호루라기. 탑에 남은 작은 수호의 힘이 그 부름을 기억한다.',
 phoenixReliquary:'재 아래 온기가 남아 있다. 영원히 사는 약속이 아니라, 한 번 더 일어설 여지다.',
 windSeal:'먼 길을 걷던 이들의 인장. 발걸음을 멈추지 말라는 짧은 말이 새겨져 있다.',
 hawkCharm:'먼 곳보다 빈틈을 먼저 보라는 정찰병의 가르침을 담았다.',
 crackedCrown:'왕관의 무게를 견디지 못한 금. 힘을 얻는 일에는 언제나 대가가 따른다.',
 hunterSeal:'큰 적 앞에서 숨을 고르던 사냥꾼의 인장. 서두르지 않는 손이 약점을 찾는다.',
 resolveEmblem:'빗나간 시도까지 새겨 넣은 문장. 다음 한 번을 버리지 않은 이가 남겼다.'
});
const note=(label,text)=>text?'<details><summary>'+label+'</summary><p>'+esc(text)+'</p></details>':'';
export function storyTracesMarkup(s){
 if(!revised(s))return '';
 const found=(s.floors||[]).flatMap((rooms,f)=>rooms.some(r=>r.seen)&&traces[f]?['<p><b>'+(f+1)+'층</b> · '+esc(traces[f])+'</p>']:[]);
 if(s.key)found.push('<p><b>귀환</b> · 열쇠를 쥐자 탑의 명령이 바뀌었다. 왕의 열쇠는 밖으로 나가서는 안 된다. 이제는 기다리는 이들에게 돌아갈 차례다.</p>');
 return found.length?'<details><summary>탑에서 읽은 흔적</summary>'+found.join('')+'</details>':'';
}
export const enemyLoreMarkup=(s,id)=>revised(s)&&s.bestiary?.[id]?note('관찰 기록',enemies[id]):'';
export const relicLoreMarkup=(s,id)=>revised(s)?note('유물에 남은 이야기',relics[id]):'';
