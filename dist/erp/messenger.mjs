import {liveMessenger} from './messenger-live.mjs';
import { makeGif } from './messenger-gif.mjs';
import {fileManager} from './moriyati-files.mjs';
import {escapeHTML as esc,fa,dateLabel} from './core.mjs?v=3';
import {roles} from './policy.mjs?v=3';
import {uid} from './factory-model.mjs?v=3';

export function reviseMessage(message,text,actor,archive,contactId){
 if(message.self===false||message.deleted)throw new Error('فقط پیام خودتان قابل ویرایش است.');
 const value=String(text||'').trim();if(!value)throw new Error('متن پیام خالی است.');
 archive.push({id:uid('ARCH'),type:'message-edit',actor,contactId,date:new Date().toISOString(),original:structuredClone(message)});
 message.text=value;message.editedAt=new Date().toISOString();return message;
}
export function removeMessage(message,actor,archive,contactId){
 if(message.self===false||message.deleted)throw new Error('فقط پیام خودتان قابل حذف است.');
 archive.push({id:uid('ARCH'),type:'message-delete',actor,contactId,date:new Date().toISOString(),original:structuredClone(message)});
 const id=message.id;for(const key of Object.keys(message))delete message[key];Object.assign(message,{id,deleted:true,self:true,date:new Date().toISOString()});return message;
}
export function sourceExcerpt(list,ids){return list.filter(m=>ids.includes(m.id)&&!m.deleted).map(m=>m.text||({audio:'[پیام صوتی]',image:'[تصویر]',video:'[ویدئو]',file:'[فایل]',album:'[آلبوم]'}[m.kind]||'')).join('\n\n');}
export const archiveFor=(actor,archive)=>actor==='alireza'?archive:[];

