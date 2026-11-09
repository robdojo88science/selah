import {preference,setPreference} from './storage.js';
import {parseReference} from './core.js';
import {$,el,button,heading,notify} from './ui.js';
let catalog,position=preference('position',{id:'JHN',chapter:1}),selected=new Set(),current=[],loadToken=0;
export async function getCatalog(){if(!catalog){const r=await fetch('./data/bible/catalog.json');if(!r.ok)throw Error('Bible catalog unavailable offline. Reconnect once to finish setup.');catalog=await r.json();}return catalog;}
export async function bookData(id){const r=await fetch('./data/bible/'+id+'.json');if(!r.ok)throw Error('This book is unavailable. Reconnect and use Settings to download the offline Bible.');return r.json();}
export async function verseOfDay(){
 const refs=[['PSA',46,10],['PRO',3,5],['JHN',3,16],['PHP',4,6],['PSA',23,1],['MAT',11,28],['ROM',12,12]];
 const d=new Date(),index=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000)%refs.length;
 const [id,chapter,verse]=refs[index];const books=await getCatalog(),data=await bookData(id),v=data[chapter-1].find(v=>v.number===String(verse));
 return {text:v.text,reference:books.find(b=>b.id===id).name+' '+chapter+':'+verse};
}
export async function renderBible(main,useInDevotion,reference){
 const books=await getCatalog();let requested=null;
 if(reference)requested=parseReference(reference,books);
 if(requested)position={id:requested.book.id,chapter:requested.chapter};
 if(!books.some(b=>b.id===position.id&&position.chapter>=1&&position.chapter<=b.chapters))position={id:'JHN',chapter:1};
 main.replaceChildren(heading('Read. Pause. Listen.','Let God’s Word meet you right where you are.'));
 const controls=el('div',{class:'toolbar'}),book=el('select',{'aria-label':'Bible book'}),chapter=el('select',{'aria-label':'Chapter'});
 for(const testament of ['Old Testament','New Testament']){const group=el('optgroup',{label:testament});for(const b of books.filter(b=>b.testament===testament))group.append(el('option',{value:b.id,text:b.name}));book.append(group);}
 book.value=position.id;
 const search=el('form'),searchInput=el('input',{placeholder:'John 3:16 or Proverbs 3:5-6','aria-label':'Bible reference'});
 search.append(el('label',{text:'Go to a passage'},el('div',{class:'inline'},searchInput,el('button',{type:'submit',text:'Go'}))));
 controls.append(el('label',{text:'Book'},book),el('label',{text:'Chapter'},chapter),search);
 const size=el('input',{type:'range',min:16,max:32,value:Math.min(32,Math.max(16,Number(preference('fontSize',20))||20)),'aria-label':'Bible text size'});
 controls.append(el('label',{text:'Text size'},size));
 const panel=el('section',{class:'panel reading'}),title=el('h2'),verses=el('div',{class:'verses'}),selectionText=el('span',{class:'saved',text:'Select verses to reflect on or copy.'});
 const copy=button('Copy selection',async()=>{await navigator.clipboard.writeText(selectedPassage().scripture);notify('Passage copied.');});
 const use=button('Use in Devotion',()=>useInDevotion(selectedPassage()),'primary');
 const clear=button('Clear',()=>{selected.clear();updateSelection();});
 const prev=button('← Previous chapter',()=>navigate(-1)),next=button('Next chapter →',()=>navigate(1));
 panel.append(el('div',{class:'section-top'},title,el('span',{class:'badge',text:'WORLD ENGLISH BIBLE'})),verses,el('div',{class:'reader-actions'},selectionText,el('div',{class:'actions'},copy,use,clear)),el('div',{class:'section-top'},prev,next));
 main.append(controls,panel,el('p',{class:'muted',text:'World English Bible · Protestant Edition · Public domain. Select verse buttons to build a passage.'}));
 function selectedPassage(){
 const values=current.filter(v=>selected.has(v.number));const b=books.find(b=>b.id===position.id);
 return {reference:b.name+' '+position.chapter+':'+values.map(v=>v.number).join(','),scripture:values.map(v=>v.number+' '+v.text).join('\n')};
 }
 function updateSelection(){for(const n of verses.children)n.setAttribute('aria-pressed',String(selected.has(n.dataset.verse)));copy.disabled=use.disabled=clear.disabled=!selected.size;selectionText.textContent=selected.size?selected.size+' verse(s) selected':'Select verses to reflect on or copy.';}
 function fillChapters(){chapter.replaceChildren();const b=books.find(b=>b.id===book.value);for(let n=1;n<=b.chapters;n++)chapter.append(el('option',{value:n,text:String(n)}));chapter.value=position.chapter;}
 async function load(range=null){
 const token=++loadToken;selected.clear();verses.replaceChildren(el('p',{text:'Opening Scripture…'}));updateSelection();
 try{const data=await bookData(position.id);if(token!==loadToken)return;current=data[position.chapter-1];
 if(range?.requestedVerses?.some(n=>!current.some(v=>n>=Number(v.number.split('-')[0])&&n<=Number(v.number.split('-').at(-1)))))throw Error('The starting verse does not exist in this chapter.');
 if(range?.end&&!current.some(v=>Number(v.number.split('-').at(-1))===range.end))throw Error('The ending verse does not exist in this chapter.');
 title.textContent=books.find(b=>b.id===position.id).name+' '+position.chapter;verses.replaceChildren();
 for(const v of current){const b=button('',()=>{selected.has(v.number)?selected.delete(v.number):selected.add(v.number);updateSelection();},'verse');b.dataset.verse=v.number;b.append(el('sup',{text:v.number}),v.text);if(v.notes?.length)b.append(el('small',{class:'verse-note',text:' ['+v.notes.join(' ')+']'}));b.setAttribute('aria-label','Verse '+v.number+': '+v.text);verses.append(b);if(range?.requestedVerses?.some(n=>n>=Number(v.number.split('-')[0])&&n<=Number(v.number.split('-').at(-1))))selected.add(v.number);}
 setPreference('position',position);prev.disabled=position.id===books[0].id&&position.chapter===1;next.disabled=position.id===books.at(-1).id&&position.chapter===books.at(-1).chapters;updateSelection();
 }catch(e){verses.replaceChildren(el('p',{class:'notice error',role:'alert',text:e.message}));}
 }
 async function navigate(delta){let i=books.findIndex(b=>b.id===position.id),c=position.chapter+delta;if(c<1){i--;c=books[i].chapters;}else if(c>books[i].chapters){i++;c=1;}position={id:books[i].id,chapter:c};book.value=position.id;fillChapters();await load();}
 book.onchange=()=>{position={id:book.value,chapter:1};fillChapters();load();};chapter.onchange=()=>{position.chapter=Number(chapter.value);load();};
 size.oninput=()=>{verses.style.fontSize=size.value+'px';setPreference('fontSize',Number(size.value));};size.oninput();
 search.onsubmit=async e=>{e.preventDefault();try{const r=parseReference(searchInput.value,books);position={id:r.book.id,chapter:r.chapter};book.value=position.id;fillChapters();await load(r);}catch(error){notify(error.message);}};
 fillChapters();await load(requested);
}


