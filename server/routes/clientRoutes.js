export function registerClientRoutes(app, { repositories }) {
  app.get('/api/clients/:id', (req, res) => {
    const client = repositories.clients.getById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    return res.json(client);
  });

  app.patch('/api/clients/:id', (req, res) => {
    const existing = repositories.clients.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Client not found' });
    return res.json(repositories.clients.upsert({ ...existing, ...req.body, id: req.params.id }));
  });

  app.get('/api/clients/:id/sequences', (req, res) => {
    res.json({
      sequences: repositories.sequences.listSequences(req.params.id),
      templates: repositories.sequences.listTemplates(req.params.id),
    });
  });

  app.patch('/api/clients/:id/sequences', (req, res) => {
    res.json(repositories.sequences.saveClientSequenceBundle(req.params.id, req.body));
  });
}
