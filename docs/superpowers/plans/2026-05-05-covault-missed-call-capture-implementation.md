# Kavor Automation System / Kavor Calls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single full-stack JavaScript app for Kavor Automation System / Kavor Calls with a React dashboard, Express API, SQLite development database, mock/live provider boundaries, realistic demo data, callback outcome tracking, and stale high-urgency escalation.

**Architecture:** Use a modular monolith with React + Vite under `client/`, Express under `server/`, shared constants under `shared/`, and tests under `tests/`. Keep all persistence behind repositories, all external systems behind providers, and all workflow decisions inside services so SQLite can be replaced by Postgres and mock providers can be replaced by live providers through environment variables.

**Tech Stack:** JavaScript ESM, React, Vite, Express, better-sqlite3, Vitest, Supertest, Lucide React, date-fns-tz.

---

## Acceptance Criteria From Spec And Review

- The default client has `high_urgency_escalation_minutes = 30`.
- Callback due times respect the client's `timezone` and `business_hours`.
- Seeded demo calls include varied, believable caller intents across sales, support, urgent buyer, reschedule, wrong number, and unqualified scenarios.
- The first screen is a usable dashboard, not a marketing page.
- External services are selected by env vars and default to deterministic mock providers.
- Callback outcomes are tracked separately from task status.
- Stale high-urgency callbacks can be escalated through an API and dashboard action.
- Follow-up sequence templates are editable per client, channel, and urgency tier.
- Sensitive phone numbers and recording URLs are encrypted at rest, with masked display fields for list views.

## File Structure

Create these files:

- `package.json`: root scripts and dependencies.
- `.gitignore`: ignored generated artifacts and local secrets.
- `.env.example`: documented configuration with mock defaults.
- `README.md`: setup, scripts, architecture, provider modes, and demo flow.
- `index.html`: Vite entry document.
- `vite.config.js`: client dev server and API proxy.
- `vitest.config.js`: test configuration.
- `shared/constants.js`: urgency tiers, callback outcomes, provider mode enums, and template variables.
- `server/index.js`: Express server bootstrap.
- `server/app.js`: Express app factory.
- `server/config/env.js`: environment parsing and validation.
- `server/db/connection.js`: SQLite connection factory.
- `server/db/schema.sql`: SQLite schema.
- `server/db/migrate.js`: schema runner.
- `server/db/seed.js`: realistic demo seed.
- `server/repositories/clientRepository.js`: client and white-label settings persistence.
- `server/repositories/callRepository.js`: missed calls, tasks, follow-up attempts, meetings, and metrics persistence.
- `server/repositories/sequenceRepository.js`: follow-up sequence and message template persistence.
- `server/repositories/integrationRepository.js`: integration status persistence.
- `server/repositories/auditRepository.js`: audit event persistence.
- `server/security/crypto.js`: encryption, decryption, masking.
- `server/security/audit.js`: audit event helper.
- `server/providers/index.js`: provider factory.
- `server/providers/mockPhoneProvider.js`: Twilio-shaped demo payload generation.
- `server/providers/mockTranscriptionProvider.js`: deterministic transcript selection.
- `server/providers/mockIntentProvider.js`: deterministic intent and urgency analysis.
- `server/providers/mockNotificationProviders.js`: mock SMS/email senders.
- `server/providers/liveProviderStubs.js`: credential-checked live-mode boundaries.
- `server/services/businessTime.js`: timezone and business-hours due time calculation.
- `server/services/ingestionService.js`: missed-call normalization and processing.
- `server/services/followUpService.js`: task creation, outcomes, templates, and stale escalation.
- `server/services/metricsService.js`: dashboard metrics.
- `server/routes/webhookRoutes.js`: Twilio-shaped webhook endpoint.
- `server/routes/demoRoutes.js`: sample missed-call processing endpoint.
- `server/routes/callRoutes.js`: call, urgency, callback, and escalation endpoints.
- `server/routes/clientRoutes.js`: client and sequence endpoints.
- `server/routes/metricsRoutes.js`: metrics endpoint.
- `server/routes/integrationRoutes.js`: integration status endpoint.
- `client/main.jsx`: React mount.
- `client/App.jsx`: dashboard composition and state orchestration.
- `client/api.js`: typed API helper functions.
- `client/data/formatters.js`: date, phone, percent, and status formatting helpers.
- `client/components/AppShell.jsx`: product shell.
- `client/components/MetricsBar.jsx`: dashboard metric cards.
- `client/components/CallInbox.jsx`: missed-call inbox table.
- `client/components/CallDetail.jsx`: transcript, summary, attempts, and outcome controls.
- `client/components/SequenceEditor.jsx`: per-client urgency rules and templates.
- `client/components/WhiteLabelPanel.jsx`: client branding and business-hours form.
- `client/components/IntegrationStatus.jsx`: provider status panel.
- `client/styles.css`: full dashboard styling.
- `tests/env.test.js`: environment parsing tests.
- `tests/businessTime.test.js`: timezone and business-hours tests.
- `tests/followUpService.test.js`: urgency rule, outcome, and escalation tests.
- `tests/ingestionService.test.js`: missed-call workflow tests.
- `tests/api.test.js`: Express route tests.
- `tests/metrics.test.js`: callback outcome and conversion metrics tests.

Modify these files during implementation:

- `docs/superpowers/specs/2026-05-05-covault-missed-call-capture-design.md`: add the approved default escalation and due-time requirements if they are missing from the design record.

---

### Task 1: Project Scaffold And Configuration

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `vitest.config.js`
- Create: `shared/constants.js`
- Test: `tests/env.test.js`
- Create: `server/config/env.js`
- Modify: `docs/superpowers/specs/2026-05-05-covault-missed-call-capture-design.md`

- [ ] **Step 1: Write the failing env tests**

Create `tests/env.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { loadEnv } from '../server/config/env.js';

describe('loadEnv', () => {
  it('defaults to local mock provider modes', () => {
    const env = loadEnv({});

    expect(env.databaseProvider).toBe('sqlite');
    expect(env.phoneProvider).toBe('mock');
    expect(env.transcriptionProvider).toBe('mock');
    expect(env.intentProvider).toBe('mock');
    expect(env.crmProvider).toBe('local');
    expect(env.smsProvider).toBe('mock');
    expect(env.emailProvider).toBe('mock');
    expect(env.port).toBe(5174);
  });

  it('rejects live provider mode without credentials', () => {
    expect(() =>
      loadEnv({
        PHONE_PROVIDER: 'twilio',
        TWILIO_AUTH_TOKEN: '',
      }),
    ).toThrow(/TWILIO_AUTH_TOKEN/);
  });
});
```

- [ ] **Step 2: Run the env test to verify it fails**

Run: `npm test -- tests/env.test.js`

Expected: FAIL because `package.json`, Vitest, and `server/config/env.js` do not exist.

- [ ] **Step 3: Create root project files**

Create `package.json`:

```json
{
  "name": "covault-missed-call-capture",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "server": "node server/index.js",
    "build": "vite build",
    "test": "vitest run",
    "db:migrate": "node server/db/migrate.js",
    "db:seed": "node server/db/seed.js",
    "db:reset": "node server/db/migrate.js --reset && node server/db/seed.js"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "better-sqlite3": "^11.10.0",
    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.2.0",
    "express": "^5.1.0",
    "lucide-react": "^0.468.0",
    "nanoid": "^5.0.9",
    "vite": "^6.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "supertest": "^7.0.0",
    "vitest": "^3.0.0"
  },
  "devDependencies": {}
}
```

Create `.gitignore`:

```gitignore
node_modules/
dist/
data/
.env
*.log
coverage/
test-results/
```

Create `.env.example`:

```text
PORT=5174
DATABASE_PROVIDER=sqlite
SQLITE_PATH=./data/covault.db
PHONE_PROVIDER=mock
TRANSCRIPTION_PROVIDER=mock
INTENT_PROVIDER=mock
CRM_PROVIDER=local
SMS_PROVIDER=mock
EMAIL_PROVIDER=mock
ENCRYPTION_KEY=dev-only-32-byte-key-change-me!!
TWILIO_AUTH_TOKEN=
```

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kavor Automation System / Kavor Calls</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/client/main.jsx"></script>
  </body>
</html>
```

Create `vite.config.js`:

```js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:5174',
    },
  },
});
```

Create `vitest.config.js`:

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.js'],
  },
});
```

Create `shared/constants.js`:

