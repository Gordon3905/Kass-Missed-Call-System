import { createApp } from './app.js';
import { loadEnv } from './config/env.js';

const config = loadEnv();
const app = createApp();

app.listen(config.port, () => {
  console.log(`CoVault API listening on http://127.0.0.1:${config.port}`);
});
