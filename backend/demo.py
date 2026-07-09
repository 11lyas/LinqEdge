"""Standalone demo of the GenAI summary layer.

Run this after configuring `.env` to verify connectivity to Azure AI Foundry
and to see an example non-diagnostic summary generated from synthetic findings.

Usage:
    python demo.py
"""

from datetime import datetime, timedelta

from app.config import get_settings
from app.genai_service import generate_summary
from app.models import Audience, Finding, SummaryRequest

# Synthetic, deterministic findings that would come from the correlation layer.
SYNTHETIC_FINDINGS = [
    Finding(
        statement="Symptoms were logged on 4 of 5 days that followed a poor-sleep night.",
        category="sleep",
        supporting_events=5,
        strength="notable",
    ),
    Finding(
        statement="Three symptom entries occurred within two hours of a vigorous workout.",
        category="exercise",
        supporting_events=3,
        strength="moderate",
    ),
    Finding(
        statement="No repeatable relationship was observed between hydration logs and events.",
        category="hydration",
        supporting_events=8,
        strength="weak",
    ),
]


def main() -> None:
    settings = get_settings()
    if not settings.is_configured:
        print(
            "Azure is not configured.\n"
            "Copy backend/.env.example to backend/.env and fill in "
            "AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY, then re-run."
        )
        return

    now = datetime.now()
    request = SummaryRequest(
        audience=Audience.patient,
        period_start=now - timedelta(days=14),
        period_end=now,
        findings=SYNTHETIC_FINDINGS,
    )

    print(f"Using deployment: {settings.azure_openai_deployment}\n")
    print("Generating summary from synthetic findings...\n")

    response = generate_summary(request)

    print("=== Generated Summary ===")
    print(response.summary)
    print("\n=== Disclaimers ===")
    for line in response.disclaimers:
        print(f"- {line}")


if __name__ == "__main__":
    main()
