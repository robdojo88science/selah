import {openDB,allEntries,preference} from './storage.js';
import {today} from './core.js';
import {$,el,button,link,heading,report,formatDate,notify,icon} from './ui.js';
import {verseOfDay,renderBible} from './bible.js';
import {startEntry,renderEditor,renderHistory,entryCard,renderPreview,flush,hasUnsaved} from './devotions.js';
import {renderSettings} from './settings.js';
const main=$('#main');let pendingPassage=null,lastRoute='home',routing=Promise.resolve();
document.body.dataset.theme=preference('theme','warm');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.selahInstall=e;});
window.addEventListener('beforeunload',e=>{if(hasUnsaved()){e.preventDefault();e.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush().catch(report);});
const connection=()=>{$('#connection').hidden=navigator.onLine;};window.addEventListener('online',connection);window.addEventListener('offline',connection);connection();
try{await openDB();}catch(e){const warning=$('#storage-warning');warning.hidden=false;warning.textContent='This browser cannot save your journal: '+e.message+' You can still write, but export your current entry or a backup before leaving.';}
async function edit(entry){await startEntry({id:entry.id});if(location.hash==='#devotion')await renderEditor(main,openPassage);else location.hash='devotion';}
async function openPassage(reference){pendingPassage=reference;if(location.hash==='#bible'){await route();}else location.hash='bible';}
async function useInDevotion(passage){await startEntry({passage});location.hash='devotion';}
async function home(){
 const hour=new Date().getHours();const entries=await allEntries().catch(()=>[]);entries.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 const greeting=hour<12?'Good morning.':hour<18?'Good afternoon.':'Good evening.';
 const topline=el('div',{class:'dashboard-top'},el('p',{class:'welcome'},greeting+' ',el('span',{text:'Let’s make a little room for God.'})),el('div',{class:'date-chip'},icon('calendar'),formatDate(today())));
 const read=link('Read the Bible','#bible','button primary');read.prepend(icon('book'));
 const write=link('Write Today’s Devotion','#devotion');write.prepend(icon('pen'));
 const hero=el('section',{class:'hero'}),copy=el('div',{class:'hero-copy'},
 el('div',{class:'hero-tag eyebrow'},icon('leaf'),'A LITTLE STILLNESS. A DEEPER FAITH.'),
 el('h1',{},'Grow closer to God, ',el('span',{text:'one day at a time.'})),
 el('p',{class:'intro',text:'Less noise. More presence. A quiet place to meet God in His Word and carry it into your day.'}),
 el('div',{class:'actions'},read,write),el('div',{class:'hero-footnote'},icon('shield'),'Your reflections stay on this device.'));
 const verse=el('aside',{class:'verse-card'},el('div',{class:'verse-card-head'},icon('sun'),el('div',{class:'eyebrow',text:'A WORD FOR TODAY'})));
 const scene=el('div',{class:'verse-scene'},el('div',{class:'orbit','aria-hidden':'true'}),el('div',{class:'light-orb','aria-hidden':'true'}),verse,el('p',{class:'scene-label',text:'PAUSE · READ · REFLECT'}));
 hero.append(copy,scene);main.replaceChildren(topline,hero);
 const paths=el('section',{class:'daily-path','aria-label':'Your daily rhythm'});
 for(const [symbol,title,description,href] of [['book','01 · Be present','Find a passage.','#bible'],['pen','02 · Go deeper','Make room for reflection.','#devotion'],['archive','03 · Remember','Return to your journey.','#history']]){
 const a=el('a',{href,class:'path-card'},el('span',{class:'path-icon'},icon(symbol)),el('span',{},el('strong',{text:title}),el('small',{text:description})));const arrow=icon('arrow');arrow.classList.add('path-arrow');a.append(arrow);paths.append(a);
 }
 const area=el('section'),recent=el('div',{class:'grid'});
 area.append(el('div',{class:'section-top'},el('div',{},el('h2',{text:entries.length?'Your recent reflections':'Your journey starts here.'}),el('p',{class:'section-caption',text:'Little moments with God. Meaningful steps forward.'})),link('View all devotions →','#history','button quiet')),recent);
 if(entries.length){for(const e of entries.slice(0,3))recent.append(entryCard(e,edit,entry=>renderPreview(main,entry,()=>edit(entry))));}
 else recent.append(el('div',{class:'empty empty-home'},el('div',{class:'empty-icon'},icon('pen')),el('div',{class:'empty-copy'},el('div',{class:'eyebrow',text:'A NEW PAGE IS WAITING'}),el('h3',{text:'Bring your heart. Start with a few words.'}),el('p',{text:'A verse, an honest thought, a simple prayer. That’s enough to begin.'})),link('Start Devotion →','#devotion','button primary')));
 main.append(paths,area,el('p',{class:'privacy-note'},icon('shield'),'Privately yours. No account needed. Keep a backup of your words in Settings.'));
 try{const v=await verseOfDay();verse.append(el('blockquote',{text:v.text}),el('div',{class:'reference',text:v.reference+' · World English Bible'}),el('div',{class:'actions'},button('Reflect on this verse →',()=>useInDevotion({reference:v.reference,scripture:v.text}),'quiet')));}catch(e){verse.append(el('p',{text:e.message}),link('Open the Bible','#bible'));}
}
async function route(){
 let target=location.hash.slice(1)||'home';if(!['home','bible','devotion','history','settings'].includes(target))target='home';
 try{await flush();}catch(e){if(lastRoute==='devotion'&&target!=='devotion'){history.replaceState(null,'','#devotion');notify('Your latest writing has not been saved. Export it before leaving this page.');return;}}
 for(const a of document.querySelectorAll('nav a')){if(a.hash==='#'+target)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
 try{
 if(target==='home')await home();
 if(target==='bible'){const ref=pendingPassage;pendingPassage=null;await renderBible(main,useInDevotion,ref);}
 if(target==='devotion')await renderEditor(main,openPassage);
 if(target==='history')await renderHistory(main,edit);
 if(target==='settings')renderSettings(main);
 lastRoute=target;main.focus({preventScroll:true});window.scrollTo(0,0);
 }catch(e){main.replaceChildren(heading('A moment of interruption.',e.message),link('Return home','#home'));report(e);}
}
window.addEventListener('hashchange',()=>{routing=routing.then(route).catch(report);});await route();
if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
 navigator.serviceWorker.register('./service-worker.js',{type:'module'}).then(reg=>{
 if(reg.waiting)notify('An update is ready. Close all Selah tabs and reopen when your writing is saved.');
 reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)notify('Update downloaded. Close all Selah tabs and reopen to apply it safely.');});});
 }).catch(e=>notify('Offline setup could not complete: '+e.message));
}


