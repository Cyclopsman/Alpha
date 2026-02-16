"""Editable proposal section templates.

Each template is a plain Python string with ``str.format()`` placeholders.
To customise the wording, edit the strings below — the generator will pick
up changes automatically.
"""

from __future__ import annotations

EXECUTIVE_SUMMARY = (
    "{agency} proposes a tailored AI automation solution for {company} "
    "operating in the {industry} sector. The engagement addresses the core "
    "challenge of {problem_short} by replacing manual workflows with an "
    "intelligent, integrated system — reducing operational cost, eliminating "
    "errors, and positioning {company} for scalable growth across the "
    "continent."
)

PROBLEM_ANALYSIS = (
    "**Current situation at {company}:**\n\n"
    "{current_process}\n\n"
    "**Key pain points identified:**\n\n"
    "- High dependency on manual effort, leading to delays and human error.\n"
    "- Limited visibility into real-time operational data.\n"
    "- Inability to scale the current process beyond {monthly_customers:,} "
    "monthly customer interactions without proportionally increasing headcount.\n"
    "- Risk of revenue leakage due to inconsistent follow-up and invoicing."
)

PROPOSED_SOLUTION = (
    "**Desired outcome:** {desired_automation}\n\n"
    "{agency} will deliver an end-to-end automation layer that integrates "
    "directly with {company}'s existing tools and communication channels. "
    "The solution includes:\n\n"
    "1. **Intelligent Intake Engine** — Captures orders, enquiries, or "
    "requests from WhatsApp, web forms, and email using natural-language "
    "processing.\n"
    "2. **Workflow Orchestrator** — Routes each request through configurable "
    "business rules (approval chains, SLA timers, escalation paths).\n"
    "3. **Document Generator** — Auto-creates invoices, quotes, and reports "
    "in branded PDF format.\n"
    "4. **Analytics Dashboard** — Real-time KPIs, conversion funnels, and "
    "exception alerts accessible via web and mobile.\n"
    "5. **Integration Hub** — Connects to ERP, accounting software, CRM, "
    "and payment gateways already in use."
)

TECHNICAL_ARCHITECTURE = (
    "```\n"
    "┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐\n"
    "│  Channels    │───▶│  API Gateway /   │───▶│  Workflow Engine │\n"
    "│  (WhatsApp,  │    │  Webhook Layer   │    │  (Rules + NLP)  │\n"
    "│   Web, Email)│    └──────────────────┘    └────────┬────────┘\n"
    "└─────────────┘                                      │\n"
    "                                                     ▼\n"
    "                  ┌──────────────────┐    ┌─────────────────┐\n"
    "                  │  Data Store      │◀──▶│  Integration Hub │\n"
    "                  │  (PostgreSQL /   │    │  (ERP, CRM,     │\n"
    "                  │   Cloud DB)      │    │   Payments)     │\n"
    "                  └──────────────────┘    └─────────────────┘\n"
    "                           │\n"
    "                           ▼\n"
    "                  ┌──────────────────┐\n"
    "                  │  Analytics &     │\n"
    "                  │  Reporting Layer │\n"
    "                  └──────────────────┘\n"
    "```\n\n"
    "**Stack highlights:** Python / Node.js micro-services, cloud-hosted "
    "(AWS / Azure / GCP), REST + webhook integrations, end-to-end encryption, "
    "99.9 % uptime SLA."
)

ROI_EXPLANATION = (
    "**Projected return on investment for {company}:**\n\n"
    "| Metric | Before automation | After automation (est.) |\n"
    "| --- | --- | --- |\n"
    "| Processing time per order | ~30 min | <2 min |\n"
    "| Error rate | ~12 % | <1 % |\n"
    "| Monthly customer capacity | {monthly_customers:,} | "
    "{scaled_customers:,}+ |\n"
    "| Staff hours saved / month | — | ~{hours_saved:,} hrs |\n\n"
    "At a monthly subscription of {currency} {monthly_sub:,}, the solution "
    "pays for itself within **{payback_months} months** through labour "
    "savings and error reduction alone — before accounting for revenue "
    "uplift from faster turnaround."
)

IMPLEMENTATION_TIMELINE = (
    "| Phase | Duration | Deliverables |\n"
    "| --- | --- | --- |\n"
    "| Discovery & scoping | Week 1–2 | Requirements document, data audit |\n"
    "| Core build | Week 3–6 | Intake engine, workflow rules, integrations |\n"
    "| Testing & UAT | Week 7–8 | End-to-end tests, staff training |\n"
    "| Go-live & hyper-care | Week 9–10 | Production deployment, 2-week "
    "support sprint |\n"
    "| Optimisation | Ongoing | Monthly reviews, model tuning, new features |"
)
