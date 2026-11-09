import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateBackup,validateEntry,planImport,parseReference,validDate} from '../js/core.js';
const catalog=JSON.parse(await fs.readFile(new URL('../data/bible/catalog.json',import.meta.url)));
const entry={id:'one',date:'2026-11-09',title:'Trust',reference:'John 3:16',scripture:'',reflection:'First\nSecond',application:'Listen',prayer:'Thank you',gratitude:'',createdAt:'2026-11-09T01:00:00.000Z',updatedAt:'2026-11-09T01:00:00.000Z',draft:false};
test('Backup validation accepts multiline untrusted text as plain strings',()=>{const e={...entry,title:'<img src=x onerror=alert(1)>'};assert.deepEqual(validateBackup({app:'selah',version:1,entries:[e]}),[e]);});
test('Reject malformed backup before mutation',()=>{for(const e of [{...entry,date:'2026-02-30'},{...entry,prayer:3},{...entry,draft:'yes'},{...entry,updatedAt:'wrong'}])assert.throws(()=>validateEntry(e));assert.throws(()=>validateBackup({app:'selah',version:2,entries:[]}));assert.throws(()=>validateBackup({app:'selah',version:1,entries:[entry,entry]}));});
test('Restore is idempotent and preserves conflicts',()=>{const changed={...entry,reflection:'Changed'};const first=planImport([entry],[entry,changed],()=> 'copy');assert.equal(first.skipped,1);assert.equal(first.conflicts,1);assert.equal(first.additions[0].id,'copy');assert.equal(planImport([entry,...first.additions],[entry,changed]).additions.length,0);assert.equal(entry.reflection,'First\nSecond');});
test('Validate dates and Bible references',()=>{assert.ok(validDate('2024-02-29'));assert.ok(!validDate('2025-02-29'));assert.equal(parseReference('Proverbs 3:5-6',catalog).end,6);assert.equal(parseReference('1 John 2:3',catalog).book.id,'1JN');for(const ref of ['John 99','John 3:0','John 3:7-2','Fake 1:1'])assert.throws(()=>parseReference(ref,catalog));});
test('All 66 Bible books, 1189 chapters, verse numbering and clean text',async()=>{
 assert.equal(catalog.length,66);let chapters=0,verses=0;
 for(const b of catalog){const data=JSON.parse(await fs.readFile(new URL('../data/bible/'+b.id+'.json',import.meta.url)));assert.equal(data.length,b.chapters);chapters+=data.length;
 for(const c of data){assert.ok(c.length);let prev=0;for(const v of c){assert.ok(Number(v.number.split('-')[0])>prev,b.name+' '+v.number);prev=Number(v.number.split('-').at(-1));assert.ok(v.text||v.notes?.length);assert.ok(!/[\\|]/.test(v.text));assert.ok(!/strong=/.test(v.text));verses++;}}}
 assert.equal(chapters,1189);assert.ok(verses>31000);
 const genesis=JSON.parse(await fs.readFile(new URL('../data/bible/GEN.json',import.meta.url)));assert.equal(genesis[0][0].text,'In the beginning, God created the heavens and the earth.');
 const john=JSON.parse(await fs.readFile(new URL('../data/bible/JHN.json',import.meta.url)));assert.equal(john[2][15].text,'For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.');
 const luke=JSON.parse(await fs.readFile(new URL('../data/bible/LUK.json',import.meta.url)));assert.equal(luke[16].find(v=>v.number==='36').text,'');assert.ok(luke[16].find(v=>v.number==='36').notes[0].includes('Some Greek manuscripts'));
 console.log('Verified '+verses+' verse records');
});
test('Static app resources and manifest paths exist',async()=>{
 const manifest=JSON.parse(await fs.readFile(new URL('../manifest.webmanifest',import.meta.url)));
 for(const icon of manifest.icons)await fs.access(new URL('../'+icon.src,import.meta.url));
 const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
 for(const match of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g))await fs.access(new URL('../'+match[1],import.meta.url));
 for(const f of ['app','bible','core','devotions','settings','storage','ui']){const text=await fs.readFile(new URL('../js/'+f+'.js',import.meta.url),'utf8');assert.ok(!text.includes('innerHTML'));assert.ok(!text.includes('https://'));}
});
