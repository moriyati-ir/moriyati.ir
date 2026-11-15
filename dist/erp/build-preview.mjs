import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
const root=process.cwd();
const input=resolve(root,'work/github-preview/input');
const output=resolve(root,'work/github-preview/dist');
await rm(input,{recursive:true,force:true});await mkdir(input,{recursive:true});
let app=await readFile(resolve(root,'app/erp-app.tsx'),'utf8');
const sync=/const sync = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);/;
if(!sync.test(app))throw new Error('Workspace loader changed; review static adapter.');
app=app.replace(sync,`const sync = useCallback(async () => {
    try {
      const saved=localStorage.getItem('moriyati-erp-github-demo-v1');
      if(saved){ const parsed=JSON.parse(saved); if(parsed.schema!==1 || !Array.isArray(parsed.batches) || !Array.isArray(parsed.inventory)) throw new Error('دادهٔ نمایشی مرورگر معتبر نیست.'); setState(parsed); }
      setMode('preview'); setLoadError('');
    }catch(e){setMode('error');setLoadError(e instanceof Error ? e.message : 'ذخیره‌سازی مرورگر در دسترس نیست.');}
  }, []);`);
const prior='const result = applyCommand(state, command); setState(result.state); notify(result.message + " · پیش‌نمایش بدون ذخیره");';
if(!app.includes(prior))throw new Error('Command handler changed; review static adapter.');
app=app.replace(prior,`const result = applyCommand(state, command); localStorage.setItem('moriyati-erp-github-demo-v1',JSON.stringify(result.state)); setState(result.state); notify(result.message + ' · ذخیره در همین مرورگر');`);
app=app.replaceAll('پیش‌نمایش بدون ذخیره','گیت‌هاب · ذخیره در این مرورگر');
app=app.replace('تمام اعداد، موجودی‌ها و اپراتورها نمونه‌اند.','داده‌ها نمونه‌اند؛ این نسخه فقط در همین مرورگر ذخیره می‌شود.');
app=app.replace('if (mode === "preview") {','if (mode === "preview") {');
await writeFile(resolve(input,'erp-app.tsx'),app);
await cp(resolve(root,'app/globals.css'),resolve(input,'styles.css'));
await writeFile(resolve(input,'entry.tsx'),`import React from 'react';import {createRoot} from 'react-dom/client';import App from './erp-app';import './styles.css';createRoot(document.getElementById('root')!).render(<App/>);`);
await writeFile(resolve(input,'index.html'),`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="نسخه نمایشی ERP موریاتی؛ داده‌های نمونه و ذخیره فقط در مرورگر"><meta name="robots" content="noindex,nofollow"><title>MORIYATI ERP | نسخهٔ نمایشی گیت‌هاب</title><link rel="icon" href="./favicon.svg"></head><body><div id="root"></div><script type="module" src="/entry.tsx"></script></body></html>`);
await build({configFile:false,root:input,base:'./',plugins:[react()],resolve:{alias:{'@':root}},publicDir:resolve(root,'public'),build:{outDir:output,emptyOutDir:true}});
await writeFile(resolve(output,'README.txt'),'Moriyati ERP — GitHub Pages review demo. All initial data is illustrative. Changes are kept only in this browser, not in the production database. Photo uploads, accounting, device readers and staff accounts are not connected. Source: https://github.com/moriyati-ir/moriyati.ir/tree/moriyati-erp/erp\n');
console.log(output);
