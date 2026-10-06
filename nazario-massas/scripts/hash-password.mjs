#!/usr/bin/env node
/**
 * Generates ADMIN_PASSWORD_HASH for production.
 *   npm run hash-password -- "minha-senha-forte"
 */
import { randomBytes, scryptSync } from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Uso: npm run hash-password -- "senha com pelo menos 10 caracteres"');
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N: 16384 });
console.log(`scrypt$16384$${salt.toString('hex')}$${hash.toString('hex')}`);
