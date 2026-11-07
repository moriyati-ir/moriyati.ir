(() => {
  'use strict';
  const dictionary=window.MORIYATI_EXPERTISE_COPY||{};
  Object.entries(window.MORIYATI_INTERNATIONAL_COPY||{}).forEach(([key,value])=>{const p=document.querySelector('#country-'+key+' p');if(p)p.textContent=value.fa;});
  const nodes=[],attrs=[];
  const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(n){return !n.parentElement.closest('script,style,[data-en],#site-language')&&/[\u0600-\u06ff]/.test(n.textContent)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
  let n;while((n=walk.nextNode()))nodes.push([n,n.textContent]);
  document.querySelectorAll('[aria-label],[alt],[title],meta[name=description]').forEach(el=>['aria-label','alt','title','content'].forEach(a=>{if(el.hasAttribute(a)&&/[\u0600-\u06ff]/.test(el.getAttribute(a)))attrs.push([el,a,el.getAttribute(a)]);}));
  function translate(){const lang=window.MoriyatiLocale.language;
    nodes.forEach(([node,fa])=>{const key=fa.trim();node.textContent=lang==='en'&&dictionary[key]?fa.replace(key,dictionary[key]):fa;});
    attrs.forEach(([el,a,fa])=>el.setAttribute(a,lang==='en'&&dictionary[fa]?dictionary[fa]:fa));
    Object.entries(window.MORIYATI_INTERNATIONAL_COPY||{}).forEach(([key,value])=>{const p=document.querySelector('#country-'+key+' p');if(p)p.textContent=value[lang];});
    document.title=lang==='en'?'Capabilities | Moriyati':'توانمندی‌ها | موریاتی';
  }
  addEventListener('moriyati:language',translate);translate();
})();
