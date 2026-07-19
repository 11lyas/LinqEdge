"""Tests for Azure endpoint normalization."""

import unittest

from app.config import Settings


class AzureEndpointTests(unittest.TestCase):
    """Accept the endpoint forms users commonly copy from Azure."""

    def test_normalizes_bare_host(self) -> None:
        settings = Settings(
            azure_openai_endpoint="example-resource.openai.azure.com",
        )

        self.assertEqual(
            settings.azure_v1_base_url,
            "https://example-resource.openai.azure.com/openai/v1/",
        )

    def test_normalizes_full_target_url(self) -> None:
        settings = Settings(
            azure_openai_endpoint=(
                "https://example-resource.services.ai.azure.com/"
                "openai/v1/responses?api-version=preview"
            ),
        )

        self.assertEqual(
            settings.azure_v1_base_url,
            "https://example-resource.services.ai.azure.com/openai/v1/",
        )

    def test_ignores_surrounding_whitespace(self) -> None:
        settings = Settings(
            azure_openai_endpoint="  https://example-resource.openai.azure.com/  ",
        )

        self.assertEqual(
            settings.azure_v1_base_url,
            "https://example-resource.openai.azure.com/openai/v1/",
        )


if __name__ == "__main__":
    unittest.main()
