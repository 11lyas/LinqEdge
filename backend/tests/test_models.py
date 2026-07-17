"""Tests for API request and response models."""

import unittest
from datetime import datetime, timedelta, timezone

from pydantic import ValidationError

from app.models import (
    MAX_FINDINGS,
    MAX_FINDING_CATEGORY_LENGTH,
    MAX_FINDING_STATEMENT_LENGTH,
    MAX_FINDING_STRENGTH_LENGTH,
    Finding,
    SummaryRequest,
)


class FindingTests(unittest.TestCase):
    """Bound prompt inputs so callers cannot submit unbounded text."""

    def test_accepts_values_at_length_limits(self) -> None:
        finding = Finding(
            statement="s" * MAX_FINDING_STATEMENT_LENGTH,
            category="c" * MAX_FINDING_CATEGORY_LENGTH,
            strength="m" * MAX_FINDING_STRENGTH_LENGTH,
        )

        self.assertEqual(len(finding.statement), MAX_FINDING_STATEMENT_LENGTH)

    def test_rejects_blank_required_text(self) -> None:
        with self.assertRaisesRegex(ValidationError, "at least 1 character"):
            Finding(statement="   ", category="sleep")

        with self.assertRaisesRegex(ValidationError, "at least 1 character"):
            Finding(statement="No pattern was observed.", category="   ")

    def test_rejects_text_over_length_limits(self) -> None:
        invalid_values = (
            {"statement": "s" * (MAX_FINDING_STATEMENT_LENGTH + 1)},
            {"category": "c" * (MAX_FINDING_CATEGORY_LENGTH + 1)},
            {"strength": "m" * (MAX_FINDING_STRENGTH_LENGTH + 1)},
        )

        for override in invalid_values:
            with self.subTest(field=next(iter(override))):
                values = {
                    "statement": "No pattern was observed.",
                    "category": "sleep",
                    **override,
                }
                with self.assertRaisesRegex(
                    ValidationError,
                    "at most .* characters",
                ):
                    Finding(**values)


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

    def test_accepts_maximum_finding_count(self) -> None:
        request = SummaryRequest(
            period_start=self.period_start,
            period_end=self.period_start + timedelta(days=1),
            findings=[
                Finding(statement=f"Synthetic finding {index}", category="test")
                for index in range(MAX_FINDINGS)
            ],
        )

        self.assertEqual(len(request.findings), MAX_FINDINGS)

    def test_rejects_too_many_findings(self) -> None:
        findings = [
            Finding(statement=f"Synthetic finding {index}", category="test")
            for index in range(MAX_FINDINGS + 1)
        ]

        with self.assertRaisesRegex(ValidationError, "at most 50 items"):
            SummaryRequest(
                period_start=self.period_start,
                period_end=self.period_start + timedelta(days=1),
                findings=findings,
            )


if __name__ == "__main__":
    unittest.main()
