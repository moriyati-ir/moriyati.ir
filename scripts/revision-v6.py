"""Static page generation for the approved November 2026 revision.

Run from the repository root. No external services or scheduled jobs are used.
"""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
COPY = json.loads((DIST / 'heritage-copy.json').read_text())

def tr(fa, en, tag='span', attrs=''):
    return f'<{tag} data-en="{html.escape(en, quote=True)}" {attrs}>{fa}</{tag}>'

def icon(kind, cls='contact-icon'):
    paths = {
        'phone': '<path d="M6 3h4l2 5-3 2c2 4 3 5 7 7l2-3 5 2v4c0 2-3 3-5 2C9 20 4 15 2 7 1 5 4 2 6 3Z"/>',
        'mail': '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 6 9 7 9-7"/>',
        'instagram': '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.7" r=".7" fill="currentColor" stroke="none"/>',
        'whatsapp': '<path d="M20 11a8 8 0 0 1-12 7l-5 2 1-5a8 8 0 1 1 16-4ZM8 7c0 4 2 6 6 7l1-2-2-1-1 1-2-2 1-1-1-2Z"/>',
        'telegram': '<path d="m3 10 18-7-4 18-6-6-4 3v-5l10-7-8 9"/>',
        'location': '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
        'arrow': '<path d="M5 12h14m-6-6 6 6-6 6"/>'
    }
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">{paths[kind]}</svg>'

def phone_rows():
    out = '<div class="phone-list">'
    for end in [56, 57, 58, 59]:
        number = f'+98 990 45 000 {end}'
        raw = f'9899045000{end}'
        out += f'<div class="phone-row"><a class="phone-number" href="tel:+{raw}" dir="ltr">{icon("phone")}<span class="contact-number-value">{number}</span></a><div class="phone-socials">'
        for channel, url in [('whatsapp', 'https://wa.me/'), ('telegram', 'https://t.me/+')]:
            label = f'{channel.title()} +{raw}'
            out += f'<a href="{url}{raw}" target="_blank" rel="noopener noreferrer" aria-label="{label}">{icon(channel)}</a>'
        out += '</div></div>'
    return out + '</div>'

def online():
    return '<div class="contact-online"><a href="mailto:info@moriyati.ir">'+icon('mail')+'<span lang="en" dir="ltr">info@moriyati.ir</span></a><a href="https://instagram.com/moriyatimint" target="_blank" rel="noopener noreferrer" aria-label="Instagram moriyatimint">'+icon('instagram')+'<span lang="en" dir="ltr">moriyatimint</span></a></div>'

def contact_block(compact=False):
    address = '<div class="contact-addresses"><article>'+tr('دفتر مرکزی', 'HEAD OFFICE', attrs='class="contact-label"')+tr('تهران، الهیه', 'Elahiyeh, Tehran', 'p', 'class="contact-address-primary"')+tr('بوتیک‌مال ملل', 'Melal Boutique Mall', 'p', 'class="contact-address-secondary"')
    if not compact:
        address += '<a class="contact-location-link" href="#location">'+icon('location')+tr('موقعیت روی نقشه', 'Find us on the map')+'</a>'
    address += '</article>'
    if not compact:
        address += '<article>'+tr('کارخانه', 'FACTORY', attrs='class="contact-label"')+tr('پارک فناوری پردیس', 'Pardis Technology Park', 'p', 'class="contact-address-primary"')+'</article>'
    address += '<div class="contact-hours">'+tr('شنبه تا چهارشنبه، ساعت ۱۰ تا ۱۸', 'Saturday–Wednesday, 10:00–18:00', 'p')+tr('مراجعهٔ حضوری با هماهنگی قبلی', 'Visits by prior appointment', 'p')+'</div></div>'
    side = address + (online() if compact else '')
    out = '<div class="contact-block'+(' compact' if compact else '')+'"><div class="contact-overview">'+phone_rows()+'<div class="contact-summary-meta">'+side+'</div></div>'
    if compact:
        out += '<a class="contact-location-link" href="contact.html">'+icon('location')+tr('اطلاعات کامل و موقعیت', 'Full details & location')+'</a>'
    else:
        out += online()
    return out+'</div>'

