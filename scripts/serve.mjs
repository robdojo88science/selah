import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(new URL('../',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
http.createServer(async(req,res)=>{
 try {
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); const relative=pathname.startsWith('/selah/')?pathname.slice(6):pathname; const file=path.resolve(root,'.'+relative);
 if(file!==root && !file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
 const target=(await fs.stat(file)).isDirectory()?path.join(file,'index.html'):file;
 res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});
 res.end(await fs.readFile(target));
 }catch{res.writeHead(404).end('Resource unavailable.');}
}).listen(4173,'127.0.0.1',()=>console.log('Selah: http://127.0.0.1:4173'));

