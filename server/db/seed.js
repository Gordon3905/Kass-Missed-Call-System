import { createDb } from './connection.js';
import { loadEnv } from '../config/env.js';
import { seedDemoData } from './demoSeed.js';

const config = loadEnv();
const db = createDb(config);
seedDemoData(db, config);
console.log('Database seeded with realistic Kavor Automation System demo data.');
