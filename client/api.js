async function request(path, options = {}) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const response = await fetch(`${apiBaseUrl}${path}`, {
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