NAV = [('index.html#/works','آثار','Creations'),('expertise.html','توانمندی‌ها','Capabilities'),('heritage.html','میراث','Heritage'),('bulletin.html','بولتن','Bulletin')]

def navlinks(active=None):
    return ''.join(f'<a href="{url}"'+(' aria-current="page"' if active == url else '')+'>'+tr(fa,en)+'</a>' for url,fa,en in NAV)

def header(active):
    return '<a class="skip-link" href="#main">'+tr('رفتن به محتوای اصلی','Skip to content')+'</a><header class="masthead"><nav class="nav-primary" aria-label="منوی اصلی" data-en-label="Main navigation">'+navlinks(active)+'</nav><a class="wordmark" href="index.html#home" aria-label="موریاتی، صفحهٔ نخست" data-en-label="Moriyati, home"><span class="wordmark-name" lang="en" dir="ltr">MORIYATI</span><span class="wordmark-caption" lang="en" dir="ltr">MINT &amp; TREASURY</span></a><div class="nav-secondary"><a class="contact-nav" href="contact.html">'+tr('ارتباط با ما','Contact')+'</a><span class="nav-divider" aria-hidden="true"></span><button class="language-button" id="site-language" type="button" aria-label="Switch to English">EN</button></div><button class="menu-button" id="menu-button" aria-label="باز کردن منو" data-en-label="Open menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button></header>'

SIGNATURE = '<div class="footer-wordmark footer-signature" lang="en" dir="ltr"><span>PURE FORM.</span> <span>ETERNAL VALUE.</span></div>'

def footer():
    return '<footer class="pages-footer section-shell"><div class="page-footer-nav">'+navlinks()+'<a href="authenticity.html">'+tr('اصالت‌سنجی','Authenticity')+'</a><a href="contact.html">'+tr('ارتباط با ما','Contact')+'</a></div>'+SIGNATURE+'<div class="site-footer"><span lang="en" dir="ltr">HOUSE OF MORIYATI · TEHRAN</span><button type="button" id="page-motion-toggle" aria-pressed="false"><i class="motion-dot" aria-hidden="true"></i><span id="page-motion-label">'+tr('حرکت: روشن','Motion: on')+'</span></button></div></footer><dialog class="mobile-menu" id="mobile-menu" aria-label="منوی اصلی" data-en-label="Main navigation"><div class="mobile-menu-top"><span lang="en">MORIYATI</span><button type="button" class="icon-close" data-close-menu aria-label="بستن منو" data-en-label="Close menu">×</button></div><nav>'+navlinks()+'<a href="contact.html">'+tr('ارتباط با ما','Contact')+'</a><a href="authenticity.html">'+tr('اصالت‌سنجی','Authenticity')+'</a></nav></dialog>'

def page(name, fa, en, body, script):
    title = html.escape(fa+' | موریاتی')
    out = f'<!doctype html>\n<html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5efe6"><meta name="description" content="{title}"><title>{title}</title><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="preload" href="assets/Vazirmatn.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="assets/NotoNaskhArabic.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="site-pages.css"><link rel="stylesheet" href="refinements.css"><link rel="stylesheet" href="editorial-pages.css"><script src="locale.js" defer></script><script src="site-pages.js" defer></script><script src="{script}" defer></script></head><body class="{name}-page" data-title-fa="{title}" data-title-en="{html.escape(en)} | Moriyati">'+header(name+'.html')+body+footer()+'</body></html>\n'
    (DIST / (name+'.html')).write_text(out)

def paras(section):
    fa = COPY['fa']['intro'] if section == 'intro' else next(s for s in COPY['fa']['sections'] if s['id']==section)['paragraphs']
    en = COPY['en']['intro'] if section == 'intro' else next(s for s in COPY['en']['sections'] if s['id']==section)['paragraphs']
    out = []
    for i,(f,e) in enumerate(zip(fa,en)):
        if section == 'families' and i == 1:
            f = f.replace('حاج حسن پورهنگ نخستین مبدع طلای سرخ در ایران بود؛','<strong>حاج حسن پورهنگ نخستین مبدع طلای سرخ در ایران بود؛</strong>')
            e = e.replace('Haj Hasan Pourhang was the first innovator of red gold in Iran','<strong>Haj Hasan Pourhang was the first innovator of red gold in Iran</strong>')
        out.append(tr(f,e,'p',f'data-approved-paragraph="{section}-{i}"'))
    return ''.join(out)

