"""Embed ReportLab's bundled fonts so document previews render consistently."""

from pathlib import Path

import reportlab
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


def register_document_fonts():
    directory = Path(reportlab.__file__).resolve().parent / "fonts"
    for name, filename in [
        ("PresenceSans", "Vera.ttf"),
        ("PresenceSans-Bold", "VeraBd.ttf"),
    ]:
        if name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(name, str(directory / filename)))
    pdfmetrics.registerFontFamily(
        "PresenceSans",
        normal="PresenceSans",
        bold="PresenceSans-Bold",
        italic="PresenceSans",
        boldItalic="PresenceSans-Bold",
    )
