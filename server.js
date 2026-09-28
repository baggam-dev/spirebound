import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
export function createServer(root=process.cwd(),apiPort=process.env.RANKING_API_PORT){
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  if(apiPort&&req.url.startsWith('/api/')){
   const upstream=http.request({host:'127.0.0.1',port:Number(apiPort),path:req.url,method:req.method,headers:{...req.headers,'x-real-ip':req.socket.remoteAddress}},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});
   upstream.setTimeout(15000,()=>upstream.destroy());upstream.on('error',()=>{if(!res.headersSent){res.writeHead(503,{'Content-Type':'application/json'});res.end('{"error":"api_unavailable"}');}else res.destroy();});req.on('aborted',()=>upstream.destroy());req.pipe(upstream);return;
  }
  try{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=pathname==='/'?'index.html':pathname.slice(1);
   const allowed=file===basename(file)&&!file.includes('\\')&&(['index.html','upgrade.html'].includes(file)||['style.css','layout.css','mobile.css','pixel-theme.css','pixel-font.woff2','title-art.png','FONT-LICENSE.txt'].includes(file)||/^[a-z][a-z0-9-]*\.js$/.test(file)&&file!=='server.js');
   if(!allowed)throw Error();const data=await readFile(resolve(root,file));
   res.setHeader('Content-Type',({'.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[extname(file)]);res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end('Not found');}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||5173),host=process.env.HOST||'0.0.0.0';createServer().listen(port,host,()=>console.log(`Spirebound: http://localhost:${port}`));
}
