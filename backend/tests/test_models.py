"""Tests for API request and response models."""

import unittest
from datetime import datetime, timedelta, timezone

from pydantic import ValidationError

from app.models import SummaryRequest


class SummaryRequestTests(unittest.TestCase):
    """Validate reporting-period boundaries before calling the GenAI layer."""

    def setUp(self) -> None:
        self.period_start = datetime(2026, 7, 1, 8, 0, tzinfo=timezone.utc)

    def test_accepts_period_with_positive_duration(self) -> None:
        request = SummaryRequest(
            period_start=self.period_start,
            period_end=self.period_start + timedelta(days=1),
        )

        self.assertEqual(request.period_start, self.period_start)

    def test_rejects_period_ending_before_it_starts(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "period_end must be later than period_start",
        ):
            SummaryRequest(
                period_start=self.period_start,
                period_end=self.period_start - timedelta(seconds=1),
            )

    def test_rejects_zero_length_period(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "period_end must be later than period_start",
        ):
            SummaryRequest(
                period_start=self.period_start,
                period_end=self.period_start,
            )

    def test_rejects_start_without_utc_offset(self) -> None:
        with self.assertRaisesRegex(ValidationError, "timezone info"):
            SummaryRequest(
                period_start=self.period_start.replace(tzinfo=None),
                period_end=self.period_start + timedelta(days=1),
            )

    def test_rejects_end_without_utc_offset(self) -> None:
        with self.assertRaisesRegex(ValidationError, "timezone info"):
            SummaryRequest(
                period_start=self.period_start,
                period_end=(self.period_start + timedelta(days=1)).replace(
                    tzinfo=None,
                ),
            )

    def test_compares_instants_across_different_offsets(self) -> None:
        same_instant_in_chicago = self.period_start.astimezone(
            timezone(timedelta(hours=-5)),
        )

        with self.assertRaisesRegex(
            ValidationError,
            "period_end must be later than period_start",
        ):
            SummaryRequest(
                period_start=self.period_start,
                period_end=same_instant_in_chicago,
            )


if __name__ == "__main__":
    unittest.main()
