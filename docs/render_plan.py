"""Render planning documents and native vector C4 diagrams; no app implementation."""
from pathlib import Path
import re
import math
from html import escape

from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    KeepTogether, Flowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.utils import simpleSplit

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/presence-hackathon-plan.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
INK = colors.HexColor('#182C36')
ACCENT = colors.HexColor('#087C77')
PALE = colors.HexColor('#EDF5F4')
MUTED = colors.HexColor('#53646D')
LINE = colors.HexColor('#C8D3D6')
W, H = 595.276, 841.89

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyPlan', fontName='Helvetica', fontSize=9.6,
    leading=13.2, textColor=INK, spaceAfter=6, allowWidows=0, allowOrphans=0))
styles.add(ParagraphStyle(name='SectionPlan', fontName='Helvetica-Bold', fontSize=20,
    leading=25, textColor=INK, spaceAfter=17, keepWithNext=True))
styles.add(ParagraphStyle(name='SubPlan', fontName='Helvetica-Bold', fontSize=11.5,
    leading=15.5, textColor=ACCENT, spaceBefore=10, spaceAfter=7, keepWithNext=True))
styles.add(ParagraphStyle(name='BulletPlan', parent=styles['BodyPlan'],
    leftIndent=11, firstLineIndent=-8, spaceAfter=6))
styles.add(ParagraphStyle(name='SmallPlan', parent=styles['BodyPlan'], fontSize=8.8,
    leading=12, textColor=MUTED, spaceAfter=7))
styles.add(ParagraphStyle(name='CoverTitle', fontName='Helvetica-Bold', fontSize=35,
    leading=39, textColor=INK, spaceAfter=20))
styles.add(ParagraphStyle(name='CoverLead', fontName='Helvetica', fontSize=17,
    leading=24, textColor=ACCENT, spaceAfter=16))

def ascii_text(s):
    return s.replace('\u2013', '-').replace('\u2014', ' - ').replace('\u2011','-').replace('\u2019', "'").replace('\u201c','"').replace('\u201d','"').replace('\u00a0',' ')

def rich(s):
    s = escape(ascii_text(s))
    s = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', lambda m: '<link href="'+m[2]+'" color="#087C77">'+m[1]+'</link>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'`([^`]+)`', r'<font name="Courier" size="8.4">\1</font>', s)
    return s

