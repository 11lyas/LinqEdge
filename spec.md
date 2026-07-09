# Active Context Integration Platform for LINQ
Version: 0.1
Date: 2026-07-09
Owner: Hackathon Team

## 1. Overview

This project proposes a modular application and integration platform that enriches LINQ cardiac monitoring data with external wellness and activity context from platforms such as Apple Health and Google Health.

The purpose is not to create a sports performance optimization tool. Instead, the platform is intended to help active monitored patients and their care teams better understand cardiac events in the context of real-life activity, symptoms, sleep, stress, and recovery.

The concept aligns with Medtronic's mission by:
- restoring health through better patient engagement and contextual understanding
- alleviating pain by reducing uncertainty and recall burden
- extending life by supporting earlier and more informed clinical conversations

## 2. Problem Statement

LINQ provides valuable long-term cardiac rhythm monitoring, but it does not capture the full context of a patient's daily life or physical activity. For active individuals, symptoms and events may be influenced by or associated with exercise, sleep, hydration, stress, or recovery patterns. Without this broader context, patient and clinician understanding may be incomplete.

There is a need for a modular system that:
- integrates LINQ event data with external health and activity sources
- normalizes those data into a common structure
- correlates cardiac events with activity and wellness context
- presents understandable, non-diagnostic insights for patients and clinicians

## 3. Goals

- Build a modular integration layer for LINQ and external wellness/activity data
- Normalize multi-source data into a reusable common schema
- Provide a timeline view that correlates LINQ events with exercise, symptoms, sleep, and other context
- Generate descriptive, non-diagnostic summaries for patient and clinician use
- Design the platform for reuse by future Medtronic applications

## 4. Non-Goals

- Diagnosing arrhythmias or other medical conditions
- Replacing clinician judgment or emergency response
- Providing exercise clearance
- Delivering athletic coaching or performance optimization recommendations
- Claiming causality between lifestyle factors and cardiac events
- Building a production-grade, regulated clinical system in the hackathon timeframe

## 5. Users

### Primary Users
- Active patients with LINQ monitors
- Clinicians reviewing LINQ event context

### Secondary Users
- Medtronic internal product and engineering teams
- Other application teams that may reuse the integration platform

## 6. Key Use Cases

1. Patient logs a workout and symptoms after exercise.
2. LINQ event data is displayed on a timeline alongside workout and symptom context.
3. The platform identifies a repeated temporal association between symptoms and poor sleep days.
4. A clinician reviews a concise summary report before a follow-up visit.
5. Another Medtronic application reuses the normalized API layer to access wellness context.

## 7. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | The system shall display LINQ event summaries made available to the app. |
| FR-02 | The system shall allow users to manually log workouts or physical activity. |
| FR-03 | The system shall allow users to log symptoms, sleep quality, hydration, and stress level. |
| FR-04 | The system shall automatically timestamp all user-entered context data. |
| FR-05 | The system shall present a unified timeline combining LINQ events and external or user-entered context. |
| FR-06 | The system shall identify temporal overlap between cardiac events and contextual signals such as activity or symptoms. |
| FR-07 | The system shall generate descriptive, non-diagnostic trend statements from structured findings. |
| FR-08 | The system shall support ingestion of external wellness or activity data in addition to LINQ data. |
| FR-09 | The system shall provide a modular connector layer for integrating multiple source systems. |
| FR-10 | The system shall normalize source-specific data into a common internal schema. |
| FR-11 | The system shall align timestamps across LINQ and external data sources. |
| FR-12 | The system shall support source-level user consent and permissions. |
| FR-13 | The system shall generate a concise patient or clinician summary for a selected period. |
| FR-14 | The system shall support a demo mode using synthetic data. |
| FR-15 | The system shall include clear disclaimers indicating that it is not intended for diagnosis, emergency use, or exercise clearance. |

