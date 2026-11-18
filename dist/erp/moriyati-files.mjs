export function fileManager({actor, tr, modal, toast, esc, preview, contact}) {
  let root, folder, mode, pending, moving, serial = 0;
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
  async function list() {
    const turn = ++serial;
    const response = await request(folder, 'PROPFIND', {headers:{Depth:'1'},body:'<propfind xmlns="DAV:"><prop><resourcetype/></prop></propfind>'});
    const doc = new DOMParser().parseFromString(await response.text(),'application/xml');
    if (turn !== serial) return;
    if (doc.documentElement.localName !== 'multistatus') throw Error(tr('پاسخ سرور معتبر نیست','Invalid WebDAV response'));
    let html = folder !== root ? button('dir',tr('پوشه بالاتر','Parent folder'),new URL('../',folder).href) : '';
    for (const row of doc.getElementsByTagNameNS('*','response')) {
      const url = new URL(row.getElementsByTagNameNS('*','href')[0].textContent,folder);
      if (!url.href.startsWith(folder) || url.pathname.replace(/\/$/,'') === new URL(folder).pathname.replace(/\/$/,'')) continue;
      const name = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1));
      const dir = !!row.getElementsByTagNameNS('*','collection').length;
      if (dir) html += button('dir','▸ ' + name,url.href.replace(/\/?$/,'/'));
      else if(mode !== 'save' && !moving) html += button('pick',name,url.href) + (mode==='browse'?button('move',tr('انتقال','Move')+' · '+name,url.href):'');
    }
    html += button('mkdir',tr('پوشه جدید','New folder'));
    if(moving) html += button('place',tr('انتقال به این پوشه','Move here'));
    else if(mode==='save') html += button('save',tr('ذخیره در این پوشه','Save here'));
    else html += '<label class="list-link">'+tr('آپلود از دستگاه','Upload from device')+'<input id="drive-upload" type="file" multiple></label>';
    modal(tr('فایل‌های موریاتی','Moriyati Files'),html);
  }
  async function upload(file,name) {
    const url=child(name);
    await request(url,'PUT',{headers:{'If-None-Match':'*'},body:file});
  }
  async function run(op,path) {
    if(op==='connect'){
      const url=new URL(document.querySelector('#drive-endpoint').value);
      if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash) throw Error(tr('نشانی HTTPS سرور را وارد کنید','Enter the HTTPS server address'));
      root=folder=url.href.replace(/\/?$/,'/');await list();localStorage.setItem(key(),root);return;
    }
    if(op==='dir') folder=path;
    if(op==='mkdir'){const name=prompt(tr('نام پوشه','Folder name'));if(!name)return;await request(child(name)+'/','MKCOL');}
    if(op==='move') moving=path;
    if(op==='place'){await request(moving,'MOVE',{headers:{Destination:child(decodeURIComponent(new URL(moving).pathname.split('/').at(-1))),Overwrite:'F'}});moving=null;}
    if(op==='save'){for(const item of pending){const blob=await (await fetch(item.src)).blob();await upload(blob,item.fileName||('media-'+crypto.randomUUID()+'.'+(blob.type.split('/')[1]||'bin')));}pending=[];mode='browse';toast(tr('ذخیره شد','Saved'));}
    if(op==='pick'){
      const blob=await (await request(path,'GET')).blob(), fileName=decodeURIComponent(new URL(path).pathname.split('/').at(-1));
      if(mode==='pick'){const reader=new FileReader();const src=await new Promise((yes,no)=>{reader.onload=()=>yes(reader.result);reader.onerror=no;reader.readAsDataURL(blob);});const type=blob.type.split('/')[0];preview({contactId:contact(),attachments:[{src,fileName,kind:['image','video','audio'].includes(type)?type:'file'}]});}
      else {const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fileName;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);}return;
    }
    await list();
  }
  return {
    open(value,items=[]){mode=value;moving=null;pending=items;root=folder=localStorage.getItem(key());
      if(root)list().catch(e=>toast(e.message));else modal(tr('اتصال به سرور فایل موریاتی','Connect to Moriyati file server'),'<label>WebDAV (HTTPS)<input id="drive-endpoint" type="url"></label>'+button('connect',tr('اتصال','Connect')));},
    action(op,path){run(op,path).catch(e=>toast(e.message));},
    async upload(input){try{for(const file of input.files)await upload(file,file.name);await list();}catch(e){toast(e.message);}}
  };
}
