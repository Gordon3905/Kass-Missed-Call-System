# CoVault Missed Call Capture Design

## Purpose

CoVault Missed Call Capture is a white-labelable AI system that captures missed calls, extracts caller information, transcribes voicemails, summarizes intent and urgency, logs the result to a local CRM/database, and triggers intelligent follow-up workflows. The first build will be a credible demo and production-ready scaffold: a single full-stack JavaScript app with mocked external providers by default and clean boundaries for live Twilio, AI transcription, CRM, SMS, and email providers.

## Goals

- Capture missed-call events through a Twilio-shaped webhook API.
- Extract caller name, number, call time, voicemail recording metadata, voicemail transcript, caller intent, and urgency.
- Log missed calls, callback tasks, callback outcomes, follow-up attempts, meeting conversions, clients, sequences, integrations, and audit events.
- Trigger urgency-aware follow-up sequences.
- Escalate stale high-urgency callbacks when they are not actioned within a configurable client window.
- Track callback completion, callback outcomes, and booked-meeting conversion.
- Provide a React dashboard for missed-call operations, metrics, integrations, white-label settings, and per-client follow-up sequence editing.
- Keep SQLite as the local development database while allowing the repository layer to swap to Postgres later.
- Keep Twilio, transcription, AI analysis, CRM, SMS, and email providers switchable between mock and live modes through environment variables.
- Include security and telecom-compliance foundations without pretending the demo is automatically compliance-certified.

## Non-Goals For The First Build

- Direct production deployment with live telecom traffic.
- Full carrier registration, legal review, or compliance certification.
- Real CRM vendor synchronization beyond provider interfaces and mock behavior.
- Background job infrastructure such as Redis/BullMQ unless later required.
- Multi-tenant billing and user authentication. The first scaffold will model clients and white-label settings, but it will not include a complete auth system.

## Recommended Approach

Use a modular monolith:

- React dashboard in the same repository as the API.
- Node/Express API for webhooks, calls, metrics, clients, sequence settings, integrations, and simulated processing.
- SQLite for development, accessed only through repositories.
- Provider adapters for mock and future live integrations.
- Shared environment validation so modes are explicit and misconfiguration is visible.

This gives CoVault a useful local demo today while preserving the seams needed for production integrations tomorrow.

## System Architecture

```text
client/
  React dashboard
  API client
  UI components
  dashboard state

server/
  app bootstrap
  config/env validation
  routes
  services
  repositories
  providers
  security helpers
  database migrations and seed data

shared/
  constants and type-like schemas where useful
```

Primary backend modules:

- `routes`: HTTP boundaries for webhooks, missed calls, metrics, clients, sequences, integrations, and demo actions.
- `services`: orchestration logic for ingestion, transcription, intent analysis, follow-up decisions, escalation, CRM logging, and metrics.
- `repositories`: database access for missed calls, callback tasks, sequence templates, clients, outcomes, integrations, and audit events.
- `providers`: mock/live adapters for Twilio, transcription, AI intent, CRM, SMS, and email.
- `security`: encryption helper, audit logging helper, retention settings, and Twilio signature validation hook for live mode.

## Data Model

Core tables:

- `clients`
  - `id`
  - `name`
  - `brand_name`
  - `logo_url`
  - `primary_color`
  - `timezone`
  - `business_hours`
  - `high_urgency_escalation_minutes`
  - `retention_days`
  - `created_at`
  - `updated_at`

- `missed_calls`
  - `id`
  - `client_id`
  - `caller_name`
  - `caller_number_encrypted`
  - `caller_number_display`
  - `call_time`
  - `duration_seconds`
  - `voicemail_recording_url_encrypted`
  - `voicemail_transcript`
  - `intent_summary`
  - `urgency`
  - `status`
  - `source_provider`
  - `provider_call_id`
  - `created_at`
  - `updated_at`

- `callback_tasks`
  - `id`
  - `missed_call_id`
  - `client_id`
  - `urgency`
  - `due_at`
  - `assigned_team`
  - `status`
  - `outcome`
  - `outcome_notes`
  - `completed_at`
  - `escalated_at`
  - `created_at`
  - `updated_at`

Callback outcomes:

- `booked_meeting`
- `voicemail_left`
- `no_answer`
- `not_qualified`
- `wrong_number`
- `resolved_no_meeting`

Follow-up and conversion tables:

- `follow_up_sequences`: per-client rules for urgency tiers, due windows, notification channels, and escalation windows.
- `message_templates`: per-client, per-urgency SMS/email templates with variables such as caller name, callback number, intent summary, and CoVault/client branding.
- `follow_up_attempts`: every SMS/email/callback reminder sent or queued.
- `booked_meetings`: meeting conversion records tied to missed calls and callback tasks.
- `integrations`: provider mode, status, last check, and public configuration metadata.
- `audit_events`: important system actions, mode changes, data access, callback status changes, and provider events.

## Missed-Call Workflow

1. Twilio-shaped webhook receives a missed-call event.
2. Ingestion service validates the payload, identifies the client, normalizes phone metadata, and stores the initial missed-call record.
3. Transcription provider processes voicemail audio.
   - Mock mode uses deterministic seeded transcripts.
   - Live mode will call a configured transcription service.
4. Intent provider extracts:
   - caller name if detectable
   - intent summary
   - urgency tier: `high`, `medium`, or `low`
   - reasoning metadata for display/debugging
