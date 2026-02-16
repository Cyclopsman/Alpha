"""DOXA Proposal Generator — FastAPI application entry point."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import AGENCY_NAME, AGENCY_TAGLINE, HOST, PORT
from app.routers.proposals import router as proposals_router

app = FastAPI(
    title=f"{AGENCY_NAME} Proposal Generator",
    description=(
        "Generate professional AI automation proposals from structured input. "
        "Outputs Markdown, PDF, and JSON."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(proposals_router, prefix="/api/v1")


@app.get("/", tags=["health"])
def root() -> dict:
    return {
        "service": f"{AGENCY_NAME} Proposal Generator",
        "tagline": AGENCY_TAGLINE,
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
