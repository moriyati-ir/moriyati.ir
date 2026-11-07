import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {Script,runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'../dist');
const helper=await readFile(resolve(root,'download-html.js'),'utf8');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.woff':'font/woff','.woff2':'font/woff2','.txt':'text/plain'};

async function exportPage(kind,language='fa'){
  let handler,output;
  const attributes=new Map();
  const link={dataset:{portableDownload:kind},download:kind==='expertise'?'Moriyati-Expertise.html':'Moriyati.html',textContent:'دریافت HTML',getAttribute:k=>attributes.get(k)||null,setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k),addEventListener:(event,callback)=>{handler=callback;}};
  class Reader{
    readAsDataURL(blob){blob.arrayBuffer().then(buffer=>{this.result='data:'+blob.type+';base64,'+Buffer.from(buffer).toString('base64');this.onload();}).catch(error=>this.onerror(error));}
  }
  const context={
    document:{documentElement:{dataset:{},lang:language},querySelectorAll:()=>[link],createElement:()=>({style:{},click(){},remove(){}}),body:{appendChild(){}}},
    location:{href:'https://moriyati-ir.github.io/moriyati.ir/index.html?lang='+language},
    fetch:async path=>new Response(await readFile(resolve(root,path)),{headers:{'Content-Type':mime[extname(path)]||'application/octet-stream'}}),
    FileReader:Reader,Blob,URL:class extends URL {static createObjectURL(blob){output=blob;return 'blob:export-test';}static revokeObjectURL(){}},setTimeout(){}
  };
  runInNewContext(helper,context);
  await handler({preventDefault(){}});
  assert.ok(output,'The download must be produced');
  return output.text();
}

test('English portable downloads keep the selected language and GitHub project path',async()=>{
 const html=await exportPage('home','en');
 assert.match(html,/data-portable-language="en"/);
 assert.match(html,/data-site-base="https:\/\/moriyati-ir\.github\.io\/moriyati\.ir\/"/);
 assert.match(html,/href="https:\/\/moriyati-ir\.github\.io\/moriyati\.ir\/contact\.html\?lang=en"/);
 assert.doesNotMatch(html,/https:\/\/moriyati-mint-treasury\.humble-deer-9355\.chatgpt\.site\//);
});

test('An offline export restores its language and repairs newly rendered cross-page links',async()=>{
 const portableRoot={dataset:{portable:'true',portableLanguage:'en',siteBase:'https://moriyati-ir.github.io/moriyati.ir/'},lang:'fa',dir:'rtl'};
 const anchor=href=>({href,getAttribute(){return this.href;},hasAttribute(){return false;},setAttribute(k,v){this.href=v;}});
 const links=[anchor('authenticity.html?lang=fa#guide-celestial'),anchor('#/works/celestial'),anchor('https://example.org/contact.html')];
 const context={document:{documentElement:portableRoot,querySelectorAll:s=>s==='a[href]'?links:[],querySelector:()=>null},location:{search:'',href:'file:///downloads/Moriyati.html'},URL,URLSearchParams,localStorage:{getItem:()=> 'fa',setItem(){}},history:{replaceState(){}},dispatchEvent(){},CustomEvent:class{}};
 context.window=context;
 runInNewContext(await readFile(resolve(root,'locale.js'),'utf8'),context);
 assert.equal(portableRoot.lang,'en');
 assert.equal(links[0].href,'https://moriyati-ir.github.io/moriyati.ir/authenticity.html?lang=en#guide-celestial');
 assert.equal(links[1].href,'#/works/celestial');assert.equal(links[2].href,'https://example.org/contact.html');
 context.MoriyatiLocale.set('fa');
 assert.equal(portableRoot.dataset.portableLanguage,'fa');
 assert.equal(links[0].href,'https://moriyati-ir.github.io/moriyati.ir/authenticity.html?lang=fa#guide-celestial');
});


for(const kind of ['home','expertise']){
  test(kind+' export embeds the real assets and preserves executable JavaScript',async()=>{
    const filename=kind==='home'?'Moriyati.html':'Moriyati-Expertise.html';
    for(const html of [await exportPage(kind),await readFile(resolve(root,'../exports',filename),'utf8')]){
    assert.match(html,/data-portable="true"/);
    assert.equal([...html.matchAll(/<\/body>/gi)].length,1,'Preview servers must not inject reload code into an HTML string inside the script bundle');
    assert.doesNotMatch(html,/<script[^>]+src=/);
    assert.doesNotMatch(html,/<img[^>]+src="assets\//);
    assert.doesNotMatch(html,/url\(['"]?assets\//);
    const scripts=Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)).filter(m=>!m[1].includes('text/plain'));
    assert.ok(scripts.length>0);
    for(const script of scripts)new Script(script[2]);
    assert.match(scripts.map(m=>m[2]).join('\n'),/const \$\$ =/,'Dollar signs in the application source must survive HTML insertion');
    if(kind==='expertise'){
      assert.doesNotMatch(html,/tel:\+9899045000/,'Contact details belong only to the contact page');
      assert.match(html,/MORIYATI_EXPERTISE_COPY/);
      assert.match(html,/expertise-locale|function translate/);
    }
    }
  });
}
