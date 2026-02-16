"""PDF export service.

Uses ``fpdf2`` to convert rendered Markdown text into a clean PDF.
Markdown formatting is intentionally simplified for PDF — tables and
code blocks are rendered as plain text with monospace font.
"""

from __future__ import annotations

import re
from pathlib import Path

from fpdf import FPDF

from app.config import AGENCY_NAME

# ── Unicode → ASCII mapping for built-in PDF fonts ──────────────────────────
_UNICODE_MAP = {
    "\u2014": "--",   # em dash
    "\u2013": "-",    # en dash
    "\u2018": "'",    # left single quote
    "\u2019": "'",    # right single quote
    "\u201c": '"',    # left double quote
    "\u201d": '"',    # right double quote
    "\u2026": "...",  # ellipsis
    "\u2022": "-",    # bullet
    "\u25b6": ">",    # right-pointing triangle
    "\u2500": "-",    # box-drawing horizontal
    "\u2502": "|",    # box-drawing vertical
    "\u250c": "+",    # box-drawing corner
    "\u2510": "+",
    "\u2514": "+",
    "\u2518": "+",
    "\u251c": "+",
    "\u2524": "+",
    "\u252c": "+",
    "\u2534": "+",
    "\u253c": "+",
}


def _safe(text: str) -> str:
    """Replace Unicode characters that Helvetica/Courier cannot render."""
    for uchar, replacement in _UNICODE_MAP.items():
        text = text.replace(uchar, replacement)
    # Final fallback: strip anything still outside latin-1
    return text.encode("latin-1", errors="replace").decode("latin-1")


# ── Layout constants ─────────────────────────────────────────────────────────
PAGE_W = 210  # A4 width in mm
MARGIN = 15
CONTENT_W = PAGE_W - 2 * MARGIN
FONT_BODY = "Helvetica"
FONT_MONO = "Courier"


class _ProposalPDF(FPDF):
    """Thin wrapper that adds header / footer branding."""

    def header(self) -> None:
        self.set_font(FONT_BODY, "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, _safe(f"{AGENCY_NAME} -- Confidential"), align="R", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font(FONT_BODY, "I", 8)
        self.set_text_color(140, 140, 140)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")


# ── Markdown‑to‑PDF renderer ────────────────────────────────────────────────

_HEADING_RE = re.compile(r"^(#{1,3})\s+(.+)$")
_BOLD_RE = re.compile(r"\*\*(.+?)\*\*")
_RULE_RE = re.compile(r"^-{3,}$")
_BULLET_RE = re.compile(r"^[-*]\s+(.+)$")
_TABLE_ROW_RE = re.compile(r"^\|(.+)\|$")
_TABLE_SEP_RE = re.compile(r"^\|[\s\-:|]+\|$")
_QUOTE_RE = re.compile(r"^>\s?(.*)$")
_CODE_FENCE_RE = re.compile(r"^```")


def render_pdf(markdown: str, dest: Path) -> None:
    """Write *markdown* content to a PDF at *dest*."""

    pdf = _ProposalPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    pdf.set_margins(MARGIN, MARGIN, MARGIN)
    pdf.set_font(FONT_BODY, size=11)

    in_code_block = False

    for raw_line in markdown.split("\n"):
        line = raw_line.rstrip()

        # Code fences
        if _CODE_FENCE_RE.match(line):
            in_code_block = not in_code_block
            continue

        if in_code_block:
            pdf.set_font(FONT_MONO, size=9)
            pdf.set_text_color(60, 60, 60)
            pdf.cell(0, 5, _safe(line), new_x="LMARGIN", new_y="NEXT")
            pdf.set_font(FONT_BODY, size=11)
            pdf.set_text_color(0, 0, 0)
            continue

        # Horizontal rule
        if _RULE_RE.match(line):
            y = pdf.get_y()
            pdf.set_draw_color(200, 200, 200)
            pdf.line(MARGIN, y, PAGE_W - MARGIN, y)
            pdf.ln(4)
            continue

        # Headings
        m = _HEADING_RE.match(line)
        if m:
            level = len(m.group(1))
            sizes = {1: 18, 2: 14, 3: 12}
            pdf.ln(3)
            pdf.set_font(FONT_BODY, "B", sizes.get(level, 12))
            pdf.set_text_color(30, 30, 30)
            pdf.multi_cell(CONTENT_W, 7, _safe(m.group(2)))
            pdf.set_font(FONT_BODY, size=11)
            pdf.set_text_color(0, 0, 0)
            pdf.ln(2)
            continue

        # Block quotes
        qm = _QUOTE_RE.match(line)
        if qm:
            pdf.set_text_color(80, 80, 80)
            pdf.set_font(FONT_BODY, "I", 10)
            pdf.multi_cell(CONTENT_W - 10, 5, _safe(qm.group(1)))
            pdf.set_font(FONT_BODY, size=11)
            pdf.set_text_color(0, 0, 0)
            continue

        # Table separator — skip
        if _TABLE_SEP_RE.match(line):
            continue

        # Table rows
        tm = _TABLE_ROW_RE.match(line)
        if tm:
            cells = [c.strip() for c in tm.group(1).split("|")]
            col_w = CONTENT_W / max(len(cells), 1)
            pdf.set_font(FONT_BODY, size=10)
            for cell_text in cells:
                clean = _BOLD_RE.sub(r"\1", cell_text)
                pdf.cell(col_w, 6, _safe(clean), border=1)
            pdf.ln()
            pdf.set_font(FONT_BODY, size=11)
            continue

        # Bullet points
        bm = _BULLET_RE.match(line)
        if bm:
            clean = _BOLD_RE.sub(r"\1", bm.group(1))
            pdf.cell(6, 6, "-")
            pdf.multi_cell(CONTENT_W - 6, 6, _safe(clean))
            continue

        # Regular paragraph text
        if line.strip():
            clean = _BOLD_RE.sub(r"\1", line)
            pdf.multi_cell(CONTENT_W, 6, _safe(clean))
        else:
            pdf.ln(3)

    pdf.output(str(dest))
