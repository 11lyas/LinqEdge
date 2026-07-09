# GenAI Summary Service

The **GenAI summary layer** for the Active Context Integration Platform
(see [`../spec.md`](../spec.md), sections 11 & 12).

It takes **structured, deterministic findings** produced upstream by the
correlation layer and turns them into **plain-language, non-diagnostic**
summaries using a **GPT model deployed in Azure AI Foundry** (Azure OpenAI).

The service never invents clinical conclusions — it only rephrases the findings
it is given, under strict safety guardrails.

## Project layout

```
backend/
  app/
    __init__.py
    config.py         # Settings loaded from .env
    azure_client.py   # AzureOpenAI client wrapper
    models.py         # Pydantic request/response models
    prompts.py        # System prompt + safety disclaimers
    genai_service.py  # Core summary generation
    main.py           # FastAPI app (/health, /summary)
  demo.py             # Standalone connectivity + example demo
  requirements.txt
  .env.example
```

## Setup

1. Create and activate a virtual environment, then install dependencies:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. Configure Azure credentials:

   ```powershell
   Copy-Item .env.example .env
   ```

   Then edit `.env` and set the values from your Azure AI Foundry project:

   - `AZURE_OPENAI_ENDPOINT` – e.g. `https://your-resource.openai.azure.com/`
   - `AZURE_OPENAI_API_KEY` – key from **Keys and Endpoint**
   - `AZURE_OPENAI_DEPLOYMENT` – the **deployment name** you gave the GPT model
   - `AZURE_OPENAI_API_VERSION` – e.g. `2024-10-21`

## Run the demo (quick connectivity check)

```powershell
python demo.py
```

This calls Azure with synthetic findings and prints a generated summary.

## Run the API

```powershell
uvicorn app.main:app --reload
```

- Health check: http://127.0.0.1:8000/health
- Interactive docs: http://127.0.0.1:8000/docs

### Example request

```http
POST /summary
Content-Type: application/json

{
  "audience": "patient",
  "period_start": "2026-06-25T00:00:00",
  "period_end": "2026-07-09T00:00:00",
  "findings": [
    {
      "statement": "Symptoms were logged on 4 of 5 days that followed a poor-sleep night.",
      "category": "sleep",
      "supporting_events": 5,
      "strength": "notable"
    }
  ]
}
```

## Safety

Every summary is generated under a system prompt that forbids diagnosis,
treatment advice, exercise clearance, and causal claims, and each response
carries explicit disclaimers (spec.md §12, FR-07, FR-15, NFR-04).
