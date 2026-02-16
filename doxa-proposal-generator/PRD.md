# Product Requirements Document (PRD)

## DOXA Proposal Generator v1.0

**Author:** DOXA Engineering
**Date:** 2026-02-16
**Status:** Shipped (v1.0)

---

## 1. Overview

The DOXA Proposal Generator is an internal tool that automatically produces professional, enterprise-ready AI automation proposals from structured input. It is designed for the DOXA sales and partnerships team to rapidly create client-facing documents for African SMEs and enterprises without manual drafting.

### 1.1 Problem Statement

Creating bespoke automation proposals is time-consuming. Each proposal requires a consistent structure covering problem analysis, technical architecture, pricing, ROI, and an implementation timeline. Sales staff currently draft these manually, leading to:

- Inconsistent quality and formatting across proposals
- 2-4 hours spent per proposal
- Pricing errors when calculating tiers manually
- Delayed response times to prospective clients

### 1.2 Solution

A FastAPI-based service that accepts six structured input fields and outputs a complete, branded proposal in three formats (Markdown, PDF, JSON) within seconds.

---

## 2. Target Users

| User | Use Case |
| --- | --- |
| Sales team | Generate proposals during or immediately after discovery calls |
| Partnerships lead | Create templated proposals for channel partners to white-label |
| Founder / CTO | Review pricing and ROI projections before client meetings |
| Future integrations | CRM or pipeline tools that consume the JSON output programmatically |

---

## 3. Functional Requirements

### 3.1 Input Fields

All fields are required.

| Field | Type | Validation | Description |
| --- | --- | --- | --- |
| `company_name` | string | min 1 char | Name of the prospective client |
| `industry` | string | min 1 char | Client's industry vertical |
| `main_problem` | string | min 10 chars | Core pain point to be solved |
| `current_process` | string | min 10 chars | How the client handles the process today |
| `desired_automation` | string | min 10 chars | What the client wants automated |
| `estimated_monthly_customers` | integer | > 0 | Volume of monthly customer interactions |

### 3.2 Generated Proposal Sections

The system generates all of the following sections from the input:

| # | Section | Description |
| --- | --- | --- |
| 1 | Executive Summary | Concise overview of the engagement, tailored to the client and industry |
| 2 | Problem Analysis | Restates the current process and identifies key pain points |
| 3 | Proposed AI Automation Solution | Five-component solution architecture mapped to the desired automation |
| 4 | Technical Architecture | ASCII system diagram with stack highlights |
| 5 | Pricing Recommendation | Setup fee, monthly subscription, and optional usage-based pricing |
| 6 | ROI Explanation | Before/after metrics table with payback period calculation |
| 7 | Implementation Timeline | Five-phase, 10-week delivery plan |
| 8 | WhatsApp Pitch | Max 5-line message ready to send to the client |

### 3.3 Output Formats

| Format | File Extension | Purpose |
| --- | --- | --- |
| Markdown | `.md` | Human-readable, version-controllable, editable |
| PDF | `.pdf` | Branded, client-facing, print-ready |
| JSON | `.json` | Machine-readable for CRM/pipeline automation |

All three files are written to the `output/` directory and their paths are returned in the API response.

### 3.4 Pricing Engine

The pricing engine calculates fees based on two factors:

**Industry complexity multipliers:**

| Industry | Multiplier |
| --- | --- |
| Education | 0.9x |
| Hospitality | 0.95x |
| Agriculture | 1.0x |
| Retail | 1.0x |
| Real Estate | 1.1x |
| Logistics | 1.15x |
| Manufacturing | 1.2x |
| Healthcare | 1.25x |
| Finance | 1.3x |
| Other (default) | 1.1x |

**Volume tiers:**

| Monthly Customers | Volume Factor |
| --- | --- |
| 0 - 100 | 0.0 (base price) |
| 101 - 500 | 0.3 |
| 501 - 2,000 | 0.6 |
| 2,001+ | 1.0 (full range) |

**Pricing formula:**
- `setup_fee = (SETUP_MIN + (SETUP_MAX - SETUP_MIN) * volume_factor) * industry_multiplier`
- `monthly_sub = (MONTHLY_MIN + (MONTHLY_MAX - MONTHLY_MIN) * volume_factor) * industry_multiplier`
- Usage-based pricing activates above 1,000 monthly customers at `$0.05 * industry_multiplier` per interaction

**Default ranges (configurable via environment variables):**
- Setup fee: USD 2,000 - 10,000
- Monthly subscription: USD 500 - 3,000

### 3.5 API Endpoints

| Method | Path | Response |
| --- | --- | --- |
| `GET` | `/` | Service info and version |
| `GET` | `/health` | Health check (`{"status": "ok"}`) |
| `POST` | `/api/v1/proposals/generate` | Full JSON response with all sections, markdown content, and file paths |
| `POST` | `/api/v1/proposals/generate/pdf` | Streams the generated PDF file directly |
| `POST` | `/api/v1/proposals/generate/markdown` | Returns proposal ID and raw markdown string |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Proposal generation completes in < 2 seconds on standard hardware
- No external API calls required (fully self-contained)

