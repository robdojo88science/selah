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
