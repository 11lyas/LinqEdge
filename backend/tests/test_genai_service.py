"""Tests for safe summary-generation boundaries."""

import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from app.genai_service import NO_FINDINGS_SUMMARY, generate_summary
from app.models import SummaryRequest


class GenerateSummaryTests(unittest.TestCase):
    """Avoid model generation when there is no factual input to summarize."""

    def test_returns_deterministic_summary_without_findings(self) -> None:
        period_start = datetime(2026, 7, 1, 8, 0, tzinfo=timezone.utc)
        request = SummaryRequest(
            period_start=period_start,
            period_end=period_start + timedelta(days=1),
        )

        with (
            patch("app.genai_service.get_settings") as get_settings,
            patch("app.genai_service.get_azure_client") as get_azure_client,
        ):
            response = generate_summary(request)

        self.assertEqual(response.summary, NO_FINDINGS_SUMMARY)
        self.assertIsNone(response.model)
        self.assertTrue(response.disclaimers)
        get_settings.assert_not_called()
        get_azure_client.assert_not_called()


if __name__ == "__main__":
    unittest.main()