```js
export const URGENCY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const CALLBACK_STATUS = {
  OPEN: 'open',
  COMPLETED: 'completed',
  ESCALATED: 'escalated',
};

export const CALLBACK_OUTCOMES = {
  BOOKED_MEETING: 'booked_meeting',
  VOICEMAIL_LEFT: 'voicemail_left',
  NO_ANSWER: 'no_answer',
  NOT_QUALIFIED: 'not_qualified',
  WRONG_NUMBER: 'wrong_number',
  RESOLVED_NO_MEETING: 'resolved_no_meeting',
};

export const TEMPLATE_VARIABLES = [
  'caller_name',
  'caller_number',
  'intent_summary',
  'client_brand_name',
  'callback_due',
];

export const PROVIDER_MODES = {
  DATABASE: ['sqlite'],
  PHONE: ['mock', 'twilio'],
  TRANSCRIPTION: ['mock', 'live'],
  INTENT: ['mock', 'live'],
  CRM: ['local', 'external'],
  SMS: ['mock', 'twilio'],
  EMAIL: ['mock', 'smtp'],
};
```

- [ ] **Step 4: Implement env validation**

Create `server/config/env.js`:

```js
import { PROVIDER_MODES } from '../../shared/constants.js';

function readMode(rawEnv, key, allowed, fallback) {
  const value = rawEnv[key] || fallback;
  if (!allowed.includes(value)) {
    throw new Error(`${key} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

export function loadEnv(rawEnv = process.env) {
  const env = {
    port: Number(rawEnv.PORT || 5174),
    sqlitePath: rawEnv.SQLITE_PATH || './data/covault.db',
    databaseProvider: readMode(rawEnv, 'DATABASE_PROVIDER', PROVIDER_MODES.DATABASE, 'sqlite'),
    phoneProvider: readMode(rawEnv, 'PHONE_PROVIDER', PROVIDER_MODES.PHONE, 'mock'),
    transcriptionProvider: readMode(rawEnv, 'TRANSCRIPTION_PROVIDER', PROVIDER_MODES.TRANSCRIPTION, 'mock'),
    intentProvider: readMode(rawEnv, 'INTENT_PROVIDER', PROVIDER_MODES.INTENT, 'mock'),
    crmProvider: readMode(rawEnv, 'CRM_PROVIDER', PROVIDER_MODES.CRM, 'local'),
    smsProvider: readMode(rawEnv, 'SMS_PROVIDER', PROVIDER_MODES.SMS, 'mock'),
    emailProvider: readMode(rawEnv, 'EMAIL_PROVIDER', PROVIDER_MODES.EMAIL, 'mock'),
    encryptionKey: rawEnv.ENCRYPTION_KEY || 'dev-only-32-byte-key-change-me!!',
    twilioAuthToken: rawEnv.TWILIO_AUTH_TOKEN || '',
  };

  if ((env.phoneProvider === 'twilio' || env.smsProvider === 'twilio') && !env.twilioAuthToken) {
    throw new Error('TWILIO_AUTH_TOKEN is required when Twilio provider modes are enabled.');
  }

  return env;
}
```

- [ ] **Step 5: Add approved review notes to the design spec**

Modify `docs/superpowers/specs/2026-05-05-covault-missed-call-capture-design.md` in the Follow-Up Rules section:

```md
Default rules:

- High urgency:
  - alert sales team immediately through SMS/email provider
  - create callback task due now
  - use a default `high_urgency_escalation_minutes` value of `30`
  - escalate if not actioned within the client's `high_urgency_escalation_minutes`

- Medium urgency:
  - create callback task for the next business day in the client's configured timezone and business hours
  - queue reminder for the sales team
```

Modify the Implementation Readiness list:

```md
7. Add realistic seed data with varied buyer, support, rescheduling, urgent, unqualified, and wrong-number caller intents.
8. Add tests and run verification.
```

- [ ] **Step 6: Install dependencies and verify env test passes**

Run: `npm install`

Expected: `node_modules` and `package-lock.json` are created.

Run: `npm test -- tests/env.test.js`

Expected: PASS with both env tests passing.

- [ ] **Step 7: Commit scaffold configuration**

Run:

```bash
git add package.json package-lock.json .gitignore .env.example index.html vite.config.js vitest.config.js shared/constants.js server/config/env.js tests/env.test.js docs/superpowers/specs/2026-05-05-covault-missed-call-capture-design.md
git commit -m "chore: scaffold Kavor Automation System app configuration"
```

Expected: Commit succeeds.

---

### Task 2: Database Schema, Migration, Seed, And Security Helpers

**Files:**
- Create: `server/db/connection.js`
- Create: `server/db/schema.sql`
- Create: `server/db/migrate.js`
- Create: `server/db/seed.js`
- Create: `server/security/crypto.js`
- Test: `tests/security.test.js`

- [ ] **Step 1: Write the failing security test**

Create `tests/security.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { createCrypto } from '../server/security/crypto.js';

describe('crypto helpers', () => {
  it('encrypts, decrypts, and masks phone numbers', () => {
    const crypto = createCrypto('dev-only-32-byte-key-change-me!!');
    const encrypted = crypto.encrypt('+14155550123');

    expect(encrypted).not.toBe('+14155550123');
    expect(crypto.decrypt(encrypted)).toBe('+14155550123');
    expect(crypto.maskPhone('+14155550123')).toBe('+1 *** *** 0123');
  });
});
```

- [ ] **Step 2: Run the security test to verify it fails**

Run: `npm test -- tests/security.test.js`

Expected: FAIL because `server/security/crypto.js` does not exist.

- [ ] **Step 3: Implement encryption and masking**

Create `server/security/crypto.js`:

```js
import crypto from 'node:crypto';

function deriveKey(secret) {
  return crypto.createHash('sha256').update(secret).digest();
}

export function createCrypto(secret) {
  const key = deriveKey(secret);

  return {
    encrypt(value) {
      if (!value) return '';
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
    },

    decrypt(value) {
      if (!value) return '';
      const [ivText, tagText, encryptedText] = String(value).split('.');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivText, 'base64'));
      decipher.setAuthTag(Buffer.from(tagText, 'base64'));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedText, 'base64')),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    },

    maskPhone(phone) {
      const digits = String(phone).replace(/\D/g, '');
      const lastFour = digits.slice(-4);
      const country = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)}` : '+1';
      return `${country} *** *** ${lastFour}`;
    },
  };
}
```

- [ ] **Step 4: Create database connection and schema**

Create `server/db/connection.js`:

```js
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from '../config/env.js';

export function createDb(config = loadEnv()) {
  const dbPath = config.sqlitePath;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}
```

Create `server/db/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#155EEF',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  business_hours TEXT NOT NULL,
  high_urgency_escalation_minutes INTEGER NOT NULL DEFAULT 30,
  retention_days INTEGER NOT NULL DEFAULT 365,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS missed_calls (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  caller_name TEXT NOT NULL,
  caller_number_encrypted TEXT NOT NULL,
  caller_number_display TEXT NOT NULL,
  call_time TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  voicemail_recording_url_encrypted TEXT NOT NULL,
  voicemail_transcript TEXT NOT NULL DEFAULT '',
  intent_summary TEXT NOT NULL DEFAULT '',
  urgency TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'new',
  source_provider TEXT NOT NULL DEFAULT 'mock',
  provider_call_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS callback_tasks (
  id TEXT PRIMARY KEY,
  missed_call_id TEXT NOT NULL REFERENCES missed_calls(id),
  client_id TEXT NOT NULL REFERENCES clients(id),
  urgency TEXT NOT NULL,
  due_at TEXT NOT NULL,
  assigned_team TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  outcome TEXT NOT NULL DEFAULT '',
  outcome_notes TEXT NOT NULL DEFAULT '',
  completed_at TEXT NOT NULL DEFAULT '',
  escalated_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS follow_up_sequences (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  urgency TEXT NOT NULL,
  due_window_minutes INTEGER NOT NULL,
  channels TEXT NOT NULL,
  escalation_minutes INTEGER NOT NULL DEFAULT 30,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(client_id, urgency)
);

CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  urgency TEXT NOT NULL,
  channel TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(client_id, urgency, channel)
);

CREATE TABLE IF NOT EXISTS follow_up_attempts (
  id TEXT PRIMARY KEY,
  missed_call_id TEXT NOT NULL REFERENCES missed_calls(id),
  callback_task_id TEXT NOT NULL REFERENCES callback_tasks(id),
  client_id TEXT NOT NULL REFERENCES clients(id),
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS booked_meetings (
  id TEXT PRIMARY KEY,
  missed_call_id TEXT NOT NULL REFERENCES missed_calls(id),
  callback_task_id TEXT NOT NULL REFERENCES callback_tasks(id),
  client_id TEXT NOT NULL REFERENCES clients(id),
  meeting_time TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  last_checked_at TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
```

