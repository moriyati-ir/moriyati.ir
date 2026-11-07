"""Prepare dated reports from the emailed structure; no scheduled publication."""
from pathlib import Path
from html.parser import HTMLParser
import json
R=Path(__file__).resolve().parents[1];D=R/'dist'
j=json.loads((R/'content/newsletter-2026-11-05.json').read_text())
class Blocks(HTMLParser):
    def __init__(self):super().__init__();self.tag=None;self.buf=[];self.items=[]
    def handle_starttag(self,tag,attrs):
        if tag in ['h2','h3','p'] and self.tag is None:self.tag=tag;self.buf=[]
    def handle_data(self,data):
        if self.tag:self.buf.append(data)
    def handle_endtag(self,tag):
        if tag==self.tag:self.items.append((tag,''.join(self.buf).strip()));self.tag=None
def email_sections(edition):
    p=Blocks();p.feed((R/'reference-assets/newsletter'/f'2026-11-05-{edition}-email.html').read_text())
    sections={};key=None;global_=False
    for tag,text in p.items:
        if tag=='h2':global_=text=='بازار جهانی';key=None
        elif global_ and tag=='h3':key=text;sections[key]=[]
        elif global_ and tag=='p' and key:sections[key].append(text)
    return sections
views={
 'morning':['Linh Tran of XS described holding above $4,000 as important for gold and said continued inflows and lower yields could open a path towards $4,200 and then $4,400. Citi retained a zero-to-three-month target of $4,500 in the same report. These were attributed scenarios at the time, rather than a consensus or a guarantee.'],
 'evening':['David Meger, director of metals trading at High Ridge Futures, said softer energy prices could ease inflation concerns and the need for rate increases. Independent metals trader Tai Wong pointed to the opposing risk: stronger-than-expected employment could put pressure on gold and reinforce expectations of higher interest rates.']}
analysis={
 'morning':['The contemporaneous gold/silver ratio was 77.84. In the original five-session assessment, gold had a volatile upward bias with medium confidence. Holding above $4,000, a softer dollar and lower yields were supportive. The high probability of a rate increase and a strong employment report were opposing evidence. A recovery in yields or sustained prices below $4,000 would neutralise that view.','The original silver assessment was a volatile upward bias with low confidence. Its short-term connection with gold was visible, but fresh industrial evidence for independent strength was absent. Holding above $52 together with improving industrial indicators would strengthen the view; a firmer dollar or weaker activity would weaken it. The editorial stance was to wait for confirmation after payrolls, rather than issue a trading signal.'],
 'evening':['The contemporaneous gold/silver ratio rose to 78.50, showing silver underperforming during the retreat. The original five-session gold assessment remained a volatile upward bias, with medium-to-low confidence. A softer dollar and lower yields supported it; the reversal from the daily high and sensitivity to payrolls were opposing evidence. A sustained move below $4,000 or a recovery in yields would neutralise the view.','The original silver outlook was uncertain and volatile, with low confidence. Silver was not fully matching gold, and there was no fresh industrial evidence for independent strength. Holding above $52 alongside stronger industrial data would strengthen the case; a firmer dollar or loss of that level would weaken it. The editorial preference was to wait for the employment release, not to provide a trading signal.']}
