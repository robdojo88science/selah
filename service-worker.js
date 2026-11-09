const PREFIX='selah-'+new URL('./',import.meta.url).pathname; const CACHE=PREFIX+'shell-v1',BIBLE=PREFIX+'bible-v1';
const scope=new URL('./',import.meta.url);
const local=p=>new URL(p,scope).href;
const shell=['./','index.html','css/style.css','js/app.js','js/core.js','js/ui.js','js/storage.js','js/bible.js','js/devotions.js','js/settings.js','manifest.webmanifest','assets/icons/icon.svg','assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/icon-maskable.png','data/bible/catalog.json','data/bible/provenance.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(shell.map(local)))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith(PREFIX+'shell-')&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
async function cacheBible(port){
 try{const c=await caches.open(BIBLE),r=await fetch(local('data/bible/catalog.json'));if(!r.ok)throw Error('Catalog download failed.');const books=await r.json();
 for(let i=0;i<books.length;i++){const url=local('data/bible/'+books[i].id+'.json');if(!(await c.match(url))){const response=await fetch(url);if(!response.ok)throw Error('Download failed for '+books[i].name);await c.put(url,response);}port?.postMessage({message:'Offline Bible: '+(i+1)+' of '+books.length+' books ready.'});}
 port?.postMessage({done:true,message:'All 66 books are ready for offline reading on this device.'});
 }catch(e){port?.postMessage({done:true,message:'Offline download incomplete: '+e.message+' Reconnect and try again. Previously downloaded books are kept.'});}
}
self.addEventListener('message',event=>{if(event.data?.type==='CACHE_BIBLE')event.waitUntil(cacheBible(event.ports[0]));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 if(event.request.mode==='navigate'){event.respondWith(caches.open(CACHE).then(async c=>(await c.match(local('index.html')))||fetch(event.request)));return;} if(!shell.map(local).includes(url.href)&&!url.pathname.includes('/data/bible/'))return;
 event.respondWith((async()=>{
 const bible=url.pathname.includes('/data/bible/'),cache=await caches.open(bible?BIBLE:CACHE),cached=(await cache.match(event.request))||(bible?await (await caches.open(CACHE)).match(event.request):null);if(cached)return cached;
 try{const r=await fetch(event.request);if(r.ok)await cache.put(event.request,r.clone());return r;}catch{if(event.request.mode==='navigate')return (await caches.open(CACHE)).match(local('index.html'));return new Response('Resource unavailable offline',{status:503});}
 })());
});



