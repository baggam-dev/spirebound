# 0.50 이펙트 검증 증거

- full.log: 샌드박스 밖 전체670 통과(Python API통합 포함). full-sandbox.log는 로컬API EACCES 실패 이력이며 성공근거가 아니다.
- focused.log: 관련39 통과. finish-tests.log: 전체시작후 작성 마감3 통과(실행된 전체범위 합계673).
- canvas/result.json, canvas-final.log: 구0.49/신0.50 동일합성장면8개/84검사. PNG는 실제Canvas 결과로 imagegen시안과 다르다. 렌더비용은 동일함수를 직접호출한CPU시점표본이며 구게임의reduced전체생략과의비교/실휴대폰FPS·메모리누수증거가 아니다. 최초canvas.log/Canvas-elevated.log는브라우저권한/격리서버접속실패로성공근거제외.
- raf/result.json: 실제게임PC/가로모바일 기본/완화4장면·저장재개/자산실패시저장보존재시도1 통과. 실휴대폰검증아님.
- skills/skill-renewal-report.json: UI4/갤러리66/검10·5원소600프레임과저장왕복/검PNG실패fallback 통과. skills.log는 옛QA의지연자산activate누락으로대기해중단한빈로그, skills-final.log가성공근거다. QA수정으로해결했으며게임추가수정없음.
- boss/result.json: 실제게임보스핵심4/저장재개 통과.
- deploy.log: release-20261108-224859-95f51a/runtime b2b92bf 공식배포·서버API27/nginx/health/index일치. 이전0.49릴리스보존.
- public-canvas/result.json: 공개모듈4/48검사, 실제PNG직접확인. public-files/public-online/public-boss의최종성공여부는 WORK_STATUS 최신상단/해당결과를따른다.

모든브라우저는격리저장을사용하고실운영순위제출을하지않는다. 온라인시작은격리된세션/시작API만호출한다. 토큰·쿠키·사용자원시기록은저장하지않는다. 부하값은개발PC Edge에뮬레이션이다.
## 최종 공개 결과
public-online2/버전0.50·public-canvas4/48·public-boss4/저장/오류0·실점수제출0통과。public-files는218파일/PNG/보안assert이후이전버튼대기실패(전체명령실패보존). HTTP서버200정상/Edge자동HTTPS승격원인。public-transfer-confirmed가QA전용자동승격해제후이전2흐름/원본및기존HTTPS저장보존통과。public-transfer/public-transfer-final은원인진단중단로그이며성공근거아님。最終실PNG직접확인/로컬서버종료.
