(() => {
  'use strict';
  const root = document.documentElement;
  let lang = new URLSearchParams(location.search).get('lang');
  if (!['fa','en'].includes(lang)) lang = root.dataset.portableLanguage;
  if (!['fa','en'].includes(lang)) { try { lang = localStorage.getItem('moriyati-language'); } catch (_) {} }
  if (!['fa','en'].includes(lang)) lang = 'fa';
  const originals = new WeakMap();
  const attributes = new WeakMap();
  function links() {
    const siteBase=root.dataset.portable==='true'&&root.dataset.siteBase?new URL(root.dataset.siteBase):null;
    document.querySelectorAll('a[href]').forEach(a => {
      const raw = a.getAttribute('href');
      if (!raw || raw.startsWith('#') || a.hasAttribute('download')) return;
      const relative=/^(?:index|expertise|contact|authenticity|heritage|bulletin)\.html(?:[?#]|$)/.test(raw);
      if(!relative&&!siteBase)return;
      const url = new URL(raw, siteBase||location.href);
      if(!relative&&!(url.origin===siteBase.origin&&url.pathname.startsWith(siteBase.pathname)&&/^(?:index|expertise|contact|authenticity|heritage|bulletin)\.html$/.test(url.pathname.split('/').pop())))return;
      url.searchParams.set('lang', lang);
      a.setAttribute('href', siteBase?url.href:url.pathname.split('/').pop() + url.search + url.hash);
    });
  }
  function set(value, announce = true) {
    lang = value === 'en' ? 'en' : 'fa';
    root.lang = lang; root.dir = lang === 'fa' ? 'rtl' : 'ltr';
    if(root.dataset.portable==='true')root.dataset.portableLanguage=lang;
    try { localStorage.setItem('moriyati-language',lang); } catch (_) {}
    try { const u=new URL(location.href);u.searchParams.set('lang',lang);history.replaceState(null,'',u); } catch (_) {}
    document.querySelectorAll('[data-en]').forEach(el => {
      if (!originals.has(el)) originals.set(el,el.innerHTML);
      el.innerHTML = lang === 'en' ? el.dataset.en : (el.dataset.fa || originals.get(el));
      if (el.tagName.toLowerCase() === 'text') el.setAttribute('direction',root.dir);
    });
    document.querySelectorAll('[data-en-label]').forEach(el => {
      if(!attributes.has(el))attributes.set(el,el.getAttribute('aria-label'));
      el.setAttribute('aria-label',lang === 'en' ? el.dataset.enLabel : attributes.get(el));
    });
    const b=document.querySelector('#site-language');
    if(b){b.textContent=lang==='fa'?'EN':'فا';b.setAttribute('aria-label',lang==='fa'?'Switch to English':'تغییر زبان به فارسی');}
    links();
    if(announce) dispatchEvent(new CustomEvent('moriyati:language',{detail:{language:lang}}));
  }
  window.MoriyatiLocale={get language(){return lang;},set,links};
  document.querySelector('#site-language')?.addEventListener('click',()=>set(lang==='fa'?'en':'fa'));
  set(lang,false);
})();
