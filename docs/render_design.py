"""Native-vector presentation mockup, not a running application or live result."""

from pathlib import Path

from document_fonts import register_document_fonts

from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.graphics import renderSVG
from reportlab.lib import colors
from reportlab.platypus import Flowable

register_document_fonts()

ROOT = Path(__file__).resolve().parents[1]


def design_drawing():
    drawing = Drawing(1440, 900)
    palette = {
        "canvas": "#F8FAF9",
        "surface": "#FFFFFF",
        "rail": "#132C32",
        "ink": "#172C33",
        "muted": "#66767B",
        "line": "#DEE7E5",
        "teal": "#0B7D70",
        "tint": "#E8F3EF",
        "light": "#B5C9CA",
    }

    def rect(x, top, width, height, fill, stroke=None, radius=0):
        drawing.add(
            Rect(
                x,
                900 - top - height,
                width,
                height,
                fillColor=colors.HexColor(palette.get(fill, fill)),
                strokeColor=colors.HexColor(palette.get(stroke, stroke))
                if stroke
                else None,
                strokeWidth=1,
                rx=radius,
                ry=radius,
            )
        )

    def label(x, top, text, size=16, color="ink", bold=False):
        drawing.add(
            String(
                x,
                900 - top - size,
                text,
                fontSize=size,
                fontName="PresenceSans-Bold" if bold else "PresenceSans",
                fillColor=colors.HexColor(palette.get(color, color)),
            )
        )

    def rule(x, top, x2):
        drawing.add(
            Line(
                x,
                900 - top,
                x2,
                900 - top,
                strokeColor=colors.HexColor(palette["line"]),
            )
        )

    rect(0, 0, 1440, 900, "canvas")
    rect(0, 0, 226, 900, "rail")
    label(28, 30, "presence", 27, "surface", True)
    label(28, 76, "THE BUSINESS SIDE OF AGENTS", 10, "light", True)
    label(28, 155, "YOUR DEMO", 11, "light", True)
    label(33, 198, "01   Publish", 17, "light")
    rect(14, 242, 198, 54, "teal", radius=10)
    label(33, 257, "02   Book", 17, "surface", True)
    label(33, 326, "03   Reconnect", 17, "light")
    label(28, 736, "Hotel Linden Basel", 16, "surface", True)
    label(28, 766, "Fictional demonstration hotel", 12, "light")
    label(28, 839, "Session evidence", 14, "light")

    rect(226, 0, 1214, 86, "surface")
    rule(226, 86, 1440)
    label(262, 25, "Book through the inbox", 23, bold=True)
    label(262, 56, "One request. An owner-approved offer. Exact terms.", 13, "muted")
    rect(1150, 23, 252, 40, "tint", radius=9)
    label(1168, 34, "Viewing as: Traveller", 14, "teal", True)

    label(269, 121, "TRAVELLER'S AGENT", 11, "muted", True)
    rect(268, 156, 707, 123, "surface", "line", 12)
    label(290, 174, "Arriving after midnight, with my dog.", 18, bold=True)
    label(290, 205, "I need a quiet place to work until 14:00 after checkout.", 16)
    label(290, 234, "Keep the total below CHF 220. Ask before confirming.", 16)

    label(274, 311, "Presence has an offer for your stay.", 20, bold=True)
    label(274, 347, "The owner can offer workspace after checkout instead", 16, "muted")
    label(
        274,
        372,
        "of late checkout, so your full request stays within budget.",
        16,
        "muted",
    )
    rect(269, 422, 705, 95, "tint", radius=10)
    label(289, 438, "Owner reply received and approved", 16, "teal", True)
    label(289, 468, "Room, dog accommodation and workspace until 14:00.", 15)
    label(289, 491, "See the source email and approved terms", 12, "teal")

    rect(269, 548, 705, 54, "surface", "line", 8)
    label(289, 566, "View request steps and sources", 14, "muted")
    label(274, 651, "Your approval is needed", 17, bold=True)
    label(
        274,
        684,
        "Review the complete offer on the right before accepting.",
        15,
        "muted",
    )
    rect(269, 778, 705, 77, "surface", "line", 14)
    label(292, 796, "Ask about this offer...", 16, "muted")
    rect(914, 797, 38, 38, "teal", radius=9)
    drawing.add(
        Line(925, 900 - 816, 940, 900 - 816, strokeColor=colors.white, strokeWidth=2)
    )
    drawing.add(
        Line(934, 900 - 810, 940, 900 - 816, strokeColor=colors.white, strokeWidth=2)
    )
    drawing.add(
        Line(934, 900 - 822, 940, 900 - 816, strokeColor=colors.white, strokeWidth=2)
    )

    rect(1006, 116, 402, 739, "surface", "line", 14)
    label(1031, 139, "Hotel Linden Basel", 22, bold=True)
    label(1031, 173, "Fictional hotel  /  Owner-approved offer", 13, "muted")
    rect(1031, 211, 351, 37, "tint", radius=7)
    label(1047, 221, "Fits your stated requirements", 14, "teal", True)
    label(1031, 278, "YOUR STAY", 11, "muted", True)
    label(1031, 308, "12-13 November 2030", 18, bold=True)
    label(1031, 338, "1 guest  /  Late arrival  /  Dog welcome", 13, "muted")
    rule(1031, 379, 1382)
    for top, item, total in [
        (401, "Room", "CHF 175"),
        (438, "Dog accommodation", "CHF 20"),
        (475, "Workspace until 14:00", "CHF 10"),
    ]:
        label(1031, top, item, 15)
        label(1290, top, total, 15, bold=True)
    rule(1031, 519, 1382)
    label(1031, 545, "Total, taxes included", 15, "muted")
    label(1214, 535, "CHF 205", 28, bold=True)
    label(1031, 602, "Checkout 11:00. Workspace until 14:00.", 13)
    label(1031, 630, "Cancel free until 11 November, 18:00 CET.", 12, "muted")
    label(1031, 654, "Offer valid for 10 minutes after issue.", 12, "muted")
    rect(1031, 687, 351, 53, "teal", radius=9)
    label(1081, 703, "Approve CHF 205 offer", 17, "surface", True)
    label(1094, 762, "Ask a question first", 14, "muted")
    label(1031, 806, "Exact offer revision is preserved on acceptance.", 11, "muted")
    return drawing


class DesignPreview(Flowable):
    def __init__(self):
        super().__init__()
        self.width = 499
        self.height = 320

    def draw(self):
        self.canv.saveState()
        self.canv.scale(499 / 1440, 499 / 1440)
        design_drawing().drawOn(self.canv, 0, 0)
        self.canv.restoreState()


def export_svg():
    output = ROOT / "output/design/presence-demo-preview.svg"
    output.parent.mkdir(parents=True, exist_ok=True)
    svg = renderSVG.drawToString(design_drawing())
    svg = svg.replace(
        "font-family: PresenceSans-Bold;",
        "font-family: Arial, Helvetica, sans-serif; font-weight: 700;",
    )
    svg = svg.replace(
        "font-family: PresenceSans;", "font-family: Arial, Helvetica, sans-serif;"
    )
    svg = svg.replace(
        "<title>...</title>",
        "<title>Presence presentation demo - design preview</title>",
    )
    svg = svg.replace(
        "<desc>...</desc>",
        "<desc>Proposed booking screen. Static design preview, not working software.</desc>",
    )
    output.write_text(svg)
    return output


if __name__ == "__main__":
    print(export_svg())