- [ ] **Step 5: Create migration and realistic seed scripts**

Create `server/db/migrate.js`:

```js
import fs from 'node:fs';
import { createDb } from './connection.js';
import { loadEnv } from '../config/env.js';

const reset = process.argv.includes('--reset');
const db = createDb(loadEnv());

if (reset) {
  db.exec(`
    DROP TABLE IF EXISTS audit_events;
    DROP TABLE IF EXISTS integrations;
    DROP TABLE IF EXISTS booked_meetings;
    DROP TABLE IF EXISTS follow_up_attempts;
    DROP TABLE IF EXISTS message_templates;
    DROP TABLE IF EXISTS follow_up_sequences;
    DROP TABLE IF EXISTS callback_tasks;
    DROP TABLE IF EXISTS missed_calls;
    DROP TABLE IF EXISTS clients;
  `);
}

db.exec(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
console.log('Database migrated.');
```

Create `server/db/seed.js` with deterministic, believable data:

```js
import { nanoid } from 'nanoid';
import { createDb } from './connection.js';
import { loadEnv } from '../config/env.js';
import { createCrypto } from '../security/crypto.js';

const now = new Date('2026-05-05T16:00:00.000Z');
const config = loadEnv();
const db = createDb(config);
const secure = createCrypto(config.encryptionKey);

function iso(minutesAgo) {
  return new Date(now.getTime() - minutesAgo * 60_000).toISOString();
}

const client = {
  id: 'client_kavor_demo',
  name: 'Kavor Automation System Demo Client',
  brand_name: 'Kavor Calls',
  logo_url: '',
  primary_color: '#155EEF',
  timezone: 'America/New_York',
  business_hours: JSON.stringify({ monday: ['09:00', '17:00'], tuesday: ['09:00', '17:00'], wednesday: ['09:00', '17:00'], thursday: ['09:00', '17:00'], friday: ['09:00', '17:00'] }),
  high_urgency_escalation_minutes: 30,
  retention_days: 365,
  created_at: iso(1200),
  updated_at: iso(1200),
};

db.prepare(`
  INSERT OR REPLACE INTO clients
  (id, name, brand_name, logo_url, primary_color, timezone, business_hours, high_urgency_escalation_minutes, retention_days, created_at, updated_at)
  VALUES (@id, @name, @brand_name, @logo_url, @primary_color, @timezone, @business_hours, @high_urgency_escalation_minutes, @retention_days, @created_at, @updated_at)
`).run(client);

const calls = [
  ['Avery Johnson', '+14155550123', 18, 'We are ready to book a walkthrough this week and need pricing before our board meeting tomorrow.', 'Buyer ready to book a walkthrough and asking for pricing before a deadline.', 'high', 'open', ''],
  ['Mina Patel', '+16465550144', 74, 'I missed my appointment confirmation and need to move the demo from Thursday morning to Friday afternoon.', 'Existing prospect needs to reschedule a demo.', 'medium', 'completed', 'voicemail_left'],
  ['Jordan Lee', '+13105550188', 138, 'Our current vendor missed another emergency request. I need someone to call me back today about switching.', 'Urgent vendor replacement conversation with same-day callback expectation.', 'high', 'escalated', 'no_answer'],
  ['Taylor Brooks', '+15125550191', 260, 'I saw your ad but I am not sure if this is for residential or commercial service. Please send details.', 'New inquiry asking if the service fits their use case.', 'medium', 'open', ''],
  ['Sam Rivera', '+12065550165', 410, 'Sorry, I think I called the wrong company. Please disregard this message.', 'Caller says this was a wrong number.', 'low', 'completed', 'wrong_number'],
  ['Priya Shah', '+17205550177', 530, 'We have three locations and need missed-call coverage before the holiday weekend. Can sales call me today?', 'Multi-location prospect requests sales callback before holiday weekend.', 'high', 'completed', 'booked_meeting'],
];

for (const [callerName, number, minutesAgo, transcript, summary, urgency, taskStatus, outcome] of calls) {
  const missedCallId = nanoid();
  const callbackTaskId = nanoid();
  const createdAt = iso(minutesAgo);
  db.prepare(`
    INSERT OR REPLACE INTO missed_calls
    (id, client_id, caller_name, caller_number_encrypted, caller_number_display, call_time, duration_seconds, voicemail_recording_url_encrypted, voicemail_transcript, intent_summary, urgency, status, source_provider, provider_call_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    missedCallId,
    client.id,
    callerName,
    secure.encrypt(number),
    secure.maskPhone(number),
    createdAt,
    48,
    secure.encrypt(`https://recordings.example.com/${missedCallId}.mp3`),
    transcript,
    summary,
    urgency,
    'processed',
    'mock',
    `mock_${missedCallId}`,
    createdAt,
    createdAt,
  );

  db.prepare(`
    INSERT OR REPLACE INTO callback_tasks
    (id, missed_call_id, client_id, urgency, due_at, assigned_team, status, outcome, outcome_notes, completed_at, escalated_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    callbackTaskId,
    missedCallId,
    client.id,
    urgency,
    iso(Math.max(minutesAgo - 30, 0)),
    'Sales Team',
    taskStatus,
    outcome,
    outcome ? `Demo seed outcome: ${outcome}` : '',
    taskStatus === 'completed' ? iso(Math.max(minutesAgo - 20, 0)) : '',
    taskStatus === 'escalated' ? iso(Math.max(minutesAgo - 100, 0)) : '',
    createdAt,
    createdAt,
  );

  if (outcome === 'booked_meeting') {
    db.prepare(`
      INSERT OR REPLACE INTO booked_meetings
      (id, missed_call_id, callback_task_id, client_id, meeting_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nanoid(), missedCallId, callbackTaskId, client.id, new Date(now.getTime() + 86_400_000).toISOString(), iso(20));
  }
}

const sequences = [
  ['high', 0, ['sms', 'email'], 30],
  ['medium', 1440, ['email'], 30],
  ['low', 4320, ['email'], 30],
];

for (const [urgency, dueWindow, channels, escalation] of sequences) {
  db.prepare(`
    INSERT OR REPLACE INTO follow_up_sequences
    (id, client_id, urgency, due_window_minutes, channels, escalation_minutes, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(`seq_${urgency}`, client.id, urgency, dueWindow, JSON.stringify(channels), escalation, iso(1200), iso(1200));
}

const templates = [
  ['high', 'sms', '', 'Urgent missed call from {{caller_name}}: {{intent_summary}}. Call back now at {{caller_number}}.'],
  ['high', 'email', 'High urgency missed call for {{client_brand_name}}', '{{caller_name}} needs immediate follow-up: {{intent_summary}}'],
  ['medium', 'email', 'Callback queued for {{client_brand_name}}', '{{caller_name}} should be called during the next business day. Context: {{intent_summary}}'],
  ['low', 'email', 'Low urgency missed call logged', '{{caller_name}} left a low-priority message: {{intent_summary}}'],
];

for (const [urgency, channel, subject, body] of templates) {
  db.prepare(`
    INSERT OR REPLACE INTO message_templates
    (id, client_id, urgency, channel, subject, body, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(`template_${urgency}_${channel}`, client.id, urgency, channel, subject, body, iso(1200), iso(1200));
}

console.log('Database seeded with realistic Kavor Automation System demo data.');
```

- [ ] **Step 6: Run migration, seed, and security test**

Run: `npm run db:reset`

Expected: Console includes `Database migrated.` and `Database seeded with realistic Kavor Automation System demo data.`

Run: `npm test -- tests/security.test.js`

Expected: PASS.

- [ ] **Step 7: Commit database and security foundation**

Run:

```bash
git add server/db server/security tests/security.test.js
git commit -m "feat: add local database and encryption foundation"
```

Expected: Commit succeeds.

---

### Task 3: Repositories And Audit Logging

**Files:**
- Create: `server/repositories/clientRepository.js`
- Create: `server/repositories/callRepository.js`
- Create: `server/repositories/sequenceRepository.js`
- Create: `server/repositories/integrationRepository.js`
- Create: `server/repositories/auditRepository.js`
- Create: `server/security/audit.js`
- Test: `tests/repositories.test.js`

- [ ] **Step 1: Write failing repository tests**

Create `tests/repositories.test.js`:

```js
import Database from 'better-sqlite3';
import fs from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { createClientRepository } from '../server/repositories/clientRepository.js';
import { createCallRepository } from '../server/repositories/callRepository.js';
import { createSequenceRepository } from '../server/repositories/sequenceRepository.js';

function createMemoryDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(new URL('../server/db/schema.sql', import.meta.url), 'utf8'));
  return db;
}

