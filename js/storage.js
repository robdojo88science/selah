let database;
export function openDB(){
 return new Promise((resolve,reject)=>{
 if(!globalThis.indexedDB){reject(Error('IndexedDB is unavailable.'));return;}
 const request=indexedDB.open('selah-journal',1);
 request.onupgradeneeded=()=>{const store=request.result.createObjectStore('entries',{keyPath:'id'});store.createIndex('date','date');};
 request.onerror=()=>reject(request.error);
 request.onblocked=()=>reject(Error('Another Selah tab is blocking storage. Close other tabs and reload.'));
 request.onsuccess=()=>{database=request.result;database.onversionchange=()=>database.close();resolve();};
 });
}
function transact(mode,action){
 return new Promise((resolve,reject)=>{
 if(!database){reject(Error('Journal storage is unavailable. Export your current writing before leaving.'));return;}
 let tx;try{tx=database.transaction('entries',mode);const request=action(tx.objectStore('entries'));tx.oncomplete=()=>resolve(request?.result);tx.onerror=()=>reject(tx.error||Error('Storage failed.'));tx.onabort=()=>reject(tx.error||Error('Save was interrupted.'));}catch(e){reject(e);}
 });
}
export const allEntries=()=>transact('readonly',s=>s.getAll());
export const putEntry=e=>transact('readwrite',s=>s.put(e));
export const removeEntry=id=>transact('readwrite',s=>s.delete(id));
export const addEntries=entries=>transact('readwrite',s=>{for(const e of entries)s.add(e);});
export function preference(key,fallback){try{return JSON.parse(localStorage.getItem('selah-'+key))??fallback;}catch{return fallback;}}
export function setPreference(key,value){try{localStorage.setItem('selah-'+key,JSON.stringify(value));return true;}catch{return false;}}
