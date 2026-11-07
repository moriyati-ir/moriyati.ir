from pathlib import Path
import importlib.util,re
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'dist'
spec=importlib.util.spec_from_file_location('revision',ROOT/'scripts/revision-v7.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.build_heritage()
links=[('index.html#/works','آثار','Creations'),('expertise.html','توانمندی‌ها','Capabilities'),('heritage.html','میراث','Heritage'),('authenticity.html','اصالت‌سنجی','Authenticity'),('bulletin.html','خبرنامه','Newsletter'),('contact.html','ارتباط با ما','Contact')]
def nav():return ''.join('<a href="'+u+'">'+m.tr(f,e)+'</a>' for u,f,e in links)
def swap(s,tag,needle,replace):
 starts=list(re.finditer(r'<'+tag+r'\b[^>]*>',s))
 for a in starts:
  if not needle(a[0]):continue
  depth=1
  for b in re.finditer(r'</?'+tag+r'\b[^>]*>',s[a.end():]):
   depth+=-1 if b[0].startswith('</') else 1
   if depth==0:
    end=a.end()+b.end();return s[:a.start()]+replace(s[a.start():end])+s[end:]
  raise ValueError('Unclosed '+tag)
 return s
menu='<dialog class="mobile-menu" id="mobile-menu" aria-label="منوی اصلی" data-en-label="Main navigation"><div class="mobile-menu-top"><span lang="en">MORIYATI</span><button type="button" class="icon-close menu-close" data-close-menu aria-label="بستن منو" data-en-label="Close menu">×</button></div><nav aria-label="منوی اصلی" data-en-label="Main navigation">'+nav()+'</nav><p>'+m.tr('تهران، ایران','Tehran, Iran')+'</p></dialog>'
for name in ['index','expertise','contact','authenticity','heritage','bulletin']:
 p=D/(name+'.html');s=p.read_text()
 s=s.replace('بولتن','خبرنامه')
 s=s.replace('data-en="Bulletin"','data-en="Newsletter"')
 s=s.replace('>The Moriyati Bulletin<','>The Moriyati Newsletter<')
 if 'v7.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="v7.css">\n</head>')
 s=swap(s,'dialog',lambda t:'id="mobile-menu"' in t,lambda _:menu)
 s=swap(s,'div',lambda t:'class="page-footer-nav"' in t,lambda _:'<div class="page-footer-nav">'+nav()+'</div>')
 if name=='index':
  s=swap(s,'div',lambda t:'class="contact-block compact"' in t,lambda _:m.contact_block(True))
 if name=='contact':
  s=swap(s,'div',lambda t:'class="contact-block"' in t,lambda _:m.contact_block(False))
  s=swap(s,'section',lambda t:'id="retailers"' in t,lambda _:'')
  section='<section class="retailer-section section-shell" id="retailers"><div class="section-kicker"><span class="eyebrow">'+m.tr('۰۲ / شبکهٔ فروش','02 / RETAIL NETWORK')+'</span><span class="small-english">NEAR YOU, WITH MORIYATI</span></div><div data-dealer-directory></div><aside class="retailer-affairs"><div><h3>'+m.tr('امور عاملیت‌ها','Retail partnerships')+'</h3><p>'+m.tr('برای گفت‌وگو دربارهٔ همکاری و پیوستن به شبکهٔ فروش موریاتی، با خانه در ارتباط باشید.','Contact the House to discuss working together and joining Moriyati’s retail network.')+'</p></div><a href="mailto:info@moriyati.ir?subject=Moriyati%20retail%20partnership">'+m.icon('mail')+m.tr('ارتباط با امور عاملیت‌ها','Contact retail partnerships')+'</a></aside></section>'
  s=s.replace('<section class="contact-location',section+'<section class="contact-location',1)
  s=s.replace('۰۲ / موقعیت','۰۳ / موقعیت').replace('02 / LOCATION','03 / LOCATION')
 if name in ['index','contact']:
  for src in ['dealers-data.js','dealers.js']:
   if 'src="'+src+'"' not in s:s=s.replace('</head>','<script src="'+src+'" defer></script>\n</head>')
 if name=='expertise':
  s=swap(s,'div',lambda t:'class="authority-strip' in t,lambda old:re.sub(r'<figure[^>]*data-chamber[^>]*>.*?</figure>','',old,flags=re.S))
  chamber='<figure data-chamber><div class="authority-mark"><img src="assets/authorities/tehran-chamber.svg" alt="نشان اتاق بازرگانی تهران" loading="lazy"></div><figcaption>'+m.tr('اتاق بازرگانی تهران','Tehran Chamber of Commerce')+'</figcaption></figure>'
  s=swap(s,'div',lambda t:'class="authority-strip' in t,lambda old:old[:-6]+chamber+'</div>')
 if name=='contact':s=s.replace('۰۲ / خانه را پیدا کنید','۰۳ / خانه را پیدا کنید').replace('02 / FIND THE HOUSE','03 / FIND THE HOUSE')
 p.write_text(s)
p=D/'app.js';s=p.read_text().replace('بولتن','خبرنامه')
s=re.sub(r"tilt\.style\.transform=reduced\?'none':`rotateX\([^;]+;","tilt.style.transform='none';",s)
marker='</div></div></div><div class="collection-narrative">'
if 'class="collection-retailer-cta"' not in s:
 cta='<div class="collection-retailer-cta"><button type="button" data-open-dealers><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>${language===\'fa\'?\'یافتن نزدیک‌ترین عاملیت فروش\':\'Find your nearest retailer\'}</span></button></div>'
 assert marker in s
 s=s.replace(marker,'</div>'+cta+'</div></div><div class="collection-narrative">')
p.write_text(s)
print('Applied shared v7 content, navigation, contact and collection retailer entry.')