describe('repositories', () => {
  let db;

  beforeEach(() => {
    db = createMemoryDb();
  });

  it('stores clients with default 30 minute escalation', () => {
    const clients = createClientRepository(db);
    clients.upsert({
      id: 'client_1',
      name: 'Apex Dental',
      brand_name: 'Apex Dental',
      logo_url: '',
      primary_color: '#155EEF',
      timezone: 'America/New_York',
      business_hours: { monday: ['09:00', '17:00'] },
      retention_days: 365,
    });

    expect(clients.getById('client_1').high_urgency_escalation_minutes).toBe(30);
  });

  it('tracks callback outcomes and booked meetings', () => {
    const clients = createClientRepository(db);
    const calls = createCallRepository(db);
    clients.upsert({
      id: 'client_1',
      name: 'Apex Dental',
      brand_name: 'Apex Dental',
      logo_url: '',
      primary_color: '#155EEF',
      timezone: 'America/New_York',
      business_hours: { monday: ['09:00', '17:00'] },
      high_urgency_escalation_minutes: 30,
      retention_days: 365,
    });

    calls.insertMissedCall({
      id: 'call_1',
      client_id: 'client_1',
      caller_name: 'Jamie Fox',
      caller_number_encrypted: 'encrypted',
      caller_number_display: '+1 *** *** 1212',
      call_time: '2026-05-05T14:00:00.000Z',
      duration_seconds: 42,
      voicemail_recording_url_encrypted: 'recording',
      voicemail_transcript: 'Need pricing today.',
      intent_summary: 'Pricing request.',
      urgency: 'high',
      status: 'processed',
      source_provider: 'mock',
      provider_call_id: 'mock_1',
    });

    calls.insertCallbackTask({
      id: 'task_1',
      missed_call_id: 'call_1',
      client_id: 'client_1',
      urgency: 'high',
      due_at: '2026-05-05T14:00:00.000Z',
      assigned_team: 'Sales Team',
    });

    calls.completeCallback('task_1', {
      outcome: 'booked_meeting',
      outcome_notes: 'Booked Friday demo.',
      completed_at: '2026-05-05T14:20:00.000Z',
    });

    calls.insertBookedMeeting({
      id: 'meeting_1',
      missed_call_id: 'call_1',
      callback_task_id: 'task_1',
      client_id: 'client_1',
      meeting_time: '2026-05-08T15:00:00.000Z',
    });

    const task = calls.getCallbackTask('task_1');
    expect(task.status).toBe('completed');
    expect(task.outcome).toBe('booked_meeting');
    expect(calls.listCalls()[0].outcome).toBe('booked_meeting');
  });

  it('persists sequence templates by client, urgency, and channel', () => {
    const clients = createClientRepository(db);
    const sequences = createSequenceRepository(db);
    clients.upsert({
      id: 'client_1',
      name: 'Apex Dental',
      brand_name: 'Apex Dental',
      logo_url: '',
      primary_color: '#155EEF',
      timezone: 'America/New_York',
      business_hours: { monday: ['09:00', '17:00'] },
      high_urgency_escalation_minutes: 30,
      retention_days: 365,
    });

    sequences.upsertTemplate({
      id: 'template_1',
      client_id: 'client_1',
      urgency: 'high',
      channel: 'sms',
      subject: '',
      body: 'Call {{caller_name}} now.',
    });

    expect(sequences.listTemplates('client_1')[0].body).toBe('Call {{caller_name}} now.');
  });
});
```

- [ ] **Step 2: Run repository tests to verify they fail**

Run: `npm test -- tests/repositories.test.js`

Expected: FAIL because repository modules do not exist.

- [ ] **Step 3: Implement repository modules**

Create focused repository files with these exported factories and methods:

`server/repositories/clientRepository.js`:

```js
import { nanoid } from 'nanoid';

const now = () => new Date().toISOString();

export function createClientRepository(db) {
  return {
    upsert(input) {
      const record = {
        id: input.id || nanoid(),
        name: input.name,
        brand_name: input.brand_name,
        logo_url: input.logo_url || '',
        primary_color: input.primary_color || '#155EEF',
        timezone: input.timezone || 'America/New_York',
        business_hours: JSON.stringify(input.business_hours || { monday: ['09:00', '17:00'], tuesday: ['09:00', '17:00'], wednesday: ['09:00', '17:00'], thursday: ['09:00', '17:00'], friday: ['09:00', '17:00'] }),
        high_urgency_escalation_minutes: input.high_urgency_escalation_minutes ?? 30,
        retention_days: input.retention_days || 365,
        created_at: input.created_at || now(),
        updated_at: now(),
      };

      db.prepare(`
        INSERT INTO clients
        (id, name, brand_name, logo_url, primary_color, timezone, business_hours, high_urgency_escalation_minutes, retention_days, created_at, updated_at)
        VALUES (@id, @name, @brand_name, @logo_url, @primary_color, @timezone, @business_hours, @high_urgency_escalation_minutes, @retention_days, @created_at, @updated_at)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          brand_name=excluded.brand_name,
          logo_url=excluded.logo_url,
          primary_color=excluded.primary_color,
          timezone=excluded.timezone,
          business_hours=excluded.business_hours,
          high_urgency_escalation_minutes=excluded.high_urgency_escalation_minutes,
          retention_days=excluded.retention_days,
          updated_at=excluded.updated_at
      `).run(record);

      return this.getById(record.id);
    },

    getById(id) {
      const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
      if (!row) return null;
      return { ...row, business_hours: JSON.parse(row.business_hours) };
    },
  };
}
```

`server/repositories/callRepository.js` must export methods named in the tests plus `listOpenHighUrgencyTasks`, `markEscalated`, `insertFollowUpAttempt`, and `getMetricsRows`. Use SQL joins so `listCalls()` returns each call with `callback_task_id`, `due_at`, `callback_status`, `outcome`, and `escalated_at`.

`server/repositories/sequenceRepository.js` must export `upsertSequence`, `listSequences`, `upsertTemplate`, `listTemplates`, and `saveClientSequenceBundle(clientId, payload)`.

`server/repositories/integrationRepository.js` must export `upsert`, `list`, and `getStatusSummary`.

`server/repositories/auditRepository.js` must export `insert` and `listRecent`.

Use `nanoid()` for missing ids and ISO strings for timestamps in every repository.

- [ ] **Step 4: Implement audit helper**

Create `server/security/audit.js`:

```js
import { nanoid } from 'nanoid';

export function createAuditLogger(auditRepository) {
  return {
    record({ client_id, entity_type, entity_id, action, metadata = {} }) {
      return auditRepository.insert({
        id: nanoid(),
        client_id,
        entity_type,
        entity_id,
        action,
        metadata,
        created_at: new Date().toISOString(),
      });
    },
  };
}
```

- [ ] **Step 5: Run repository tests**

Run: `npm test -- tests/repositories.test.js`

Expected: PASS.

- [ ] **Step 6: Commit repositories**

Run:

```bash
git add server/repositories server/security/audit.js tests/repositories.test.js
git commit -m "feat: add persistence repositories"
```

Expected: Commit succeeds.

---

### Task 4: Provider Adapters

**Files:**
- Create: `server/providers/index.js`
- Create: `server/providers/mockPhoneProvider.js`
- Create: `server/providers/mockTranscriptionProvider.js`
- Create: `server/providers/mockIntentProvider.js`
- Create: `server/providers/mockNotificationProviders.js`
- Create: `server/providers/liveProviderStubs.js`
- Test: `tests/providers.test.js`

- [ ] **Step 1: Write failing provider tests**

Create `tests/providers.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { createProviders } from '../server/providers/index.js';

