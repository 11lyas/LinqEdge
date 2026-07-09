"""GenAI summary layer: turns structured findings into plain-language summaries.

This is the concrete implementation of the "GenAI summary layer" from section 11
of spec.md. It calls the Azure AI Foundry (Azure OpenAI) GPT deployment.
"""

from .azure_client import get_azure_client
from .config import get_settings
from .models import SummaryRequest, SummaryResponse
from .prompts import DISCLAIMERS, SYSTEM_PROMPT, build_user_prompt


def generate_summary(request: SummaryRequest) -> SummaryResponse:
    """Generate a non-diagnostic, plain-language summary for a set of findings.

    Args:
        request: Audience, reporting period, and structured findings.

    Returns:
        A SummaryResponse containing the generated text and disclaimers.

    Raises:
        AzureNotConfiguredError: if Azure credentials are missing.
        openai.OpenAIError: if the Azure request fails.
    """
    settings = get_settings()
    client = get_azure_client()

    completion = client.chat.completions.create(
        model=settings.azure_openai_deployment,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(request)},
        ],
        # GPT-5-class models use max_completion_tokens (which also covers
        # reasoning tokens) and only support the default temperature.
        max_completion_tokens=2000,
    )

    summary_text = (completion.choices[0].message.content or "").strip()

    return SummaryResponse(
        summary=summary_text,
        audience=request.audience,
        disclaimers=DISCLAIMERS,
        model=settings.azure_openai_deployment,
    )
