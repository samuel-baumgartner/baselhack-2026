"""Render planning documents and native vector C4 diagrams; no app implementation."""

from pathlib import Path

from document_fonts import register_document_fonts
import re
import math
from html import escape

from reportlab.platypus import (
    BaseDocTemplate,
    PageTemplate,
    Frame,
    Paragraph,
    Spacer,
    PageBreak,
    KeepTogether,
    Flowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.utils import simpleSplit
from render_architecture import load_views, update_markdown
from render_design import DesignPreview, export_svg

register_document_fonts()

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/pdf/presence-hackathon-plan.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)
INK = colors.HexColor("#182C36")
ACCENT = colors.HexColor("#087C77")
PALE = colors.HexColor("#EDF5F4")
MUTED = colors.HexColor("#53646D")
LINE = colors.HexColor("#C8D3D6")
W, H = 595.276, 841.89

styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="BodyPlan",
        fontName="PresenceSans",
        fontSize=9.6,
        leading=13.2,
        textColor=INK,
        spaceAfter=6,
        allowWidows=0,
        allowOrphans=0,
    )
)
styles.add(
    ParagraphStyle(
        name="SectionPlan",
        fontName="PresenceSans-Bold",
        fontSize=20,
        leading=25,
        textColor=INK,
        spaceAfter=17,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="SubPlan",
        fontName="PresenceSans-Bold",
        fontSize=11.5,
        leading=15.5,
        textColor=ACCENT,
        spaceBefore=10,
        spaceAfter=7,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="BulletPlan",
        parent=styles["BodyPlan"],
        leftIndent=11,
        firstLineIndent=-8,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="SmallPlan",
        parent=styles["BodyPlan"],
        fontSize=8.8,
        leading=12,
        textColor=MUTED,
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        fontName="PresenceSans-Bold",
        fontSize=35,
        leading=39,
        textColor=INK,
        spaceAfter=20,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverLead",
        fontName="PresenceSans",
        fontSize=17,
        leading=24,
        textColor=ACCENT,
        spaceAfter=16,
    )
)


def ascii_text(s):
    return (
        s.replace("\u2013", "-")
        .replace("\u2014", " - ")
        .replace("\u2011", "-")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u00a0", " ")
    )


def rich(s):
    s = escape(ascii_text(s))
    s = re.sub(
        r"\[([^\]]+)\]\((https?://[^)]+)\)",
        lambda m: '<link href="' + m[2] + '" color="#087C77">' + m[1] + "</link>",
        s,
    )
    s = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"`([^`]+)`", r'<font name="Courier" size="8.4">\1</font>', s)
    return s


VIEWS = load_views()
LEGENDS = {
    view["level"]: [
        f"{edge['id']}. {edge['label']} / {edge['technology']}"
        for edge in view["edges"]
    ]
    for view in VIEWS
}
styles.add(
    ParagraphStyle(
        name="DiagramLegend",
        parent=styles["SmallPlan"],
        fontSize=8,
        leading=10.5,
        spaceAfter=3,
    )
)