describe('providers', () => {
  it('creates deterministic mock providers', async () => {
    const providers = createProviders({
      phoneProvider: 'mock',
      transcriptionProvider: 'mock',
      intentProvider: 'mock',
      smsProvider: 'mock',
      emailProvider: 'mock',
    });

    const payload = providers.phone.sampleMissedCall();
    const transcript = await providers.transcription.transcribe({ recordingUrl: payload.recordingUrl, providerCallId: payload.providerCallId });
    const intent = await providers.intent.analyze({ transcript });
    const sms = await providers.sms.send({ to: '+14155550123', message: 'Call back now' });

    expect(payload.from).toMatch(/^\+/);
    expect(transcript).toContain('walkthrough');
    expect(intent.urgency).toBe('high');
    expect(sms.status).toBe('sent');
  });
});
```

- [ ] **Step 2: Run provider tests to verify they fail**

Run: `npm test -- tests/providers.test.js`

Expected: FAIL because provider files do not exist.

- [ ] **Step 3: Implement mock providers and factory**

Create `server/providers/mockPhoneProvider.js`:

```js
export function createMockPhoneProvider() {
  return {
    sampleMissedCall() {
      return {
        clientId: 'client_kavor_demo',
        from: '+14155550123',
        callerName: 'Avery Johnson',
        callTime: new Date().toISOString(),
        durationSeconds: 52,
        recordingUrl: 'mock://recordings/high-priority-buyer',
        providerCallId: `mock_call_${Date.now()}`,
      };
    },
  };
}
```

Create `server/providers/mockTranscriptionProvider.js`:

```js
const transcripts = new Map([
  ['mock://recordings/high-priority-buyer', 'Hi, this is Avery Johnson. We are ready to book a walkthrough this week and need pricing before our board meeting tomorrow. Please call me back today.'],
]);

export function createMockTranscriptionProvider() {
  return {
    async transcribe({ recordingUrl }) {
      return transcripts.get(recordingUrl) || 'Hi, I missed your call and would like someone to call me back when available.';
    },
  };
}
```

Create `server/providers/mockIntentProvider.js`:

```js
import { URGENCY } from '../../shared/constants.js';

export function createMockIntentProvider() {
  return {
    async analyze({ transcript }) {
      const text = transcript.toLowerCase();
      if (text.includes('today') || text.includes('tomorrow') || text.includes('ready to book')) {
        return {
          callerName: transcript.match(/this is ([A-Z][a-z]+ [A-Z][a-z]+)/)?.[1] || '',
          intentSummary: 'Caller is ready to move forward and needs same-day sales follow-up.',
          urgency: URGENCY.HIGH,
          rationale: 'Detected deadline language and booking intent.',
        };
      }
      if (text.includes('wrong company') || text.includes('disregard')) {
        return {
          callerName: '',
          intentSummary: 'Caller indicated the call was not a qualified opportunity.',
          urgency: URGENCY.LOW,
          rationale: 'Detected wrong-number language.',
        };
      }
      return {
        callerName: '',
        intentSummary: 'Caller needs routine follow-up during business hours.',
        urgency: URGENCY.MEDIUM,
        rationale: 'No immediate deadline detected.',
      };
    },
  };
}
```

Create `server/providers/mockNotificationProviders.js`:

```js
export function createMockSmsProvider() {
  return {
    async send({ to, message }) {
      return { id: `mock_sms_${Date.now()}`, to, message, status: 'sent' };
    },
  };
}

export function createMockEmailProvider() {
  return {
    async send({ to, subject, message }) {
      return { id: `mock_email_${Date.now()}`, to, subject, message, status: 'sent' };
    },
  };
}
```

Create `server/providers/liveProviderStubs.js`:

```js
export function createUnavailableLiveProvider(name) {
  return new Proxy(
    {},
    {
      get() {
        return async () => {
          throw new Error(`${name} live provider is configured but no live adapter has been implemented in this scaffold.`);
        };
      },
    },
  );
}
```

Create `server/providers/index.js`:

```js
import { createMockPhoneProvider } from './mockPhoneProvider.js';
import { createMockTranscriptionProvider } from './mockTranscriptionProvider.js';
import { createMockIntentProvider } from './mockIntentProvider.js';
import { createMockSmsProvider, createMockEmailProvider } from './mockNotificationProviders.js';
import { createUnavailableLiveProvider } from './liveProviderStubs.js';

export function createProviders(config) {
  return {
    phone: config.phoneProvider === 'mock' ? createMockPhoneProvider() : createUnavailableLiveProvider('Twilio phone'),
    transcription: config.transcriptionProvider === 'mock' ? createMockTranscriptionProvider() : createUnavailableLiveProvider('Transcription'),
    intent: config.intentProvider === 'mock' ? createMockIntentProvider() : createUnavailableLiveProvider('AI intent'),
    sms: config.smsProvider === 'mock' ? createMockSmsProvider() : createUnavailableLiveProvider('SMS'),
    email: config.emailProvider === 'mock' ? createMockEmailProvider() : createUnavailableLiveProvider('Email'),
  };
}
```

- [ ] **Step 4: Run provider tests**

Run: `npm test -- tests/providers.test.js`

Expected: PASS.

- [ ] **Step 5: Commit providers**

Run:

```bash
git add server/providers tests/providers.test.js
git commit -m "feat: add switchable provider adapters"
```

Expected: Commit succeeds.

---

### Task 5: Business-Time And Follow-Up Services

**Files:**
- Create: `server/services/businessTime.js`
- Create: `server/services/followUpService.js`
- Test: `tests/businessTime.test.js`
- Test: `tests/followUpService.test.js`

- [ ] **Step 1: Write failing business-time tests**

Create `tests/businessTime.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { calculateDueAt } from '../server/services/businessTime.js';

const businessHours = {
  monday: ['09:00', '17:00'],
  tuesday: ['09:00', '17:00'],
  wednesday: ['09:00', '17:00'],
  thursday: ['09:00', '17:00'],
  friday: ['09:00', '17:00'],
};

describe('calculateDueAt', () => {
  it('sets high urgency due immediately', () => {
    const dueAt = calculateDueAt({
      callTime: '2026-05-05T14:00:00.000Z',
      urgency: 'high',
      timezone: 'America/New_York',
      businessHours,
    });

    expect(dueAt).toBe('2026-05-05T14:00:00.000Z');
  });

  it('queues medium urgency for next business day inside client hours', () => {
    const dueAt = calculateDueAt({
      callTime: '2026-05-08T22:30:00.000Z',
      urgency: 'medium',
      timezone: 'America/New_York',
      businessHours,
    });

    expect(dueAt).toBe('2026-05-11T13:00:00.000Z');
  });
});
```

- [ ] **Step 2: Write failing follow-up service tests**

Create `tests/followUpService.test.js` with an in-memory database and assertions:

```js
import Database from 'better-sqlite3';
import fs from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { createClientRepository } from '../server/repositories/clientRepository.js';
import { createCallRepository } from '../server/repositories/callRepository.js';
import { createSequenceRepository } from '../server/repositories/sequenceRepository.js';
import { createFollowUpService } from '../server/services/followUpService.js';

function setupDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(new URL('../server/db/schema.sql', import.meta.url), 'utf8'));
  return db;
}

