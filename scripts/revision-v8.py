"""Apply the owner's recorded editorial/design revisions to the preserved v7 source.

Idempotent; earlier regeneration scripts should be followed by this revision.
"""
from pathlib import Path
import re,json
ROOT=Path(__file__).resolve().parents[1]
D=ROOT/'dist'

def region(s,tag,predicate):
    for a in re.finditer(r'<'+tag+r'\b[^>]*>',s):
        if not predicate(a[0]):continue
        depth=1
        for b in re.finditer(r'</?'+tag+r'\b[^>]*>',s[a.end():]):
            depth+=-1 if b[0].startswith('</') else 1
            if depth==0:return a.start(),a.end()+b.end()
        raise ValueError('Unclosed '+tag)
    return None

def swap(s,tag,predicate,fn):
    r=region(s,tag,predicate)
    return s[:r[0]]+fn(s[r[0]:r[1]])+s[r[1]:] if r else s

def tr(fa,en):
    from html import escape
    return '<span data-en="'+escape(en,quote=True)+'">'+fa+'</span>'

# Official recognizable brand marks, locally hosted and inheriting button colour.
def brand_icon(name):
    s=(D/'assets/v8/icons'/f'{name}.svg').read_text()
    s=re.sub(r'<title>.*?</title>','',s)
    s=re.sub(r'<svg[^>]*>','<svg class="contact-icon brand-contact-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none">',s,1)
    return s

phone_roles=[('56','فروش، مشاوره و همکاری تجاری','Sales, enquiries & business partnerships'),('57','پیگیری سفارش و هماهنگی تحویل','Orders & delivery'),('58','حسابداری و امور مالی','Accounting & finance'),('59','خدمات پس از فروش','After-sales service')]
for p in D.glob('*.html'):
    s=p.read_text()
    if 'v8.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="v8.css">\n</head>')
    if 'refinements-v8.js' not in s:s=s.replace('</head>','<script src="refinements-v8.js" defer></script>\n</head>')
    for name,pattern in [('whatsapp',r'https://wa\.me/'),('telegram',r'https://t\.me/\+')]:
        s=re.sub(r'(<a\b[^>]*href="'+pattern+r'[^>]+>)<svg\b[\s\S]*?</svg>',lambda m:m[1]+brand_icon(name),s)
    for suffix,fa,en in phone_roles:
        pattern=r'(<a class="phone-number" href="tel:\+9899045000'+suffix+r'"[^>]*>)([\s\S]*?)(</a>)'
        def phone(m):
            body=re.sub(r'<span class="phone-department"[\s\S]*?</span>','',m[2])
            return m[1]+'<span class="phone-department" data-en="'+en+'" dir="auto">'+fa+'</span>'+body+m[3]
        s=re.sub(pattern,phone,s)
    p.write_text(s)

p=D/'index.html';s=p.read_text()
if 'class="portal-art-link"' not in s:
    s=s.replace('<div class="portal-art" aria-hidden="true">','<div class="portal-art">')
    s=re.sub(r'(<img src="assets/collections/home-square.webp"[^>]*>)',r'\1<a class="portal-art-link" href="#/works" aria-label="مشاهدهٔ آثار" data-en-label="Explore the collections"></a>',s)
if 'class="heritage-panorama-link"' not in s:
    s=re.sub(r'(<figure class="heritage-panorama">)(<img[^>]*>)',r'\1<a class="heritage-panorama-link" href="heritage.html" aria-label="روایت کامل میراث" data-en-label="Explore Moriyati heritage">\2</a>',s)
p.write_text(s)

# The location follows the addresses and precedes the retail network.
p=D/'contact.html';s=p.read_text()
loc=region(s,'section',lambda t:'id="location"' in t)
ret=region(s,'section',lambda t:'id="retailers"' in t)
if loc and ret and loc[0]>ret[0]:
    block=s[loc[0]:loc[1]];s=s[:loc[0]]+s[loc[1]:]
    ret=region(s,'section',lambda t:'id="retailers"' in t);s=s[:ret[0]]+block+s[ret[0]:]
s=s.replace('03 / FIND THE HOUSE','02 / FIND THE HOUSE').replace('۰۳ / خانه را پیدا کنید','۰۲ / خانه را پیدا کنید').replace('02 / RETAIL NETWORK','03 / RETAIL NETWORK').replace('۰۲ / شبکهٔ فروش','۰۳ / شبکهٔ فروش')
p.write_text(s)

# Only the owner's explicitly requested honorific changes the approved narrative.
for name in ['heritage.html','heritage-copy.json']:
    p=D/name;s=p.read_text();s=re.sub(r'(?<!حاج )محمدحسین مهربان','حاج محمدحسین مهربان',s)
    s=re.sub(r'(?<!Haj )Mohammadhossein Mehraban','Haj Mohammadhossein Mehraban',s)
    p.write_text(s)

