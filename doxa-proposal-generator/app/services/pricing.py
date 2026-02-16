"""Pricing calculation engine.

Pricing is tiered by estimated monthly customer volume and adjusted by
industry complexity.  All values are in the currency configured in
``app.config``.
"""

from __future__ import annotations

from app.config import (
    CURRENCY,
    DEFAULT_MONTHLY_MAX,
    DEFAULT_MONTHLY_MIN,
    DEFAULT_SETUP_FEE_MAX,
    DEFAULT_SETUP_FEE_MIN,
)
from app.models.proposal import PricingRecommendation

# Industry complexity multipliers – higher means more integration work.
_INDUSTRY_MULTIPLIER: dict[str, float] = {
    "agriculture": 1.0,
    "logistics": 1.15,
    "healthcare": 1.25,
    "finance": 1.3,
    "retail": 1.0,
    "education": 0.9,
    "real estate": 1.1,
    "manufacturing": 1.2,
    "hospitality": 0.95,
}

DEFAULT_MULTIPLIER = 1.1


def _volume_factor(monthly_customers: int) -> float:
    """Return a 0-1 scale factor based on customer volume."""
    if monthly_customers <= 100:
        return 0.0
    if monthly_customers <= 500:
        return 0.3
    if monthly_customers <= 2000:
        return 0.6
    return 1.0


def calculate_pricing(
    industry: str,
    monthly_customers: int,
) -> PricingRecommendation:
    """Derive a pricing recommendation from industry and volume."""

    multiplier = _INDUSTRY_MULTIPLIER.get(industry.lower(), DEFAULT_MULTIPLIER)
    vf = _volume_factor(monthly_customers)

    setup_range = DEFAULT_SETUP_FEE_MAX - DEFAULT_SETUP_FEE_MIN
    monthly_range = DEFAULT_MONTHLY_MAX - DEFAULT_MONTHLY_MIN

    setup_fee = int((DEFAULT_SETUP_FEE_MIN + setup_range * vf) * multiplier)
    monthly_sub = int((DEFAULT_MONTHLY_MIN + monthly_range * vf) * multiplier)

    # Usage-based pricing kicks in above 1 000 customers / month.
    usage_based = None
    if monthly_customers > 1000:
        per_unit = round(0.05 * multiplier, 3)
        usage_based = (
            f"${per_unit} per additional customer interaction above 1 000/month"
        )

    return PricingRecommendation(
        setup_fee=setup_fee,
        monthly_subscription=monthly_sub,
        usage_based_pricing=usage_based,
        currency=CURRENCY,
    )