describe('followUpService', () => {
  let db;
  let clients;
  let calls;
  let sequences;

  beforeEach(() => {
    db = setupDb();
    clients = createClientRepository(db);
    calls = createCallRepository(db);
    sequences = createSequenceRepository(db);
    clients.upsert({
      id: 'client_1',
      name: 'Apex Dental',
      brand_name: 'Apex Dental',
      logo_url: '',
      primary_color: '#155EEF',
      timezone: 'America/New_York',
      business_hours: { monday: ['09:00', '17:00'], tuesday: ['09:00', '17:00'], wednesday: ['09:00', '17:00'], thursday: ['09:00', '17:00'], friday: ['09:00', '17:00'] },
      high_urgency_escalation_minutes: 30,
      retention_days: 365,
    });
    sequences.upsertSequence({ id: 'seq_high', client_id: 'client_1', urgency: 'high', due_window_minutes: 0, channels: ['sms', 'email'], escalation_minutes: 30, enabled: 1 });
    sequences.upsertTemplate({ id: 'template_high_sms', client_id: 'client_1', urgency: 'high', channel: 'sms', subject: '', body: 'Call {{caller_name}} now: {{intent_summary}}' });
  });

  it('creates immediate high urgency callback task and follow-up attempts', async () => {
    calls.insertMissedCall({
      id: 'call_1',
      client_id: 'client_1',
      caller_name: 'Avery Johnson',
      caller_number_encrypted: 'encrypted',
      caller_number_display: '+1 *** *** 0123',
      call_time: '2026-05-05T14:00:00.000Z',
      duration_seconds: 42,
      voicemail_recording_url_encrypted: 'recording',
      voicemail_transcript: 'Need pricing today.',
      intent_summary: 'Needs pricing today.',
      urgency: 'high',
      status: 'processed',
      source_provider: 'mock',
      provider_call_id: 'mock_1',
    });

    const sent = [];
    const service = createFollowUpService({
      callRepository: calls,
      sequenceRepository: sequences,
      smsProvider: { send: async (message) => sent.push(message) || { status: 'sent' } },
      emailProvider: { send: async (message) => sent.push(message) || { status: 'sent' } },
    });

    const task = await service.createCallbackForCall({
      call: calls.getCallById('call_1'),
      client: clients.getById('client_1'),
    });

    expect(task.due_at).toBe('2026-05-05T14:00:00.000Z');
    expect(sent[0].message).toContain('Avery Johnson');
  });

  it('escalates stale high urgency tasks after 30 minutes', async () => {
    calls.insertMissedCall({
      id: 'call_2',
      client_id: 'client_1',
      caller_name: 'Jordan Lee',
      caller_number_encrypted: 'encrypted',
      caller_number_display: '+1 *** *** 0188',
      call_time: '2026-05-05T14:00:00.000Z',
      duration_seconds: 42,
      voicemail_recording_url_encrypted: 'recording',
      voicemail_transcript: 'Need callback today.',
      intent_summary: 'Needs callback today.',
      urgency: 'high',
      status: 'processed',
      source_provider: 'mock',
      provider_call_id: 'mock_2',
    });
    calls.insertCallbackTask({
      id: 'task_2',
      missed_call_id: 'call_2',
      client_id: 'client_1',
      urgency: 'high',
      due_at: '2026-05-05T14:00:00.000Z',
      assigned_team: 'Sales Team',
    });

    const service = createFollowUpService({
      callRepository: calls,
      sequenceRepository: sequences,
      smsProvider: { send: async () => ({ status: 'sent' }) },
      emailProvider: { send: async () => ({ status: 'sent' }) },
    });

    const result = await service.escalateStaleHighUrgency({
      now: '2026-05-05T14:31:00.000Z',
      clientsById: new Map([['client_1', clients.getById('client_1')]]),
    });

    expect(result.escalated).toHaveLength(1);
    expect(calls.getCallbackTask('task_2').status).toBe('escalated');
  });
});
```

- [ ] **Step 3: Run service tests to verify they fail**

Run: `npm test -- tests/businessTime.test.js tests/followUpService.test.js`

Expected: FAIL because service files do not exist.

- [ ] **Step 4: Implement `businessTime.js`**

Create `server/services/businessTime.js`:

```js
import { addDays, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function nextBusinessStart(date, timezone, businessHours) {
  for (let offset = 0; offset < 10; offset += 1) {
    const candidate = addDays(date, offset);
    const zoned = toZonedTime(candidate, timezone);
    const dayName = dayNames[zoned.getDay()];
    const hours = businessHours[dayName];
    if (hours) {
      const localDate = format(zoned, 'yyyy-MM-dd');
      return fromZonedTime(`${localDate}T${hours[0]}:00`, timezone).toISOString();
    }
  }
  return date.toISOString();
}

export function calculateDueAt({ callTime, urgency, timezone, businessHours }) {
  const callDate = new Date(callTime);
  if (urgency === 'high') return callDate.toISOString();
  if (urgency === 'low') return nextBusinessStart(addDays(callDate, 3), timezone, businessHours);
  return nextBusinessStart(addDays(callDate, 1), timezone, businessHours);
}
```

- [ ] **Step 5: Implement `followUpService.js`**

Create `server/services/followUpService.js`:

```js
import { nanoid } from 'nanoid';
import { CALLBACK_STATUS } from '../../shared/constants.js';
import { calculateDueAt } from './businessTime.js';

function renderTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? '');
}

export function createFollowUpService({ callRepository, sequenceRepository, smsProvider, emailProvider }) {
  return {
    async createCallbackForCall({ call, client }) {
      const dueAt = calculateDueAt({
        callTime: call.call_time,
        urgency: call.urgency,
        timezone: client.timezone,
        businessHours: client.business_hours,
      });
      const task = callRepository.insertCallbackTask({
        id: nanoid(),
        missed_call_id: call.id,
        client_id: client.id,
        urgency: call.urgency,
        due_at: dueAt,
        assigned_team: 'Sales Team',
      });
      const templates = sequenceRepository
        .listTemplates(client.id)
        .filter((template) => template.urgency === call.urgency);

      const values = {
        caller_name: call.caller_name,
        caller_number: call.caller_number_display,
        intent_summary: call.intent_summary,
        client_brand_name: client.brand_name,
        callback_due: dueAt,
      };

      for (const template of templates) {
        const message = renderTemplate(template.body, values);
        const provider = template.channel === 'sms' ? smsProvider : emailProvider;
        const response = await provider.send({
          to: template.channel === 'sms' ? '+15555550100' : 'sales@example.com',
          subject: renderTemplate(template.subject || `Missed call for ${client.brand_name}`, values),
          message,
        });
        callRepository.insertFollowUpAttempt({
          id: nanoid(),
          missed_call_id: call.id,
          callback_task_id: task.id,
          client_id: client.id,
          channel: template.channel,
          recipient: template.channel === 'sms' ? '+15555550100' : 'sales@example.com',
          message,
          status: response.status,
          sent_at: new Date().toISOString(),
        });
      }

      return task;
    },

    completeCallback(taskId, outcome, outcomeNotes = '') {
      return callRepository.completeCallback(taskId, {
        outcome,
        outcome_notes: outcomeNotes,
        completed_at: new Date().toISOString(),
      });
    },

    async escalateStaleHighUrgency({ now = new Date().toISOString(), clientsById }) {
      const stale = callRepository.listOpenHighUrgencyTasks().filter((task) => {
        const client = clientsById.get(task.client_id);
        const threshold = client?.high_urgency_escalation_minutes ?? 30;
        const ageMinutes = (new Date(now).getTime() - new Date(task.due_at).getTime()) / 60_000;
        return ageMinutes >= threshold;
      });

      for (const task of stale) {
        callRepository.markEscalated(task.id, now);
        await smsProvider.send({
          to: '+15555550100',
          message: `Escalation: high urgency missed call for ${task.caller_name} is still open.`,
        });
      }

      return { escalated: stale.map((task) => ({ ...task, status: CALLBACK_STATUS.ESCALATED })) };
    },
  };
}
```

- [ ] **Step 6: Run service tests**

Run: `npm test -- tests/businessTime.test.js tests/followUpService.test.js`

Expected: PASS.

- [ ] **Step 7: Commit services**

Run:

```bash
git add server/services tests/businessTime.test.js tests/followUpService.test.js
git commit -m "feat: add follow-up rules and business-time scheduling"
```

Expected: Commit succeeds.

---

### Task 6: Ingestion, Metrics, Express App, And API Routes

**Files:**
- Create: `server/services/ingestionService.js`
- Create: `server/services/metricsService.js`
- Create: `server/app.js`
- Create: `server/index.js`
- Create: `server/routes/webhookRoutes.js`
- Create: `server/routes/demoRoutes.js`
- Create: `server/routes/callRoutes.js`
- Create: `server/routes/clientRoutes.js`
- Create: `server/routes/metricsRoutes.js`
- Create: `server/routes/integrationRoutes.js`
- Test: `tests/ingestionService.test.js`
- Test: `tests/metrics.test.js`
- Test: `tests/api.test.js`

- [ ] **Step 1: Write failing ingestion and API tests**

Create `tests/ingestionService.test.js`:

```js
import Database from 'better-sqlite3';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createClientRepository } from '../server/repositories/clientRepository.js';
import { createCallRepository } from '../server/repositories/callRepository.js';
import { createSequenceRepository } from '../server/repositories/sequenceRepository.js';
import { createCrypto } from '../server/security/crypto.js';
import { createIngestionService } from '../server/services/ingestionService.js';

function setup() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(new URL('../server/db/schema.sql', import.meta.url), 'utf8'));
  const clients = createClientRepository(db);
  clients.upsert({
    id: 'client_kavor_demo',
    name: 'Kavor Automation System Demo Client',
    brand_name: 'Kavor Calls',
    logo_url: '',
    primary_color: '#155EEF',
    timezone: 'America/New_York',
    business_hours: { monday: ['09:00', '17:00'], tuesday: ['09:00', '17:00'], wednesday: ['09:00', '17:00'], thursday: ['09:00', '17:00'], friday: ['09:00', '17:00'] },
    high_urgency_escalation_minutes: 30,
    retention_days: 365,
  });
  return { db, clients };
}

