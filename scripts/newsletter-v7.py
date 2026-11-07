"""Build the two archived newsletter editions; no publication scheduler."""
from pathlib import Path
import html, json, importlib.util
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'dist'
spec=importlib.util.spec_from_file_location('revision',ROOT/'scripts/revision-v7.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
data=json.loads((ROOT/'content/newsletter-2026-11-05.json').read_text())
data.pop('editorialNotes',None)
data['notice']={'fa':'شماره‌های آرشیوی ۱۴ آبان ۱۴۰۵؛ قیمت‌ها مربوط به زمان ثبت هر شماره‌اند.','en':'Archived editions of 5 November 2026; quotations refer to their stated observation times.'}
(D/'newsletter-data.js').write_text('window.MORIYATI_NEWSLETTER='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
esc=lambda s:html.escape(str(s),quote=True)
def article(e):
 c=e['fa'];refs={s['id']:i+1 for i,s in enumerate(e['sources'])}
 def stories(key):
  out=''
  for story in c[key]:
   label='<span class="news-story-kind">یادداشت موریاتی</span>' if story.get('type')=='editorial' else ''
   out+='<article class="news-story">'+label+'<h3>'+esc(story['heading'])+'</h3>'+''.join('<p>'+esc(p)+'</p>' for p in story['paragraphs'])
   if story['sourceIds']:out+='<div class="news-story-refs">منبع '+''.join('<a href="#news-source-'+sid+'">['+str(refs[sid])+']</a>' for sid in story['sourceIds'])+'</div>'
   out+='</article>'
  return out
 return '<header class="newsletter-issue-heading"><div class="news-issue-meta"><span>نوبت صبح</span><time datetime="'+e['date']+'T11:00:00+03:30">'+e['dateFa']+'</time><span dir="ltr">11:00 · Tehran</span></div><div><span class="eyebrow">شمارهٔ ۰۱</span><h2>'+esc(c['title'])+'</h2><p class="newsletter-summary">'+esc(c['summary'])+'</p><nav class="bulletin-section-links" aria-label="بخش‌های خبرنامه"><a href="#global">بازار جهانی <span aria-hidden="true">↓</span></a><a href="#iran">بازار ایران <span aria-hidden="true">↓</span></a></nav></div></header><div class="newsletter-columns"><section id="global" class="newsletter-column"><div class="newsletter-column-head"><span lang="en">01</span><h2>بازار جهانی</h2></div>'+stories('global')+'</section><section id="iran" class="newsletter-column"><div class="newsletter-column-head"><span lang="en">02</span><h2>بازار ایران</h2></div>'+stories('iran')+'</section></div><section class="newsletter-sources"><h2>منابع این شماره</h2><ol>'+''.join('<li id="news-source-'+s['id']+'"><a href="'+esc(s['url'])+'" target="_blank" rel="noopener noreferrer" dir="auto">'+esc(s['title'])+'</a></li>' for s in e['sources'])+'</ol></section>'
tr=m.tr
body='<main class="pages-main bulletin-editorial" id="main"><section class="bulletin-masthead section-shell"><div class="section-kicker"><span class="eyebrow">'+tr('نشریهٔ خانه','MARKET DISPATCHES')+'</span><span class="small-english" lang="en">THE MORIYATI NEWSLETTER</span></div><div class="bulletin-title-row">'+tr('خبرنامه','Newsletter','h1')+tr('آرشیو شماره‌ها','ARCHIVED EDITIONS','span','class="bulletin-preview-label"')+'</div>'+tr('نگاهی به بازار جهانی و بازار ایران؛ طلا، نقره، بورس و ارز.\nدر دو شمارهٔ مستقل، برای مرور صبح و جمع‌بندی شب.','A view of global and Iranian markets: gold, silver, equities and currencies.\nTwo independent editions, for the morning outlook and evening review.','p','class="bulletin-deck"')+'<div class="bulletin-edition-bar"><div class="bulletin-editions" role="group" aria-label="نوبت خبرنامه" data-en-label="Newsletter edition"><button type="button" data-edition="morning" aria-pressed="true">'+tr('نوبت صبح','Morning edition')+'<span dir="ltr">11:00</span></button><button type="button" data-edition="evening" aria-pressed="false">'+tr('نوبت شب','Evening edition')+'<span dir="ltr">23:00</span></button></div><span class="bulletin-timezone">'+tr('به وقت تهران','Tehran time')+'</span></div><p class="newsletter-archive-note">'+tr(data['notice']['fa'],data['notice']['en'])+'</p></section><article id="newsletter-article" class="newsletter-article section-shell" aria-live="polite">'+article(data['editions'][0])+'</article><section class="newsletter-archive section-shell"><div class="newsletter-archive-heading">'+tr('آرشیو خبرنامه','Newsletter archive','h2')+'<span lang="en">2026 / 11 / 05</span></div><div class="newsletter-archive-grid">'+''.join('<button type="button" data-news-id="'+e['id']+'"><span>'+tr('صبح' if i==0 else 'شب','Morning' if i==0 else 'Evening')+' <span dir="ltr">'+e['time']+'</span></span>'+tr(e['fa']['title'],e['en']['title'],'strong')+'<span>'+tr(e['dateFa'],'5 November 2026')+'</span></button>' for i,e in enumerate(data['editions']))+'</div></section></main>'
m.page('bulletin','خبرنامه','Newsletter',body,'newsletter.js')
p=D/'bulletin.html';s=p.read_text().replace('<script src="newsletter.js"','<script src="newsletter-data.js" defer></script><script src="newsletter.js"');p.write_text(s)
print('Built two complete archived editions, with bilingual reporting and sources.')
