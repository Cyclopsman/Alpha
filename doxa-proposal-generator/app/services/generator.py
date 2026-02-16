"""Core proposal generation engine.

Orchestrates template rendering, pricing, and file output.
"""

from __future__ import annotations

import json
import math
import uuid
from datetime import date
from pathlib import Path

from app.config import AGENCY_NAME, AGENCY_EMAIL, AGENCY_WEBSITE, OUTPUT_DIR
from app.models.proposal import (
    ProposalFiles,
    ProposalInput,
    ProposalOutput,
    ProposalSections,
)
from app.services.pdf_export import render_pdf
from app.services.pricing import calculate_pricing
from app.templates.sections import (
    EXECUTIVE_SUMMARY,
    IMPLEMENTATION_TIMELINE,
    PROBLEM_ANALYSIS,
    PROPOSED_SOLUTION,
    ROI_EXPLANATION,
    TECHNICAL_ARCHITECTURE,
)
from app.templates.whatsapp import WHATSAPP_PITCH


def _short_problem(text: str, max_words: int = 18) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]) + " ..."


def _estimate_hours_saved(monthly_customers: int) -> int:
    """Rough estimate: 0.4 hrs saved per customer interaction automated."""
    return max(10, int(monthly_customers * 0.4))


def generate_proposal(data: ProposalInput) -> ProposalOutput:
    """Build every section, write output files, return full result."""

    proposal_id = uuid.uuid4().hex[:12]
    today = date.today()

    # ── Pricing ──────────────────────────────────────────────────────────
    pricing = calculate_pricing(data.industry, data.estimated_monthly_customers)

    # ── Section rendering ────────────────────────────────────────────────
    common = dict(
        agency=AGENCY_NAME,
        company=data.company_name,
        industry=data.industry,
        monthly_customers=data.estimated_monthly_customers,
        currency=pricing.currency,
    )

    executive_summary = EXECUTIVE_SUMMARY.format(
        **common,
        problem_short=_short_problem(data.main_problem),
    )

    problem_analysis = PROBLEM_ANALYSIS.format(
        **common,
        current_process=data.current_process,
    )

    proposed_solution = PROPOSED_SOLUTION.format(
        **common,
        desired_automation=data.desired_automation,
    )

    technical_architecture = TECHNICAL_ARCHITECTURE  # static diagram

    hours_saved = _estimate_hours_saved(data.estimated_monthly_customers)
    scaled_customers = data.estimated_monthly_customers * 5
    payback_months = max(1, math.ceil(pricing.setup_fee / max(1, pricing.monthly_subscription)))

    roi_explanation = ROI_EXPLANATION.format(
        **common,
        scaled_customers=scaled_customers,
        hours_saved=hours_saved,
        monthly_sub=pricing.monthly_subscription,
        payback_months=payback_months,
    )

    implementation_timeline = IMPLEMENTATION_TIMELINE

    whatsapp_pitch = WHATSAPP_PITCH.format(
        contact=data.company_name.split()[0],
        agency=AGENCY_NAME,
        company=data.company_name,
        industry=data.industry.lower(),
        setup_fee=pricing.setup_fee,
        monthly_sub=pricing.monthly_subscription,
        currency=pricing.currency,
    )

    sections = ProposalSections(
        executive_summary=executive_summary,
        problem_analysis=problem_analysis,
        proposed_solution=proposed_solution,
        technical_architecture=technical_architecture,
        pricing=pricing,
        roi_explanation=roi_explanation,
        implementation_timeline=implementation_timeline,
        whatsapp_pitch=whatsapp_pitch,
    )

    # ── Markdown assembly ────────────────────────────────────────────────
    md = _build_markdown(proposal_id, today, data, sections)

    # ── File output ──────────────────────────────────────────────────────
    file_stem = f"{proposal_id}_{data.company_name.replace(' ', '_')}"
    md_path = OUTPUT_DIR / f"{file_stem}.md"
    pdf_path = OUTPUT_DIR / f"{file_stem}.pdf"
    json_path = OUTPUT_DIR / f"{file_stem}.json"

    md_path.write_text(md, encoding="utf-8")
    render_pdf(md, pdf_path)

    files = ProposalFiles(
        markdown_path=str(md_path),
        pdf_path=str(pdf_path),
        json_path=str(json_path),
    )

    output = ProposalOutput(
        proposal_id=proposal_id,
        generated_date=today,
        client=data.company_name,
        industry=data.industry,
        sections=sections,
        markdown=md,
        files=files,
    )

    # Write JSON last so it includes file paths.
    json_path.write_text(
        output.model_dump_json(indent=2), encoding="utf-8"
    )

    return output


# ── Markdown builder ─────────────────────────────────────────────────────────

def _build_markdown(
    proposal_id: str,
    today: date,
    data: ProposalInput,
    s: ProposalSections,
) -> str:
    pricing_block = (
        f"| Item | Amount |\n"
        f"| --- | --- |\n"
        f"| Setup fee | {s.pricing.currency} {s.pricing.setup_fee:,} |\n"
        f"| Monthly subscription | {s.pricing.currency} "
        f"{s.pricing.monthly_subscription:,} |\n"
    )
    if s.pricing.usage_based_pricing:
        pricing_block += (
            f"| Usage-based pricing | {s.pricing.usage_based_pricing} |\n"
        )

    return (
        f"# Automation Proposal for {data.company_name}\n\n"
        f"**Proposal ID:** {proposal_id}  \n"
        f"**Date:** {today.isoformat()}  \n"
        f"**Prepared by:** {AGENCY_NAME} — {AGENCY_EMAIL}  \n"
        f"**Website:** {AGENCY_WEBSITE}\n\n"
        f"---\n\n"
        f"## 1. Executive Summary\n\n{s.executive_summary}\n\n"
        f"---\n\n"
        f"## 2. Problem Analysis\n\n{s.problem_analysis}\n\n"
        f"---\n\n"
        f"## 3. Proposed AI Automation Solution\n\n{s.proposed_solution}\n\n"
        f"---\n\n"
        f"## 4. Technical Architecture\n\n{s.technical_architecture}\n\n"
        f"---\n\n"
        f"## 5. Pricing\n\n{pricing_block}\n\n"
        f"---\n\n"
        f"## 6. Return on Investment\n\n{s.roi_explanation}\n\n"
        f"---\n\n"
        f"## 7. Implementation Timeline\n\n{s.implementation_timeline}\n\n"
        f"---\n\n"
        f"## 8. WhatsApp Pitch\n\n"
        f"> {s.whatsapp_pitch.replace(chr(10), chr(10) + '> ')}\n\n"
        f"---\n\n"
        f"*Generated by {AGENCY_NAME} Proposal Generator*\n"
    )