### 4.2 Configuration
- All branding (agency name, tagline, website, email) configurable via environment variables
- Pricing ranges and currency configurable via environment variables
- `.env.example` provided as a template

### 4.3 Extensibility
- **Template system:** All proposal section text lives in `app/templates/` as Python format strings. Wording can be changed without modifying business logic.
- **Modular services:** Pricing, PDF export, and generation are separate services that can be replaced or extended independently.
- **JSON output:** Enables downstream automation (CRM sync, email drip, Slack notifications) without re-parsing.

### 4.4 Security
- CORS middleware included (configurable origins)
- No secrets stored in code; all configuration via environment variables
- Input validation via Pydantic models with minimum-length and type constraints

### 4.5 Tone and Style
All generated content must be:
- Concise and business-focused
- Enterprise-ready in language and formatting
- Appropriate for African SMEs and enterprises (references to WhatsApp, local payment gateways, practical ROI framing)

---

## 5. Technical Architecture

### 5.1 Stack
- **Language:** Python 3.11+
- **Framework:** FastAPI 0.115+
- **Server:** Uvicorn
- **Data validation:** Pydantic v2
- **PDF generation:** fpdf2
- **Configuration:** python-dotenv

### 5.2 Project Structure

```
doxa-proposal-generator/
├── app/
│   ├── main.py                 # FastAPI app, middleware, route registration
│   ├── config.py               # Environment variable loading and defaults
│   ├── models/
│   │   └── proposal.py         # ProposalInput, ProposalOutput, PricingRecommendation, etc.
│   ├── services/
│   │   ├── generator.py        # Orchestrates template rendering, pricing, file output
│   │   ├── pricing.py          # Industry-aware, volume-tiered pricing calculator
│   │   └── pdf_export.py       # Markdown-to-PDF renderer with branded header/footer
│   ├── templates/
│   │   ├── sections.py         # Editable str.format() templates for all 7 text sections
│   │   └── whatsapp.py         # 5-line WhatsApp pitch template
│   └── routers/
│       └── proposals.py        # API route handlers
├── output/                     # Generated files (gitignored)
├── examples/
│   ├── example_input.json      # Sample API request body
│   └── example_output.md       # Sample generated proposal
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

### 5.3 Data Flow

```
Client (HTTP POST)
  → FastAPI Router
    → Generator Service
      → Pricing Service (calculates fees)
      → Template Rendering (fills section templates)
      → Markdown Assembly (combines all sections)
      → PDF Export (converts markdown to branded PDF)
      → JSON Serialisation (writes structured output)
    → HTTP Response (JSON / PDF / Markdown)
```

---

## 6. Deployment

### 6.1 Local Development
```bash
cd doxa-proposal-generator
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### 6.2 Production
- Deploy behind a reverse proxy (nginx / Caddy)
- Set `HOST=0.0.0.0` and appropriate `PORT`
- Use a process manager (systemd / supervisord) or containerise with Docker
- Restrict CORS origins in `app/main.py` to known frontends

---

## 7. Future Roadmap

| Priority | Feature | Description |
| --- | --- | --- |
| High | AI-enhanced summaries | Use an LLM to generate more nuanced executive summaries from the input |
| High | Multi-currency support | Dynamic currency conversion with live exchange rates |
| Medium | Client portal | Web UI for sales team to fill in fields and preview proposals |
| Medium | Template editor | Admin interface to edit proposal templates without code changes |
| Medium | CRM integration | Auto-push generated proposals to HubSpot / Salesforce pipelines |
| Low | Multi-language | Generate proposals in French, Swahili, Portuguese for pan-African reach |
| Low | Analytics | Track proposal conversion rates and average deal size |

---

## 8. Success Metrics

| Metric | Target |
| --- | --- |
| Proposal generation time | < 2 seconds |
| Time saved per proposal vs manual | > 90% reduction (from ~3 hrs to < 5 min including input) |
| Pricing accuracy | 100% (deterministic calculation, no manual errors) |
| Format consistency | 100% (all proposals follow identical structure) |
| Sales team adoption | 80%+ of proposals generated through the tool within 30 days |

---

## 9. Acceptance Criteria

- [ ] API accepts all six required input fields with validation
- [ ] Generates all eight proposal sections with correct, professional content
- [ ] Outputs valid Markdown, PDF, and JSON files
- [ ] Pricing adjusts correctly by industry multiplier and volume tier
- [ ] WhatsApp pitch is max 5 lines
- [ ] Server starts and responds to health checks
- [ ] Interactive API docs available at `/docs`
- [ ] Example input and output files included
- [ ] Environment-variable configuration works for branding and pricing
- [ ] No hardcoded secrets in source code
