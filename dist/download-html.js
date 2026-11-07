(() => {
  'use strict';
  const cache=new Map();
  async function read(path){const r=await fetch(path);if(!r.ok)throw new Error('Download resource unavailable');return r;}
  function data(path){if(!cache.has(path))cache.set(path,read(path).then(r=>r.blob()).then(blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);})));return cache.get(path);}
  async function replaceAsync(value,pattern,convert){const matches=Array.from(value.matchAll(pattern));const replacements=await Promise.all(matches.map(convert));for(let i=matches.length-1;i>=0;i--){const match=matches[i];value=value.slice(0,match.index)+replacements[i]+value.slice(match.index+match[0].length);}return value;}
  function save(html,name){const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=name;link.style.display='none';document.body.appendChild(link);link.click();setTimeout(()=>{link.remove();URL.revokeObjectURL(url);},3000);}
  document.querySelectorAll('[data-portable-download]').forEach(link=>link.addEventListener('click',async event=>{
    event.preventDefault();if(link.getAttribute('aria-busy')==='true')return;
    const name=link.download||'Moriyati.html';
    if(document.documentElement.dataset.portable==='true'){save('<!doctype html>\n'+document.documentElement.outerHTML,name);return;}
    const original=link.textContent;link.setAttribute('aria-busy','true');link.textContent=document.documentElement.lang==='en'?'Preparing…':'در حال آماده‌سازی…';
    try{
      const base=link.dataset.portableDownload==='expertise'?'expertise':'index';
      const language=document.documentElement.lang==='en'?'en':'fa';
      const origin=new URL('./',location.href).href;
      let html=await read(base+'.html').then(r=>r.text());
      const scripts=Array.from(html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)).map(m=>m[1]);
      const sources=await Promise.all(scripts.map(path=>read(path).then(r=>r.text())));
      html=html.replace(/\s*<link rel="preload"[^>]+>/g,'').replace(/<script\b[\s\S]*?<\/script>/gi,'');
      html=html.replace('<html ','<html data-portable="true" data-portable-language="'+language+'" data-site-base="'+origin+'" ');
      html=await replaceAsync(html,/<link rel="stylesheet" href="([^"]+)">/g,async m=>{let css=await read(m[1]).then(r=>r.text());css=await replaceAsync(css,/url\(['"]?([^'"\)]+)['"]?\)/g,async u=>u[1].startsWith('data:')?u[0]:"url('"+await data(u[1])+"')");return '<style>'+css+'</style>';});
      html=await replaceAsync(html,/(src|href)="(assets\/[^\"]+)"/g,async m=>m[1]+'="'+await data(m[2])+'"');
      let js=sources.join('\n;\n');
      const paths=[...new Set(Array.from(js.matchAll(/(?<![A-Za-z0-9_-])assets\/[A-Za-z0-9_./-]+\.(?:webp|png|jpeg|jpg|svg)/g)).map(m=>m[0]))];
      const embedded=await Promise.all(paths.map(path=>data(path)));
      paths.forEach((path,i)=>{js=js.split(path).join(embedded[i]);});
      html=html.replace(/href="((?:index|expertise|contact|authenticity|heritage|bulletin)\.html[^\"]*)"/g,(_,path)=>{const url=new URL(path,origin);url.searchParams.set('lang',language);return 'href="'+url.href+'"';});
      const licenseFiles=['CormorantGaramond-OFL.txt','NotoNaskhArabic-OFL.txt','Vazirmatn-OFL.txt','Institution-marks-sources.txt'];
      const licenses=await Promise.all(licenseFiles.map(path=>read('assets/licenses/'+path).then(r=>r.text())));
      const endScript='</scr'+'ipt>';
      const licenseTag='<script type="text/plain" id="font-licenses">'+licenses.join('\n\n').replace(/<\/script/gi,'<\\/script')+endScript;
      const script='<script>\n'+js.replace(/<\/script/gi,'<\\/script')+'\n'+endScript;
      const endBody='</bo'+'dy>';
      html=html.replace(endBody,()=>licenseTag+script+'\n'+endBody);save(html,name);
    }catch(error){link.title=document.documentElement.lang==='en'?'Download failed. Please try again.':'دریافت کامل نشد؛ دوباره تلاش کنید.';}
    finally{link.removeAttribute('aria-busy');link.textContent=original;}
  }));
})();
