from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


# ── Request ──────────────────────────────────────────────────────────────────

class ProposalInput(BaseModel):
    """Structured input the client or sales team provides."""

    company_name: str = Field(..., min_length=1, examples=["Farmbora Ltd"])
    industry: str = Field(..., min_length=1, examples=["Agriculture"])
    main_problem: str = Field(
        ...,
        min_length=10,
        examples=[
            "Manual order processing takes 3 days and leads to frequent errors"
        ],
    )
    current_process: str = Field(
        ...,
        min_length=10,
        examples=[
            "Orders come in via WhatsApp, staff manually enters them into Excel, "
            "then emails invoices one by one"
        ],
    )
    desired_automation: str = Field(
        ...,
        min_length=10,
        examples=[
            "Automated order intake from WhatsApp, auto-generated invoices, "
            "and real-time inventory sync"
        ],
    )
    estimated_monthly_customers: int = Field(
        ..., gt=0, examples=[500]
    )


# ── Pricing ──────────────────────────────────────────────────────────────────

class PricingRecommendation(BaseModel):
    setup_fee: int
    monthly_subscription: int
    usage_based_pricing: Optional[str] = None
    currency: str = "USD"


# ── Generated proposal sections ─────────────────────────────────────────────

class ProposalSections(BaseModel):
    executive_summary: str
    problem_analysis: str
    proposed_solution: str
    technical_architecture: str
    pricing: PricingRecommendation
    roi_explanation: str
    implementation_timeline: str
    whatsapp_pitch: str


# ── Full response ────────────────────────────────────────────────────────────

class ProposalOutput(BaseModel):
    proposal_id: str
    generated_date: date
    client: str
    industry: str
    sections: ProposalSections
    markdown: str
    files: ProposalFiles


class ProposalFiles(BaseModel):
    markdown_path: str
    pdf_path: str
    json_path: str