morning=j['editions'][0]
for e in j['editions']:
    kind=e['edition'];day=kind=='morning';rid='reuters-morning' if day else 'reuters-evening'
    e['cover']='assets/v8/newsletter-'+('morning' if day else 'evening')+'.webp'
    e['coverAlt']={'fa':'مطالعه‌ای از طلا و نقره در نور '+('صبح' if day else 'شب'),'en':'Gold and silver in '+('morning' if day else 'evening')+' light'}
    e['globalSnapshot']=[{'symbol':symbol,'value':value,'label':{'fa':fa,'en':en},'unit':{'fa':'دلار / اونس تروا','en':'USD / troy ounce'},'change':change,'observedAt':'06:46' if day else '22:35','sourceId':rid} for symbol,value,fa,en,change in [('Au',4134.83 if day else 4100.27,'طلای نقدی','Spot gold',1.9 if day else 1.0),('Ag',53.12 if day else 52.23,'نقرهٔ نقدی','Spot silver',1.7 if day else 0)]]
    e['ratio']=77.84 if day else 78.50
    e['comparison']={'morning':{'gold':4134.83,'silver':53.12,'time':'06:46'},'evening':{'gold':4100.27,'silver':52.23,'time':'22:35'},'date':'2026-11-05'}
    rows=[('دلار آزاد تهران','Tehran free-market USD','۲۶۷٬۷۰۰','267,700','تومان / فروش','toman / sell','۱۱:۰۱','11:01','bonbast'),('حوالهٔ رسمی دلار','Official USD remittance','۱۸۸٬۶۶۸','188,668','تومان / فروش','toman / sell','آخرین ثبت: ۱۳ آبان','Last observation: 4 November','exchange'),('طلای ۱۸ عیار','18-karat gold','۲۶٬۰۹۷٬۶۹۶','26,097,696','تومان / گرم','toman / gram','۱۱:۰۱','11:01','bonbast'),('نقرهٔ ۹۹۹','999 silver','۴۷۸٬۴۲۰','478,420','تومان / گرم','toman / gram','۱۰:۵۰','10:50','tgju'),('آب‌شدهٔ نقدی','Melted gold, cash','۱۱۳٬۰۵۰٬۰۰۰','113,050,000','تومان / مثقال','toman / mithqal','۱۱:۰۱','11:01','bonbast'),('بورس تهران','Tehran equities','جلسهٔ تازه نداشت','No new session','آخرین جلسه: ۱۳ آبان','Last session: 4 November','روز غیرمعاملاتی','Non-trading day','iran-equities')]
    e['iranSnapshot']=[{'label':{'fa':a,'en':b},'value':{'fa':c,'en':d},'unit':{'fa':u,'en':v},'observedAt':{'fa':f,'en':g},'sourceId':source} for a,b,c,d,u,v,f,g,source in rows]
    e['iranSnapshotNote']={'fa':('ثبت صبح ۱۴ آبان ۱۴۰۵؛ زمان مشاهدهٔ هر نرخ در جدول آمده است.' if day else 'آخرین ثبتِ در دسترس از شمارهٔ صبح ۱۴ آبان؛ این نرخ‌ها قیمت ساعت ۲۳ نیستند.'),'en':('Morning observations from 5 November 2026; each row retains its observation time.' if day else 'Latest available observations from the 5 November morning issue; these are not 23:00 quotations.')}
    needed=[s for s in morning['sources'] if s['id'] in ['bonbast','tgju']]+[{'id':'exchange','title':'Tasnim — official USD remittance, 13 Aban 1405','url':'https://www.tasnimnews.ir/fa/news/1405/08/13/3739900/','publishedDate':'2026-11-04','note':'Rate preserved from the owner’s original morning email; observation predates this issue.'}]
    for source in needed:
        if not any(s['id']==source['id'] for s in e['sources']):e['sources'].append(source)
    sections=email_sections('morning' if day else 'evening')
    if not any(st['heading']=='نظر منابع معتبر جهانی' for st in e['fa']['global']):
        for lang in ['fa','en']:e[lang]['global']=[s for s in e[lang]['global'] if s.get('type')!='editorial']
        e['fa']['global'] += [{'heading':'نظر منابع معتبر جهانی','paragraphs':sections.get('نظر منابع معتبر جهانی',[]),'sourceIds':[rid]},{'heading':'برداشت تیم تحلیل موریاتی','paragraphs':sections.get('برداشت تیم تحلیل موریاتی',[]),'sourceIds':[],'type':'editorial'}]
        e['en']['global'] += [{'heading':'Views from global sources','paragraphs':views[kind],'sourceIds':[rid]},{'heading':'Moriyati’s analytical assessment','paragraphs':analysis[kind],'sourceIds':[],'type':'editorial'}]
    e['outlook']={'fa':{'gold':'رشد نوسانی','silver':'رشد نوسانی' if day else 'نامشخص و نوسانی','confidenceGold':'اطمینان متوسط' if day else 'اطمینان متوسط‌روبه‌پایین','confidenceSilver':'اطمینان پایین'},'en':{'gold':'Volatile upward bias','silver':'Volatile upward bias' if day else 'Uncertain and volatile','confidenceGold':'Medium confidence' if day else 'Medium-to-low confidence','confidenceSilver':'Low confidence'}}
(R/'content/newsletter-2026-11-05.json').write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
(D/'newsletter-data.js').write_text('window.MORIYATI_NEWSLETTER = '+json.dumps(j,ensure_ascii=False)+';\n')
print('Prepared both archive issues, covers, price tables and emailed editorial sections.')
