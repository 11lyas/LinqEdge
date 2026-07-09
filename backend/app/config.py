"""Application configuration loaded from environment / .env file."""

from functools import lru_cache
from urllib.parse import urlsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly-typed application settings.

    Values are read from environment variables, falling back to a local
    `.env` file. See `.env.example` for the expected keys.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Azure AI Foundry / Azure OpenAI
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_api_version: str = "2024-10-21"
    azure_openai_deployment: str = "gpt-4o"

    # Application
    app_name: str = "Active Context GenAI Service"

    @property
    def is_configured(self) -> bool:
        """True when the minimum Azure credentials are present."""
        return bool(self.azure_openai_endpoint and self.azure_openai_api_key)

    @property
    def azure_v1_base_url(self) -> str:
        """The Azure AI Foundry v1 API base URL, derived from the endpoint.

        Accepts any pasted form of the endpoint (bare host, trailing slash, or
        a full target URL such as `.../openai/v1/responses`) and normalizes it
        to `https://<host>/openai/v1/`.
        """
        parts = urlsplit(self.azure_openai_endpoint)
        return f"{parts.scheme}://{parts.netloc}/openai/v1/"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
