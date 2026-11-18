// Authentication comes from the relay, independently of the ERP role selector.
export function liveMessenger(c, model) {
 let session=null, active=null, running=false, pendingOffer=null;
 const endpoint='/api/messenger/';
 const visible=()=>Boolean(document.querySelector('.messenger'));
 function refresh(){if(visible())c.render(true);}
 function connected(){return !!session&&session.actor===c.actor();}
 async function request(s,path,data){
  const response=await fetch(endpoint+path,{method:data?'POST':'GET',cache:'no-store',redirect:'error',headers:{Authorization:'Bearer '+s.token,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
  if(!response.ok)throw Error(response.status===401?'کلید اتصال معتبر نیست.':'سرویس مسنجر در دسترس نیست.');
  return response.json();
 }
 async function connect(token){
  const actor=c.actor(),s={actor,token};
  const settings=await request(s,'session');
  if(actor!==settings.actor||actor!==c.actor())throw Error('کلید به این حساب تعلق ندارد.');
  cleanup();session={...s,ice:settings.iceServers,cursor:Number(localStorage.getItem('moriyati-relay-cursor-'+actor)||0)};c.closeModal();refresh();poll();
 }
 function cleanup(){
  if(active){clearTimeout(active.timeout);active.stream?.getTracks().forEach(track=>track.stop());active.pc?.close();active.audio?.remove();}
  active=null;pendingOffer=null;
 }
 async function signal(call,mode,data){return request(call.session,'signal',{to:call.to,id:call.id,mode,data});}
 async function end(){const call=active||pendingOffer;cleanup();if(call)await signal(call,'hangup').catch(()=>{});refresh();}
 async function peer(to,id){
  if(!connected()||active)throw Error('تماس دیگری فعال است یا اتصال برقرار نیست.');
  const call={id,to,session,pc:new RTCPeerConnection({iceServers:session.ice})};active=call;
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});
   if(active!==call||!connected()){stream.getTracks().forEach(track=>track.stop());throw Error('تماس بسته شد.');}
   call.stream=stream;stream.getTracks().forEach(track=>call.pc.addTrack(track,stream));
   call.pc.ontrack=e=>{const audio=document.createElement('audio');audio.autoplay=true;audio.controls=true;audio.srcObject=e.streams[0];audio.className='live-call-audio';document.body.append(audio);call.audio=audio;audio.play().catch(()=>c.toast('برای شنیدن تماس، پخش صدا را لمس کنید.'));};
   call.pc.onconnectionstatechange=()=>{if(active!==call)return;if(call.pc.connectionState==='connected'){clearTimeout(call.timeout);refresh();}if(call.pc.connectionState==='failed'){end();c.toast('اتصال صوتی قطع شد.');}};
   call.timeout=setTimeout(()=>{if(active===call){end();c.toast('پاسخی دریافت نشد.');}},60000);
   return call;
  }catch(e){if(active===call)cleanup();throw e;}
 }
 async function describe(call,sdp){
  await call.pc.setLocalDescription(sdp);
  if(call.pc.iceGatheringState!=='complete')await new Promise(resolve=>{
   const finish=()=>{clearTimeout(timer);call.pc.removeEventListener('icegatheringstatechange',change);resolve();};
   const change=()=>{if(call.pc.iceGatheringState==='complete')finish();};
   const timer=setTimeout(finish,8000);call.pc.addEventListener('icegatheringstatechange',change);
  });
  if(active!==call||!connected())throw Error('تماس پایان یافت.');
  return call.pc.localDescription;
 }
 async function start(to){if(active||pendingOffer)return end();if(!connected())return setup();try{const call=await peer(to,crypto.randomUUID());await signal(call,'offer',await describe(call,await call.pc.createOffer()));refresh();}catch(e){await end();throw e;}}
 async function accept(){const offer=pendingOffer;if(!offer)return;pendingOffer=null;try{const call=await peer(offer.to,offer.id);await call.pc.setRemoteDescription(offer.data);await signal(call,'answer',await describe(call,await call.pc.createAnswer()));c.closeModal();refresh();}catch(e){await end();throw e;}}
 async function setup(){try{const probe=await fetch(endpoint+'session',{cache:'no-store',redirect:'error'});if(probe.status!==401){c.toast('سرویس مسنجر هنوز به این سایت وصل نشده است.');return;}}catch{c.toast('سرویس مسنجر در دسترس نیست.');return;}c.modal('اتصال مسنجر',`<form id="messenger-relay"><label>کلید اتصال حساب<input type="password" name="token" required autocomplete="off"></label></form>`, '<button class="primary" type="submit" form="messenger-relay">اتصال</button>');}
 async function receive(s,e){
  if(e.type==='signal'){
   if(e.mode==='hangup'&&(active?.id===e.id||pendingOffer?.id===e.id)){cleanup();c.closeModal();refresh();}
   if(Date.now()-Date.parse(e.at)>60000)return;
   if(pendingOffer&&Date.now()-pendingOffer.started>60000)pendingOffer=null;
   if(e.mode==='offer'&&!active&&!pendingOffer&&!model.contacts().find(x=>x.id===e.from)?.blocked){pendingOffer={started:Date.now(),id:e.id,to:e.from,data:e.data,session:s};c.modal('تماس صوتی',model.escape(model.name(e.from)),'<button class="primary" data-msg="relay-answer">پاسخ</button><button class="secondary" data-msg="relay-end">رد تماس</button>');}
   if(e.mode==='answer'&&active?.id===e.id&&active.to===e.from&&active.pc.signalingState==='have-local-offer')await active.pc.setRemoteDescription(e.data);
   return;
  }
  const contacts=model.contacts(),threads=model.threads(),contact=contacts.find(x=>x.id===e.from);
  if(contact?.blocked)return;
  if(!contact)contacts.push({id:e.from,name:model.name(e.from),initial:model.name(e.from).slice(0,1)});
  const list=threads[e.from]||=([]),m=list.find(v=>v.id===e.id&&v.self===(e.type==='ack'));
  if(e.type==='message'){
   if(!m){list.push({...e.data,actor:e.from,senderId:e.from,sender:model.name(e.from),id:e.id,self:false,relay:true,date:e.at,time:new Date(e.at).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'})});const dest=contacts.find(x=>x.id===e.from);dest.unread=(dest.unread||0)+1;model.notify?.(dest);}
   if(!c.save())throw Error('ذخیره پیام انجام نشد.');
   await request(s,'ack',{to:e.from,id:e.id,state:'delivered'});
  }else if(e.type==='change'&&m){if(e.mode==='edit'&&!m.deleted){m.text=e.text;m.editedAt=e.at;}if(e.mode==='delete'){for(const key of ['text','src','attachments','fileName','reply'])delete m[key];m.deleted=true;}c.save();}
  else if(e.type==='ack'&&m){m.deliveredAt||=e.at;if(e.state==='read')m.readAt=e.at;c.save();}
  refresh();
 }
 async function poll(){
  if(!connected()){if(session){cleanup();session=null;}return;}
  if(running)return;running=true;const s=session;
  try{
   for(let i=0;i<20;i++){const events=await request(s,'events?after='+s.cursor);if(s!==session||!connected()||!events.length)break;await receive(s,events[0]);if(s!==session||!connected())break;s.cursor=events[0].seq;localStorage.setItem('moriyati-relay-cursor-'+s.actor,String(s.cursor));}
   if(s===session&&connected()&&visible()&&document.visibilityState==='visible'){const to=c.contact();for(const m of model.threads()[to]||[]){if(m.relay&&!m.self&&!m.readAt&&document.querySelector('[data-message-id="'+CSS.escape(m.id)+'"]')){await request(s,'ack',{to,id:m.id,state:'read'});if(s!==session||!connected())break;m.readAt=new Date().toISOString();c.save();}}}
  }catch{/* Retry unacknowledged events on the next poll. */}finally{running=false;}
 }
 async function send(to,m){
  if(!connected()||to==='self'||model.contacts().find(x=>x.id===to)?.group)return;
  const s=session;try{const reply=await request(s,'message',{to,id:m.id,data:m});if(s!==session||!connected())return;m.sentAt=reply.at;c.save();refresh();}catch(e){if(connected())c.toast(e.message);}
 }
 setInterval(poll,1500);
 window.addEventListener('pagehide',()=>{if(active||pendingOffer)end();});
 async function change(to,m,mode,text){
  if(!m?.sentAt)return;
  if(!connected())throw Error('برای تغییر پیام ارسال‌شده، ابتدا به مسنجر وصل شوید.');
  await request(session,'change',{to,id:m.id,mode,text});
 }
 return {change,connected,setup,connect,start,accept,end,send,status:()=>active?(active.pc.connectionState==='connected'?'تماس صوتی برقرار است':'در حال برقراری تماس…'):null};
}