export function messenger(c){
 const u={tab:'chats',filter:'active',search:'',selected:[],reply:null,chosen:null,pending:null,recorder:null,stream:null,cancelVoice:false,busy:false};
 const language=()=>localStorage.getItem('erp-messenger-lang-'+c.actor())||c.language?.()||'fa';
 const tr=(fa,en)=>language()==='en'?en:fa;
 const switcher=()=>action('language',language()==='fa'?'EN':'FA','aria-label="'+tr('تغییر زبان مسنجر','Switch messenger language')+'"','msg-language');
 const state=()=>c.space();const contacts=()=>state().contacts||[];const threads=()=>state().messages;const current=()=>contacts().find(x=>x.id===c.contact());
 const action=(name,label,data='',cls='secondary')=>`<button type="button" class="${cls}" data-msg="${name}" ${data}>${label}</button>`;
 const drive=fileManager({actor:c.actor,tr,modal:c.modal,toast:c.toast,esc,preview:mediaPreview,contact:c.contact});
 const live=liveMessenger(c,{contacts,threads,escape:esc,name:id=>c.identity?.(id)?.name||roles[id]?.name||id,notify:contact=>{if(!contact.muted)sound(prefs().tone);}});
 const liveError=e=>c.toast(e.message);
 const display=x=>x.group?x.name:(c.identity?.(x.id)?.name||x.name);
 const portrait=x=>{const src=!x.group&&c.identity?.(x.id)?.photo;return src?`<img class="avatar" alt="" src="${esc(src)}">`:c.avatar(display(x)?.[0]||'•');};
 const moods={listen:['گوش دادن','Listening'],review:['بررسی فایل','Reviewing a file'],think:['در حال فکر','Thinking'],happy:['خوشحال','Happy']};
 function behnamPortrait(mood='listen'){
  const key=Object.hasOwn(moods,mood)?mood:'listen';
  return '<img class="behnam-portrait" alt="'+tr(...moods[key])+'" src="'+new URL('./visuals/behnam/'+key+'.webp',import.meta.url).href+'">';
 }
 function behnamLauncher(){
  const inbox=c.actor()==='behnam';
  return action(inbox?'behnam-inbox':'start-direct',behnamPortrait()+'<span>'+ (inbox?tr('صندوق بهنام','My inbox'):tr('از بهنام بپرس','Ask Behnam'))+'</span>','data-id="behnam"','behnam-launch');
 }
 function behnamControls(x,list){
  if(x.group||x.id==='self'||(x.id!=='behnam'&&c.actor()!=='behnam'))return '';
  const mine=c.actor()==='behnam';
  const status=live.connected()?tr('گفتگو با بهنام · پاسخ انسانی','Behnam · human replies'):tr('پیش‌نمایش این مرورگر','Browser preview');
  return '<div class="behnam-controls"><small>'+status+'</small>'+(!live.connected()?action('relay-connect',tr('اتصال برای ارسال واقعی','Connect for live chat')):'')+(mine?'<label>'+tr('حالت پاسخ','Reply expression')+' <select id="behnam-mood">'+Object.entries(moods).map(([k,v])=>'<option value="'+k+'" '+(k===(u.beMood||'listen')?'selected':'')+'>'+tr(...v)+'</option>').join('')+'</select></label>':'')+'</div>';
 }
 const prefKey=()=> 'moriyati-chat-style-'+c.actor();
 const prefs=()=>JSON.parse(localStorage.getItem(prefKey())||'{}');
 const colors=[['bg','پس‌زمینه','Background'],['in','حباب دریافتی','Received bubble'],['out','حباب ارسالی','Sent bubble'],['text','رنگ نوشته','Text colour'],['tab','رنگ تب','Tab colour']];
 function style(){const p=prefs();return colors.filter(([k])=>/^#[0-9a-f]{6}$/i.test(p[k])).map(([k])=>'--chat-'+k+':'+p[k]).concat(p.size?'--chat-size:'+Number(p.size)+'px':'').join(';');}
 const palettes={mint:['#e5f0e9','#ffffff','#bce9c9','#173323','#7ac897'],midnight:['#10171d','#24303e','#284560','#ffffff','#4c769b'],plum:['#201725','#342c38','#684779','#ffffff','#9468a8']};
 function updatePreview(form){
  const preview=form.querySelector('.appearance-preview');
  for(const [key] of colors)preview.style.setProperty('--'+key,form.elements[key].value);
  preview.style.fontSize=form.elements.size.value+'px';
  form.querySelector('output').textContent=fa(form.elements.size.value);
 }
 function settings(){
  const p=prefs(),defaults=document.documentElement.dataset.theme==='dark'?palettes.midnight:palettes.mint;
  const row=(label,control)=>'<label class="appearance-row">'+label+control+'</label>';
  c.modal(tr('ظاهر گفتگو','Chat appearance'),`<form id="messenger-style" class="appearance-form">
   <div class="appearance-preview"><span>${tr('بار رسید؟','Did the shipment arrive?')}</span><span>${tr('بله، دریافت شد.','Yes, received.')}</span></div>
   <div class="appearance-palettes">${Object.entries(palettes).map(([id,values])=>action('palette',tr(({mint:'نعناعی',midnight:'شب',plum:'آلویی'})[id],id),`data-palette="${id}" style="background:${values[2]};color:${values[3]}"`)).join('')}</div>
   <section>${row(tr('اندازه نوشته','Text size'),`<output></output><input name="size" type="range" min="12" max="30" value="${Number(p.size)||16}">`)}
   ${colors.map(([k,f,e],i)=>row(tr(f,e),`<input type="color" name="${k}" value="${/^#[a-f0-9]{6}$/i.test(p[k])?p[k]:defaults[i]}" data-style-color>`)).join('')}</section>
   <section>${row(tr('صدای اعلان','Notification tone'),`<select name="tone">${[['silent','بی‌صدا','Silent'],['bell','زنگ','Bell'],['soft','ملایم','Soft'],['short','کوتاه','Short']].map(([k,f,e])=>`<option value="${k}" ${p.tone===k?'selected':''}>${tr(f,e)}</option>`).join('')}</select>`)}</section>
   <button class="primary">${tr('ذخیره','Save')}</button></form>`);
  updatePreview(document.getElementById('messenger-style'));
 }
 function sound(tone){if(!tone||tone==='silent')return;try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.frequency.value={bell:880,soft:440,short:660}[tone];o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.09,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.35);o.start();o.stop(a.currentTime+.36);o.onended=()=>a.close();}catch{}}
 function recent(x){const m=threads()[x.id]?.at(-1);if(m?.date)return Date.parse(m.date)||0;const t=(m?.time||x.time||'').replace(/[۰-۹]/g,n=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(n));return /^\d+:\d+$/.test(t)?Number(t.replace(':','')):0;}
 const photo=src=>`<button type="button" class="msg-photo" data-action="view-image" data-src="${esc(src)}"><img src="${esc(src)}" alt="عکس گفتگو"></button>`;
 const attachment=m=>m.kind==='image'?photo(m.src):m.kind==='album'?`<div class="msg-album">${m.attachments.map(attachment).join('')}</div>`:m.kind==='video'?`<video controls playsinline preload="metadata" src="${esc(m.src)}"></video>`:m.kind==='audio'?`<audio controls preload="metadata" src="${esc(m.src)}"></audio>`:m.kind==='file'?`<a href="${esc(m.src)}" download="${esc(m.fileName||m.text||'file')}">${c.icon('file','sm')}${esc(m.fileName||m.text||'فایل')}</a>`:'';
 function receipt(m){
  if(m.self===false)return '';
  const state=m.readAt?['✓✓','خوانده شده','Read','read']:m.deliveredAt?['✓✓','تحویل شد','Delivered','delivered']:m.sentAt?['✓','ارسال شد','Sent','sent']:['◷','ذخیره محلی','Local only','local'];
  return `<span class="msg-receipt ${state[3]}" aria-label="${tr(state[1],state[2])}" title="${tr(state[1],state[2])}">${state[0]}</span>`;
 }
 function renderMessage(m){return `<div class="message ${m.self===false?'':'self'} ${u.selected.includes(m.id)?'msg-selected':''}" data-message-id="${esc(m.id)}">${m.deleted?'<p class="muted">این پیام حذف شده است.</p>':`${m.sender?`<small>${esc(c.identity?.(m.senderId||m.actor)?.name||m.sender)}</small>`:''}${m.forwarded?'<small>بازارسال‌شده</small>':''}${m.reply?`<div class="reply-preview">${esc(m.reply.text||m.reply)}</div>`:''}${attachment(m)}${Object.entries(m.reactions||{}).filter(([,v])=>v.length).map(([k,v])=>'<small>'+esc(k)+' '+v.length+'</small>').join('')}${m.text?`<p data-user-content>${esc(m.text)}</p>`:''}${m.source?`<small class="message-note">منبع: ${esc(m.source.label)}</small>`:''}${m.reminder?`<div class="message-note">${c.icon('clock','sm')}${esc(dateLabel(m.reminder,{day:'numeric',month:'long'}))} · ${esc(new Date(m.reminder).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'}))} ${m.reminderState==='done'?'· انجام شد':m.reminderState==='cancelled'?'· لغو شد':''}</div>`:''}<div class="message-time">${m.pinned?'سنجاق‌شده · ':''}${m.editedAt?'ویرایش‌شده · ':''}${(m.starred?'★ ':'')+esc(m.time||'اکنون')} ${receipt(m)}</div><button type="button" class="message-menu" data-msg="menu" data-id="${esc(m.id)}" aria-label="گزینه‌های پیام">${c.icon('more','sm')}</button>`}</div>`;}
 function renderContacts(){return contacts().filter(x=>u.filter==='archived'?x.archived:(!x.archived||u.search.trim())&&(u.filter!=='list'||x.list===u.list)&&(u.filter!=='favorite'||x.favorite)&&(u.filter!=='groups'||x.group)&&(u.filter!=='unread'||x.unread>0)&&(u.filter!=='pinned'||x.pinned)).filter(x=>(display(x)+' '+(threads()[x.id]||[]).filter(m=>!m.deleted).map(m=>m.text||'').join(' ')).includes(u.search)).sort((a,b)=>Number(!!b.unread)-Number(!!a.unread)||(!a.unread&&!b.unread?Number(!!b.pinned)-Number(!!a.pinned):0)||recent(b)-recent(a)).map(x=>{const last=(threads()[x.id]||[]).filter(m=>!m.deleted).at(-1);return `<button class="contact-row contact ${c.contact()===x.id?'is-active':''}" data-msg="open" data-contact="${x.id}">${portrait(x)}<span class="contact-body"><b data-user-content>${esc(display(x))}</b><small data-user-content>${x.pinned?'سنجاق‌شده · ':''}${x.muted?'بی‌صدا · ':''}${esc(x.locked?'🔒':last?.text||x.role||'گفتگوی جدید')}</small></span><span class="msg-meta">${esc(last?.time||x.time||'')}${x.unread?'<i>'+Number(x.unread)+'</i>':''}${x.group?c.icon('users','sm'):''}</span></button>`;}).join('')||'<p class="empty-state">گفتگویی پیدا نشد.</p>';}
 function tabs(){return '<nav class="msg-tabs">'+[['chats',tr('گفتگوها','Chats'),'send'],['groups',tr('گروه‌ها','Groups'),'users'],['calls',tr('تماس‌ها','Calls'),'phone'],['files',tr('فایل‌ها','Files'),'file']].map(([key,label,icon])=>action('tab',c.icon(icon)+'<small>'+label+'</small>',`data-tab="${key}" aria-pressed="${u.tab===key}"`,'msg-tab')).join('')+'</nav>';}
 const tabTitle=()=>({groups:tr('گروه‌ها','Groups'),calls:tr('تماس‌ها','Calls'),files:tr('فایل‌ها','Files'),chats:tr('گفتگوها','Chats')})[u.tab];
 function pinnedBanner(list){
  const m=list.filter(row=>row.pinned&&!row.deleted).at(-1);
  return m?action('jump-pin',esc(m.text||m.fileName||tr('پیام سنجاق‌شده','Pinned message')),'data-id="'+esc(m.id)+'" aria-label="'+tr('رفتن به پیام سنجاق‌شده','Jump to pinned message')+'"','msg-pinned'):'';
 }
 function secondaryTab(){
  if(u.tab==='groups')return renderContacts();
  if(u.tab==='calls')return live.connected()?('<p>'+esc(live.status()||tr('برای تماس، گفتگوی شخص را باز کنید.','Open a direct chat to call.'))+'</p>'+(live.status()?action('relay-end',tr('پایان تماس','End call')):'')):action('relay-connect',tr('اتصال به سرویس تماس','Connect to calling service'));
  if(u.tab==='files')return drive.render();return '<h2>'+esc(roles[c.actor()]?.name||'')+'</h2>'+action('self',tr('پیام‌های ذخیره‌شده','Saved messages'))+'<p>'+tr('زبان مسنجر','Messenger language')+' '+switcher()+'</p>';
 }
 function render(){if(!document.getElementById('appearance-css')){const css=document.createElement('link');css.id='appearance-css';css.rel='stylesheet';css.href=new URL('./messenger-appearance.css',import.meta.url);document.head.append(css);}const candidate=current(),x=candidate?.locked&&u.unlocked!==c.actor()+'/'+candidate.id?null:candidate,list=x?(threads()[x.id]||[]):[],q=u.search.trim();return `<div style="${esc(style())}" data-msg-lang="${language()}" lang="${language()}" dir="${language()==='fa'?'rtl':'ltr'}" class="messenger ${x?'chat-open':''}"><aside class="contacts-panel conversation-list"><div class="contacts-head"><h1>${tabTitle()}</h1><div class="msg-head-tools" dir="ltr">${['groups','chats'].includes(u.tab)?action(u.tab==='groups'?'group':'create-menu','＋','aria-label="'+tr('ایجاد','Create')+'"','msg-new'):''}${action('settings',c.icon('settings'),'aria-label="'+tr('تنظیمات مسنجر','Messenger settings')+'"','msg-settings')}${switcher()}</div></div>${u.tab==='chats'?`<label class="searchbox">${c.icon('search','sm')}<input id="messenger-search" type="search" aria-label="جستجوی گفتگو و پیام" placeholder="جستجوی گفتگو و پیام" value="${esc(u.search)}"></label><div id="messenger-contacts">${renderContacts()}</div>${live.connected()?'':'<p class="sheet-body-note">اطلاعات نمونه همین مرورگر · ارسال بین حساب‌های واقعی بعد از اتصال سرویس</p>'}`:secondaryTab()}${tabs()}</aside><section class="chat-panel chat">${!x?`<div class="chat-placeholder">${c.icon('send')}<h2>پیام‌ها و همکاری روزانه</h2><p>گفتگو، عکس، فیلم، فایل، ویس و یادداشت شخصی</p>${action('new','شروع گفتگو')}</div>`:`<div class="chat-head">${action('back',c.icon('back'),'aria-label="بازگشت به گفتگوها"','icon-btn chat-back')}${x.id==="behnam"?behnamPortrait(list.filter(m=>m.self===false&&!m.deleted).at(-1)?.beMood):portrait(x)}<button data-msg="info"><b data-user-content>${esc(display(x))}</b><small>${esc(x.id==='behnam'?tr('مدیر هوشمند','Smart Manager'):x.id==='self'?'فضای خصوصی این حساب':x.role||'گفتگوی نمونه')}</small></button><div class="chat-head-actions">${switcher()}${x.id==='self'?action('reminder',c.icon('clock'),'aria-label="یادآور جدید"','icon-btn'):action('call',c.icon('phone'),'aria-label="تماس"','icon-btn')}${action('chat-options',c.icon('more'),'aria-label="تنظیمات گفتگو"','icon-btn')}</div></div>${x.id==='self'?'<div class="self-intro">نوت‌ها، منابع ذخیره‌شده و یادآورهای خصوصی همین حساب</div>':''}${behnamControls(x,list)}${pinnedBanner(list)}<div class="chat-messages">${q?`<small>نتیجه جستجو: ${esc(q)}</small>`:''}${list.filter(m=>!q||m.text?.includes(q)).map(renderMessage).join('')||'<div class="empty-state">هنوز پیامی در این گفتگو نیست.</div>'}</div>${u.selected.length?`<div class="chat-tools">${fa(u.selected.length)} پیام انتخاب شد ${action('summary','گزیده قابل ویرایش')}${action('clear-selection','لغو')}</div>`:''}${u.reply?`<div class="chat-tools">پاسخ به: ${esc(u.reply.text||'رسانه')}${action('cancel-reply','لغو')}</div>`:''}<form class="chat-composer" id="messenger-form"><button type="button" class="icon-btn" data-msg="attach" aria-label="پیوست عکس فیلم ویس فایل">＋</button><button type="button" class="icon-btn" data-msg="camera" aria-label="دوربین">${c.icon('camera')}</button><textarea dir="auto" id="messenger-text" name="text" aria-label="متن پیام" placeholder="${x.id==='self'?'یادداشت برای خودم':'پیام'}" rows="1">${esc(c.draft(x.id)||'')}</textarea><button type="submit" class="icon-btn msg-send" aria-label="ارسال پیام">${c.icon('send')}</button><button type="button" class="icon-btn ${u.recorder?.state==='recording'?'recording':''}" data-msg="voice" aria-label="${u.recorder?.state==='recording'?'توقف ضبط و بازبینی':'ضبط ویس'}">${c.icon(u.recorder?.state==='recording'?'stop':'mic')}</button><input id="messenger-file" type="file" hidden multiple><input id="messenger-camera" type="file" hidden accept="image/*" capture="environment"></form>${u.recorder?`<div class="voice-console"><div class="voice-meter"><time id="voice-time"></time><canvas id="voice-wave" width="320" height="36"></canvas></div><div class="voice-actions">${action('cancel-recording','✕','aria-label="'+tr('حذف ضبط','Delete recording')+'"')}${action('pause-recording',u.recorder.state==='paused'?'▶':'Ⅱ','aria-label="'+tr('توقف موقت یا ادامه','Pause or resume')+'"')}${action('review-recording',c.icon('send'),'aria-label="'+tr('بازبینی و ارسال','Review and send')+'"')}</div></div>`:''}`}</section></div>`;}
 function persist(){c.save();c.render(true);}
 function add(contactId,text,extra={}){if(!threads()[contactId]||contacts().find(x=>x.id===contactId)?.blocked){c.toast(tr('ارسال در دسترس نیست','Sending unavailable'));return;}threads()[contactId].push({id:uid('MSG'),kind:'text',self:true,actor:c.actor(),date:new Date().toISOString(),time:new Date().toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'}),text,...(u.reply?{reply:{id:u.reply.id,text:u.reply.text||'رسانه'}}:{}),...extra,...(c.actor()==='behnam'?{beMood:document.getElementById('behnam-mood')?.value||'listen'}:{})});live.send(contactId,threads()[contactId].at(-1));u.reply=null;c.setDraft(contactId,'');persist();}
 const chosen=()=>threads()[u.chosen?.contactId]?.find(m=>m.id===u.chosen.id);
 function moreMenu(id){const m=(threads()[c.contact()]||[]).find(m=>m.id===id);if(!m||m.deleted)return;u.chosen={id,contactId:c.contact()};c.modal('گزینه‌های پیام',`<p data-user-content>${esc(m.text||'رسانه')}</p>${[['reply','پاسخ'],['forward','بازارسال'],['react','واکنش'],['note','ذخیره برای خودم'],['reminder','یادآور از این پیام'],['select','انتخاب برای گزیده'],['pin-message',m.pinned?'برداشتن سنجاق':'سنجاق پیام'],...(m.reminder?[['reminder-done','انجام شد'],['reminder-edit','ویرایش یادآور'],['reminder-snooze','تعویق یادآور'],['reminder-cancel','لغو یادآور']]:[]),...(m.self!==false?[['edit','ویرایش متن'],['delete','حذف پیام']]:[])].map(([a,l])=>action(a,l,'','list-link')).join('')}<div class="message-reactions">${Object.entries(m.reactions||{}).map(([k,v])=>`${esc(k)} ${fa(v.length)}`).join(' ')}</div>`);}
 function reminder(existing=null){const m=existing||chosen(),value=m?.reminder?new Date(new Date(m.reminder)-new Date(m.reminder).getTimezoneOffset()*60000).toISOString().slice(0,16):'';c.modal('یادآور شخصی',`<form id="messenger-reminder" data-edit="${existing?.id||''}"><div class="field"><label>یادداشت<textarea name="text" aria-label="متن پیام" required>${esc(m?.text||'')}</textarea></label></div><div class="field"><label>تاریخ و ساعت<input type="datetime-local" name="date" required value="${value}"></label></div><p>یادآور داخل این پیش‌نمونه با بازبودن صفحه بررسی می‌شود؛ اعلان بیرون برنامه نیازمند سرویس است.</p></form>`,`<button class="primary" type="submit" form="messenger-reminder">ذخیره یادآور</button>`);}
 function mediaPreview(p){u.pending=p;c.modal('بازبینی پیش از ارسال',`<form id="messenger-media">${p.attachments.map(attachment).join('')}<div class="field"><label>متن همراه<textarea name="text" placeholder="توضیح اختیاری"></textarea></label></div><p>${fa(p.attachments.length)} پیوست · آماده ثبت در همین گفتگو</p></form>`,`${action('cancel-media','لغو')}<button class="primary" type="submit" form="messenger-media">ارسال</button>`,true);}
 async function files(input){const contactId=c.contact();try{const attachments=[];for(const f of [...input.files]){const src=await c.fileData(f);if(!src)throw new Error('فایل خوانده نشد یا از اندازه مجاز بزرگ‌تر بود.');attachments.push({kind:f.type.startsWith('image/')?'image':f.type.startsWith('video/')?'video':f.type.startsWith('audio/')?'audio':'file',src,fileName:f.name});}if(attachments.length)mediaPreview({contactId,attachments});}catch(e){c.toast(e.message);}input.value='';}
 async function voice(video=false){if(u.busy)return;if(u.recorder?.state==='recording'){u.recorder.stop();return;}if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){c.toast('ضبط در این مرورگر فعال نیست؛ فایل صوتی پیوست کنید.');return;}const contactId=c.contact();u.busy=true;u.cancelVoice=false;try{u.stream=await navigator.mediaDevices.getUserMedia({audio:true,video:video?{facingMode:'user'}:false});if(u.cancelVoice||contactId!==c.contact()){u.stream.getTracks().forEach(t=>t.stop());return;}const chunks=[];u.elapsed=0;u.since=Date.now();const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){try{u.audio=new Audio();u.analyser=u.audio.createAnalyser();u.audio.createMediaStreamSource(u.stream).connect(u.analyser);}catch{}}u.recorder=new MediaRecorder(u.stream);u.recorder.addEventListener('dataavailable',e=>{if(e.data.size)chunks.push(e.data);});u.recorder.addEventListener('stop',async()=>{clearInterval(u.meter);u.audio?.close().catch(()=>{});u.audio=null;u.analyser=null;const cancelled=u.cancelVoice;u.stream?.getTracks().forEach(t=>t.stop());const type=u.recorder?.mimeType||'audio/webm';u.recorder=null;u.stream=null;if(cancelled){c.render(true);return;}try{const src=await c.fileData(new Blob(chunks,{type}));if(src)mediaPreview({contactId,attachments:[{kind:video?'video':'audio',src,fileName:(video?'video':'voice')+(type.includes('mp4')?'.mp4':'.webm')}]});}catch(e){c.toast(e.message);}c.render(true);});u.recorder.start();c.render(true);u.meter=setInterval(drawVoice,100);}catch{u.stream?.getTracks().forEach(t=>t.stop());c.toast('دسترسی میکروفن برقرار نشد.');}finally{u.busy=false;}}
 function readGifs(){return JSON.parse(localStorage.getItem('erp-gifs-'+c.actor())||'[]');}
 function gifShelf(){c.modal(tr('گیف‌های من','My GIFs'),'<label class="list-link">'+tr('ساخت گیف از عکس‌ها','Make GIF from photos')+'<input type="file" multiple accept="image/*" id="gif-photos"></label><div class="gif-gallery">'+readGifs().map((src,i)=>action('gif-use','<img alt="GIF" src="'+esc(src)+'">','data-index="'+i+'"')).join('')+'</div>');}
 document.addEventListener('paste',e=>{if(e.target.id!=='messenger-text')return;const list=Array.from(e.clipboardData?.files||[]);if(list.length){e.preventDefault();files({files:list,value:''});}});
 function drawVoice(){
  const clock=document.getElementById('voice-time'),canvas=document.getElementById('voice-wave');
  if(!clock||!canvas)return;
  const secs=Math.floor((u.elapsed+(u.recorder?.state==='recording'?Date.now()-u.since:0))/1000);
  clock.textContent=Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0');
  if(!u.analyser)return;
  const values=new Uint8Array(u.analyser.fftSize);u.analyser.getByteTimeDomainData(values);
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,320,36);ctx.fillStyle=getComputedStyle(canvas).color;
  for(let i=0;i<64;i++){const h=Math.max(2,Math.abs(values[Math.floor(i*values.length/64)]-128)/4);ctx.fillRect(i*5,18-h/2,3,h);}
 }
 function cancel(){u.beMood=null;u.unlocked=null;u.cancelVoice=true;if(u.recorder&&u.recorder.state!=='inactive'){u.cancelVoice=true;u.recorder.stop();}u.pending=null;u.reply=null;u.selected=[];}
 const people=()=>Object.entries(roles).filter(([id,r])=>id!==c.actor()&&id!=='office'&&r.level===roles[c.actor()].level);
 function groupForm(x=null){c.modal(x?'مدیریت اعضای گروه':'گروه هم‌سطح جدید',`<form id="messenger-group" data-id="${x?.id||''}"><div class="field"><label>نام گروه<input name="name" required value="${esc(x?.name||'')}"></label></div><fieldset><legend>همکاران هم‌سطح</legend>${people().map(([id,r])=>`<label class="op-team-choice"><input type="checkbox" name="members" value="${id}" ${x?.members?.includes(id)?'checked':''}>${esc(c.identity?.(id)?.name||r.name)}</label>`).join('')}</fieldset><p>سازنده مدیر این گروه است. عضویت گروه، دسترسی به تسک یا اطلاعات شخصی ایجاد نمی‌کند.</p></form>`,`<button class="primary" form="messenger-group" type="submit">ذخیره گروه</button>`);}
 function menu(id){const m=threads()[c.contact()]?.find(v=>v.id===id);if(!m||m.deleted)return;u.chosen={id,contactId:c.contact()};c.modal(tr('گزینه‌های پیام','Message options'),`<div class="quick-react">${['👍','❤️','😂','😮','😢','🙏','🤗'].map(v=>action('reaction',v,'data-reaction="'+v+'"')).join('')}${action('react','＋')}</div><blockquote data-user-content>${esc(m.text||m.fileName||'')}</blockquote>`+
 [['reply','پاسخ','Reply'],['forward','بازارسال','Forward'],['copy','کپی','Copy'],['star',m.starred?'برداشتن ستاره':'ستاره‌دار کردن',m.starred?'Unstar':'Star'],...(m.src||m.attachments?[['drive-message','ذخیره در فایل‌های موریاتی','Save to Moriyati Files']]:[]),...(m.self!==false?[['delete','حذف','Delete']]:[]),['pin-message',m.pinned?'برداشتن سنجاق':'سنجاق',m.pinned?'Unpin':'Pin'],...(m.self!==false?[['edit','ویرایش','Edit']]:[])].map(([k,f,e])=>action(k,tr(f,e),'','list-link')).join(''));}
 async function pinDigest(id,pin){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode([c.actor(),id,pin].join('|')));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');}
 async function unlock(x){if(!x?.locked)return true;const pin=prompt(tr('رمز گفتگو','Chat PIN'));return pin!==null&&await pinDigest(x.id,pin)===x.locked;}
 let timer,point,holdTarget,suppress=0;
 function resetHold(){clearTimeout(timer);holdTarget=null;}
 function longMenu(el){if(el.dataset.messageId)menu(el.dataset.messageId);else threadMenu(el.dataset.contact);}
 document.addEventListener('pointerdown',e=>{resetHold();const el=e.target.closest('.messenger [data-message-id],.messenger .contact-row');if(!el||e.button!==0)return;point=[e.clientX,e.clientY];holdTarget=el;timer=setTimeout(()=>{suppress=Date.now()+1200;longMenu(el);resetHold();},480);});
 document.addEventListener('pointermove',e=>{if(holdTarget&&Math.hypot(point[0]-e.clientX,point[1]-e.clientY)>8)resetHold();});
 for(const event of ['pointerup','pointercancel'])document.addEventListener(event,resetHold);
 document.addEventListener('contextmenu',e=>{const el=e.target.closest('.messenger .contact-row,.messenger [data-message-id]');if(el){e.preventDefault();resetHold();longMenu(el);}});
 document.addEventListener('click',e=>{if(Date.now()<suppress&&e.target.closest('.messenger')){e.preventDefault();e.stopImmediatePropagation();suppress=0;}},true);
 function threadMenu(id){const x=contacts().find(v=>v.id===id);if(!x)return;u.thread=id;c.modal(display(x),`<blockquote data-user-content>${esc(x.locked?'🔒':threads()[id]?.at(-1)?.text||'')}</blockquote>`+
 [['unread',x.unread?'خوانده شد':'خوانده‌نشده',x.unread?'Mark read':'Mark unread'],['pinned',x.pinned?'برداشتن سنجاق':'سنجاق گفتگو',x.pinned?'Unpin':'Pin'],['archived',x.archived?'خروج از بایگانی':'بایگانی',x.archived?'Unarchive':'Archive'],['muted',x.muted?'فعال‌کردن صدا':'بی‌صدا',x.muted?'Unmute':'Mute'],['locked',x.locked?'باز کردن قفل':'قفل گفتگو',x.locked?'Unlock':'Lock chat'],...(!x.group&&id!=='self'?[['blocked',x.blocked?'رفع مسدودیت':'مسدود کردن',x.blocked?'Unblock':'Block']]:[]),['clear','پاک‌کردن پیام‌ها','Clear chat'],...(id==='self'?[]:[['remove','حذف گفتگو','Delete chat']])].map(([k,f,e])=>action('thread-'+k,tr(f,e),'','list-link')).join(''));}
 async function threadAction(k){const x=contacts().find(v=>v.id===u.thread);if(!x)return;if(!await unlock(x))return;
 if(k==='clear'||k==='remove'){if(!confirm(tr('تأیید می‌کنید؟','Confirm?')))return;threads()[x.id]=[];if(k==='remove')contacts().splice(contacts().indexOf(x),1);}
 else if(k==='locked'){if(x.locked)x.locked='';else{const pin=prompt(tr('رمز قفل محلی گفتگو','Local chat PIN'));if(!pin)return;x.locked=await pinDigest(x.id,pin);}}
 else if(k==='list'){const list=prompt(tr('نام فهرست','List name'),x.list||'');if(list===null)return;x.list=list;}
 else if(k==='unread')x.unread=x.unread?0:1;else x[k]=!x[k];c.closeModal();c.save();c.nav('messages');}
 function act(el){const a=el.dataset.msg,m=chosen(),x=current();if(!a)return false;
  if(a==='behnam-inbox'){u.tab='chats';u.filter='active';u.search='';c.nav('messages');return true;}
  if(a==='settings')settings();
  else if(a==='create-menu')c.modal(tr('ایجاد','Create'),[['new','گفتگوی جدید','New chat'],['group','گروه جدید','New group']].map(([k,f,e])=>action(k,tr(f,e),'','list-link')).join(''));
  else if(a==='palette'){const form=el.closest('form');colors.forEach(([k],i)=>{form.elements[k].value=palettes[el.dataset.palette][i];form.elements[k].dataset.edited='1';});updatePreview(form);}
  else if(a==='drive-open')drive.open('browse');
  else if(a==='drive-message')drive.open('save',m.attachments||[m]);
  else if(a==='drive-pick-file')drive.open('pick');
  else if(a.startsWith('drive-'))drive.action(a.slice(6),el.dataset.path);
  else if(a==='gifs')gifShelf();
  else if(a==='gif-use'){const gif=readGifs()[Number(el.dataset.index)];if(gif)mediaPreview({contactId:c.contact(),attachments:[{kind:'image',src:gif,fileName:'animation.gif'}]});}
  else if(a==='device')document.getElementById('messenger-file').click();
  else if(a==='copy'){navigator.clipboard.writeText(m.text||m.fileName||'').then(()=>c.closeModal()).catch(()=>c.toast(tr('کپی انجام نشد','Copy failed')));}
  else if(a==='more')moreMenu(m.id);
  else if(a==='jump-pin')document.querySelector('.chat-messages [data-message-id="'+CSS.escape(el.dataset.id)+'"]')?.scrollIntoView({block:'center',behavior:'smooth'});
  else if(a==='star'){m.starred=!m.starred;c.closeModal();persist();}
  else if(a.startsWith('thread-'))threadAction(a.slice(7));
  else if(a==='open'||a==='self'){u.selected=[];u.search='';const opened=contacts().find(row=>row.id===el.dataset.contact);if(opened?.locked){unlock(opened).then(ok=>{if(ok){opened.unread=0;c.save();c.nav('messages/'+opened.id);u.unlocked=c.actor()+'/'+opened.id;c.render(true);}});return;}if(opened?.unread){opened.unread=0;c.save();}c.nav('messages/'+(a==='self'?'self':el.dataset.contact));}
  else if(a==='back')c.nav('messages');
  else if(a==='tab'){u.tab=el.dataset.tab;u.filter=u.tab==='groups'?'groups':'active';u.search='';if(c.contact())c.nav('messages');else c.render(true);}
  else if(a==='language'){localStorage.setItem('erp-messenger-lang-'+c.actor(),language()==='fa'?'en':'fa');c.render(true);}
  else if(a==='lists'){c.modal(tr('فهرست‌ها','Lists'),Array.from(new Set(contacts().map(x=>x.list).filter(Boolean))).map(v=>action('show-list',esc(v),'data-list="'+esc(v)+'"','list-link')).join('')||tr('فهرستی ثبت نشده','No lists yet'));}
  else if(a==='show-list'){u.filter='list';u.list=el.dataset.list;c.closeModal();c.render(true);}
  else if(['active','archived','favorite','unread','pinned','groups'].includes(a)){u.filter=a;c.closeModal();c.render(true);}
  else if(a==='new')c.modal('گفتگوی خصوصی',Object.entries(roles).filter(([id])=>id!==c.actor()).map(([id,r])=>action('start-direct',esc(c.identity?.(id)?.name||r.name),`data-id="${id}"`,'list-link')).join(''));
  else if(a==='start-direct'){u.tab='chats';u.search='';const r=roles[el.dataset.id];if(!contacts().some(x=>x.id===el.dataset.id)){contacts().push({id:el.dataset.id,name:r.name,initial:r.name[0],role:r.title});threads()[el.dataset.id]=[];}c.save();c.nav('messages/'+el.dataset.id);}
  else if(a==='group')groupForm();
  else if(a==='info'){c.modal(display(x),`<p>${esc(x.role||'گفتگو')}</p>${action('history',tr('رسانه و فایل','Media and files'))}${action('stars',tr('ستاره‌دارها','Starred messages'))}${x.group?(x.members||[]).map(id=>`<p>${portrait({id,name:roles[id]?.name||id})} ${esc(c.identity?.(id)?.name||roles[id]?.name||id)}</p>`).join('')+(x.admin===c.actor()?action('group-edit','مدیریت اعضا'):''):''}`);}
  else if(a==='history'||a==='stars'){
   const items=(threads()[x.id]||[]).filter(m=>!m.deleted&&(a==='stars'?m.starred:m.src||m.attachments));
   c.modal(a==='stars'?tr('ستاره‌دارها','Starred'):tr('رسانه و فایل','Media and files'),items.map(m=>'<article>'+attachment(m)+'<p>'+esc(m.text||m.fileName||'')+'</p></article>').join('')||tr('هنوز موردی ثبت نشده','Nothing here yet'));
  }
  else if(a==='group-edit'&&x?.admin===c.actor())groupForm(x);
  else if(a==='chat-options')threadMenu(x.id);
  else if(a==='legacy-options')c.modal('تنظیمات گفتگو',[['pin-chat',x.pinned?'برداشتن سنجاق گفتگو':'سنجاق گفتگو'],['mute',x.muted?'فعال‌کردن صدا':'بی‌صدا'],['archive',x.archived?'خارج‌کردن از بایگانی':'بایگانی گفتگو']].map(([a,l])=>action(a,l,'','list-link')).join(''));
  else if(['pin-chat','mute','archive'].includes(a)){const key={ 'pin-chat':'pinned',mute:'muted',archive:'archived'}[a];x[key]=!x[key];c.closeModal();persist();}
  else if(a==='relay-connect')live.setup();
  else if(a==='relay-answer')live.accept().catch(liveError);
  else if(a==='relay-end'){live.end().catch(liveError);c.closeModal();}
  else if(a==='call'){if(!x||x.group||x.id==='self')c.toast(tr('تماس صوتی در گفتگوی دونفره در دسترس است.','Voice calls are available in direct chats.'));else live.start(x.id).catch(liveError);}
  else if(a==='video-record'){c.closeModal();voice(true);}
  else if(a==='attach')c.modal(tr('پیوست','Attachment'),action('device',tr('عکس، ویدیو، آهنگ یا فایل','Photo, video, music or file'))+action('video-record',tr('ضبط پیام ویدیویی','Record video message'))+action('gifs',tr('گیف‌های من','My GIFs'))+action('drive-pick-file',tr('از فایل‌های موریاتی','From Moriyati Files')));
  else if(a==='camera')document.getElementById(a==='attach'?'messenger-file':'messenger-camera').click();
  else if(a==='voice')voice();
  else if(a==='pause-recording'&&u.recorder){if(u.recorder.state==='paused'){u.since=Date.now();u.recorder.resume();}else{u.elapsed+=Date.now()-u.since;u.recorder.pause();}c.render(true);}
  else if(a==='review-recording'&&u.recorder)u.recorder.stop();
  else if(a==='cancel-recording')cancel();
  else if(a==='cancel-media'){u.pending=null;c.closeModal();}
  else if(a==='menu')menu(el.dataset.id);
  else if(a==='reply'){u.reply=structuredClone(m);c.closeModal();c.render(true);}
  else if(a==='cancel-reply'){u.reply=null;c.render(true);}
  else if(a==='forward')c.modal('بازارسال به گفتگو',contacts().map(x=>action('forward-to',esc(display(x)),`data-contact="${x.id}"`,'list-link')).join(''));
  else if(a==='forward-to'){const value=structuredClone(m);const media={};for(const key of ['kind','src','fileName','attachments'])if(value[key]!==undefined)media[key]=value[key];add(el.dataset.contact,value.text,{...media,forwarded:true});c.closeModal();}
  else if(a==='react')c.modal('واکنش به پیام',['👍','❤️','😂','😮','😢','🙏','🤗','✅','👀','🎉','👏','🔥','💯','⭐','💪','😊','🙌','👌','✨','💙'].map(v=>action('reaction',v,`data-reaction="${v}"`)).join(''));
  else if(a==='reaction'){m.reactions||={};const r=m.reactions[el.dataset.reaction]||=[];if(r.includes(c.actor()))m.reactions[el.dataset.reaction]=r.filter(v=>v!==c.actor());else r.push(c.actor());c.closeModal();persist();}
  else if(a==='note'){add('self',m.text,{kind:m.kind,src:m.src,attachments:m.attachments,source:{contactId:u.chosen.contactId,messageIds:[m.id],label:contacts().find(x=>x.id===u.chosen.contactId)?.name}});c.closeModal();c.toast('در فضای خصوصی همین حساب ذخیره شد.');}
  else if(a==='select'){u.selected=u.selected.includes(m.id)?u.selected.filter(x=>x!==m.id):[...u.selected,m.id];c.closeModal();c.render(true);}
  else if(a==='clear-selection'){u.selected=[];c.render(true);}
  else if(a==='summary')c.modal('گزیده قابل ویرایش',`<form id="messenger-summary"><p>متن انتخاب‌شده منبع این نوت است؛ پردازش هوشمند متصل نیست. متن را پیش از ذخیره اصلاح کنید.</p><div class="field"><textarea name="text" aria-label="متن گزیده" required rows="9">${esc(sourceExcerpt(threads()[c.contact()],u.selected))}</textarea></div></form>`,`<button class="primary" form="messenger-summary" type="submit">ذخیره در نوت خصوصی</button>`);
  else if(a==='pin-message'){m.pinned=!m.pinned;c.closeModal();persist();}
  else if(a==='reminder')reminder();
  else if(a==='reminder-edit'||a==='reminder-snooze')reminder(m);
  else if(a==='reminder-done'||a==='reminder-cancel'){m.reminderState=a==='reminder-done'?'done':'cancelled';c.closeModal();persist();}
  else if(a==='edit')c.modal('ویرایش متن پیام',`<form id="messenger-edit"><div class="field"><textarea name="text" aria-label="متن پیام" required>${esc(m.text||'')}</textarea></div></form>`,`<button class="primary" form="messenger-edit" type="submit">ذخیره تغییر</button>`);
  else if(a==='delete'){const to=u.chosen.contactId,actor=c.actor();live.change(to,m,'delete').then(()=>{if(actor!==c.actor())return;removeMessage(m,actor,c.archive(),to);c.closeModal();persist();}).catch(liveError);}
  return true;
 }
 function submit(form){if(!form.id.startsWith('messenger-'))return false;const fd=new FormData(form);try{
  if(form.id==='messenger-relay')live.connect(String(fd.get('token')||'')).catch(liveError);
  else if(form.id==='messenger-style'){const p=prefs();p.size=Number(fd.get('size'));p.tone=fd.get('tone');for(const el of form.querySelectorAll('[data-style-color][data-edited]'))p[el.name]=el.value;localStorage.setItem(prefKey(),JSON.stringify(p));c.closeModal();c.render(true);}
  else if(form.id==='messenger-form'){const text=String(fd.get('text')||'').trim();if(text)add(c.contact(),text);}
  else if(form.id==='messenger-media'){const p=u.pending;if(!p)throw new Error('پیوست آماده نیست.');add(p.contactId,String(fd.get('text')||''),p.attachments.length===1?p.attachments[0]:{kind:'album',attachments:p.attachments});u.pending=null;c.closeModal();}
  else if(form.id==='messenger-edit'){const m=chosen(),to=u.chosen.contactId,actor=c.actor(),text=String(fd.get('text')||'').trim();if(!text)throw Error('متن لازم است.');live.change(to,m,'edit',text).then(()=>{if(actor!==c.actor())return;reviseMessage(m,text,actor,c.archive(),to);c.closeModal();persist();}).catch(liveError);}
  else if(form.id==='messenger-group'){const id=form.dataset.id||uid('GROUP'),existing=contacts().find(x=>x.id===id);if(existing&&existing.admin!==c.actor())throw new Error('مدیریت این گروه در اختیار شما نیست.');const allowed=people().map(([id])=>id),members=fd.getAll('members').filter(id=>allowed.includes(id)),name=String(fd.get('name')||'').trim();if(!name)throw new Error('نام گروه لازم است.');const value={id,name,group:true,initial:name[0],role:'گروه هم‌سطح',admin:c.actor(),members:[c.actor(),...members]};if(existing)Object.assign(existing,value);else{contacts().push(value);threads()[id]=[];}c.closeModal();c.save();c.nav('messages/'+id);}
  else if(form.id==='messenger-summary'){const text=String(fd.get('text')||'').trim();if(!text)throw new Error('متن لازم است.');add('self',text,{source:{contactId:c.contact(),messageIds:[...u.selected],label:current()?.name}});u.selected=[];c.closeModal();}
  else if(form.id==='messenger-reminder'){const date=new Date(fd.get('date')),text=String(fd.get('text')||'').trim();if(!text||!Number.isFinite(+date))throw new Error('متن و تاریخ معتبر لازم است.');const old=threads().self.find(m=>m.id===form.dataset.edit);if(old){reviseMessage(old,text,c.actor(),c.archive(),'self');old.reminder=date.toISOString();old.reminderState='pending';delete old.notified;}else add('self',text,{reminder:date.toISOString(),reminderState:'pending',...(chosen()?{source:{contactId:u.chosen.contactId,messageIds:[chosen().id],label:contacts().find(x=>x.id===u.chosen.contactId)?.name}}:{})});c.closeModal();persist();}
 }catch(e){c.toast(e.message);}return true;}
 function input(el){if(el.closest('#messenger-style'))updatePreview(el.closest('form'));if(el.id==='messenger-text')c.setDraft(c.contact(),el.value);if(el.id==='messenger-search'){u.search=el.value;document.getElementById('messenger-contacts').innerHTML=renderContacts();}}
 function change(el){if(el.id==='behnam-mood'){u.beMood=el.value;return true;}if(el.id==='gif-photos'){const actor=c.actor();makeGif(Array.from(el.files)).then(gif=>{if(actor!==c.actor())return;const library=readGifs();library.unshift(gif);localStorage.setItem('erp-gifs-'+actor,JSON.stringify(library));gifShelf();}).catch(()=>c.toast(tr('ذخیره گیف انجام نشد','Could not save GIF')));return true;}if(el.id==='drive-upload'){drive.upload(el);return true;}if(el.closest('#messenger-style')){updatePreview(el.closest('form'));if(el.name==='tone')sound(el.value);}if(el.hasAttribute('data-style-color'))el.dataset.edited='1';if(['messenger-file','messenger-camera'].includes(el.id)){files(el);return true;}return false;}
 function tick(){let changed=false;for(const m of threads().self||[])if(m.reminder&&(!m.reminderState||m.reminderState==='pending')&&!m.notified&&new Date(m.reminder)<=new Date()){m.notified=true;c.notify({id:uid('REM'),kind:'reminder',ownerId:c.actor(),recipients:[c.actor()],name:'یادآور شخصی',text:' '+m.text,detail:'برای خودم',time:'اکنون',chat:'self',read:false});changed=true;}if(changed){sound(prefs().tone);c.save();c.render(true);}}
 return {behnamLauncher,language,render,act,submit,input,change,cancel,tick};
}
