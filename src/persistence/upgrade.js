import {collectRecords,importRecords} from './upgrade-transfer.js';
const $=id=>document.getElementById(id),secureOrigin='https://'+location.host,oldOrigin='http://'+location.host,isSecure=location.protocol==='https:';
let lastRecords=null,popup=null,nonce=null;
$('play').href=secureOrigin+'/';$('transfer').hidden=isSecure;$('importLabel').hidden=!isSecure;
function download(records){const url=URL.createObjectURL(new Blob([JSON.stringify(records)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=isSecure?'spirebound-local-backup.json':'spirebound-http-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('download').onclick=()=>{try{download(lastRecords||collectRecords(localStorage));}catch{$('status').textContent='브라우저 저장 공간에 접근할 수 없습니다.';}};
function receive(records){const result=importRecords(localStorage,records);lastRecords=records;$('status').textContent=`기록 ${result.added}개를 옮겼습니다.${result.skipped?' 기존 기록 '+result.skipped+'개는 유지하고 가져온 원본을 별도 백업했습니다.':''} 게임으로 이동해 주세요.`;$('download').textContent='가져온 원본 백업 받기';return result;}
$('importFile').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>8000000)throw Error('백업 파일이 너무 큽니다.');receive(JSON.parse(await file.text()));}catch(error){$('status').textContent=error.message||'백업을 읽지 못했습니다.';}};
if(isSecure){
 document.title='Spirebound · 기록 백업·가져오기';$('heading').textContent='기록 백업·가져오기';$('intro').textContent='이 브라우저의 진행 도전·최근 개인 기록·랭킹 등록 대기를 JSON 파일로 보관하거나 가져옵니다. 온라인 순위는 서버에 남고 쿠키는 백업에 포함되지 않습니다.';$('download').textContent='이 브라우저 기록 백업 받기';$('importPolicy').textContent='기존 기록은 덮어쓰지 않습니다. 가져온 도전의 다른 기기 온라인 등록 권한은 옮겨지지 않습니다. 브라우저 기록은 사이트 데이터 설정에서 삭제할 수 있지만 공개 랭킹은 삭제되지 않습니다.';
 const token=new URLSearchParams(location.hash.slice(1)).get('receive');
 if(window.opener&&/^[a-f0-9]{32}$/.test(token||'')){
  const source=window.opener;let timer;
  const notify=()=>source.postMessage({type:'spirebound-ready',nonce:token},oldOrigin);
  const listener=event=>{if(event.origin!==oldOrigin||event.source!==source||event.data?.type!=='spirebound-records'||event.data.nonce!==token)return;clearInterval(timer);window.removeEventListener('message',listener);try{receive(event.data.records);source.postMessage({type:'spirebound-imported',nonce:token},oldOrigin);}catch(error){$('status').textContent=error.message||'가져오지 못했습니다. 이전 기록은 보존되어 있습니다.';}};
  window.addEventListener('message',listener);notify();timer=setInterval(notify,500);setTimeout(()=>clearInterval(timer),20000);
 }
}else{
 $('transfer').onclick=()=>{try{lastRecords=collectRecords(localStorage);nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');popup=window.open(secureOrigin+'/upgrade.html#receive='+nonce,'_blank');$('status').textContent=popup?'새 창에서 기록을 옮깁니다. 이 창은 완료될 때까지 열어 두세요.':'새 창이 차단되었습니다. 백업을 받은 뒤 HTTPS의 기록 가져오기 화면에서 불러오세요.';}catch{$('status').textContent='기록을 읽지 못했습니다. 이전 기록을 삭제하지 말고 다시 시도해 주세요.';}};
 window.addEventListener('message',event=>{if(event.origin!==secureOrigin||event.source!==popup||event.data?.nonce!==nonce)return;if(event.data.type==='spirebound-ready')popup.postMessage({type:'spirebound-records',nonce,records:lastRecords},secureOrigin);if(event.data.type==='spirebound-imported')$('status').textContent='옮기기가 완료되었습니다. 새 창에서 게임을 계속해 주세요.';});
}
