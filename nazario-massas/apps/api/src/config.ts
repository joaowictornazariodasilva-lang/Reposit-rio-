import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { hashPassword } from './lib/password';

const env = process.env;
const isProduction = env.NODE_ENV === 'production';

function required(name: string): string {
  const value = env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

const DEV_ADMIN_PASSWORD = 'nazario2026';

export const config = {
  isProduction,
  port: Number(env.PORT ?? 8787),
  dataFile: resolve(env.DATA_FILE ?? 'data/db.json'),
  /** Built storefront to serve in production (single-process deploy). */
  webDist: env.WEB_DIST ? resolve(env.WEB_DIST) : undefined,
  corsOrigin: env.CORS_ORIGIN,
  publicUrl: env.PUBLIC_URL ?? 'http://localhost:5173',

  session: {
    secret: isProduction ? required('SESSION_SECRET') : (env.SESSION_SECRET ?? randomBytes(32).toString('hex')),
    ttlSeconds: 60 * 60 * 12,
    cookie: 'nz_admin',
  },

  admin: {
    email: (isProduction ? required('ADMIN_EMAIL') : (env.ADMIN_EMAIL ?? 'admin@nazariomassas.com.br')).toLowerCase(),
    passwordHash: isProduction
      ? required('ADMIN_PASSWORD_HASH')
      : (env.ADMIN_PASSWORD_HASH ?? hashPassword(DEV_ADMIN_PASSWORD)),
    devPassword: isProduction || env.ADMIN_PASSWORD_HASH ? undefined : DEV_ADMIN_PASSWORD,
  },

  payments: {
    provider: (env.PAYMENT_PROVIDER ?? 'mock') as 'mock' | 'asaas',
    asaas: {
      apiKey: env.ASAAS_API_KEY ?? '',
      baseUrl: env.ASAAS_ENV === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3',
      webhookToken: env.ASAAS_WEBHOOK_TOKEN ?? '',
    },
  },
} as const;

if (config.payments.provider === 'asaas' && (!config.payments.asaas.apiKey || !config.payments.asaas.webhookToken)) {
  throw new Error('PAYMENT_PROVIDER=asaas requires ASAAS_API_KEY and ASAAS_WEBHOOK_TOKEN');
}