## 8. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | The system shall use a modular architecture so new data connectors can be added independently. |
| NFR-02 | The system shall protect health-related data in transit and at rest. |
| NFR-03 | The system shall use explicit consent before collecting or displaying external wellness data. |
| NFR-04 | The system shall prevent unsupported diagnostic or coaching claims in the user experience. |
| NFR-05 | Key screens shall load within 2 to 3 seconds under normal demo conditions. |
| NFR-06 | User logging actions should complete within 1 second under normal demo conditions. |
| NFR-07 | The system shall handle missing or partial external data gracefully. |
| NFR-08 | Generated summaries shall be explainable and traceable to visible underlying source data. |
| NFR-09 | The codebase should be maintainable and reusable by other Medtronic teams. |
| NFR-10 | The demo should work reliably with synthetic or mocked data sources. |

## 9. System Architecture

The solution is organized into the following layers:

1. Data Sources
- LINQ event data
- Apple Health data
- Google Health data
- manual user-entered context
- future third-party wellness sources

2. Connector Layer
- source-specific adapters
- authentication and permissions
- consent handling

3. Normalization Layer
- common event schema
- timestamp normalization
- data validation and mapping

4. Correlation Layer
- event-to-activity matching
- symptom correlation
- contextual trend detection
- rule-based or lightweight analytics

5. Experience Layer
- patient timeline
- clinician summary
- report export
- optional GenAI-generated plain-language summaries

6. Governance Layer
- disclaimers
- privacy
- access control
- auditability
- non-diagnostic guardrails

## 10. Proposed Data Model

### Common Event Schema
| Field | Description |
|---|---|
| user_id | Internal user reference |
| source_system | LINQ, Apple, Google, Manual |
| event_type | arrhythmia_event, workout, symptom, sleep, stress, hydration |
| start_time | Event start timestamp |
| end_time | Event end timestamp |
| metric_name | Name of metric such as steps, duration, distance |
| metric_value | Numeric or categorical value |
| metric_unit | Unit of measure |
| context_label | User or source label such as run, walk, poor sleep |
| consent_status | Granted or denied |

## 11. Analytics Approach

The preferred approach is a hybrid model:

1. Structured analytics layer
- rule-based correlation or lightweight predictive model
- identifies repeatable temporal patterns
- produces deterministic, explainable findings

2. GenAI summary layer
- transforms structured findings into clear, plain-language summaries
- does not generate unsupported clinical conclusions
- remains constrained to descriptive and non-diagnostic language

Example output:
- "Symptoms were more frequently logged on poor-sleep days during the selected period."
- "Several symptom entries occurred within hours of vigorous exercise."
- "No clear repeatable relationship was observed during this time window."

## 12. Safety and Compliance Principles

- The application shall not diagnose or recommend treatment.
- The application shall not provide athletic performance coaching.
- The application shall not imply exercise clearance.
- All insights shall be descriptive rather than causal.
- Emergency guidance shall direct users to seek clinician or emergency support as appropriate.
- Demonstrations shall use synthetic or approved data only.

## 13. MVP Scope

### In Scope
- Synthetic LINQ event feed
- At least one external connector or mocked connector pattern
- Manual context logging
- Unified timeline
- Basic rule-based correlation engine
- Summary report generation
- Safety disclaimers

### Out of Scope
- Production deployment
- Real-time emergency alerting
- Full bidirectional integration with all external platforms
- Advanced predictive clinical modeling
- Athletic performance recommendations

## 14. Success Criteria

- Demonstrate LINQ data and at least one external or mocked context source in a single timeline
- Show normalized data flowing through a modular architecture
- Generate at least three non-diagnostic contextual insights
- Produce a patient-friendly or clinician-friendly summary
- Show the system can be extended to additional sources without major redesign

## 15. Open Questions

- Which external data source should be prioritized first for the MVP?
- What exact LINQ data elements are available for the hackathon prototype?
- What permissions and platform constraints apply to Apple Health and Google Health access?
- Will the MVP run as a mobile app, web app, or service-backed demo?
- Should GenAI be included in the MVP or saved as a future enhancement?

## 16. Future Enhancements

- Additional connectors for wearable and wellness ecosystems
- More advanced patient journaling workflows
- Clinician dashboard enhancements
- Explainable ML-based contextual ranking
- Shared reusable API package for internal Medtronic teams