class C4Diagram(Flowable):
    def __init__(self, level):
        Flowable.__init__(self)
        self.level=level
        self.width=499
        self.height=475

    def draw(self):
        c=self.canv
        c.setLineWidth(.8)
        nodes={}
        def box(key,x,y,w,h,title,kind,desc='',primary=False):
            nodes[key]=(x,y,w,h)
            c.setFillColor(ACCENT if primary else PALE)
            c.setStrokeColor(ACCENT if primary else LINE)
            c.roundRect(x,y,w,h,5,fill=1,stroke=1)
            color=colors.white if primary else INK
            yy=y+h-15
            for text,font,size in [(title,'Helvetica-Bold',9.2),(kind,'Helvetica',7.7),(desc,'Helvetica',8.2)]:
                if not text: continue
                for ln in simpleSplit(text,font,size,w-15):
                    c.setFillColor(color);c.setFont(font,size)
                    c.drawCentredString(x+w/2,yy,ln); yy-=11
                yy-=3
        def boundary(x,y,w,h,label):
            c.setDash(4,3);c.setStrokeColor(MUTED);c.setFillColor(colors.white)
            c.roundRect(x,y,w,h,6,fill=0,stroke=1);c.setDash()
            c.setFont('Helvetica-Bold',8.5);c.setFillColor(MUTED)
            c.drawString(x+10,y+h-14,label)
        def port(key,p):
            x,y,w,h=nodes[key]
            return {'l':(x,y+h/2),'r':(x+w,y+h/2),'t':(x+w/2,y+h),'b':(x+w/2,y)}[p]
        def arrow(a,ap,b,bp,n,dashed=False,via=None):
            p=port(a,ap);q=port(b,bp)
            pts=[p]+(via or [])+[q]
            c.setStrokeColor(MUTED);c.setLineWidth(.85)
            if dashed:c.setDash(4,3)
            for s,t in zip(pts,pts[1:]):c.line(*s,*t)
            c.setDash()
            s=pts[-2]; angle=math.atan2(q[1]-s[1],q[0]-s[0])
            path=c.beginPath();path.moveTo(*q)
            for aa in [angle+2.65,angle-2.65]:path.lineTo(q[0]+6*math.cos(aa),q[1]+6*math.sin(aa))
            path.close();c.setFillColor(MUTED);c.drawPath(path,fill=1,stroke=0)
            s,t=pts[len(pts)//2-1:len(pts)//2+1]
            xx=(s[0]+t[0])/2; yy=(s[1]+t[1])/2
            c.setFillColor(colors.white);c.circle(xx,yy,8,fill=1,stroke=0)
            c.setFillColor(ACCENT);c.setFont('Helvetica-Bold',8);c.drawCentredString(xx,yy-2.7,str(n))
        if self.level==1:
            box('owner',5,370,146,70,'Hotel owner / staff','Person','Reviews facts and offers')
            box('guest',348,397,146,60,'Traveller','Person','Sets needs and approves')
            box('buyer',348,298,146,72,'Personal agent','External software system','Compares and requests')
            box('p',176,240,146,89,'Presence','Software system in scope','Publish, transact, reconnect',True)
            box('site',5,230,140,75,'Merchant website','External software system','First-party source content')
            box('mail',348,150,146,75,'Resend + inbox','External software system','Owner email round trip')
            box('models',5,65,146,83,'Model services / Codex','External software systems','Gateway inference and onboarding')
            box('ops',260,35,194,83,'PMS / POS / CRM / ERP','Future external software systems','Operational truth and outcomes')
            arrow('owner','b','p','t',1,via=[(78,348),(249,348)])
            arrow('guest','b','buyer','t',2)
            arrow('buyer','l','p','r',3,via=[(334,334),(334,285)])
            arrow('site','r','p','l',4)
            arrow('p','b','mail','l',5,via=[(249,188)])
            arrow('p','b','models','t',6,via=[(190,185),(78,185)])
            arrow('p','b','ops','t',7,dashed=True,via=[(249,135),(357,135)])
        elif self.level==2:
            box('browser',5,392,147,65,'Owner / demo browser','Browser container','Approval and trace UI')
            box('buyer',176,392,147,65,'Buyer-agent platform','External software system','Independent client')
            box('mail',347,392,147,65,'Resend','External software system','Send + received webhooks')
            boundary(0,137,499,225,'Presence - one shared Next.js / TypeScript repository')
            box('web',20,243,207,85,'Web and API','Next.js / Node container','Owner UI, human pages, REST/MCP, webhooks',True)
            box('worker',272,243,207,85,'Durable worker','TypeScript container','Workflow steps, onboarding, outbox and evaluations',True)
            box('db',139,150,220,64,'PostgreSQL','Database container','Tenant state, offers, reservations, events and traces')
            box('host',6,22,223,83,'Host-side Codex harness','Trusted integration process','Native subscription stays on host')
            box('ai',272,22,223,83,'AI Gateway / models','External software systems','Buyer reasoning and model comparisons')
            arrow('browser','b','web','t',1)
            arrow('buyer','b','web','t',2,via=[(249,378),(124,378)])
            arrow('mail','b','web','r',3,via=[(421,374),(236,374),(236,285)])
            arrow('web','r','worker','l',4)
            arrow('web','b','db','t',5,via=[(124,228),(249,228)])
            arrow('worker','b','db','r',6,via=[(376,182)])
            arrow('worker','b','host','t',7,via=[(483,125),(117,125)])
            arrow('worker','b','ai','t',8,via=[(376,121)])
        else:
            boundary(0,112,499,345,'Application components - shared web and worker modules')
            box('gate',104,362,291,65,'Tenant and authorization gateway','Component','Owner sessions, task scope, signatures',True)
            box('ingest',14,250,143,77,'Onboarding compiler','Component','Fetch, extract, ask, validate')
            box('trade',178,250,143,77,'Commercial state machine','Component','Offer, approval, confirmation',True)
            box('mail',342,250,143,77,'Merchant response','Component','Email + dashboard approval')
            box('pub',14,132,143,77,'Approved publisher','Component','HTML / JSON / OpenAPI / MCP')
            box('events',178,132,143,77,'Durable events / outbox','Component','Waits, retries, deduplication')
            box('consent',342,132,143,77,'Consent + evaluation','Separate components','Scope/revocation; frozen tasks and scoring')
            box('db',14,10,143,78,'PostgreSQL','External container','Approved versions, tasks and evidence')
            box('harness',178,10,143,78,'Codex harness','External process','Bounded configuration job')
            box('receiver',342,10,143,78,'Buyer event receiver','External system','Checks relevance; may suggest')
            arrow('gate','b','ingest','t',1,via=[(249,345),(85,345)])
            arrow('gate','b','trade','t',2)
            arrow('gate','r','mail','t',3,via=[(414,395)])
            arrow('ingest','b','pub','t',4)
            arrow('trade','r','mail','l',5)
            arrow('trade','b','events','t',6)
            arrow('consent','l','events','r',7)
            arrow('pub','b','db','t',8)
            arrow('events','l','db','r',8,via=[(167,170),(167,49)])
            arrow('ingest','l','harness','t',9,via=[(5,289),(5,102),(249,102)])
            arrow('events','b','receiver','t',10,via=[(249,98),(414,98)])
        c.setFillColor(MUTED);c.setFont('Helvetica',8)
        c.drawString(0,470,'Solid arrows: planned interface   |   Dashed arrows: future integration')

LEGENDS={
1:[
'1. Owner -> Presence: authenticated HTTPS publication and commercial approval.',
'2. Traveller -> personal agent: requirements and exact-offer approval.',
'3. Agent <-> Presence: HTTPS capabilities, tasks, signed updates and opted-in events.',
'4. Website -> Presence: bounded fetch over HTTP(S), with source evidence.',
'5. Presence <-> Resend/inbox: email API and received-email HTTPS webhook.',
'6. Presence -> model services: authenticated inference and onboarding tasks.',
'7. Future: authorized vendor API adapters to PMS/POS/CRM/ERP.'
],
2:[
'1. Browser -> web: HTTPS owner actions; SSE for connected trace views.',
'2. Buyer <-> web: REST/MCP; optional version-pinned A2A adapter; signed callbacks.',
'3. Resend <-> app: inbound HTTPS webhook to web; worker sends/retrieves email.',
'4. Web -> worker: persistent workflow start/resume; no in-memory human wait.',
'5-6. Web/worker -> Postgres: tenant-scoped SQL and atomic state/outbox writes.',
'7. Worker -> host harness: narrow authenticated job boundary; credentials stay on host.',
'8. Worker -> Gateway/models: HTTPS inference; model/provider/usage recorded.'
],
3:[
'1-3. Gateway routes authorized requests; owner/buyer/provider identities stay scoped.',
'4. Onboarding -> publisher: schema-valid draft, evidence checks, owner approval.',
'5. State machine <-> merchant response: task and approved structured offer.',
'6-7. State machine and consent service -> outbox: persisted permitted events.',
'8. Shared repositories persist tenant versions, commercial state, consent and traces.',
'9. Onboarding -> harness: bounded configuration proposal, no arbitrary route execution.',
'10. Outbox -> buyer receiver: signed at-least-once delivery; receiver checks relevance.',
'Evaluation uses the same public tools on isolated fixture tenants and deterministic scorers.'
]}

class PlanDoc(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable,Paragraph) and flowable.style.name=='SectionPlan':
            text=flowable.getPlainText()
            key='section-'+str(self.page)
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text,key,0,False)

