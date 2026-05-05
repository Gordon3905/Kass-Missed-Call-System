const now = () => new Date().toISOString();

export function createIntegrationRepository(db) {
  return {
    upsert(input) {
      const id = input.id || `integration_${input.provider}`;
      db.prepare(`
        INSERT INTO integrations
        (id, provider, mode, status, last_checked_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          provider=excluded.provider,
          mode=excluded.mode,
          status=excluded.status,
          last_checked_at=excluded.last_checked_at,
          metadata=excluded.metadata
      `).run(id, input.provider, input.mode, input.status || 'ready', input.last_checked_at || now(), JSON.stringify(input.metadata || {}));
      return db.prepare('SELECT * FROM integrations WHERE id = ?').get(id);
    },

    list() {
      return db.prepare('SELECT * FROM integrations ORDER BY provider').all().map((row) => ({ ...row, metadata: JSON.parse(row.metadata) }));
    },

    getStatusSummary() {
      return Object.fromEntries(this.list().map((row) => [row.provider, row]));
    },
  };
}