describe('ingestionService', () => {
  it('processes a missed call into a stored call and callback task', async () => {
    const { db, clients } = setup();
    const calls = createCallRepository(db);
    const sequences = createSequenceRepository(db);
    sequences.upsertTemplate({ id: 't1', client_id: 'client_kavor_demo', urgency: 'high', channel: 'sms', subject: '', body: 'Call {{caller_name}} now.' });
    const service = createIngestionService({
      clientRepository: clients,
      callRepository: calls,
      sequenceRepository: sequences,
      crypto: createCrypto('dev-only-32-byte-key-change-me!!'),
      transcriptionProvider: { transcribe: async () => 'This is Avery Johnson. We are ready to book and need pricing today.' },
      intentProvider: { analyze: async () => ({ callerName: 'Avery Johnson', intentSummary: 'Ready to book and needs pricing today.', urgency: 'high', rationale: 'Booking and deadline language.' }) },
      smsProvider: { send: async () => ({ status: 'sent' }) },
      emailProvider: { send: async () => ({ status: 'sent' }) },
    });

    const result = await service.processMissedCall({
      clientId: 'client_kavor_demo',
      from: '+14155550123',
      callerName: '',
      callTime: '2026-05-05T14:00:00.000Z',
      durationSeconds: 52,
      recordingUrl: 'mock://recordings/high-priority-buyer',
      providerCallId: 'mock_1',
    });

    expect(result.call.caller_name).toBe('Avery Johnson');
    expect(result.call.urgency).toBe('high');
    expect(result.callbackTask.due_at).toBe('2026-05-05T14:00:00.000Z');
    expect(calls.listCalls()).toHaveLength(1);
  });
});
```

Create `tests/metrics.test.js`:

```js
import Database from 'better-sqlite3';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createMetricsService } from '../server/services/metricsService.js';

describe('metricsService', () => {
  it('computes callback and conversion metrics from repository rows', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    db.exec(fs.readFileSync(new URL('../server/db/schema.sql', import.meta.url), 'utf8'));
    const service = createMetricsService({
      getMetricsRows: () => [
        { urgency: 'high', callback_status: 'completed', outcome: 'booked_meeting', completed_at: '2026-05-05T14:20:00.000Z', call_time: '2026-05-05T14:00:00.000Z' },
        { urgency: 'medium', callback_status: 'completed', outcome: 'voicemail_left', completed_at: '2026-05-05T16:00:00.000Z', call_time: '2026-05-05T15:00:00.000Z' },
        { urgency: 'high', callback_status: 'open', outcome: '', completed_at: '', call_time: '2026-05-05T15:30:00.000Z' },
      ],
    });

    const metrics = service.getDashboardMetrics();

    expect(metrics.totalMissedCalls).toBe(3);
    expect(metrics.callbackCompletionRate).toBe(67);
    expect(metrics.bookedMeetings).toBe(1);
    expect(metrics.conversionRate).toBe(33);
    expect(metrics.outcomes.booked_meeting).toBe(1);
  });
});
```

Create `tests/api.test.js`:

```js
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';

describe('api', () => {
  it('returns integration status and metrics', async () => {
    const app = createApp({ useMemoryDb: true, seed: true });

    const integrations = await request(app).get('/api/integrations/status');
    expect(integrations.status).toBe(200);
    expect(integrations.body.providers.phone.mode).toBe('mock');

    const metrics = await request(app).get('/api/metrics');
    expect(metrics.status).toBe(200);
    expect(metrics.body.totalMissedCalls).toBeGreaterThan(0);
  });

  it('processes a demo missed call', async () => {
    const app = createApp({ useMemoryDb: true, seed: true });
    const response = await request(app).post('/api/demo/process-missed-call').send({});

    expect(response.status).toBe(201);
    expect(response.body.call.intent_summary).toContain('same-day');
  });
});
```

- [ ] **Step 2: Run ingestion, metrics, and API tests to verify they fail**

Run: `npm test -- tests/ingestionService.test.js tests/metrics.test.js tests/api.test.js`

Expected: FAIL because services, app, and routes do not exist.

- [ ] **Step 3: Implement ingestion service**

Create `server/services/ingestionService.js`:

```js
import { nanoid } from 'nanoid';
import { createFollowUpService } from './followUpService.js';

export function createIngestionService({
  clientRepository,
  callRepository,
  sequenceRepository,
  crypto,
  transcriptionProvider,
  intentProvider,
  smsProvider,
  emailProvider,
}) {
  return {
    async processMissedCall(payload) {
      const client = clientRepository.getById(payload.clientId);
      if (!client) throw new Error(`Client not found: ${payload.clientId}`);

      const transcript = await transcriptionProvider.transcribe({
        recordingUrl: payload.recordingUrl,
        providerCallId: payload.providerCallId,
      });
      const intent = await intentProvider.analyze({ transcript });
      const callerName = payload.callerName || intent.callerName || 'Unknown Caller';
      const now = new Date().toISOString();

      const call = callRepository.insertMissedCall({
        id: nanoid(),
        client_id: client.id,
        caller_name: callerName,
        caller_number_encrypted: crypto.encrypt(payload.from),
        caller_number_display: crypto.maskPhone(payload.from),
        call_time: payload.callTime,
        duration_seconds: payload.durationSeconds || 0,
        voicemail_recording_url_encrypted: crypto.encrypt(payload.recordingUrl),
        voicemail_transcript: transcript,
        intent_summary: intent.intentSummary,
        urgency: intent.urgency,
        status: 'processed',
        source_provider: 'mock',
        provider_call_id: payload.providerCallId,
        created_at: now,
        updated_at: now,
      });

      const followUp = createFollowUpService({
        callRepository,
        sequenceRepository,
        smsProvider,
        emailProvider,
      });
      const callbackTask = await followUp.createCallbackForCall({ call, client });

      return { call, callbackTask, intent };
    },
  };
}
```

- [ ] **Step 4: Implement metrics service**

Create `server/services/metricsService.js`:

```js
export function createMetricsService(callRepository) {
  return {
    getDashboardMetrics() {
      const rows = callRepository.getMetricsRows();
      const total = rows.length;
      const completed = rows.filter((row) => row.callback_status === 'completed').length;
      const booked = rows.filter((row) => row.outcome === 'booked_meeting').length;
      const urgency = { high: 0, medium: 0, low: 0 };
      const outcomes = {};
      let responseTotal = 0;
      let responseCount = 0;

      for (const row of rows) {
        urgency[row.urgency] = (urgency[row.urgency] || 0) + 1;
        if (row.outcome) outcomes[row.outcome] = (outcomes[row.outcome] || 0) + 1;
        if (row.completed_at) {
          responseTotal += (new Date(row.completed_at).getTime() - new Date(row.call_time).getTime()) / 60_000;
          responseCount += 1;
        }
      }

      return {
        totalMissedCalls: total,
        urgency,
        callbackCompletionRate: total ? Math.round((completed / total) * 100) : 0,
        bookedMeetings: booked,
        conversionRate: total ? Math.round((booked / total) * 100) : 0,
        averageResponseMinutes: responseCount ? Math.round(responseTotal / responseCount) : 0,
        outcomes,
      };
    },
  };
}
```

- [ ] **Step 5: Implement Express app and routes**

Create `server/app.js`:

```js
import express from 'express';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import { loadEnv } from './config/env.js';
import { createDb } from './db/connection.js';
import { createCrypto } from './security/crypto.js';
import { createProviders } from './providers/index.js';
import { createClientRepository } from './repositories/clientRepository.js';
import { createCallRepository } from './repositories/callRepository.js';
import { createSequenceRepository } from './repositories/sequenceRepository.js';
import { createIntegrationRepository } from './repositories/integrationRepository.js';
import { registerDemoRoutes } from './routes/demoRoutes.js';
import { registerWebhookRoutes } from './routes/webhookRoutes.js';
import { registerCallRoutes } from './routes/callRoutes.js';
import { registerClientRoutes } from './routes/clientRoutes.js';
import { registerMetricsRoutes } from './routes/metricsRoutes.js';
import { registerIntegrationRoutes } from './routes/integrationRoutes.js';

function createMemoryDatabase() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(new URL('./db/schema.sql', import.meta.url), 'utf8'));
  return db;
}

