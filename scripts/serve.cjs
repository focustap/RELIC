const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'};
http.createServer((req,res)=>{
 try{
  let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(name==='/RELIC')name='/RELIC/';
  if(name.startsWith('/RELIC/'))name=name.slice(6);
  const target=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':target.endsWith('.webp')?'public, max-age=3600':'no-cache'});
  fs.createReadStream(target).pipe(res);
 }catch{res.writeHead(400);res.end('Bad request');}
}).listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('RELIC available at http://127.0.0.1:'+(process.env.PORT||4173)+'/RELIC/'));
