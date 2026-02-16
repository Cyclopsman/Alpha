"""Proposal API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from app.models.proposal import ProposalInput, ProposalOutput
from app.services.generator import generate_proposal

router = APIRouter(prefix="/proposals", tags=["proposals"])


@router.post(
    "/generate",
    response_model=ProposalOutput,
    summary="Generate a full automation proposal",
)
def create_proposal(data: ProposalInput) -> ProposalOutput:
    """Accept structured input and return a complete proposal with files."""
    try:
        return generate_proposal(data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/generate/pdf",
    summary="Generate a proposal and return the PDF directly",
    responses={200: {"content": {"application/pdf": {}}}},
)
def create_proposal_pdf(data: ProposalInput) -> FileResponse:
    """Generate a proposal and stream back the PDF file."""
    try:
        result = generate_proposal(data)
        return FileResponse(
            path=result.files.pdf_path,
            media_type="application/pdf",
            filename=f"proposal_{result.proposal_id}.pdf",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/generate/markdown",
    summary="Generate a proposal and return raw Markdown",
    responses={200: {"content": {"text/markdown": {}}}},
)
def create_proposal_markdown(data: ProposalInput) -> JSONResponse:
    """Generate a proposal and return the Markdown content."""
    try:
        result = generate_proposal(data)
        return JSONResponse(
            content={"proposal_id": result.proposal_id, "markdown": result.markdown}
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
