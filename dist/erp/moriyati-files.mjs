if(typeof document!=='undefined'&&!document.querySelector('link[data-mf-style]')){const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./moriyati-files.css',import.meta.url).href;css.dataset.mfStyle='';document.head.append(css);}
export function fileManager({actor, tr, modal, toast, esc, preview, contact}) {
  let root, folder, mode, pending, moving, serial = 0;
  let tab = 'browse', inline = false, entries = [], more = false, identity, query = '', listing = false;
  const managesServer = () => actor()==='alireza';
  const configured = () => document.querySelector('meta[name="moriyati-files-endpoint"]')?.content || localStorage.getItem('moriyati-files-endpoint') || localStorage.getItem(key()) || null;
  const key = () => 'moriyati-dav-' + actor();
  const button = (op, label, path = '') => '<button class="list-link" data-msg="drive-' + op + '" data-path="' + esc(path) + '">' + esc(label) + '</button>';
  const child = (name) => {
    if (!name || name === '.' || name === '..' || /[/\\]/.test(name)) throw Error(tr('نام نامعتبر','Invalid name'));
    return new URL(encodeURIComponent(name), folder).href;
  };
  async function request(url, method, options = {}) {
    if (!root || !url.startsWith(root)) throw Error(tr('مسیر نامعتبر','Invalid path'));
    const response = await fetch(url, {method, credentials:'include', redirect:'error', ...options});
    if (!response.ok) throw Error(tr('دسترسی به سرور فایل ناموفق بود','File server request failed') + ' (' + response.status + ')');
    return response;
  }
  const label = (fa,en) => tr(fa,en);
  const names = () => ({
    browse:label('مرور','Browse'),recent:label('اخیر','Recents'),shared:label('اشتراکی','Shared')
  });
  const title = url => decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).at(-1)||'');
  function stored(type) {
    try { return JSON.parse(localStorage.getItem(key()+'-'+type)||'[]').filter(x=>root && x.url?.startsWith(root)); } catch {return [];}
  }
  function remember(type,entry) {
    const rows=stored(type), exists=rows.some(x=>x.url===entry.url);
    const next=rows.filter(x=>x.url!==entry.url);
    if(type!=='favorites'||!exists)next.unshift(entry);
    localStorage.setItem(key()+'-'+type,JSON.stringify(next.slice(0,100)));
  }
  const row = (op,text,path='',mark='›') => '<button type="button" class="mf-row" data-msg="drive-'+op+'" data-path="'+esc(path)+'"><span aria-hidden="true">'+esc(mark)+'</span><span>'+esc(text)+'</span><small aria-hidden="true">‹</small></button>';
  function items(rows) {
    return rows.filter(x=>(!moving && mode!=='save'||x.dir)).map(x=>'<div class="mf-item" data-name="'+esc(x.name.toLocaleLowerCase())+'">'+row(x.dir?'dir':'pick',x.name,x.url,x.dir?'▱':'▤')+'</div>').join('');
  }
  function screen() {
    let html='<div class="mf-head"><h2>'+esc(mode==='pick'?label('انتخاب فایل','Choose file'):mode==='save'?label('ذخیره فایل','Save file'):(names()[tab]))+'</h2>'+(managesServer()||folder?'<button type="button" data-msg="drive-more" aria-label="'+label('گزینه‌ها','Options')+'">•••</button>':'')+'</div>';
    if(more)html+='<div class="mf-group">'+(managesServer()?row('settings',label('اتصال به سرور فایل','Connect to file server')):'')+(root&&folder&&tab==='browse'?row('mkdir',label('پوشه جدید','New folder'))+(folder!==root?row('favorite',label('تغییر وضعیت علاقه‌مندی پوشه','Toggle folder favorite')):''):'')+'</div>';
    html+='<input class="mf-search" type="search" value="'+esc(query)+'" placeholder="'+label('جستجوی فایل‌ها','Search files')+'" aria-label="'+label('جستجوی فایل‌ها','Search files')+'">';
    if(tab==='browse'&&!folder){
      const favorites=stored('favorites');
      if(favorites.length)html+='<h3>'+label('علاقه‌مندی‌ها','Favorites')+'</h3><div class="mf-group">'+items(favorites)+'</div>';
      html+='<h3>'+label('مکان‌ها','Locations')+'</h3><div class="mf-group">'+row(root?'dir':managesServer()?'settings':'retry',label('فایل‌های موریاتی','Moriyati Files'),root||'','☁')+'</div>';
      if(mode==='browse')html+='<h3>'+label('عکس‌های نمونه کارگاه','Workshop samples')+'</h3><div class="mf-group">'+[['receipt','دریافت','Receiving'],['melt','ذوب','Melting'],['assay','عیارسنجی','Assay'],['pack','بسته‌بندی','Packaging']].map(([file,fa,en])=>'<a class="mf-item mf-row" data-name="'+label(fa,en).toLowerCase()+'" href="./visuals/demo/'+file+'.webp" target="_blank" rel="noopener"><img width="36" height="36" src="./visuals/demo/'+file+'.webp" alt="">'+label(fa,en)+'</a>').join('')+'</div>';
    }else{
      if(tab==='browse')html+=row('back',folder===root?names().browse:title(folder),'','‹');
      const rows=tab==='recent'?stored('recent'):tab==='shared'?stored('shared'):entries;
      html+='<div class="mf-group">'+items(rows)+'</div>';
      if(!rows.length)html+='<p class="mf-empty">'+(listing?label('در حال دریافت…','Loading…'):tab==='shared'?label('هنوز فایلی از مسنجر اینجا ذخیره نشده است.','No messenger files have been saved here yet.'):tab==='recent'?label('فایل‌هایی که باز می‌کنید اینجا می‌آیند.','Files you open appear here.'):label('پوشه خالی است','Empty folder'))+'</p>';
      if(folder&&tab==='browse')html+=moving?row('place',label('انتقال به این پوشه','Move here')):mode==='save'?row('save',label('ذخیره در این پوشه','Save here')):'<label class="mf-upload">'+label('بارگذاری فایل','Upload file')+'<input id="drive-upload" type="file" multiple></label>';
      if(more&&mode==='browse'&&folder&&tab==='browse')html+=entries.filter(x=>!x.dir).map(x=>row('move',label('انتقال','Move')+' · '+x.name,x.url)).join('');
    }
    if(mode==='browse')html+='<nav class="mf-tabs">'+Object.entries(names()).map(([k,v])=>'<button type="button" data-msg="drive-tab" data-path="'+k+'" aria-pressed="'+(tab===k)+'">'+v+'</button>').join('')+'</nav>';
    return html;
  }
  function frame(){return '<section class="moriyati-files">'+screen()+'</section>';}
  function draw(){
    if(identity!==actor())return;
    if(inline){const node=document.querySelector('.moriyati-files');if(node)node.innerHTML=screen();}
    else modal(label('فایل‌های موریاتی','Moriyati Files'),frame());
  }
  function reset(value,embed,items=[]){
    serial++;identity=actor();mode=value;inline=embed;tab='browse';pending=items;moving=null;query='';more=false;entries=[];listing=false;
    root=configured();folder=null;
  }
  document.addEventListener('input',e=>{
    if(!e.target.matches('.mf-search'))return;
    query=e.target.value;for(const node of e.target.closest('.moriyati-files').querySelectorAll('.mf-item'))node.hidden=!node.dataset.name.includes(query.toLocaleLowerCase());
  });
  async function list() {
    const turn=++serial; listing=true;entries=[];draw();
    try {
      const response=await request(folder,'PROPFIND',{headers:{Depth:'1'},body:'<propfind xmlns="DAV:"><prop><resourcetype/></prop></propfind>'});
      const doc=new DOMParser().parseFromString(await response.text(),'application/xml');
      if(turn!==serial||identity!==actor())return;
      if(doc.documentElement.localName!=='multistatus')throw Error(label('پاسخ سرور معتبر نیست','Invalid server response'));
      for(const item of doc.getElementsByTagNameNS('*','response')){
        const href=item.getElementsByTagNameNS('*','href')[0]?.textContent;
        if(!href)continue;
        const url=new URL(href,folder);
        if(!url.href.startsWith(folder)||url.pathname.replace(/\/$/,'')===new URL(folder).pathname.replace(/\/$/,''))continue;
        const dir=!!item.getElementsByTagNameNS('*','collection').length;
        entries.push({name:title(url),url:dir?url.href.replace(/\/?$/,'/'):url.href,dir});
      }
      entries.sort((a,b)=>Number(b.dir)-Number(a.dir)||a.name.localeCompare(b.name));
    }finally{if(turn===serial){listing=false;draw();}}
  }
  async function upload(file,name) {
    const url=child(name);
    await request(url,'PUT',{headers:{'If-None-Match':'*'},body:file});
    if(mode==='save')remember('shared',{url,name,dir:false});
  }
  async function run(op,path) {
    if(op==='more'){more=!more;draw();return;}
    if(op==='retry'){root=configured();if(!root)toast(label('سرور فایل هنوز توسط مدیر تنظیم نشده است.','The file server has not been configured.'));draw();return;}
    if(op==='settings'){if(!managesServer())return;identity=actor();mode=mode||'browse';root=configured();inline=false;modal(label('اتصال به سرور فایل','Connect to file server'),'<label>'+label('نشانی سرور','Server address')+'<input id="drive-endpoint" type="url" placeholder="https://…" value="'+esc(root||'')+'"></label>'+button('connect',label('اتصال','Connect')));return;}
    if(op==='favorite'){remember('favorites',{url:folder,name:title(folder),dir:true});more=false;draw();return;}
    if(op==='tab'){serial++;tab=path;query='';more=false;listing=false;if(tab==='browse'&&folder)await list();else draw();return;}
    if(op==='back'){folder=folder===root?null:new URL('../',folder).href;more=false;if(folder)await list();else draw();return;}
    if(op==='connect'){
      if(!managesServer())return;
      let url;try{url=new URL(document.querySelector('#drive-endpoint').value.trim());}catch{throw Error(label('نشانی کامل HTTPS را وارد کنید','Enter a complete HTTPS address'));}
      if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash) throw Error(tr('نشانی HTTPS سرور را وارد کنید','Enter the HTTPS server address'));
      root=folder=url.href.replace(/\/?$/,'/');await list();localStorage.setItem('moriyati-files-endpoint',root);return;
    }
    if(op==='dir'){folder=path;tab='browse';more=false;query='';}
    if(op==='mkdir'){const name=prompt(tr('نام پوشه','Folder name'));if(!name)return;await request(child(name)+'/','MKCOL');}
    if(op==='move') moving=path;
    if(op==='place'){await request(moving,'MOVE',{headers:{Destination:child(decodeURIComponent(new URL(moving).pathname.split('/').at(-1))),Overwrite:'F'}});moving=null;}
    if(op==='save'){for(const item of pending){const blob=await (await fetch(item.src)).blob();await upload(blob,item.fileName||('media-'+crypto.randomUUID()+'.'+(blob.type.split('/')[1]||'bin')));}pending=[];mode='browse';toast(tr('ذخیره شد','Saved'));}
    if(op==='pick'){
      const blob=await (await request(path,'GET')).blob(), fileName=decodeURIComponent(new URL(path).pathname.split('/').at(-1));
      remember('recent',{url:path,name:fileName,dir:false});
      if(mode==='pick'){const reader=new FileReader();const src=await new Promise((yes,no)=>{reader.onload=()=>yes(reader.result);reader.onerror=no;reader.readAsDataURL(blob);});const type=blob.type.split('/')[0];preview({contactId:contact(),attachments:[{src,fileName,kind:['image','video','audio'].includes(type)?type:'file'}]});}
      else {const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fileName;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);}return;
    }
    await list();
  }
  return {
    render(){if(!inline||identity!==actor())reset('browse',true);return frame();},
    open(value,items=[]){reset(value,false,items);draw();},
    action(op,path){run(op,path).catch(e=>toast(e.message));},
    async upload(input){try{for(const file of input.files)await upload(file,file.name);await list();}catch(e){toast(e.message);}}
  };
}
