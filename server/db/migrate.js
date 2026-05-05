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