5. Follow-up service evaluates the client's urgency-specific sequence.
6. CRM/database service logs the completed record.
7. Notification providers create follow-up attempts.
8. Dashboard updates metrics and inbox state.

## Follow-Up Rules

Default rules:

- High urgency:
  - alert sales team immediately through SMS/email provider
  - create callback task due now
  - use a default `high_urgency_escalation_minutes` value of `30`
  - escalate if not actioned within the client's `high_urgency_escalation_minutes`

- Medium urgency:
  - create callback task for the next business day in the client's configured timezone and business hours
  - queue reminder for the sales team

- Low urgency:
  - log the missed call
  - optionally create a nurture follow-up depending on client settings

Stale escalation:

- A scheduled service endpoint or periodic check identifies high-urgency callback tasks with no completion or outcome after the configured window.
- Escalation creates an audit event, marks `escalated_at`, and sends a second alert to the configured team channel.
- The dashboard highlights stale escalated tasks.

## Dashboard Design

The React dashboard will be the first screen. It will include:

- Overview metrics:
  - missed calls
  - high/medium/low urgency mix
  - callback completion rate
  - callback outcome distribution
  - booked meetings
  - missed-call-to-meeting conversion rate
  - average response time

- Missed-call inbox:
  - caller
  - number display
  - call time
  - urgency
  - intent summary
  - callback due state
  - escalation state
  - callback outcome

- Call detail panel:
  - transcript
  - AI summary
  - urgency rationale
  - follow-up attempts
  - callback task controls
  - outcome selector: booked meeting, voicemail left, no answer, not qualified, wrong number, resolved no meeting

- Follow-up sequence editor:
  - per-client urgency tiers
  - due windows
  - stale escalation window
  - sales-team alert channels
  - per-client message templates for SMS and email across high, medium, and low urgency
  - variable preview for caller and client fields

- White-label settings:
  - client brand name
  - primary color
  - logo URL
  - timezone and business hours

- Integration status:
  - Twilio mode
  - transcription mode
  - AI intent mode
  - CRM mode
  - SMS mode
  - email mode

Core dashboard interactions:

- Process a sample missed call.
- Change urgency.
- Mark callback complete with outcome.
- Record booked meeting conversion.
- Edit sequence timing and templates.
- Save white-label settings.
- Trigger stale callback escalation check.

## Provider Modes

Environment variables will control provider behavior:

```text
DATABASE_PROVIDER=sqlite
PHONE_PROVIDER=mock|twilio
TRANSCRIPTION_PROVIDER=mock|live
INTENT_PROVIDER=mock|live
CRM_PROVIDER=local|external
SMS_PROVIDER=mock|twilio
EMAIL_PROVIDER=mock|smtp
ENCRYPTION_KEY=...
TWILIO_AUTH_TOKEN=...
```

Mock providers must be deterministic enough for tests and demos. Live providers should fail closed when required credentials are missing.

## Security And Compliance Foundations

The scaffold will include:

- Encryption helper for sensitive phone numbers and recording URLs.
- Masked display fields for dashboard lists.
- Audit events for ingestion, provider actions, callback status changes, outcome changes, escalation, and settings updates.
- Twilio signature validation boundary for live webhooks.
- Consent and opt-out fields in sequence settings where automated messaging is enabled.
- Retention setting per client.
- Provider mode visibility in the dashboard.
- No hardcoded secrets.

The product will be designed to support telecom-compliance workflows, including consent, opt-out handling, audit trails, and message-template controls. A production launch will still require legal and carrier-specific review.

## API Surface

Initial endpoints:

- `POST /api/webhooks/twilio/missed-call`
- `POST /api/demo/process-missed-call`
- `GET /api/calls`
- `GET /api/calls/:id`
- `PATCH /api/calls/:id/urgency`
- `PATCH /api/callback-tasks/:id/complete`
- `PATCH /api/callback-tasks/:id/outcome`
- `POST /api/callback-tasks/escalate-stale`
- `GET /api/metrics`
- `GET /api/clients/:id`
- `PATCH /api/clients/:id`
- `GET /api/clients/:id/sequences`
- `PATCH /api/clients/:id/sequences`
- `GET /api/integrations/status`

## Testing Strategy

Backend tests:

- webhook payload normalization
- mock transcription behavior
- mock intent and urgency classification
- follow-up rule selection by urgency
- high-urgency stale escalation
- callback outcome tracking and metrics
- repository CRUD behavior

Frontend checks:

- dashboard renders seed metrics
- call detail panel updates selected call
- callback outcome changes are reflected in metrics
- sequence editor persists per-client urgency templates
- integration mode status renders from API

Build verification:

- install dependencies
- run database setup/seed
- run unit tests
- run app build
- run local dev server and inspect primary dashboard flow

## Implementation Readiness

This design is ready to become an implementation plan. The first implementation should prioritize end-to-end local behavior over live provider depth:

1. Scaffold the full-stack app.
2. Create database schema and seed data.
3. Implement repositories and mock providers.
4. Implement missed-call processing workflow.
5. Implement metrics, outcomes, and stale escalation.
6. Build the React dashboard and editors.
7. Add realistic seed data with varied buyer, support, rescheduling, urgent, unqualified, and wrong-number caller intents.
8. Add tests and run verification.
