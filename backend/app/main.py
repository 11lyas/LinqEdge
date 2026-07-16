"""FastAPI application exposing the GenAI summary endpoint."""

from fastapi import FastAPI, HTTPException
from openai import OpenAIError

from .azure_client import AzureNotConfiguredError
from .config import get_settings
from .genai_service import generate_summary
from .models import HealthResponse, SummaryRequest, SummaryResponse

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description=(
        "GenAI summary layer for the Active Context Integration Platform. "
        "Turns structured, deterministic findings into plain-language, "
        "non-diagnostic summaries using an Azure AI Foundry GPT deployment."
    ),
    version="0.1.0",
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    """Report service status and whether Azure credentials are configured."""
    return HealthResponse(
        status="ok",
        azure_configured=settings.is_configured,
        deployment=settings.azure_openai_deployment,
    )


@app.post("/summary", response_model=SummaryResponse, tags=["genai"])
def create_summary(request: SummaryRequest) -> SummaryResponse:
    """Generate a plain-language, non-diagnostic summary from structured findings."""
    try:
        return generate_summary(request)
    except AzureNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except OpenAIError as exc:
        raise HTTPException(
            status_code=502,
            detail="The summary service is temporarily unavailable.",
        ) from exc
