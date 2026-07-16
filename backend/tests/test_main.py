"""Tests for API error boundaries."""

import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from fastapi import HTTPException
from openai import OpenAIError

from app.main import create_summary
from app.models import SummaryRequest


class CreateSummaryTests(unittest.TestCase):
    """Keep upstream service details out of client-facing responses."""

    def test_redacts_openai_error_details(self) -> None:
        now = datetime.now(timezone.utc)
        request = SummaryRequest(
            period_start=now - timedelta(days=1),
            period_end=now,
        )

        with patch(
            "app.main.generate_summary",
            side_effect=OpenAIError("sensitive upstream request details"),
        ):
            with self.assertRaises(HTTPException) as context:
                create_summary(request)

        self.assertEqual(context.exception.status_code, 502)
        self.assertEqual(
            context.exception.detail,
            "The summary service is temporarily unavailable.",
        )
        self.assertNotIn(
            "sensitive upstream request details",
            context.exception.detail,
        )


if __name__ == "__main__":
    unittest.main()