class C4Diagram(Flowable):
    def __init__(self, level):
        super().__init__()
        self.view = next(view for view in VIEWS if view["level"] == level)
        self.width = 499
        self.height = 470

    def draw(self):
        c = self.canv
        c.saveState()
        c.translate(15, 0)
        c.scale(0.94, 0.94)
        c.setLineWidth(0.8)
        nodes = {node["id"]: node for node in self.view["nodes"]}
        boundary = self.view.get("boundary")
        if boundary:
            c.setDash(4, 3)
            c.setStrokeColor(MUTED)
            c.roundRect(*boundary["box"], 6, fill=0, stroke=1)
            c.setDash()
            x, y, w, h = boundary["box"]
            c.setFillColor(MUTED)
            c.setFont("PresenceSans-Bold", 8)
            c.drawString(x + 10, y + h - 14, boundary["label"])
        for node in nodes.values():
            x, y, w, h = node["box"]
            primary = node.get("primary", False)
            c.setFillColor(ACCENT if primary else PALE)
            c.setStrokeColor(ACCENT if primary else LINE)
            c.roundRect(x, y, w, h, 5, fill=1, stroke=1)
            yy = y + h - 14
            for field, font, size in [
                ("title", "PresenceSans-Bold", 8.8),
                ("kind", "PresenceSans", 7.4),
                ("description", "PresenceSans", 8),
            ]:
                for line in simpleSplit(node[field], font, size, w - 14):
                    c.setFillColor(colors.white if primary else INK)
                    c.setFont(font, size)
                    c.drawCentredString(x + w / 2, yy, line)
                    yy -= 10
                yy -= 3
            if yy < y + 2:
                raise ValueError(f"Diagram label overflows node {node['id']}")

        def port(key, name):
            x, y, w, h = nodes[key]["box"]
            return {
                "l": (x, y + h / 2),
                "r": (x + w, y + h / 2),
                "t": (x + w / 2, y + h),
                "b": (x + w / 2, y),
            }[name]

        def head(point, previous):
            angle = math.atan2(point[1] - previous[1], point[0] - previous[0])
            path = c.beginPath()
            path.moveTo(*point)
            for a in [angle + 2.65, angle - 2.65]:
                path.lineTo(point[0] + 6 * math.cos(a), point[1] + 6 * math.sin(a))
            path.close()
            c.setFillColor(MUTED)
            c.drawPath(path, fill=1, stroke=0)

        for edge in self.view["edges"]:
            points = [port(edge["from"], edge["fromPort"])]
            points += edge.get("via", [])
            points.append(port(edge["to"], edge["toPort"]))
            c.setStrokeColor(MUTED)
            if edge.get("future"):
                c.setDash(4, 3)
            for a, b in zip(points, points[1:]):
                c.line(*a, *b)
            c.setDash()
            head(points[-1], points[-2])
            if edge.get("bidirectional"):
                head(points[0], points[1])
            mid = max(0, len(points) // 2 - 1)
            a, b = points[mid : mid + 2]
            xx, yy = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
            c.setFillColor(colors.white)
            c.circle(xx, yy, 7, fill=1, stroke=0)
            c.setFillColor(ACCENT)
            c.setFont("PresenceSans-Bold", 7.5)
            c.drawCentredString(xx, yy - 2.5, str(edge["id"]))
        c.restoreState()


class PlanDoc(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == "SectionPlan":
            text = flowable.getPlainText()
            key = "section-" + str(self.page)
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, 0, False)


def footer(c, doc):
    c.saveState()
    c.setStrokeColor(LINE)
    c.line(48, 46, W - 48, 46)
    c.setFillColor(MUTED)
    c.setFont("PresenceSans", 8)
    c.drawString(48, 31, "PRESENCE  /  BASELHACK 2026  /  REVIEWED PLAN v2")
    c.drawRightString(W - 48, 31, str(doc.page))
    if doc.page > 1:
        c.setFont("PresenceSans", 7.5)
        c.drawString(
            48,
            H - 31,
            "THE POST-WEBSITE BUSINESS  /  Research, pitch and proposed architecture",
        )
    c.restoreState()


doc = PlanDoc(
    str(OUT),
    pagesize=(W, H),
    leftMargin=48,
    rightMargin=48,
    topMargin=57,
    bottomMargin=59,
    title="Presence - BaselHack 2026 plan",
    author="BaselHack team planning",
    subject="Three-minute pitch, milestones, market research and C4 architecture",
)
doc.addPageTemplates(
    PageTemplate(
        id="plan",
        frames=[
            Frame(
                48,
                59,
                W - 96,
                H - 116,
                leftPadding=0,
                rightPadding=0,
                topPadding=0,
                bottomPadding=0,
            )
        ],
        onPage=footer,
    )
)
story = []
story.append(Spacer(1, 52))
story.append(Paragraph("PRESENCE", styles["SubPlan"]))
story.append(
    Paragraph("The business side<br/>of personal agents", styles["CoverTitle"])
)
story.append(
    Paragraph(
        "Your next customer is an agent.<br/>Your business should be ready.",
        styles["CoverLead"],
    )
)
story.append(Spacer(1, 15))
story.append(
    Paragraph(
        "Research-backed plan for Adobe's<br/><b>The Post-Website Business</b> challenge",
        styles["BodyPlan"],
    )
)
story.append(Spacer(1, 20))
for t in [
    "31 October 2026  |  Europe/Zurich  |  Reviewed planning version 2",
    "<b>Three-minute pitch. Three demo moments.</b><br/>Publish an approved presence. Complete a request through email. Reconnect with permission.",
    "<b>Scope:</b> one fictional Basel hotel; one shared Next.js application; versioned tenant configurations; Docker Compose.",
    "<b>Status:</b> planning documents only. No application, benchmark results or measured revenue uplift. Pricing and financial examples are hypothetical.",
]:
    story.append(Paragraph(t, styles["BodyPlan"]))
story.append(PageBreak())


def append_md(md, force_sections=True, small=False):
    lines = md.splitlines()
    buf = []

    def flush():
        if buf:
            story.append(
                Paragraph(
                    rich(" ".join(buf)), styles["SmallPlan" if small else "BodyPlan"]
                )
            )
            buf.clear()

    for line in lines:
        if line.startswith("# "):
            continue
        if line.startswith("## "):
            flush()
            if force_sections and story and not isinstance(story[-1], PageBreak):
                story.append(PageBreak())
            story.append(Paragraph(rich(line[3:]), styles["SectionPlan"]))
        elif line.startswith("### "):
            flush()
            if line.startswith("### Speaker draft"):
                story.append(PageBreak())
                story.append(
                    Paragraph(
                        "Speaker draft - three-minute narrative", styles["SectionPlan"]
                    )
                )
            else:
                story.append(Paragraph(rich(line[4:]), styles["SubPlan"]))
        elif line.startswith("- "):
            flush()
            paragraph = Paragraph(
                "- " + rich(line[2:]), styles["SmallPlan" if small else "BulletPlan"]
            )
            story.append(KeepTogether([paragraph]) if small else paragraph)
        elif not line.strip():
            flush()
        else:
            buf.append(line.strip())
    flush()


update_markdown()
export_svg()
append_md((ROOT / "docs/plan-review.md").read_text(), force_sections=False)
md = (ROOT / "docs/plan.md").read_text()
# Keep document identity on cover rather than repeat the metadata preamble.
md = md[md.index("## 01.") :]
before, after = md.split("## 15. C4 architecture views", 1)
append_md(before)
for level, title, subtitle in [
    (
        1,
        "15A. C4 Level 1 - system context",
        "Who participates and where the system boundary sits.",
    ),
    (
        2,
        "15B. C4 Level 2 - containers",
        "One shared codebase, separate runtime responsibilities.",
    ),
    (
        3,
        "15C. C4 Level 3 - web/API components",
        "One container decomposition; worker execution remains adjacent.",
    ),
]:
    story.append(PageBreak())
    story.append(Paragraph(title, styles["SectionPlan"]))
    story.append(Paragraph(subtitle, styles["BodyPlan"]))
    story.append(C4Diagram(level))
    for ln in LEGENDS[level]:
        story.append(Paragraph(rich(ln), styles["DiagramLegend"]))
    if level == 3:
        story.append(
            Paragraph(
                "Level 4 is deferred until implementation. Editable Mermaid and a booking sequence are in docs/architecture.md. Diagrams are proposals, not deployed infrastructure.",
                styles["SmallPlan"],
            )
        )
# The overview stays in Markdown; the PDF already includes all three diagram pages.
append_md("## 16." + after.split("## 16.", 1)[1])
story.append(PageBreak())
story.append(Paragraph("Presentation design preview", styles["SectionPlan"]))
story.append(
    Paragraph(
        "Proposed Tailwind/shadcn composition, not a working app or measured result. The owner/traveller contexts remain distinct. This is the booking chapter; the same shell supports Publish and Reconnect.",
        styles["BodyPlan"],
    )
)
story.append(DesignPreview())
story.append(Spacer(1, 18))
story.append(
    Paragraph(
        "Visual contract: projector-readable hierarchy, one next action, typed offer cards, source evidence and truthful waiting states. Exported vector preview: output/design/presence-demo-preview.svg.",
        styles["BodyPlan"],
    )
)
story.append(PageBreak())
story.append(Paragraph("Implementation specification", styles["SectionPlan"]))
append_md((ROOT / "docs/implementation-spec.md").read_text(), force_sections=False)
story.append(PageBreak())
story.append(Paragraph("Source register", styles["SectionPlan"]))
append_md((ROOT / "docs/sources.md").read_text(), force_sections=False, small=True)
story.append(PageBreak())
story.append(Paragraph("Appendix - recovered challenge", styles["SectionPlan"]))
story.append(
    Paragraph(
        "User-provided source material. Navigation, participant names and contact details omitted. The original contains the full challenge; the archive is preserved alongside this PDF.",
        styles["SmallPlan"],
    )
)
brief = (ROOT / "docs/challenge-brief.md").read_text()
brief = brief[brief.index("The Post-Website Business\n") :]
# The copied webpage uses standalone section names rather than Markdown.
for title in [
    "Problem Statement",
    "Context",
    "Must-haves",
    "Who should join this challenge",
    "Nice-to-haves",
    "Legal Framework",
]:
    brief = brief.replace("\n" + title + "\n", "\n### " + title + "\n")
append_md(brief, force_sections=False, small=True)
doc.build(story)
print(OUT)