export function createApp(options = {}) {
  const config = loadEnv(options.env || process.env);
  const db = options.useMemoryDb ? createMemoryDatabase() : createDb(config);
  const providers = createProviders(config);
  const repositories = {
    clients: createClientRepository(db),
    calls: createCallRepository(db),
    sequences: createSequenceRepository(db),
    integrations: createIntegrationRepository(db),
  };
  const secure = createCrypto(config.encryptionKey);
  const app = express();

  app.use(express.json());

  registerDemoRoutes(app, { repositories, providers, secure });
  registerWebhookRoutes(app, { repositories, providers, secure });
  registerCallRoutes(app, { repositories, providers });
  registerClientRoutes(app, { repositories });
  registerMetricsRoutes(app, { repositories });
  registerIntegrationRoutes(app, { config });

  return app;
}
```

Create `server/index.js`:

```js
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';

const config = loadEnv();
const app = createApp();

app.listen(config.port, () => {
  console.log(`Kavor Automation System API listening on http://127.0.0.1:${config.port}`);
});
```

Implement each route file as a small `registerXRoutes(app, deps)` function. Endpoint names must match the design spec. Use `res.status(201).json(...)` for created demo/webhook calls and `res.json(...)` for reads/updates.

- [ ] **Step 6: Run API tests**

Run: `npm test -- tests/ingestionService.test.js tests/metrics.test.js tests/api.test.js`

Expected: PASS.

- [ ] **Step 7: Commit API workflow**

Run:

```bash
git add server/services server/app.js server/index.js server/routes tests/ingestionService.test.js tests/metrics.test.js tests/api.test.js
git commit -m "feat: add missed-call processing API"
```

Expected: Commit succeeds.

---

### Task 7: React Dashboard And Interaction Flow

**Files:**
- Create: `client/main.jsx`
- Create: `client/App.jsx`
- Create: `client/api.js`
- Create: `client/data/formatters.js`
- Create: `client/components/AppShell.jsx`
- Create: `client/components/MetricsBar.jsx`
- Create: `client/components/CallInbox.jsx`
- Create: `client/components/CallDetail.jsx`
- Create: `client/components/SequenceEditor.jsx`
- Create: `client/components/WhiteLabelPanel.jsx`
- Create: `client/components/IntegrationStatus.jsx`
- Create: `client/styles.css`

- [ ] **Step 1: Create API client**

Create `client/api.js`:

```js
async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);
  return response.json();
}

export const api = {
  getMetrics: () => request('/api/metrics'),
  getCalls: () => request('/api/calls'),
  getClient: (id) => request(`/api/clients/${id}`),
  updateClient: (id, payload) => request(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getSequences: (id) => request(`/api/clients/${id}/sequences`),
  updateSequences: (id, payload) => request(`/api/clients/${id}/sequences`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getIntegrations: () => request('/api/integrations/status'),
  processDemoCall: () => request('/api/demo/process-missed-call', { method: 'POST', body: JSON.stringify({}) }),
  updateUrgency: (callId, urgency) => request(`/api/calls/${callId}/urgency`, { method: 'PATCH', body: JSON.stringify({ urgency }) }),
  completeCallback: (taskId, payload) => request(`/api/callback-tasks/${taskId}/complete`, { method: 'PATCH', body: JSON.stringify(payload) }),
  escalateStale: () => request('/api/callback-tasks/escalate-stale', { method: 'POST', body: JSON.stringify({}) }),
};
```

- [ ] **Step 2: Create formatting helpers**

Create `client/data/formatters.js`:

```js
export function formatPercent(value) {
  return `${value}%`;
}

export function formatDateTime(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function humanize(value) {
  return String(value || 'none').replace(/_/g, ' ');
}
```

- [ ] **Step 3: Build dashboard composition**

Create `client/main.jsx`:

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);
```

Create `client/App.jsx` with state for metrics, calls, selected call, client, sequences, integrations, loading, and save status. On mount, fetch all dashboard data. Implement handlers for demo processing, stale escalation, urgency changes, callback completion with outcome, client settings save, and sequence save. Use the component files listed below for rendering.

- [ ] **Step 4: Build component files**

Create these component responsibilities:

- `client/components/AppShell.jsx`: brand header, left navigation labels, main content slots.
- `client/components/MetricsBar.jsx`: compact metrics for missed calls, completion rate, booked meetings, conversion rate, response time, and urgency mix.
- `client/components/CallInbox.jsx`: dense table/list with urgency, caller, summary, due time, escalation state, and selected row.
- `client/components/CallDetail.jsx`: transcript, AI summary, urgency selector, follow-up attempts, outcome selector, notes field, complete callback button, and booked meeting button behavior.
- `client/components/SequenceEditor.jsx`: editable due windows, escalation window, channels, and SMS/email templates grouped by urgency.
- `client/components/WhiteLabelPanel.jsx`: brand name, primary color, logo URL, timezone, business hours, and retention days.
- `client/components/IntegrationStatus.jsx`: provider mode and status grid.

Use Lucide icons for buttons and status markers. Keep cards to individual repeated metric panels and operational panels. Do not create a marketing hero.

- [ ] **Step 5: Implement dashboard styling**

Create `client/styles.css` with:

```css
:root {
  color: #142033;
  background: #f6f8fb;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  background: #f6f8fb;
}

button,
input,
select,
textarea {
  font: inherit;
}
```

Continue with a restrained operational dashboard palette using white surfaces, blue accent, amber high-priority highlights, green conversion markers, slate text, 8px radii, dense tables, clear focus states, and responsive layout that collapses panels into a single column below 880px.

- [ ] **Step 6: Build and inspect locally**

Run: `npm run build`

Expected: PASS and `dist/` is created.

Run API in one terminal: `npm run server`

Run dashboard in another terminal: `npm run dev`

Expected: Vite reports `http://127.0.0.1:5173/`; API reports `http://127.0.0.1:5174`.

Manual check in browser:

- Overview metrics render realistic seed values.
- Process sample missed call adds a high-urgency call.
- Complete callback requires an outcome.
- Booked meeting outcome changes conversion metrics.
- Stale escalation action highlights stale high-urgency task.
- Sequence editor saves urgency-tier templates.
- White-label settings save and update dashboard branding.

- [ ] **Step 7: Commit dashboard**

Run:

```bash
git add client index.html
git commit -m "feat: add Kavor Automation System missed-call dashboard"
```

Expected: Commit succeeds.

---

### Task 8: Documentation, Final Verification, And Cleanup

**Files:**
- Create: `README.md`
- Modify: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Write README**

Create `README.md`:

```md
# Kavor Automation System / Kavor Calls

Kavor Automation System / Kavor Calls is a full-stack JavaScript scaffold for capturing missed calls, transcribing voicemails, summarizing caller intent, assigning urgency, logging callback work, triggering follow-up, escalating stale high-priority callbacks, and measuring booked-meeting conversion.

## Stack

- React + Vite dashboard
- Node + Express API
- SQLite development database
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
```

- [ ] **Step 2: Run full verification**

Run: `npm test`

Expected: PASS for all test files.

Run: `npm run db:reset`

Expected: migration and realistic seed complete.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Inspect git status**

Run: `git status --short`

Expected: only intentional project files are modified or untracked.

- [ ] **Step 4: Commit docs and final polish**

Run:

```bash
git add README.md .env.example package.json package-lock.json
git commit -m "docs: add Kavor Automation System setup and demo guide"
```

Expected: Commit succeeds.

---

## Self-Review

Spec coverage:

- Twilio-shaped missed-call capture: Task 6.
- Caller name, number, call time, voicemail, transcript, summary, urgency: Tasks 2, 4, and 6.
- CRM/database logging: Tasks 2 and 3.
- Urgency-aware follow-up: Task 5.
- Default 30-minute high-urgency escalation: Tasks 1, 2, and 5.
- Timezone and business-hours due times: Task 5.
- Callback outcomes and booked meetings: Tasks 2, 3, 6, and 7.
- Conversion and completion metrics: Task 6 and Task 7.
- White-label settings: Tasks 2, 3, 6, and 7.
- Per-client message templates across urgency tiers: Tasks 2, 3, 5, and 7.
- Mock/live provider boundaries: Tasks 1 and 4.
- Security/compliance foundations: Tasks 2 and 3.
- Realistic seeded data: Task 2.

Placeholder scan:

- This plan avoids open-ended filler markers and defers no required implementation detail.
- Each task has concrete files, commands, and expected results.

Type consistency:

- Urgency values are `high`, `medium`, and `low`.
- Callback statuses are `open`, `completed`, and `escalated`.
- Callback outcomes match the spec: `booked_meeting`, `voicemail_left`, `no_answer`, `not_qualified`, `wrong_number`, `resolved_no_meeting`.
- Client business hours are stored as JSON and exposed as parsed objects through repositories.

