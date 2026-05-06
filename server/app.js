import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { loadEnv } from './config/env.js';
import { createDb } from './db/connection.js';
import { seedDemoData } from './db/demoSeed.js';
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
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(fs.readFileSync(new URL('./db/schema.sql', import.meta.url), 'utf8'));
  return db;
}

export function createApp(options = {}) {
  const config = loadEnv(options.env || process.env);
  const db = options.useMemoryDb ? createMemoryDatabase() : createDb(config);
  if (options.seed) seedDemoData(db, config);

  const providers = createProviders(config);
  const repositories = {
    clients: createClientRepository(db),
    calls: createCallRepository(db),
    sequences: createSequenceRepository(db),
    integrations: createIntegrationRepository(db),
  };
  const secure = createCrypto(config.encryptionKey);
  const app = express();

  app.use((req, res, next) => {
    const allowedOrigins = config.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
    const requestOrigin = req.headers.origin;
    if (requestOrigin && (allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin))) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });

  app.use(express.json());

  registerDemoRoutes(app, { repositories, providers, secure });
  registerWebhookRoutes(app, { repositories, providers, secure });
  registerCallRoutes(app, { repositories, providers });
  registerClientRoutes(app, { repositories });
  registerMetricsRoutes(app, { repositories });
  registerIntegrationRoutes(app, { config, repositories });

  return app;
}
