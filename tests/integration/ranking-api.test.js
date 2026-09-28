import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
test('ranking API SQLite and HTTP integration suite',()=>{
 const bundled=join(process.env.USERPROFILE||'', '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
 const python=process.env.PYTHON||(existsSync(bundled)?bundled:process.platform==='win32'?'python':'python3');
 const result=spawnSync(python,['-B','-m','unittest','discover','-s','api','-p','test_*.py','-v'],{encoding:'utf8',timeout:60000});
 assert.equal(result.status,0,result.error?.message||result.stdout+result.stderr);
});