def section_title(key):
    f = next(s for s in COPY['fa']['sections'] if s['id']==key)['title']
    e = next(s for s in COPY['en']['sections'] if s['id']==key)['title']
    return tr(f,e,'h2')

MARKS = {
 'jewel':'<path d="m32 5 13 17-13 31-13-31Z M19 22h26M26 12l6 10 6-10M32 22v31"/><path d="M17 18 9 23l9 10M47 18l8 5-9 10"/>',
 'antique':'<path d="M24 8h16M27 8v12c0 7-12 7-12 18 0 9 8 15 17 15s17-6 17-15c0-11-12-11-12-18V8M19 32h26M22 48h20M26 55h12"/><path d="M17 26c-13-7-13 9 1 11M47 26c13-7 13 9-1 11"/>',
 'bracelet':'<ellipse cx="32" cy="32" rx="23" ry="15" transform="rotate(-25 32 32)"/><ellipse cx="32" cy="32" rx="18" ry="10" transform="rotate(-25 32 32)"/><path d="m15 31 5 6m2-14 5 7m4-12 4 8m5-9 3 6"/>',
 'redgold':'<path d="m14 17 30-7 8 34-30 8Z M14 17l8 35M44 10l-2 33-20 9"/><path d="m22 22 15-3m-13 9 12-3m-10 9 10-2"/>',
 'gold':'<path d="m13 18 34-6 5 34-34 7Z M13 18l5 35M47 12l-3 32-26 9"/><path d="M24 25h13m-11 7h10m-8 7h7"/>',
 'bangle':'<ellipse cx="28" cy="32" rx="17" ry="23" transform="rotate(24 28 32)"/><ellipse cx="35" cy="31" rx="17" ry="23" transform="rotate(24 35 31)"/><path d="m21 12 7 1m-15 8 6 1m-7 10 6 1m-5 10 6 1m5 8 7 1"/>',
 'house':'<path d="m10 29 22-17 22 17M16 25v28h32V25M27 53V36h10v17"/><path d="M24 12h16M22 7h20"/>',
 'bar':'<rect x="17" y="6" width="30" height="51" rx="4"/><rect x="21" y="10" width="22" height="43" rx="2"/><path d="m26 24 6-10 6 10-6 7Z M27 37h10m-10 6h10"/>',
 'art':'<path d="M12 52 47 9l6 5-34 43-9 2Z M43 14l6 5M12 52l7 5"/><path d="M8 17c4-8 12-5 13 1s8 8 11 1M27 49c10-12 15 7 27-1"/>'
}

def mark(kind):
    return '<svg class="lineage-mark" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+MARKS[kind]+'</svg>'

def person(key, fa, en, role_fa, role_en, kind):
    return '<div class="lineage-person" data-person="'+key+'"><span class="lineage-anchor" aria-hidden="true"></span>'+mark(kind)+tr(fa,en,'h3')+tr(role_fa,role_en,'span','class="lineage-role"')+'</div>'