def footer(c,doc):
    c.saveState()
    c.setStrokeColor(LINE);c.line(48,46,W-48,46)
    c.setFillColor(MUTED);c.setFont('Helvetica',8)
    c.drawString(48,31,'PRESENCE  /  BASELHACK 2026  /  PLANNING v1')
    c.drawRightString(W-48,31,str(doc.page))
    if doc.page>1:
        c.setFont('Helvetica',7.5)
        c.drawString(48,H-31,'THE POST-WEBSITE BUSINESS  /  Research, pitch and proposed architecture')
    c.restoreState()

doc=PlanDoc(str(OUT),pagesize=(W,H),leftMargin=48,rightMargin=48,
    topMargin=57,bottomMargin=59,title='Presence - BaselHack 2026 plan',
    author='BaselHack team planning',subject='Three-minute pitch, milestones, market research and C4 architecture')
doc.addPageTemplates(PageTemplate(id='plan',frames=[Frame(48,59,W-96,H-116,
    leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=footer))
story=[]
story.append(Spacer(1,52))
story.append(Paragraph('PRESENCE',styles['SubPlan']))
story.append(Paragraph('The business side<br/>of personal agents',styles['CoverTitle']))
story.append(Paragraph('Your next customer is an agent.<br/>Your business should be ready.',styles['CoverLead']))
story.append(Spacer(1,15))
story.append(Paragraph('Research-backed plan for Adobe\'s<br/><b>The Post-Website Business</b> challenge',styles['BodyPlan']))
story.append(Spacer(1,20))
for t in ['31 October 2026  |  Europe/Zurich  |  Planning version 1',
          '<b>Three-minute pitch. Three demo moments.</b><br/>Publish an approved presence. Complete a request through email. Reconnect with permission.',
          '<b>Scope:</b> one fictional Basel hotel; one shared Next.js application; versioned tenant configurations; Docker Compose.',
          '<b>Status:</b> planning documents only. No application, benchmark results or measured revenue uplift. Pricing and financial examples are hypothetical.']:
    story.append(Paragraph(t,styles['BodyPlan']))
story.append(PageBreak())

def append_md(md,force_sections=True,small=False):
    lines=md.splitlines(); buf=[]
    def flush():
        if buf:
            story.append(Paragraph(rich(' '.join(buf)),styles['SmallPlan' if small else 'BodyPlan']))
            buf.clear()
    for line in lines:
        if line.startswith('# '):continue
        if line.startswith('## '):
            flush()
            if force_sections and story and not isinstance(story[-1],PageBreak):story.append(PageBreak())
            story.append(Paragraph(rich(line[3:]),styles['SectionPlan']))
        elif line.startswith('### '):
            flush()
            if line.startswith('### Speaker draft'):
                story.append(PageBreak())
                story.append(Paragraph('Speaker draft - three-minute narrative',styles['SectionPlan']))
            else:
                story.append(Paragraph(rich(line[4:]),styles['SubPlan']))
        elif line.startswith('- '):
            flush()
            paragraph=Paragraph('- '+rich(line[2:]),styles['SmallPlan' if small else 'BulletPlan'])
            story.append(KeepTogether([paragraph]) if small else paragraph)
        elif not line.strip():flush()
        else:buf.append(line.strip())
    flush()

md=(ROOT/'docs/plan.md').read_text()
# Keep document identity on cover rather than repeat the metadata preamble.
md=md[md.index('## 01.'):]
before,after=md.split('## 15. C4 architecture views',1)
append_md(before)
for level,title,subtitle in [
    (1,'15A. C4 Level 1 - system context','Who participates and where the system boundary sits.'),
    (2,'15B. C4 Level 2 - containers','One shared codebase, separate runtime responsibilities.'),
    (3,'15C. C4 Level 3 - components','Approved facts, deterministic commitments and durable events.')]:
    story.append(PageBreak());story.append(Paragraph(title,styles['SectionPlan']))
    story.append(Paragraph(subtitle,styles['BodyPlan']))
    story.append(C4Diagram(level))
    for ln in LEGENDS[level]:story.append(Paragraph(rich(ln),styles['SmallPlan']))
    if level==3:story.append(Paragraph('Level 4 is deferred until implementation. Editable Mermaid and a booking sequence are in docs/architecture.md. Diagrams are proposals, not deployed infrastructure.',styles['SmallPlan']))
# The overview stays in Markdown; the PDF already includes all three diagram pages.
append_md('## 16.'+after.split('## 16.',1)[1])
story.append(PageBreak())
story.append(Paragraph('Source register',styles['SectionPlan']))
append_md((ROOT/'docs/sources.md').read_text(),force_sections=False,small=True)
story.append(PageBreak())
story.append(Paragraph('Appendix - recovered challenge',styles['SectionPlan']))
story.append(Paragraph('User-provided source material. Navigation, participant names and contact details omitted. The original contains the full challenge; the archive is preserved alongside this PDF.',styles['SmallPlan']))
brief=(ROOT/'docs/challenge-brief.md').read_text()
brief=brief[brief.index('The Post-Website Business\n'):]
# The copied webpage uses standalone section names rather than Markdown.
for title in ['Problem Statement','Context','Must-haves','Who should join this challenge','Nice-to-haves','Legal Framework']:
    brief=brief.replace('\n'+title+'\n','\n### '+title+'\n')
append_md(brief,force_sections=False,small=True)
doc.build(story)
print(OUT)
