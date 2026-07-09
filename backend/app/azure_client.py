"""Thin wrapper around the Azure AI Foundry (Azure OpenAI) client.

We target the Azure AI Foundry **v1 API** surface, which is OpenAI-compatible.
The official `openai` SDK's `OpenAI` client is pointed at the Foundry v1 base
URL (`https://<resource>.services.ai.azure.com/openai/v1/`). This is the
supported path for newer GPT model deployments hosted in Azure AI Foundry.
"""

from functools import lru_cache

from openai import OpenAI

from .config import get_settings


class AzureNotConfiguredError(RuntimeError):
    """Raised when Azure credentials are missing."""


@lru_cache
def get_azure_client() -> OpenAI:
    """Build (and cache) an OpenAI client targeting the Foundry v1 API.

    Raises:
        AzureNotConfiguredError: if the endpoint or API key is missing.
    """
    settings = get_settings()
    if not settings.is_configured:
        raise AzureNotConfiguredError(
            "Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT and "
            "AZURE_OPENAI_API_KEY in your .env file (see .env.example)."
        )

    return OpenAI(
        base_url=settings.azure_v1_base_url,
        api_key=settings.azure_openai_api_key,
    )
