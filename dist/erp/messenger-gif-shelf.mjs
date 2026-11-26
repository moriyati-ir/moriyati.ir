// The static demo keeps its original per-browser shelf. The production shelf
// lists media IDs and loads image bytes only when the user opens or sends one.
export function gifShelfStore(live) {
  const base = '/api/live/gifs';
  const key = actor => 'erp-gifs-'+actor;
  const legacy = actor => {
    try { return JSON.parse(localStorage.getItem(key(actor)) || '[]'); }
    catch { return []; }
  };
  async function request(url,actor,options={}) {
    const response = await fetch(url,{cache:'no-store',credentials:'same-origin',...options,
      headers:{'X-Moriyati-User':actor,...options.headers}});
    if (!response.ok) {
      const error = await response.json().catch(()=>({}));
      throw Error(error.error || 'دسترسی به گیف‌های این حساب برقرار نشد.');
    }
    return response;
  }
  return {
    async list(actor) {
      if (!live) return legacy(actor);
      const {items} = await (await request(base,actor)).json();
      return items.map(item=>base+'/'+encodeURIComponent(item.id));
    },
    async add(actor,gif) {
      if (!live) {
        const current=legacy(actor);
        localStorage.setItem(key(actor),JSON.stringify([gif,...current]));
        return;
      }
      await request(base,actor,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({gif})});
    },
    async attachment(actor,src) {
      if (!live) return src;
      const blob=await (await request(src,actor)).blob();
      return new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>resolve(reader.result);
        reader.onerror=()=>reject(Error('خواندن فایل گیف انجام نشد.'));
        reader.readAsDataURL(blob);
      });
    }
  };
}
