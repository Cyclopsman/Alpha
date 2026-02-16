# DOXA Proposal Generator

Production-ready API that generates professional AI automation proposals from structured input. Built for African SMEs and enterprises.

## Features

- Accepts structured client input (company, industry, problem, current process, desired automation, volume)
- Generates a complete proposal with 8 sections: executive summary, problem analysis, proposed solution, technical architecture, pricing, ROI, implementation timeline, and WhatsApp pitch
- Outputs **Markdown**, **PDF**, and **JSON**
- Editable template system — customise wording without touching business logic
- Tiered pricing engine with industry-aware multipliers and volume scaling
- Environment-variable configuration for branding, pricing defaults, and currency

## Project Structure

```
doxa-proposal-generator/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Environment variables & defaults
│   ├── models/
│   │   └── proposal.py      # Pydantic request / response models
│   ├── services/
│   │   ├── generator.py     # Core proposal generation orchestrator
│   │   ├── pricing.py       # Pricing calculation engine
│   │   └── pdf_export.py    # Markdown-to-PDF renderer
│   ├── templates/
│   │   ├── sections.py      # Editable section templates
│   │   └── whatsapp.py      # WhatsApp pitch template
│   └── routers/
│       └── proposals.py     # API route definitions
├── output/                  # Generated proposal files (gitignored)
├── examples/
│   ├── example_input.json   # Sample request payload
│   └── example_output.md    # Sample generated proposal
├── requirements.txt
├── .env.example
└── README.md
```

## Quick Start

```bash
cd doxa-proposal-generator

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and edit environment config
cp .env.example .env

# Run the server
uvicorn app.main:app --reload
```

The API is available at **http://localhost:8000**. Interactive docs at **http://localhost:8000/docs**.

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Service info |
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/proposals/generate` | Full proposal (JSON response with all sections + file paths) |
| `POST` | `/api/v1/proposals/generate/pdf` | Proposal as downloadable PDF |
| `POST` | `/api/v1/proposals/generate/markdown` | Proposal as raw Markdown |

## Example Request

```bash
curl -X POST http://localhost:8000/api/v1/proposals/generate \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Farmbora Ltd",
    "industry": "Agriculture",
    "main_problem": "Manual order processing takes 3 days and leads to frequent errors",
    "current_process": "Orders come in via WhatsApp, staff manually enters them into Excel, then emails invoices one by one",
    "desired_automation": "Automated order intake from WhatsApp, auto-generated invoices, and real-time inventory sync",
    "estimated_monthly_customers": 500
  }'
```

## Customising Templates

All proposal wording lives in `app/templates/`. Edit the template strings in:

- `sections.py` — Executive summary, problem analysis, proposed solution, ROI, timeline
- `whatsapp.py` — WhatsApp pitch message

Templates use Python `str.format()` placeholders. Available variables are documented in each template file.

## Customising Pricing

Edit `app/services/pricing.py` to adjust:

- Industry complexity multipliers
- Volume tier thresholds
- Usage-based pricing rules

Or override defaults via environment variables in `.env`.

## Output Formats

Every call to `/api/v1/proposals/generate` produces three files in the `output/` directory:

1. **Markdown** (`.md`) — human-readable, version-controllable
2. **PDF** (`.pdf`) — branded, ready to send to clients
3. **JSON** (`.json`) — machine-readable, suitable for CRM/pipeline automation
