"""Pydantic models for the GenAI summary layer.

These mirror the "structured findings -> plain-language summary" flow described
in section 11 (Analytics Approach) of spec.md. The GenAI layer never invents
clinical conclusions; it only rephrases deterministic findings produced upstream
by the correlation layer.
"""

from enum import Enum
from typing import Optional

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator


MAX_FINDINGS = 50
MAX_FINDING_STATEMENT_LENGTH = 1_000
MAX_FINDING_CATEGORY_LENGTH = 64
MAX_FINDING_STRENGTH_LENGTH = 32


class Audience(str, Enum):
    """Who the summary is written for."""

    patient = "patient"
    clinician = "clinician"


class Finding(BaseModel):
    """A single deterministic, explainable finding from the correlation layer.

    Findings are the *only* factual basis the GenAI layer is allowed to use.
    """

    model_config = ConfigDict(str_strip_whitespace=True)

    statement: str = Field(
        ...,
        min_length=1,
        max_length=MAX_FINDING_STATEMENT_LENGTH,
        description="Deterministic finding text, e.g. 'Symptoms were logged on 4 of 5 poor-sleep days.'",
    )
    category: str = Field(
        ...,
        min_length=1,
        max_length=MAX_FINDING_CATEGORY_LENGTH,
        description="Context category such as sleep, exercise, symptom, stress, hydration.",
    )
    supporting_events: int = Field(
        default=0,
        ge=0,
        description="Number of underlying data points supporting this finding (for traceability).",
    )
    strength: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=MAX_FINDING_STRENGTH_LENGTH,
        description="Optional qualitative strength label such as weak, moderate, or notable.",
    )


class SummaryRequest(BaseModel):
    """Request payload for generating a plain-language summary."""

    audience: Audience = Field(
        default=Audience.patient,
        description="Whether to write for a patient or a clinician.",
    )
    period_start: AwareDatetime = Field(
        ...,
        description="Start of the reporting period, including a UTC offset.",
    )
    period_end: AwareDatetime = Field(
        ...,
        description="End of the reporting period, including a UTC offset.",
    )
    findings: list[Finding] = Field(
        default_factory=list,
        max_length=MAX_FINDINGS,
        description="Structured findings from the correlation layer.",
    )

    @model_validator(mode="after")
    def validate_reporting_period(self) -> "SummaryRequest":
        """Require a reporting period with a positive duration."""
        if self.period_end <= self.period_start:
            raise ValueError("period_end must be later than period_start")
        return self


class SummaryResponse(BaseModel):
    """Generated summary plus governance metadata."""

    summary: str = Field(..., description="Plain-language, non-diagnostic summary text.")
    audience: Audience
    disclaimers: list[str] = Field(
        default_factory=list,
        description="Safety disclaimers attached to every summary.",
    )
    model: str = Field(..., description="The Azure deployment used to generate the summary.")


class HealthResponse(BaseModel):
    """Service health / configuration status."""

    status: str
    azure_configured: bool
    deployment: str
