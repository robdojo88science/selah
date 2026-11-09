export const fields=['title','reference','scripture','reflection','application','prayer','gratitude'];
export function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
export function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s;}
export function validateEntry(e){
 if(!e||typeof e!=='object'||typeof e.id!=='string'||!e.id||e.id.length>200||!validDate(e.date)||typeof e.draft!=='boolean')throw Error('Invalid entry identity, date, or draft status.');
 for(const f of fields)if(typeof e[f]!=='string'||e[f].length>2000000)throw Error('Invalid journal field: '+f);
 for(const f of ['createdAt','updatedAt'])if(typeof e[f]!=='string'||isNaN(Date.parse(e[f])))throw Error('Invalid entry timestamp.');
 return Object.fromEntries(['id','date',...fields,'createdAt','updatedAt','draft'].map(k=>[k,e[k]]));
}
export function validateBackup(data){
 if(!data||data.app!=='selah'||data.version!==1||!Array.isArray(data.entries)||data.entries.length>100000)throw Error('This is not a supported Selah backup.');
 const entries=data.entries.map(validateEntry);if(new Set(entries.map(e=>e.id)).size!==entries.length)throw Error('Backup contains duplicate entry IDs.');
 return entries;
}
export function fingerprint(e){return JSON.stringify([e.date,...fields.map(f=>e[f]),e.draft]);}
export function planImport(existing,incoming,newId=()=>crypto.randomUUID()){
 const ids=new Map(existing.map(e=>[e.id,e]));const prints=new Set(existing.map(fingerprint));const additions=[];let skipped=0,conflicts=0;
 for(const original of incoming){const e={...original};const print=fingerprint(e);if(prints.has(print)){skipped++;continue;}
 if(ids.has(e.id)){e.id=newId();conflicts++;}ids.set(e.id,e);prints.add(print);additions.push(e);}
 return {additions,skipped,conflicts};
}
export function parseReference(s,catalog){
 const m=s.trim().match(/^(.+?)\s+(\d+)(?::([\d,\s–-]+))?$/);
 if(!m)throw Error('Use a reference such as John 3:16 or Proverbs 3:5-6.');
 const norm=s=>s.toLowerCase().replace(/[.\s]/g,'');
 const book=catalog.find(b=>norm(b.name)===norm(m[1])||norm(b.id)===norm(m[1])||(b.id==='PSA'&&norm(m[1])==='psalm'));
 const chapter=Number(m[2]);let requestedVerses=null;
 if(m[3]){
 requestedVerses=[];
 for(const part of m[3].split(',')){
 const range=part.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
 if(!range)throw Error('Use verse numbers or ranges, such as John 3:16-18.');
 const first=Number(range[1]),last=Number(range[2]||range[1]);
 if(first<1||last<first||last>200)throw Error('That verse range is not valid.');
 for(let n=first;n<=last;n++)requestedVerses.push(n);
 }
 }
 if(!book||chapter<1||chapter>book.chapters)throw Error('That book or chapter is not valid.');
 return {book,chapter,start:requestedVerses?.[0]??null,end:requestedVerses?.at(-1)??null,requestedVerses};
}
