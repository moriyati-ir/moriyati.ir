"""Apply the owner's family heading, country layout and jar removal corrections."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
ORDER = ['oman', 'uae', 'tanzania', 'china', 'switzerland', 'canada', 'usa']

p = DIST / 'expertise-copy.js'
s = p.read_text()
marker = 'window.MORIYATI_INTERNATIONAL_COPY = '
start = s.index(marker)
countries = json.loads(s[start + len(marker):].strip().removesuffix(';'))
replacements = {
    'oman': (
        'ضربخانهٔ سلطنتی خلیج (Khalij Royal Mint)، بازوی پالایش و تولید مجموعه در عمان است.',
        'ضربخانهٔ سلطنتی خلیج (Khalij Royal Mint)، بازوی پالایش و تولید مجموعه در مسقطِ عمان است.',
        'Khalij Royal Mint is the group’s refining and production operation in Oman.',
        'Khalij Royal Mint is the group’s refining and production operation in Muscat, Oman.'),
    'uae': (
        'امارات، دفتر مرکزی و مرکز هماهنگی فعالیت‌های بین‌المللی مهربان اینترپرایس است.',
        'دفتر مرکزی مهربان اینترپرایس در دبی، امارات قرار دارد و مرکز هماهنگی فعالیت‌های بین‌المللی مجموعه است.',
        'The UAE is home to Mehraban Enterprise’s global headquarters and coordinates its international activities.',
        'Mehraban Enterprise’s global headquarters is in Dubai, United Arab Emirates, and coordinates the group’s international activities.'),
    'tanzania': (
        'تانزانیا، یکی از محل‌های فعالیت مجموعه برای تأمین مواد خام است.',
        'دارالسلام در تانزانیا، یکی از پایگاه‌های مجموعه برای تأمین مواد خام است.',
        'Tanzania is one of the group’s bases for raw-material sourcing.',
        'Dar es Salaam, Tanzania, is one of the group’s bases for raw-material sourcing.'),
    'china': (
        'فعالیت مجموعه در چین، تأمین فناوری، تجهیزات و مواد اولیه را در بر می‌گیرد.',
        'فعالیت مجموعه در شنژنِ چین، تأمین فناوری، تجهیزات و مواد اولیه را در بر می‌گیرد.',
        'The group’s activities in China include sourcing technology, equipment and raw materials.',
        'The group’s activities in Shenzhen, China, include sourcing technology, equipment and raw materials.'),
    'switzerland': (
        'سوئیس به مدیریت خزانه و امور بانکی بین‌المللی مهربان اینترپرایس اختصاص دارد.',
        'فعالیت مجموعه در ژنوِ سوئیس، به مدیریت خزانه و امور بانکی بین‌المللی مهربان اینترپرایس اختصاص دارد.',
        'Switzerland is dedicated to Mehraban Enterprise’s treasury management and international banking affairs.',
        'The group’s operations in Geneva, Switzerland, are dedicated to Mehraban Enterprise’s treasury management and international banking affairs.'),
    'canada': (
        'در کانادا، فعالیت مجموعه در حوزهٔ جواهرات و برندهای وابسته به آن دنبال می‌شود.',
        'فعالیت مجموعه در تورنتوی کانادا، در حوزهٔ جواهرات و برندهای وابسته به آن دنبال می‌شود.',
        'In Canada, the group’s work centres on jewellery and its associated brands.',
        'In Toronto, Canada, the group’s work centres on jewellery and its associated brands.'),
    'usa': (
        'فعالیت مجموعه در آمریکا بر جواهرات و توسعهٔ برندهای این حوزه متمرکز است.',
        'فعالیت مجموعه در ایالت دلاورِ آمریکا بر جواهرات و توسعهٔ برندهای این حوزه متمرکز است.',
        'The group’s activities in the United States focus on jewellery and the development of brands in this field.',
        'The group’s activities in Delaware, United States, focus on jewellery and the development of brands in this field.')
}
for key, (old_fa, new_fa, old_en, new_en) in replacements.items():
    countries[key]['fa'] = countries[key]['fa'].replace(old_fa, new_fa)
    countries[key]['en'] = countries[key]['en'].replace(old_en, new_en)
s = s[:start] + marker + json.dumps({k: countries[k] for k in ORDER}, ensure_ascii=False, indent=2) + ';\n'
p.write_text(s)

p = DIST / 'expertise.html'
s = p.read_text()
s = re.sub(r'\n?<script src="granule-jar\.js"[^>]*></script>', '', s)
s = re.sub(r'<figure class="granule-experience"[\s\S]*?</figure>', '', s)
tab_pattern = r'(<div class="country-tabs"[^>]*>)([\s\S]*?)(</div>)'
match = re.search(tab_pattern, s)
tabs = {re.search(r'data-country="([^"]+)"', b)[1]: b for b in re.findall(r'<button\b[\s\S]*?</button>', match[2])}
for key, button in tabs.items():
    button = re.sub(r'aria-selected="[^"]+"', 'aria-selected="' + str(key == ORDER[0]).lower() + '"', button)
    button = re.sub(r' tabindex="-?\d+"', '', button)
    button = button.replace('<button ', '<button tabindex="' + ('0' if key == ORDER[0] else '-1') + '" ', 1)
    # A conventional short country label keeps the English mobile tab legible.
    if key == 'usa':
        button = button.replace('<span>آمریکا</span>', '<span data-en="USA">آمریکا</span>')
    tabs[key] = button
tab_heading = re.sub(r' aria-orientation="[^"]*"', '', match[1])
s = s[:match.start()] + tab_heading.replace('role="tablist"', 'role="tablist" aria-orientation="horizontal"') + ''.join(tabs[k] for k in ORDER) + match[3] + s[match.end():]
panel_pattern = r'(<div class="country-panels">)([\s\S]*?)(</div>)'
match = re.search(panel_pattern, s)
panels = {re.search(r'id="country-([^"]+)"', b)[1]: b for b in re.findall(r'<article\b[\s\S]*?</article>', match[2])}
for key, panel in panels.items():
    panel = re.sub(r'(<p\b[^>]*>)[\s\S]*?(</p>)', lambda m: m[1] + countries[key]['fa'] + m[2], panel, count=1)
    panel = panel.replace('country-panel active', 'country-panel')
    panel = re.sub(r' hidden(?=>)', '', panel)
    if key == ORDER[0]:
        panel = panel.replace('class="country-panel"', 'class="country-panel active"', 1)
    else:
        panel = panel.replace('tabindex="0">', 'tabindex="0" hidden>', 1)
    if key == 'usa':
        panel = panel.replace('<h3>آمریکا و کانادا؛ جواهرات</h3>', '<h3 data-en="United States: jewellery">آمریکا؛ جواهرات</h3>')
    if key == 'canada':
        panel = panel.replace('<h3>آمریکا و کانادا؛ جواهرات</h3>', '<h3 data-en="Canada: jewellery">کانادا؛ جواهرات</h3>')
    panels[key] = panel
s = s[:match.start()] + match[1] + '\n' + '\n'.join(panels[k] for k in ORDER) + '\n' + match[3] + s[match.end():]
s = re.sub(r'(<circle class="map-halo" )cx="[^"]+" cy="[^"]+"', r'\1cx="635" cy="238"', s)
s = re.sub(r'(<span class="atlas-coordinates"[^>]*>)[^<]*', r'\1OMAN · REFINING &amp; PRODUCTION', s)
p.write_text(s)
(DIST / 'granule-jar.js').unlink(missing_ok=True)
print('Applied country order and location copy; removed the interactive jar.')
