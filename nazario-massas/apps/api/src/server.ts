import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { serve } from '@hono/node-server';
import { createApp } from './app';
import { config } from './config';
import { createPaymentProvider } from './payments';
import { JsonStore } from './repositories/json-store';

await mkdir(join(dirname(config.dataFile), 'uploads'), { recursive: true });
const store = await JsonStore.open(config.dataFile);
const app = createApp(store.repositories, createPaymentProvider());

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`Nazário Massas API → http://localhost:${port}`);
  console.log(`  payments: ${config.payments.provider} · data: ${config.dataFile}`);
  if (config.admin.devPassword) {
    console.log(`  admin (dev): ${config.admin.email} / ${config.admin.devPassword}`);
  }
});
