export const transferKeys=['spirebound.run.v1','spirebound.run.v1.backup','spirebound.run.v1.ended','spirebound.history','spirebound.rank-submissions.v1'];
export function collectRecords(storage){return Object.fromEntries(transferKeys.map(key=>[key,storage.getItem(key)]).filter(([,value])=>value!==null));}
export function importRecords(storage,records){
 if(!records||Array.isArray(records)||typeof records!=='object'||JSON.stringify(records).length>8000000)throw Error('잘못된 백업 파일입니다.');
 for(const [key,value] of Object.entries(records))if(!transferKeys.includes(key)||typeof value!=='string'||value.length>4000000)throw Error('잘못된 백업 항목입니다.');
 const backupKey='spirebound.http-backup.'+Date.now()+'.'+Math.random().toString(36).slice(2),added=[],skipped=[];
 const existingRun=transferKeys.slice(0,3).some(key=>storage.getItem(key)!==null);
 storage.setItem(backupKey,JSON.stringify(records));
 try{for(const [key,value] of Object.entries(records)){if(storage.getItem(key)!==null||existingRun&&transferKeys.slice(0,3).includes(key)){skipped.push(key);continue;}storage.setItem(key,value);added.push(key);}}
 catch(error){for(const key of added)storage.removeItem(key);throw Error('저장 공간이 부족합니다. 가져오기 전 기록은 보존했습니다.');}
 return {added:added.length,skipped:skipped.length,backupKey};
}