def build_heritage():
    fa,en=COPY['fa'],COPY['en']
    body='<main class="pages-main heritage-editorial" id="main"><section class="heritage-entry section-shell"><div class="section-kicker"><span class="eyebrow">'+tr('میراث موریاتی','MORIYATI HERITAGE')+'</span><span class="small-english" lang="en">ROOTS &amp; CONTINUITY</span></div><div class="heritage-entry-heading">'+tr(fa['title'],en['title'],'h1')+tr(fa['subtitle'],en['subtitle'],'p','class="heritage-subtitle"')+'</div><figure class="heritage-city-portrait" aria-label="اصفهان در روزگار قاجار" data-en-label="A painterly view of Qajar-era Isfahan"><img src="assets/motion/isfahan-qajar-panorama.webp" width="2172" height="724" alt="برداشت نقاشانه از اصفهان در روزگار قاجار" data-en-label="A painterly interpretation of Qajar-era Isfahan"></figure><div class="approved-prose heritage-introduction">'+paras('intro')+'</div><a class="heritage-follow" href="#families">'+tr('دو خاندان، یک میراث','Two families, one heritage')+'<span aria-hidden="true">↓</span></a></section>'
    body+='<section id="families" class="heritage-families section-shell"><div class="heritage-section-heading"><span class="small-english" lang="en">THE FAMILY LINE</span>'+section_title('families')+'</div><div class="genealogy" role="group" aria-label="دو شاخهٔ خاندان سوزنی و پورهنگ و خانوادهٔ مهربان" data-en-label="The Suzani and Pourhang family branches and the Mehraban family"><svg class="genealogy-lines" aria-hidden="true"><g class="genealogy-lines-group"></g></svg><div class="family-columns"><div class="family-column" data-branch="suzani">'+tr('خاندان سوزنی','THE SUZANI FAMILY','h3','class="family-name"')+person('aziz','عزیزالله سوزنی','Azizollah Suzani','جواهرات سلطنتی','Royal jewellery','jewel')+person('hossein','حاج حسین سوزنی','Haj Hossein Suzani','آثار عتیقه','Antiques','antique')+person('reza','حاج رضا سوزنی','Haj Reza Suzani','دستبند','Bracelets','bracelet')+'</div><div class="family-column" data-branch="pourhang">'+tr('خاندان پورهنگ','THE POURHANG FAMILY','h3','class="family-name"')+person('hasan','حاج حسن پورهنگ','Haj Hasan Pourhang','طلای سرخ','Red gold','redgold')+person('javad','حاج جواد پورهنگ','Haj Javad Pourhang','طلاسازی','Goldsmithing','gold')+'</div></div><div class="parents-row">'+person('mohammad','محمدحسین مهربان','Mohammadhosein Mehraban','النگوسازی','Bangle making','bangle')+person('elahe','الهه پورهنگ','Elahe Pourhang','عضو هیئت‌مدیره','Board member','house')+'</div><div class="next-generation">'+person('alireza','علیرضا مهربان','Alireza Mehraban','مدیرعامل · شمش','Chief executive · Bullion','bar')+person('ala','آلا مهربان','Ala Mehraban','مدیر هنری خانهٔ موریاتی','Artistic Director of the House','art')+'</div></div><div class="approved-prose family-narrative">'+paras('families')+'</div></section>'
    body+='<section class="heritage-making section-shell" id="making"><div class="heritage-section-heading"><span class="small-english" lang="en">THE EVOLUTION OF EXPERTISE</span>'+section_title('making')+'</div><div class="heritage-milestones">'
    making_fa=fa['sections'][1]['paragraphs'];making_en=en['sections'][1]['paragraphs']
    for i,(f,e) in enumerate(zip(making_fa,making_en)):
        date_fa=['تا ۱۳۸۵','۱۳۸۵ — ۱۳۹۰','از ۱۳۹۰'][i];date_en=['Until 1385','1385 — 1390','From 1390'][i]
        body+='<article class="heritage-milestone"><span class="milestone-dot" aria-hidden="true"></span><div class="milestone-year">'+tr(date_fa,date_en)+'</div><div class="milestone-mark">'+mark(['bangle','jewel','gold'][i])+'</div><div class="approved-prose">'+tr(f,e,'p',f'data-approved-paragraph="making-{i}"')+'</div></article>'
    body+='</div></section><section class="heritage-today section-shell" id="today"><div class="heritage-section-heading"><span class="small-english" lang="en">THE PRESENT GENERATION</span>'+section_title('today')+'</div><div class="today-composition"><div class="approved-prose">'+paras('today')+'</div><div class="today-bullion" aria-hidden="true">'+mark('bar')+'<span lang="en">Au · Ag</span><span class="today-year">'+tr('۱۳۹۷','1397')+'</span></div></div></section>'
    body+='<section class="heritage-art section-shell" id="art"><div class="heritage-section-heading"><span class="small-english" lang="en">THE ARTISTIC DIRECTION</span>'+section_title('art')+'</div><div class="heritage-art-layout"><figure class="art-reveal"><img src="assets/collections/artwork/painting-frame-macro.webp" width="1536" height="1024" alt="نقاشی اسب، قاب هنری و شمش مجموعهٔ آرت‌ورک موریاتی" data-en-label="Painting, artistic frame and gold bar from Moriyati’s Artwork collection" loading="lazy"><svg viewBox="0 0 600 400" fill="none" stroke="currentColor" stroke-width=".8" aria-hidden="true"><path class="art-gesture" d="M35 315C90 280 84 235 137 221S201 208 208 152 254 117 295 95 349 130 386 98 427 41 470 48 534 84 566 64"/><path class="art-gesture" d="M19 358c60-4 72-42 113-39s62-6 92-45 84-15 113-46 56-23 91-65 76-44 153-46"/><path class="art-gesture" d="M37 372C118 371 145 353 207 331s97-67 146-68 97-30 209-25"/></svg></figure><div class="approved-prose art-narrative">'+paras('art')+'</div></div></section><div class="heritage-next section-shell"><a class="text-link" href="index.html#/works">'+tr('مشاهدهٔ آثار','Explore the creations')+icon('arrow')+'</a><a class="text-link" href="contact.html">'+tr('ارتباط با ما','Contact the House')+icon('mail')+'</a></div></main>'
    page('heritage',fa['title'],en['title'],body,'heritage.js')

