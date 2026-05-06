import { nanoid } from 'nanoid';

const now = () => new Date().toISOString();
const defaultHours = () => ({
  monday: ['09:00', '17:00'],
  tuesday: ['09:00', '17:00'],
  wednesday: ['09:00', '17:00'],
  thursday: ['09:00', '17:00'],
  friday: ['09:00', '17:00'],
});

function parseClient(row) {
  if (!row) return null;
  return {
    ...row,
    business_hours: JSON.parse(row.business_hours),
    settings: JSON.parse(row.settings_json || '{}'),
  };
}

export function createClientRepository(db) {
  return {
    upsert(input) {
      const existing = input.id ? this.getById(input.id) : null;
      const timestamp = now();
      const record = {
        id: input.id || nanoid(),
        name: input.name,
        brand_name: input.brand_name,
        logo_url: input.logo_url || '',
        primary_color: input.primary_color || '#155EEF',
        timezone: input.timezone || 'America/New_York',
        business_hours: JSON.stringify(input.business_hours || defaultHours()),
        high_urgency_escalation_minutes: input.high_urgency_escalation_minutes ?? 30,
        retention_days: input.retention_days || 365,
        settings_json: JSON.stringify(input.settings || existing?.settings || {}),
        created_at: existing?.created_at || input.created_at || timestamp,
        updated_at: timestamp,
      };

      db.prepare(`
        INSERT INTO clients
        (id, name, brand_name, logo_url, primary_color, timezone, business_hours, high_urgency_escalation_minutes, retention_days, settings_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          brand_name=excluded.brand_name,
          logo_url=excluded.logo_url,
          primary_color=excluded.primary_color,
          timezone=excluded.timezone,
          business_hours=excluded.business_hours,
          high_urgency_escalation_minutes=excluded.high_urgency_escalation_minutes,
          retention_days=excluded.retention_days,
          settings_json=excluded.settings_json,
          updated_at=excluded.updated_at
      `).run(
        record.id,
        record.name,
        record.brand_name,
        record.logo_url,
        record.primary_color,
        record.timezone,
        record.business_hours,
        record.high_urgency_escalation_minutes,
        record.retention_days,
        record.settings_json,
        record.created_at,
        record.updated_at,
      );

      return this.getById(record.id);
    },

    getById(id) {
      return parseClient(db.prepare('SELECT * FROM clients WHERE id = ?').get(id));
    },

    list() {
      return db.prepare('SELECT * FROM clients ORDER BY name').all().map(parseClient);
    },
  };
}
