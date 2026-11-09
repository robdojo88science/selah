import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root = new URL('../', import.meta.url);
const source = new URL('source-downloads/usfm/', root);
const names = 'Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation'.split('|');
const codes = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split(' ');
export function clean(text) {
 return text.replace(/\\f\s[\s\S]*?\\f\*/g,'').replace(/\\x\s[\s\S]*?\\x\*/g,'')
 .replace(/\\fig\s[\s\S]*?\\fig\*/g,'')
 .replace(/\\\+?w\s+([^|\\]*)(?:\|[^\\]*)?\\\+?w\*/g,'$1')
 .replace(/^\s*\\(?:s\d*|r|d|sp|cl|ms\d*|mr|qa)\s.*$/gm,'')
 .replace(/\\[a-z]+\d*\*/gi,'').replace(/\\[a-z]+\d*\s?/gi,'').replace(/\s+/g,' ').trim();
}
const files = await fs.readdir(source);
const catalog = [];
for (let i=0;i<codes.length;i++) {
 const file = files.find(f => f.endsWith(codes[i]+'engwebp.usfm'));
 if (!file) throw Error('Missing '+codes[i]);
 const raw = await fs.readFile(new URL(file, source),'utf8');
 const chapters = [];
 for (const match of raw.matchAll(/\\c\s+(\d+)\s+([\s\S]*?)(?=\\c\s+\d+|$)/g)) {
  const verses = [];
  for (const v of match[2].matchAll(/\\v\s+(\d+(?:-\d+)?)\s+([\s\S]*?)(?=\\v\s+\d+|$)/g)) {
   const notes=[...v[2].matchAll(/\\f\s[\s\S]*?\\ft\s+([\s\S]*?)\\f\*/g)].map(n=>clean(n[1])); const text=clean(v[2]); if ((!text && !notes.length) || /[\\|]/.test(text)) throw Error('Unparsed markup '+file+' '+v[1]);
   verses.push({number:v[1],text,...(notes.length?{notes}:{})});
  }
  chapters[Number(match[1])-1]=verses;
 }
 if(!chapters.length || chapters.some(c=>!c?.length)) throw Error('Invalid chapters '+file);
 const book={id:codes[i],name:names[i],testament:i<39?'Old Testament':'New Testament',chapters:chapters.length};
 catalog.push(book);
 await fs.writeFile(new URL('data/bible/'+codes[i]+'.json',root),JSON.stringify(chapters));
}
await fs.writeFile(new URL('data/bible/catalog.json',root),JSON.stringify(catalog));
const zip=await fs.readFile(new URL('source-downloads/engwebp_usfm.zip',root));
await fs.writeFile(new URL('data/bible/provenance.json',root),JSON.stringify({translation:'World English Bible, Protestant Edition',source:'https://ebible.org/Scriptures/engwebp_usfm.zip',license:'Public domain',licenseURL:'https://ebible.org/engwebp/copyright.htm',downloaded:'2026-11-09',sha256:crypto.createHash('sha256').update(zip).digest('hex'),notes:'USFM formatting annotations and headings omitted; verse text and numbering retained. Footnotes preserved separately, including text-critical notes for verses with no main text. Rebuild with npm run import-bible.'},null,2));
console.log('Imported '+catalog.length+' books, '+catalog.reduce((n,b)=>n+b.chapters,0)+' chapters.');


