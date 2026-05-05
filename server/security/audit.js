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
