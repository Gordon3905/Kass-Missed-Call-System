# Kavor Automation System / Kavor Calls

Kavor Automation System / Kavor Calls is a full-stack JavaScript scaffold for capturing missed calls, transcribing voicemails, summarizing caller intent, assigning urgency, logging callback work, triggering follow-up, escalating stale high-priority callbacks, and measuring booked-meeting conversion.

## Stack

- React + Vite dashboard
- Node + Express API
- SQLite development database through Node's built-in `node:sqlite`
- Repository layer designed for Postgres replacement
- Mock/live provider boundaries for phone, transcription, AI intent, CRM, SMS, and email

## Setup

```bash
npm install
npm run db:reset
npm run server
npm run dev
```

Dashboard: http://127.0.0.1:5173
API: http://127.0.0.1:5174

If those ports are already in use, run the API and dashboard on clean ports:

```bash
PORT=5192 npm run server
API_PROXY_TARGET=http://127.0.0.1:5192 npm run dev -- --port 5193 --strictPort
```

## Provider Modes

Copy `.env.example` to `.env` and change provider modes as integrations become available.

Mock modes are deterministic and safe for demos. Live modes validate required credentials and expose adapter boundaries.

## Demo Flow

1. Open the dashboard.
2. Review realistic seeded missed calls.
3. Process a sample missed call.
4. Inspect AI summary and urgency.
5. Complete a callback with an outcome.
6. Trigger stale high-priority escalation.
7. Edit per-client follow-up templates.
8. Review conversion metrics.

## API Contract

- `POST /api/demo/process-missed-call` returns a processed call, AI intent metadata, and callback task.
- `GET /api/calls` returns missed calls joined with callback fields including `due_at`, `callback_status`, `task_status`, `outcome`, and `escalated_at`.
- `GET /api/metrics` returns total calls, urgency mix, callback completion rate, booked meetings, conversion rate, average response time, and outcome distribution.
- `POST /api/callback-tasks/escalate-stale` returns `{ escalated: [...] }`.

