import {openDB,allEntries,preference} from './storage.js';
import {today} from './core.js';
import {$,el,button,link,heading,report,formatDate,notify} from './ui.js';
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
 const hero=el('section',{class:'hero'}),copy=el('div',{class:'hero-copy'},el('div',{class:'eyebrow',text:formatDate(today())}),el('p',{class:'muted',text:hour<12?'Good morning!':hour<18?'Good afternoon!':'Good evening!'}),el('h1',{text:'Grow closer to God, one day at a time.'}),el('p',{class:'intro',text:'Take a breath. Set the world aside. There’s a quiet place here for you and God’s Word.'}),el('div',{class:'actions'},link('Read the Bible →','#bible','button primary'),link('Write Today’s Devotion','#devotion')));
 const verse=el('aside',{class:'verse-card'},el('div',{class:'eyebrow',text:'A WORD FOR TODAY'}));
 hero.append(copy,verse);main.replaceChildren(hero);
 const area=el('section'),recent=el('div',{class:'grid'});
 area.append(el('div',{class:'section-top'},el('h2',{text:entries.length?'Return to your reflections':'Begin a daily rhythm'}),link('View all devotions →','#history','button quiet')),recent);
 if(entries.length){for(const e of entries.slice(0,3))recent.append(entryCard(e,edit,entry=>renderPreview(main,entry,()=>edit(entry))));}
 else recent.append(el('div',{class:'empty'},el('div',{class:'eyebrow',text:'A NEW PAGE, EVERY DAY'}),el('h3',{text:'Your first reflection is waiting.'}),el('p',{text:'A verse, a thought, a simple prayer. Start wherever you are.'}),link('Start Devotion','#devotion','button primary')));
 main.append(area,el('p',{class:'muted',text:'Your words stay yours. Devotions are saved on this device, without an account. Back up your journal in Settings.'}));
 try{const v=await verseOfDay();verse.append(el('blockquote',{text:v.text}),el('div',{class:'reference',text:v.reference+' · WEB'}),el('div',{class:'actions'},button('Reflect on this verse →',()=>useInDevotion({reference:v.reference,scripture:v.text}),'quiet')));}catch(e){verse.append(el('p',{text:e.message}),link('Open the Bible','#bible'));}
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
