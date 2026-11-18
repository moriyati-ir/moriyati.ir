// Fixed 3:3:2 colour table. Periodic clear codes keep all LZW codes nine bits wide.
export async function makeGif(files) {
  if (!files.length) throw new Error('No frames');
  if (files.length === 1 && files[0].type === 'image/gif') return asDataUrl(files[0]);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', {willReadFrequently:true});
  const bytes = Array.from('GIF89a', c => c.charCodeAt(0));
  const word = n => bytes.push(n & 255, n >>> 8);
  for (let i = 0; i < files.length; i++) {
    const image = new Image();
    const url = URL.createObjectURL(files[i]);
    try {
      image.src = url;
      await image.decode();
      if (!i) {
        const scale = Math.min(1, 240 / Math.max(image.width, image.height));
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        word(canvas.width); word(canvas.height); bytes.push(247, 0, 0);
        for (let k=0;k<256;k++) bytes.push(Math.round((k>>5)*255/7),Math.round((k>>2&7)*255/7),(k&3)*85);
        bytes.push(33,255,11,...Array.from('NETSCAPE2.0',c=>c.charCodeAt(0)),3,1,0,0,0);
      }
      context.fillStyle='#000'; context.fillRect(0,0,canvas.width,canvas.height);
      const scale = Math.min(canvas.width/image.width, canvas.height/image.height);
      const w=image.width*scale,h=image.height*scale;
      context.drawImage(image,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
      bytes.push(33,249,4,0,50,0,0,0,44,0,0,0,0); word(canvas.width); word(canvas.height); bytes.push(0,8);
      const data=context.getImageData(0,0,canvas.width,canvas.height).data, packed=[];
      let buffer=0,count=0;
      function code(value){buffer|=value<<count;count+=9;while(count>=8){packed.push(buffer&255);buffer>>>=8;count-=8;}}
      for(let p=0;p<data.length;p+=4){if(p%800===0)code(256);code((data[p]&224)|((data[p+1]>>3)&28)|(data[p+2]>>6));}
      code(257);if(count)packed.push(buffer);
      for(let j=0;j<packed.length;j+=255){const chunk=packed.slice(j,j+255);bytes.push(chunk.length,...chunk);}
      bytes.push(0);
    } finally { URL.revokeObjectURL(url); }
  }
  bytes.push(59);
  return asDataUrl(new Blob([new Uint8Array(bytes)],{type:'image/gif'}));
}
function asDataUrl(blob) {
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
}
