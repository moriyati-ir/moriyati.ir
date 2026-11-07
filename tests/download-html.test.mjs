import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {Script,runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'../dist');
const helper=await readFile(resolve(root,'download-html.js'),'utf8');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.woff':'font/woff','.woff2':'font/woff2','.txt':'text/plain'};

async function exportPage(kind){
  let handler,output;
  const attributes=new Map();
  const link={dataset:{portableDownload:kind},download:kind==='expertise'?'Moriyati-Expertise.html':'Moriyati.html',textContent:'دریافت HTML',getAttribute:k=>attributes.get(k)||null,setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k),addEventListener:(event,callback)=>{handler=callback;}};
  class Reader{
    readAsDataURL(blob){blob.arrayBuffer().then(buffer=>{this.result='data:'+blob.type+';base64,'+Buffer.from(buffer).toString('base64');this.onload();}).catch(error=>this.onerror(error));}
  }
  const context={
    document:{documentElement:{dataset:{},lang:'fa'},querySelectorAll:()=>[link],createElement:()=>({style:{},click(){},remove(){}}),body:{appendChild(){}}},
    fetch:async path=>new Response(await readFile(resolve(root,path)),{headers:{'Content-Type':mime[extname(path)]||'application/octet-stream'}}),
    FileReader:Reader,Blob,URL:{createObjectURL(blob){output=blob;return 'blob:export-test';},revokeObjectURL(){}},setTimeout(){}
  };
  runInNewContext(helper,context);
  await handler({preventDefault(){}});
  assert.ok(output,'The download must be produced');
  return output.text();
}

for(const kind of ['home','expertise']){
  test(kind+' export embeds the real assets and preserves executable JavaScript',async()=>{
    const html=await exportPage(kind);
    assert.match(html,/data-portable="true"/);
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
  });
}