p=D/'expertise.html';s=p.read_text()
if 'mehrabanenterprises.com</span>' not in s:
    s=swap(s,'div',lambda t:'class="international-heading ' in t,lambda b:b[:-6]+'<a class="enterprise-website external-link" href="https://mehrabanenterprises.com" target="_blank" rel="noopener noreferrer"><span lang="en" dir="ltr">mehrabanenterprises.com</span></a></div>')
if 'construction-sketch' not in s:
    s=swap(s,'article',lambda t:'class="construction-row ' in t,lambda b:b.replace('<span lang="en" dir="ltr">FUTURE RESIDENCY SOLUTIONS</span>','<figure class="construction-sketch"><img src="assets/v8/future-residency-sketch.webp" width="1536" height="1024" loading="lazy" alt="اسکچ معماری فیوچر رزیدنسی سولوشنز، با الهام از اپراهاوس عمان" data-en-label="Future Residency Solutions architectural concept inspired by the Muscat Opera House"></figure><span class="construction-company" lang="en" dir="ltr">FUTURE RESIDENCY SOLUTIONS</span>'))
for key,flag in [('uae','ae'),('oman','om'),('usa','us'),('canada','ca'),('tanzania','tz'),('china','cn'),('switzerland','ch')]:
    pattern=r'(<button\b[^>]*data-country="'+key+r'"[^>]*>)(?!<img)([^<]+)(</button>)'
    s=re.sub(pattern,lambda m:m[1]+'<img class="country-flag" src="assets/v8/flags/'+flag+'.svg" width="24" height="16" alt="" aria-hidden="true"><span>'+m[2]+'</span>'+m[3],s)
# Owner clarification: a subsidiary responsible for the full real-estate remit.
real_estate_fa='فیوچر رزیدنسی سولوشنز، یکی از شرکت‌های زیرمجموعهٔ مهربان اینترپرایس است. این شرکت فعالیت‌های مجموعه در حوزهٔ املاک و مستغلات را مدیریت می‌کند؛ از ساخت‌وساز و توسعهٔ پروژه‌های ملکی تا تأمین مصالح ساختمانی.'
real_estate_en='Future Residency Solutions LLC is a subsidiary of Mehraban Enterprises. It manages the group’s real estate activities, from construction and property development to the supply of building materials.'
def real_estate_copy(block):
    block=re.sub(r'(<span class="construction-company"[^>]*>)[^<]+',lambda m:m[1]+'FUTURE RESIDENCY SOLUTIONS LLC',block)
    block=re.sub(r'<h3>[\s\S]*?</h3>','<h3>'+tr('املاک و مستغلات','Real estate')+'</h3>',block,count=1)
    from html import escape
    block=re.sub(r'<p\b[^>]*>[\s\S]*?</p>','<p data-en="'+escape(real_estate_en,quote=True)+'">'+real_estate_fa+'</p>',block,count=1)
    return block
s=swap(s,'article',lambda t:'class="construction-row ' in t,real_estate_copy)
# The owner removed the interactive jar; do not regenerate its runtime or controls.
s=re.sub(r'<figure class="granule-experience"[\s\S]*?</figure>','',s)
s=re.sub(r'\n?<script src="granule-jar\.js"[^>]*></script>','',s)
p.write_text(s)

# The live country copy is centralised here; don't let its locale layer overwrite the correction.
p=D/'expertise-copy.js';s=p.read_text()
old='خلیج رویال مینت (Khalij Royal Mint)، بازوی پالایش و تولید مجموعه در عمان است.'
new='ضربخانهٔ سلطنتی خلیج (Khalij Royal Mint)، بازوی پالایش و تولید مجموعه در عمان است. حق استفاده از این برند در اختیار مجموعهٔ مهربان اینترپرایس است.'
if 'حق استفاده از این برند' not in s:s=s.replace(old,new)
if 'The right to use this brand' not in s:s=s.replace('Khalij Royal Mint is the group’s refining and production operation in Oman.','Khalij Royal Mint is the group’s refining and production operation in Oman. The right to use this brand is held by Mehraban Enterprises.')
p.write_text(s)

# Remove the emoji arrow, including both emoji/text variation selectors, everywhere it was used.
for p in D.iterdir():
    if p.suffix not in ['.html','.js','.json']:continue
    s=p.read_text();s=re.sub(r'<span aria-hidden="true">↗[\ufe0e\ufe0f]?</span>','',s)
    s=re.sub('↗[\ufe0e\ufe0f]?','',s);p.write_text(s)
print('Applied revision 8 shared editorial and structural changes.')
