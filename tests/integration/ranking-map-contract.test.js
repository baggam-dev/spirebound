import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {newRun} from '../../src/game/engine.js';
import {RELEASE} from '../../src/game/version.js';

test('actual generated classic and expanded maps satisfy Python online-start validation',()=>{
 const bundled=join(process.env.USERPROFILE||'', '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
 const python=process.env.PYTHON||(existsSync(bundled)?bundled:process.platform==='win32'?'python':'python3');
 const runs=[];
 for(const campaign of ['classic','expanded'])for(const seed of [1,31,98]){
  const s=newRun(seed,{campaign});
  runs.push({runId:`map-contract-${campaign}-${seed}`,seed,roomCounts:s.floors.map(r=>r.length),
   rulesVersion:s.ranking.rulesVersion,seasonId:s.ranking.seasonId,gameVersion:s.ranking.gameVersion});
 }
 const script=`import json, sys, tempfile
from pathlib import Path
sys.path.insert(0, 'api')
from ranking_api import Ranking
data = json.load(sys.stdin)
with tempfile.TemporaryDirectory() as folder:
    config = dict(season='SPIREBOUND', open=True, versions=[data['version']], origins=[], blockedNames=[])
    app = Ranking(Path(folder) / 'ranking.sqlite3', config)
    token = app.session(None)[1]
    for run in data['runs']:
        result = app.start(token, run)
        assert result['runId'] == run['runId']
        assert result == app.start(token, run)
    assert app.leaderboard(token, 'SPIREBOUND')['entries'] == []
print('accepted', len(data['runs']))
`;
 const result=spawnSync(python,['-B','-c',script],{input:JSON.stringify({version:RELEASE,runs}),encoding:'utf8',timeout:60000});
 assert.equal(result.status,0,result.error?.message||result.stdout+result.stderr);
 assert.match(result.stdout,/accepted 6/);
});
