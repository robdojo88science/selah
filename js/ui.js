export const $=(selector,root=document)=>root.querySelector(selector);
export function el(tag,props={},...children){const node=document.createElement(tag);for(const [key,value]of Object.entries(props)){if(key==='class')node.className=value;else if(key==='text')node.textContent=value;else node.setAttribute(key,value);}for(const child of children.flat())if(child!==null&&child!==undefined)node.append(child);return node;}
export function button(text,action,kind=''){const b=el('button',{type:'button',class:kind,text});b.addEventListener('click',()=>Promise.resolve().then(action).catch(report));return b;}
export function link(text,href,kind='button'){return el('a',{href,class:kind,text});}
export function notify(message){$('#status').textContent=message;clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('#status').textContent='',6500);}
export function report(error){console.error(error);notify(error.message||'Something went wrong. Please try again.');}
export function confirmAction(message,title='Please confirm'){return new Promise(resolve=>{const d=$('#confirm');$('#confirm-title').textContent=title;$('#confirm-text').textContent=message;d.returnValue='cancel';d.addEventListener('close',()=>resolve(d.returnValue==='ok'),{once:true});d.showModal();});}
export function download(name,text,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=el('a',{href:url,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function formatDate(value){return new Intl.DateTimeFormat(undefined,{dateStyle:'long'}).format(new Date(value+'T12:00:00'));}
export function heading(title,description){return el('div',{class:'page-heading'},el('div',{class:'eyebrow',text:'YOUR QUIET PLACE'}),el('h1',{text:title}),el('p',{text:description}));}
export function icon(name){
 const shapes={
 book:['M12 5c-3-2-7-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15'],
 pen:['m15 4 5 5M5 19l4-1L21 6a2 2 0 0 0-3-3L6 15Zm-1 3h16'],
 leaf:['M5 19C0 10 9 3 21 3c0 12-7 19-16 16Zm0 0L15 9'],
 arrow:['M5 12h14m-5-5 5 5-5 5'],
 shield:['m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Zm-4 9 3 3 5-6'],
 sun:['M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1','M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
 calendar:['M4 5h16v16H4ZM4 10h16M8 3v4m8-4v4m-8 7h2m4 0h2'],
 archive:['M4 4h16v5H4Zm1 5v12h14V9m-10 5h6']
 };
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('class','icon');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 for(const d of shapes[name]||shapes.leaf){const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',d);svg.append(p);}
 return svg;
}
