from pathlib import Path
import json
D=Path(__file__).resolve().parents[1]/'dist'
rows=[('tehran','تهران','Tehran',35.7911174,51.4207593,'۰۲۱'),('isfahan','اصفهان','Isfahan',32.6546,51.6680,'۰۳۱'),('tabriz','تبریز','Tabriz',38.0800,46.2919,'۰۴۱'),('mashhad','مشهد','Mashhad',36.2970,59.6062,'۰۵۱'),('shiraz','شیراز','Shiraz',29.5918,52.5837,'۰۷۱'),('rasht','رشت','Rasht',37.2808,49.5832,'۰۱۳'),('sari','مازندران · ساری','Mazandaran · Sari',36.5633,53.0601,'۰۱۱'),('bushehr','بوشهر','Bushehr',28.9234,50.8203,'۰۷۷')]
out=[]
for i,(key,fa,en,lat,lon,prefix) in enumerate(rows):
 demo=i>0
 out.append(dict(id=key,city={'fa':fa,'en':en},name={'fa':('عاملیت نمونهٔ '+fa) if demo else 'موریاتی · الهیه','en':(en+' sample retailer') if demo else 'Moriyati · Elahiyeh'},address={'fa':('ایران، '+fa+'، خیابان نمونه، ساختمان شمارهٔ '+str(i+1).translate(str.maketrans('0123456789','۰۱۲۳۴۵۶۷۸۹'))) if demo else 'ایران، تهران، الهیه، بوتیک‌مال ملل','en':('Iran, '+en+', Sample Street, Building '+str(i+1).translate(str.maketrans('0123456789','۰۱۲۳۴۵۶۷۸۹'))) if demo else 'Melal Boutique Mall, Elahiyeh, Tehran, Iran'},hours={'fa':'شنبه تا چهارشنبه، ۱۰ تا ۱۸','en':'Saturday–Wednesday, 10:00–18:00'},phone=(prefix+'–XXX XXXX') if demo else '+98 990 45 000 56',tel=None if demo else '+989904500056',lat=lat,lon=lon,sample=demo))
(D/'dealers-data.js').write_text('window.MORIYATI_DEALERS = '+json.dumps(out,ensure_ascii=False,indent=2)+';\n')
