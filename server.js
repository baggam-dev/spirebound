import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
export function createServer(root=process.cwd()){
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  try{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=pathname==='/'?'index.html':pathname.slice(1);
   const allowed=file===basename(file)&&!file.includes('\\')&&(file==='index.html'||['style.css','layout.css','mobile.css'].includes(file)||/^[a-z][a-z0-9-]*\.js$/.test(file)&&file!=='server.js');
   if(!allowed)throw Error();const data=await readFile(resolve(root,file));
   res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[extname(file)]);res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end('Not found');}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||5173),host=process.env.HOST||'0.0.0.0';createServer().listen(port,host,()=>console.log(`Spirebound: http://localhost:${port}`));
}
