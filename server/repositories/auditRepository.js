import { nanoid } from 'nanoid';

export function createAuditRepository(db) {
  return {
    insert(input) {
      const record = {
        id: input.id || nanoid(),
        client_id: input.client_id,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        action: input.action,
        metadata: JSON.stringify(input.metadata || {}),
        created_at: input.created_at || new Date().toISOString(),
      };
      db.prepare(`
        INSERT INTO audit_events
        (id, client_id, entity_type, entity_id, action, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(record.id, record.client_id, record.entity_type, record.entity_id, record.action, record.metadata, record.created_at);
      return { ...record, metadata: JSON.parse(record.metadata) };
    },

    listRecent(limit = 20) {
      return db.prepare('SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?').all(limit).map((row) => ({ ...row, metadata: JSON.parse(row.metadata) }));
    },
  };
}
