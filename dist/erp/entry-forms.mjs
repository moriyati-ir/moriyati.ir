export const supplyCatalog = [
 ['acid','اسید','لیتر'], ['powder','پودر مواد شیمیایی','کیلوگرم'], ['granule-solution','محلول گرانول','لیتر'],
 ['graphite-crucible','بوته گرافیت','عدد',true], ['paper-filter','فیلتر کاغذی','عدد'],
 ['cloth-filter','فیلتر پارچه‌ای','عدد',true], ['sandpaper','سمباده','عدد']
].map(([id,name,unit,reusable=false])=>({id,name,unit,reusable,stock:0}));

const normalize = text => String(text).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/ي/g,'ی').replace(/ك/g,'ک');
export function invoiceFields(text){
 const lines=normalize(text).split(/\n/).map(line=>line.trim()).filter(Boolean);
 const amount=line=>{
  const values=line?.match(/[0-9]+(?:[٬,][0-9]{3})*(?:[٫.][0-9]+)?/g);
  if(!values?.length)return '';
  return String(Number(values.at(-1).replace(/[٬,]/g,'').replace('٫','.'))*(line.includes('تومان')?10:1));
 };
 const total=lines.findLast(line=>/جمع کل|مبلغ کل|قابل پرداخت|مبلغ نهایی/.test(line));
 const shipping=lines.find(line=>/هزینه حمل|کرایه حمل|هزینه ارسال/.test(line));
 const date=lines.join(' ').match(/(?:13|14|20)\d{2}[\/\-]\d{1,2}[\/\-]\d{1,2}/)?.[0]||'';
 return {title:lines.find(line=>/^(?:بابت|موضوع|شرح خرید)\s*[:：]/.test(line))?.replace(/^[^:：]+[:：]\s*/,'')||'',
  amount:amount(total), shipping:amount(shipping),invoiceDate:date,vatIncluded:lines.some(line=>/مالیات|ارزش افزوده/.test(line)&&Number(amount(line))>0)};
}

async function scanPhoto(file,serial){
 if(globalThis.createImageBitmap&&(globalThis.TextDetector||(serial&&globalThis.BarcodeDetector))){
 const bitmap=await createImageBitmap(file);
 try{
  if(serial&&globalThis.BarcodeDetector){
   const [code]=await new BarcodeDetector().detect(bitmap);
   if(code)return code.rawValue;
  }
  if(globalThis.TextDetector){
   const items=await new TextDetector().detect(bitmap);
   if(items.length)return items.map(x=>x.rawValue).join('\n');
  }
 }catch{/* Use the worker when this image format exceeds native recognition support. */}finally{bitmap.close();}
 }
 const engine=await import('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.esm.min.js');
 const worker=await (engine.createWorker||engine.default.createWorker)('fas+eng');
 try{return (await worker.recognize(file)).data.text;}finally{await worker.terminate();}
}

export function bindPhotoReader(form,serial=false){
 const input=form.elements[serial?'photo':'receipt'];
 const status=document.createElement('small');status.setAttribute('role','status');input.closest('.field').append(status);
 let generation=0;
 input.addEventListener('change',async()=>{
  const current=++generation,file=input.files[0];status.textContent='';if(!file)return;
  const preview=input.closest('label')?.querySelector('img');
  if(preview){const url=URL.createObjectURL(file);preview.onload=()=>URL.revokeObjectURL(url);preview.src=url;preview.hidden=false;}
  const previous=Object.fromEntries([...form.elements].filter(el=>el.name).map(el=>[el.name,el.type==='checkbox'?el.checked:el.value]));
  status.textContent='در حال خواندن عکس…';
  try{
   const text=await scanPhoto(file,serial);
   if(current!==generation||!form.isConnected)return;
   const code=normalize(text).trim();
   const values=serial?{serial:code.match(/(?:سریال|serial|s\/n)\s*[:#-]?\s*([\w-]+)/i)?.[1]||(/^[\w-]+$/.test(code)?code:'')}:invoiceFields(text);
   let count=0;
   for(const [key,value] of Object.entries(values)){
    const field=form.elements[key];if(!field||value===''||value===false)continue;
    if(field.type==='checkbox'){if(field.checked===previous[key])field.checked=value;}
    else if(field.value===previous[key])field.value=value;
    count++;
   }
   status.textContent=count?'اطلاعات خوانده شد. برای اصلاح، روی مقدار بزنید.':'اطلاعات خوانا پیدا نشد. دستی وارد کنید.';
  }catch{if(current===generation)status.textContent='اسکن در دسترس نیست. دستی وارد کنید.';}
 });
}
