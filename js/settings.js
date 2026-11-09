import {allEntries,addEntries,preference,setPreference} from './storage.js';
import {validateBackup,planImport,today} from './core.js';
import {flush,currentEntry,hasUnsaved} from './devotions.js';
import {el,button,heading,download,confirmAction,notify} from './ui.js';
export async function backup(){
 try{await flush();}catch(e){notify('Storage unavailable. Export includes your current writing.');}
 const entries=await allEntries().catch(()=>[]);const current=currentEntry();if(current&&hasUnsaved()){const i=entries.findIndex(e=>e.id===current.id);if(i>=0)entries[i]=current;else entries.push(current);}
 download('selah-backup-'+today()+'.json',JSON.stringify({app:'selah',version:1,exportedAt:new Date().toISOString(),entries},null,2));notify('Backup prepared. Keep the downloaded file somewhere safe.');
}
export function renderSettings(main){
 main.replaceChildren(heading('A little care for your journal.','Simple preferences and a safe home for your words.'));
 const panel=el('section',{class:'panel reading'}),theme=el('select',{'aria-label':'Color theme'},el('option',{value:'warm',text:'Warm cream'}),el('option',{value:'paper',text:'Quiet paper'}));theme.value=preference('theme','warm');
 theme.onchange=()=>{document.body.dataset.theme=theme.value;if(!setPreference('theme',theme.value))notify('This browser cannot remember preferences.');};
 const file=el('input',{type:'file',accept:'.json,application/json',id:'import-file'});
 const importButton=button('Review and restore backup',async()=>{
 if(!file.files[0])throw Error('Choose a Selah JSON backup first.');
 if(file.files[0].size>100*1024*1024)throw Error('Backup is larger than the 100 MB import limit.');
 const incoming=validateBackup(JSON.parse(await file.files[0].text()));await flush();const existing=await allEntries();const plan=planImport(existing,incoming);
 if(!plan.additions.length){notify('All entries in this backup are already on this device.');return;}
 if(await confirmAction('Add '+plan.additions.length+' entries? '+plan.skipped+' duplicates will be skipped. '+plan.conflicts+' changed entries will be kept as separate copies. Existing entries will not be overwritten.','Restore backup?')){
 await addEntries(plan.additions);notify('Restored '+plan.additions.length+' devotions. Existing entries were preserved.');file.value='';
 }
 },'primary');
 const offlineStatus=el('p',{role:'status',class:'muted',text:'Offline setup status is checked when you request it.'});
 const offlineButton=button('Download / verify offline Bible',async()=>{
 if(!navigator.serviceWorker?.controller)throw Error('Offline support is not ready. Open Selah on localhost or HTTPS, then reload once.');
 offlineButton.disabled=true;offlineStatus.textContent='Preparing all 66 books for offline reading…';
 const channel=new MessageChannel();
 const timeout=setTimeout(()=>{offlineButton.disabled=false;offlineStatus.textContent='Still preparing or interrupted. Keep Selah open and try again to verify.';},180000);
 channel.port1.onmessage=e=>{offlineStatus.textContent=e.data.message;if(e.data.done){clearTimeout(timeout);offlineButton.disabled=false;channel.port1.close();}};
 navigator.serviceWorker.controller.postMessage({type:'CACHE_BIBLE'},[channel.port2]);
 });
 const install=button('Install Selah',async()=>{
 if(!window.selahInstall){notify('Use your browser’s Install app or Add to Home Screen menu. Availability depends on your browser.');return;}
 await window.selahInstall.prompt();window.selahInstall=null;
 });
 panel.append(el('div',{class:'setting'},el('h2',{text:'Make yourself at home'}),el('label',{text:'Color theme'},theme)),
 el('div',{class:'setting'},el('h2',{text:'Keep your words safe'}),el('p',{text:'Your devotions are saved privately on this device. To move them to another device or protect them from browser data loss, export a backup.'}),el('p',{class:'muted',text:'Entries do not sync automatically. Private browsing, clearing site data, or browser storage eviction can remove them. Backup files contain your private journal in readable form; store them securely.'}),button('Export Backup',backup,'primary')),
 el('div',{class:'setting'},el('h3',{text:'Restore a backup'}),el('p',{text:'Selah validates the entire file before importing. Duplicate content is skipped and changed entries are preserved as separate copies.'}),el('label',{for:'import-file',text:'Selah backup file (.json)'}),file,el('br'),importButton),
 el('div',{class:'setting'},el('h2',{text:'A quiet place, even offline'}),el('p',{text:'After the app shell is cached, your journal works offline. Download all 66 Bible books once for complete offline reading. Browser storage availability still applies.'}),el('div',{class:'actions'},offlineButton,install),offlineStatus),
 el('div',{class:'setting'},el('h3',{text:'Scripture & privacy'}),el('p',{text:'World English Bible, Protestant Edition. Public-domain text from eBible.org. No tracking, accounts, or journal uploads. Local storage is private to your browser profile, but it is not encrypted or password protected.'}),el('a',{href:'./data/bible/provenance.json',text:'Bible source and verification record'})));
 main.append(panel);
}
