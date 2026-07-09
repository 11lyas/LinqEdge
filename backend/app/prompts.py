"""Prompt construction with the safety guardrails required by spec.md.

The system prompt enforces the Safety and Compliance Principles (section 12) and
the non-diagnostic language constraints (FR-07, FR-15, NFR-04).
"""

from .models import Audience, Finding, SummaryRequest

# Standard disclaimers attached to every generated summary.
DISCLAIMERS: list[str] = [
    "This summary is descriptive only and is not a medical diagnosis.",
    "It does not provide treatment advice, exercise clearance, or performance coaching.",
    "Observations describe timing associations only and do not imply cause and effect.",
    "For medical concerns or emergencies, contact your clinician or emergency services.",
]

SYSTEM_PROMPT = """\
You are a careful health-context summarization assistant for the Active Context \
Integration Platform, which adds daily-life context to LINQ cardiac monitoring data.

Your ONLY job is to rephrase the provided structured findings into a clear, \
plain-language summary. You must obey these rules without exception:

1. Use ONLY the findings provided. Never invent numbers, events, or relationships.
2. Never diagnose a condition or suggest a diagnosis.
3. Never recommend treatment, medication, or changes to medication.
4. Never provide exercise clearance or athletic performance coaching.
5. Use descriptive, association-based language ("was more frequently logged \
alongside", "occurred within hours of"). Never claim causation ("caused", \
"because of", "leads to").
6. If the findings show no clear relationship, say so plainly.
7. Do not alarm the reader. Be calm, neutral, and factual.
8. Keep the summary concise: 2-5 short sentences.

You will be told whether the reader is a PATIENT (use warm, simple, everyday \
language) or a CLINICIAN (use concise, professional, neutral language).
"""


def _format_findings(findings: list[Finding]) -> str:
    if not findings:
        return "(No structured findings were provided for this period.)"

    lines: list[str] = []
    for i, f in enumerate(findings, start=1):
        strength = f" [{f.strength}]" if f.strength else ""
        support = (
            f" (supported by {f.supporting_events} data point(s))"
            if f.supporting_events
            else ""
        )
        lines.append(f"{i}. [{f.category}]{strength} {f.statement}{support}")
    return "\n".join(lines)


def build_user_prompt(request: SummaryRequest) -> str:
    """Assemble the user message from the structured request."""
    audience_label = (
        "PATIENT" if request.audience == Audience.patient else "CLINICIAN"
    )
    period = (
        f"{request.period_start.date().isoformat()} to "
        f"{request.period_end.date().isoformat()}"
    )

    return (
        f"Reader: {audience_label}\n"
        f"Reporting period: {period}\n\n"
        f"Structured findings:\n{_format_findings(request.findings)}\n\n"
        "Write the plain-language summary now, following all safety rules."
    )