def build_bulletin():
    body='<main class="pages-main bulletin-editorial" id="main"><section class="bulletin-masthead section-shell"><div class="section-kicker"><span class="eyebrow">'+tr('یادداشت‌های بازار','MARKET DISPATCHES')+'</span><span class="small-english" lang="en">THE MORIYATI BULLETIN</span></div><div class="bulletin-title-row">'+tr('بولتن موریاتی','The Moriyati Bulletin','h1')+tr('نسخهٔ نمایشی','DESIGN PREVIEW','span','class="bulletin-preview-label"')+'</div>'+tr('نگاهی به بازار جهانی و بازار ایران؛ طلا، نقره، بورس و ارز.','A view of global and Iranian markets: gold, silver, equities and currencies.','p','class="bulletin-deck"')+'<div class="bulletin-edition-bar"><div class="bulletin-editions" role="group" aria-label="نوبت بولتن" data-en-label="Bulletin edition"><button type="button" data-edition="morning" aria-pressed="true">'+tr('نوبت صبح','Morning edition')+'<span dir="ltr">11:00</span></button><button type="button" data-edition="evening" aria-pressed="false">'+tr('نوبت شب','Evening edition')+'<span dir="ltr">23:00</span></button></div><span class="bulletin-timezone">'+tr('به وقت تهران','Tehran time')+'</span></div><div class="bulletin-preview-note">'+tr('این شماره برای نمایش قالب بولتن است و حاوی خبر یا نرخ زنده نیست.','This is a preview of the bulletin format; it contains no live news or market prices.','p')+'</div></section><section class="bulletin-lead section-shell"><div class="bulletin-lead-art" aria-hidden="true"><svg viewBox="0 0 700 430" fill="none"><g stroke="currentColor" stroke-width=".8"><path d="M45 344h610M90 290h525M140 236h425M195 182h315M240 128h225" opacity=".25"/><path d="M54 318C129 352 118 270 185 286S268 207 320 227s80-95 139-63 93-61 187-96"/><path d="M55 340C126 310 147 343 211 299s101 28 164-62 91 19 132-49 77-30 139-95" opacity=".45"/><rect x="262" y="129" width="98" height="160" rx="10" transform="rotate(-10 262 129)"/><rect x="277" y="139" width="68" height="134" rx="4" transform="rotate(-10 277 139)"/><circle cx="407" cy="259" r="62"/><circle cx="407" cy="259" r="51"/><path d="M395 233v52m24-45c-30-25-52 8-16 17s11 35-16 13"/><path d="m304 174 14 20-14 25-13-25Z"/></g><text x="77" y="96" fill="currentColor" font-family="Georgia,serif" font-size="14" letter-spacing="8">Au · Ag</text></svg></div><article><span class="eyebrow" id="bulletin-edition-label">'+tr('نوبت صبح · شمارهٔ نمونه','Morning edition · Sample issue')+'</span><h2 id="bulletin-lead-title">'+tr('پیش از آغاز روز بازار','Before the trading day')+'</h2><p id="bulletin-lead-summary">'+tr('مرور موضوعات اثرگذار بر فلزات گران‌بها، در کنار تصویری مستقل از بازار ایران.','A review of the themes affecting precious metals, alongside an independent view of Iranian markets.')+'</p><nav class="bulletin-section-links" aria-label="بخش‌های بولتن" data-en-label="Bulletin sections"><a href="#global">'+tr('بازار جهانی','Global markets')+'<span aria-hidden="true">↓</span></a><a href="#iran">'+tr('بازار ایران','Iranian markets')+'<span aria-hidden="true">↓</span></a></nav></article></section><section class="bulletin-section section-shell" id="global"><div class="bulletin-section-head"><span class="bulletin-section-number" lang="en">01</span>'+tr('بازار جهانی','Global markets','h2')+'<span class="small-english" lang="en">GLOBAL MARKETS</span></div><div class="bulletin-story-grid"><article class="bulletin-story lead-story"><span class="eyebrow">'+tr('فلزات گران‌بها','PRECIOUS METALS')+'</span>'+tr('طلا و نقره در قاب اقتصاد جهانی','Gold and silver in the global economy','h3')+tr('مرور مسیر فلزات گران‌بها در کنار سیاست پولی، ارزش دلار و داده‌های مهم اقتصادی.','Precious metals considered alongside monetary policy, the US dollar and significant economic data.','p')+'</article><article class="bulletin-story"><span class="eyebrow">'+tr('اقتصاد و سیاست پولی','ECONOMY & MONETARY POLICY')+'</span>'+tr('آنچه بازارها دنبال می‌کنند','What markets are watching','h3')+tr('در قالب نهایی، رویدادهای مهم و منابع هر خبر در این بخش قرار می‌گیرند.','In a published edition, this section will carry significant developments and the sources for each report.','p')+'</article><article class="bulletin-story"><span class="eyebrow">'+tr('تقویم بازار','MARKET CALENDAR')+'</span>'+tr('رویدادهای پیش رو','The events ahead','h3')+tr('جایگاه مرور داده‌ها و رویدادهای اقتصادی پیش رو، با زمان انتشار و ارجاع به منبع.','A place for forthcoming economic releases and events, with publication times and source references.','p')+'</article></div></section><section class="bulletin-section section-shell" id="iran"><div class="bulletin-section-head"><span class="bulletin-section-number" lang="en">02</span>'+tr('بازار ایران','Iranian markets','h2')+'<span class="small-english" lang="en">IRAN · GOLD · SILVER · EQUITIES · FX</span></div><div class="iran-market-topics"><span>'+tr('طلا','Gold')+'</span><span>'+tr('نقره','Silver')+'</span><span>'+tr('بورس','Equities')+'</span><span>'+tr('ارز','Currencies')+'</span></div><div class="bulletin-story-grid"><article class="bulletin-story lead-story"><span class="eyebrow">'+tr('در بازار داخلی','THE DOMESTIC MARKET')+'</span>'+tr('بازار ایران، در یک نگاه','Iranian markets at a glance','h3')+tr('مرور مستقل تحولات طلا، نقره، بورس و ارز؛ با تفکیک زمان و منبع داده‌ها در هر شماره.','An independent review of gold, silver, equities and currencies, with data times and sources identified in each issue.','p')+'</article><article class="bulletin-story"><span class="eyebrow">'+tr('گزارش بازار','MARKET REPORT')+'</span>'+tr('جزئیات هر نوبت','Inside each edition','h3')+tr('شماره‌های صبح و شب در این قسمت، گزارش و یادداشت‌های مربوط به همان نوبت را نمایش خواهند داد.','The morning and evening editions will present the reports and notes for their respective publication windows.','p')+'</article></div></section><section class="bulletin-archive section-shell"><div>'+tr('آرشیو بولتن','The bulletin archive','h2')+tr('آرشیو پس از انتشار نخستین شماره شکل می‌گیرد.','The archive will begin with the first published issue.','p')+'</div><span class="archive-monogram" lang="en" aria-hidden="true">M</span></section></main>'
    page('bulletin','بولتن موریاتی','The Moriyati Bulletin',body,'bulletin.js')

