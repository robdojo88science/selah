import {allEntries,putEntry,removeEntry} from './storage.js';
import {fields,today,validDate,validateEntry} from './core.js';
import {$,el,button,link,notify,confirmAction,formatDate,heading,download} from './ui.js';
let active=null,revision=0,persistedRevision=0,timer,queue=Promise.resolve(),inputs={},saveStatus,storageError=false;
const labels={reflection:'What is God teaching me through this passage?',application:'How can I apply God’s Word to my life today?',prayer:'My Prayer',gratitude:'What am I thankful to God for today?'};
export function hasUnsaved(){return revision!==persistedRevision;}
function blank(){const stamp=new Date().toISOString();return {id:crypto.randomUUID(),date:today(),title:'',reference:'',scripture:'',reflection:'',application:'',prayer:'',gratitude:'',createdAt:stamp,updatedAt:stamp,draft:true};}
export function currentEntry(){return active?{...active}:null;}
export async function flush(){
 clearTimeout(timer);
 if(!active||!hasUnsaved())return queue;
 const snapshot=structuredClone(active),version=revision;
 if(!validDate(snapshot.date))throw Error('Choose a valid journal date before leaving.');
 snapshot.updatedAt=new Date().toISOString();validateEntry(snapshot);
 const operation=queue.catch(()=>{}).then(()=>putEntry(snapshot));
 queue=operation;
 try{await operation;if(active?.id===snapshot.id){persistedRevision=Math.max(persistedRevision,version);active.updatedAt=snapshot.updatedAt;if(!hasUnsaved()&&saveStatus)saveStatus.textContent='Saved locally · '+(active.draft?'Draft':'Completed');}storageError=false;}
 catch(e){storageError=true;if(saveStatus)saveStatus.textContent='Not saved — export your writing before leaving.';throw e;}
}
function edited(){revision++;if(saveStatus)saveStatus.textContent='Saving…';clearTimeout(timer);timer=setTimeout(()=>flush().catch(e=>notify(e.message)),500);}
export async function startEntry({id=null,fresh=false,passage=null}={}){
 await flush();
 const entries=await allEntries().catch(()=>[]);
 let entry=id?entries.find(e=>e.id===id):null;
 if(!entry&&!fresh)entry=active||entries.filter(e=>e.date===today()).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];
 if(!entry)entry=blank();
 active=structuredClone(entry);revision=0;persistedRevision=0;
 if(passage){active.reference=passage.reference;active.scripture=passage.scripture;edited();}
 return active;
}
export async function renderEditor(main,openPassage){
 if(!active)await startEntry();
 const entry=active;
 main.replaceChildren(heading('A moment with God.','Read slowly. Write honestly. There is no perfect way to begin.'));
 const form=el('form',{class:'panel journal'}),side=el('aside',{class:'panel'});
 saveStatus=el('span',{class:'saved',role:'status',text:storageError?'Not saved — storage unavailable.':hasUnsaved()?'Saving…':entry.createdAt===entry.updatedAt&&!entry.title&&!entry.reflection?'Your words stay on this device.':'Saved locally · '+(entry.draft?'Draft':'Completed')});
 const makeInput=(name,type='textarea')=>{
 const field=el('div',{class:'field'}),id='entry-'+name;
 const label=name==='date'?'Date':name==='title'?'Devotion Title':name==='reference'?'Scripture / Bible Passage':name==='scripture'?'Selected Scripture':labels[name];
 field.append(el('label',{for:id,text:label}));
 const node=type==='textarea'?el('textarea',{id,rows:name==='scripture'?3:5}):el('input',{id,type});
 node.value=entry[name];inputs[name]=node;
 if(name==='title')node.className='title-input';
 if(name==='date'){node.required=true;node.max='9999-12-31';}
 if(name==='reference')node.placeholder='e.g. Proverbs 3:5-6';
 if(name!=='date')node.maxLength=2000000;
 node.addEventListener('input',()=>{active[name]=node.value;edited();if(node.tagName==='TEXTAREA'){node.style.height='auto';node.style.height=node.scrollHeight+'px';}});
 field.append(node);return field;
 };
 inputs={};
 form.append(el('div',{class:'section-top'},el('span',{class:'eyebrow',text:'MY DEVOTION · SOAP JOURNAL'}),saveStatus),makeInput('date','date'),makeInput('title','text'));
 const refs=makeInput('reference','text');refs.append(button('Open Bible passage',()=>openPassage(inputs.reference.value),'quiet'));form.append(refs,makeInput('scripture'));
 for(const [name,letter,helper] of [['reflection','O','Observe the passage. What stands out to you?'],['application','A','Choose one small way to live out what you have read.'],['prayer','P','Speak to God in your own words.'],['gratitude','♡','Optional: notice a gift, a person, or a moment of grace.']]){
 const field=makeInput(name);field.prepend(el('div',{class:'field-head'},el('span',{class:'soap',text:letter})));field.append(el('small',{text:helper}));form.append(field);
 }
 const save=el('button',{type:'submit',class:'primary',text:'Save Devotion'});
 form.append(el('div',{class:'actions'},save,button('Preview',async()=>{await flush();renderPreview(main,active,()=>renderEditor(main,openPassage));}),button('Export this entry',()=>exportEntry(active))));
 form.onsubmit=async event=>{event.preventDefault();if(!form.reportValidity())return;if(!fields.some(f=>active[f].trim())){notify('Add a title, Scripture, or a few words before saving.');return;}active.draft=false;edited();await flush().then(()=>notify('Devotion saved privately on this device.')).catch(e=>notify(e.message));};
 side.append(el('div',{class:'eyebrow',text:'MAKE ROOM FOR STILLNESS'}),el('h3',{text:'A simple rhythm'}),el('p',{text:'S · Scripture\nRead a passage slowly.'}),el('p',{text:'O · Observation\nNotice what God is teaching you.'}),el('p',{text:'A · Application\nCarry His Word into your day.'}),el('p',{text:'P · Prayer\nRespond with an open heart.'}),button('New devotion',async()=>{await startEntry({fresh:true});await renderEditor(main,openPassage);}),'Your writing is saved as a draft while you type. Use Save Devotion when you are ready.');
 main.append(el('div',{class:'split'},form,side));
}
export function exportEntry(entry){
 const text='# '+(entry.title||'Untitled devotion')+'\n\n'+entry.date+'\n\n'+fields.filter(f=>f!=='title').map(f=>'## '+f[0].toUpperCase()+f.slice(1)+'\n\n'+entry[f]).join('\n\n');
 download('selah-'+entry.date+'.md',text,'text/markdown');
}
export function renderPreview(main,entry,edit){
 main.replaceChildren(heading(entry.title||'Untitled devotion',formatDate(entry.date)),el('div',{class:'actions'},button('Edit devotion',edit,'primary'),button('Export as Markdown',()=>exportEntry(entry)),link('Devotion History','#history')));
 const article=el('article',{class:'panel reading preview'});
 if(entry.reference)article.append(el('h2',{text:entry.reference}));
 if(entry.scripture)article.append(el('blockquote',{text:entry.scripture}));
 for(const name of ['reflection','application','prayer','gratitude'])if(entry[name])article.append(el('h3',{text:labels[name]}),el('p',{text:entry[name]}));
 main.append(article);
}
export function entryCard(entry,onEdit,onView,onDelete){
 const card=el('article',{class:'card'},el('time',{datetime:entry.date,text:formatDate(entry.date)}),el('h3',{text:entry.title||'Untitled devotion'}),el('span',{class:'badge',text:entry.draft?'DRAFT':'DEVOTION'}),el('p',{class:'muted',text:entry.reference}),el('p',{text:entry.reflection.slice(0,150)+(entry.reflection.length>150?'…':'')}));
 card.append(el('div',{class:'actions'},button('View',()=>onView(entry)),button('Continue Writing',()=>onEdit(entry),'primary')));
 if(onDelete)card.append(button('Delete',()=>onDelete(entry),'danger quiet'));
 return card;
}
export async function renderHistory(main,onEdit){
 main.replaceChildren(heading('Your walk, in words.','A collection of prayers, reflections, and everyday grace.'));
 const entries=await allEntries(),search=el('input',{type:'search',placeholder:'Search your devotions','aria-label':'Search title, passage, or journal content'}),date=el('input',{type:'date','aria-label':'Filter by date'}),sort=el('select',{'aria-label':'Sort entries'},el('option',{value:'new',text:'Newest first'}),el('option',{value:'old',text:'Oldest first'}));
 const grid=el('div',{class:'grid'}),count=el('p',{class:'muted',role:'status'});
 main.append(el('div',{class:'toolbar'},el('label',{text:'Find a devotion'},search),el('label',{text:'Date'},date),el('label',{text:'Order'},sort),button('Clear filters',()=>{search.value='';date.value='';sort.value='new';draw();})),count,grid);
 const view=entry=>renderPreview(main,entry,()=>onEdit(entry));
 async function remove(entry){if(await confirmAction('Delete “'+(entry.title||'Untitled devotion')+'”? This cannot be undone. Export a backup first if you want to keep it.','Delete devotion?')){await removeEntry(entry.id);if(active?.id===entry.id){active=null;revision=persistedRevision=0;}entries.splice(entries.findIndex(e=>e.id===entry.id),1);draw();notify('Devotion deleted.');}}
 function draw(){
 const query=search.value.toLocaleLowerCase();const list=entries.filter(e=>(!date.value||e.date===date.value)&&fields.some(f=>e[f].toLocaleLowerCase().includes(query))).sort((a,b)=>(a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt))*(sort.value==='new'?-1:1));
 count.textContent=list.length+' devotion'+(list.length===1?'':'s');grid.replaceChildren();let month='';
 for(const entry of list){const key=entry.date.slice(0,7);if(key!==month){month=key;grid.append(el('h2',{class:'month',text:new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(new Date(entry.date+'T12:00:00'))}));}grid.append(entryCard(entry,onEdit,view,remove));}
 if(!list.length)grid.append(el('div',{class:'empty'},el('h3',{text:entries.length?'No matching devotions':'Your story begins here.'}),el('p',{text:entries.length?'Try another search or date.':'Make a little space for God’s Word today.'}),link('Write Today’s Devotion','#devotion')));
 }
 search.oninput=draw;date.oninput=draw;sort.onchange=draw;draw();
}
