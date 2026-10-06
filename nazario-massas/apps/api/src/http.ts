import type { Context } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';
import type { z } from 'zod';
import { DomainError } from './services/orders';

export function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new DomainError(issue?.message && !issue.message.startsWith('Invalid') ? issue.message : 'Dados inválidos.', 400);
  }
  return result.data;
}

export async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new DomainError('JSON inválido.', 400);
  }
}

/** Client IP; trusts X-Forwarded-For only behind a proxy you control (TRUST_PROXY=1). */
export function clientIp(c: Context): string {
  if (process.env.TRUST_PROXY === '1') {
    const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
  }
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    return 'unknown';
  }
}
