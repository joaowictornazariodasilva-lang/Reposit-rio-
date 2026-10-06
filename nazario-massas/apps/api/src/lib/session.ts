import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SessionPayload {
  sub: string;
  role: 'admin';
  exp: number;
}

const sign = (data: string, secret: string) => createHmac('sha256', secret).update(data).digest('base64url');

/** Stateless signed session token: base64url(payload).signature */
export function createSessionToken(payload: SessionPayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${sign(data, secret)}`;
}

export function readSessionToken(token: string | undefined, secret: string): SessionPayload | null {
  if (!token) return null;
  const [data, signature] = token.split('.');
  if (!data || !signature) return null;
  const expected = Buffer.from(sign(data, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload;
    if (payload.role !== 'admin' || typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
