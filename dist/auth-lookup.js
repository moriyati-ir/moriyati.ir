(() => {
 'use strict';
 function parse(raw){
   let value=String(raw||'').trim().replace(/[۰-۹٠-٩]/g,x=>String('۰۱۲۳۴۵۶۷۸۹'.includes(x)?'۰۱۲۳۴۵۶۷۸۹'.indexOf(x):'٠١٢٣٤٥٦٧٨٩'.indexOf(x)));
   if(/^https?:\/\//i.test(value)){
    try{const u=new URL(value);if(!['moriyati.ir','www.moriyati.ir',(window.location?.hostname||'')].includes(u.hostname))return null;value=u.searchParams.get('serial')||u.searchParams.get('id')||u.pathname.match(/\/(?:verify|authenticity|product)\/([a-z0-9-]+)\/?$/i)?.[1]||'';}catch(_){return null;}
   }
   value=value.replace(/^MORIYATI\s*[:|/]\s*/i,'').replace(/[\s-]/g,'').toUpperCase();
   return /^[A-Z0-9]{5,32}$/.test(value)?value:null;
 }
 window.MoriyatiAuth={parse};
})();