def patch_existing():
    for name in ['index','expertise','contact','authenticity']:
        path=DIST/(name+'.html');s=path.read_text()
        if 'refinements.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="refinements.css">\n</head>')
        s=s.replace('href="index.html#heritage"','href="heritage.html"')
        # The homepage teaser remains a section; the main menu opens the dedicated page.
        if name=='index':
            s=s.replace('<a href="#heritage" data-i18n="heritage">','<a href="heritage.html" data-i18n="heritage">')
            s=re.sub(r'<div class="heritage-stat">.*?</div>','',s)
            s=re.sub(r'<div class="reduced-heritage-stat">.*?</div>','',s)
            s=s.replace('<div class="contact-main reveal"><h2', '<div class="contact-main reveal"><h2',1)
            marker='<div class="contact-links reveal">'
            if 'contact-block compact' not in s:s=s.replace(marker,contact_block(True)+marker)
            s=s.replace('<a class="text-link" href="#contact"><span data-i18n="contact">ارتباط با ما</span>','<a class="text-link" href="heritage.html"><span data-i18n="readHeritage">روایت کامل میراث</span>')
        # Add Bulletin to desktop and mobile navigation, before the menu's closing nav.
        def add_bulletin(m):
            nav=m.group(0)
            if 'class="chapter-nav"' in nav:
                return re.sub(r'<a href="bulletin\.html">.*?</a>','',nav)
            if 'bulletin.html' in nav:return nav
            label='<span data-en="Bulletin">بولتن</span>' if name!='index' else '<span data-i18n="bulletin">بولتن</span>'
            return nav.replace('</nav>','<a href="bulletin.html">'+label+'</a></nav>')
        s=re.sub(r'<nav\b[^>]*>[\s\S]*?</nav>',add_bulletin,s)
        s=re.sub(r'<div class="page-footer-nav">[\s\S]*?</div>',lambda m:m.group(0) if 'bulletin.html' in m.group(0) else m.group(0).replace('</div>','<a href="bulletin.html">'+tr('بولتن','Bulletin')+'</a></div>'),s)
        s=re.sub(r'<div class="footer-wordmark"[^>]*>MORIYATI</div>',SIGNATURE,s)
        if name=='contact':
            start=s.index('<section class="contact-details')
            end=s.index('<section class="contact-location',start)
            s=s[:start]+'<section class="contact-details section-shell" id="contact-details"><div class="section-kicker"><span class="eyebrow">'+tr('۰۱ / در ارتباط','01 / IN TOUCH')+'</span><span class="small-english" lang="en">THE HOUSE, AT YOUR SERVICE</span></div><div class="contact-lines"><h2>'+tr('با موریاتی در ارتباط باشید','Reach Moriyati')+'</h2><p class="phone-channel-note">'+tr('تلفن · واتس‌اپ · تلگرام','Telephone · WhatsApp · Telegram')+'</p></div>'+contact_block(False)+'</section>'+s[end:]
        if name=='expertise':
            old='<div class="paste-orbit"></div>'
            s=s.replace(old,'<img class="silver-paste-render" src="assets/motion/v6/silver-paste.webp" width="1254" height="1254" alt="" loading="lazy">')
            begin=s.index('<article class="construction-row')
            finish=s.index('</article>',begin)+len('</article>')
            text_fa='فیوچر رزیدنسی سولوشنز، بازوی ساختمان و توسعهٔ مهربان اینترپرایز است؛ بنیانی که طرح‌های مجموعه بر آن قامت می‌گیرند. از فضاهای کاری تا زیرساخت‌های تولید، بستر استقرار و گسترش مجموعه را می‌سازد تا هر افق تازه، بر پایه‌ای استوار شکل بگیرد.'
            text_en='Future Residency Solutions is the construction and development arm of Mehraban Enterprises: the foundation on which the group’s plans take shape. From workspaces to production infrastructure, it builds the setting for the group’s establishment and growth, giving each new horizon a firm foundation.'
            s=s[:begin]+'<article class="construction-row reveal"><span lang="en" dir="ltr">FUTURE RESIDENCY SOLUTIONS</span><div><h3>'+tr('ساختمان و توسعهٔ پروژه','Construction & project development')+'</h3>'+tr(text_fa,text_en,'p')+'</div></article>'+s[finish:]
            s=s.replace('<span aria-hidden="true">←</span></a></div><a class="auth-footer-link"',icon('arrow')+'</a></div><a class="auth-footer-link"')
        path.write_text(s)

if __name__=='__main__':
    build_heritage();build_bulletin();patch_existing()
    print('Generated heritage/bulletin and applied the approved shared content revision.')
