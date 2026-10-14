import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (s: string, salt: Buffer, len: number) => Promise<Buffer>;

/** Formato: scrypt$<salt base64>$<hash base64> */
export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(senha.normalize("NFKC"), salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function conferirSenha(senha: string, armazenado: string): Promise<boolean> {
  const [alg, saltB64, hashB64] = armazenado.split("$");
  if (alg !== "scrypt" || !saltB64 || !hashB64) return false;
  const esperado = Buffer.from(hashB64, "base64");
  const hash = await scrypt(senha.normalize("NFKC"), Buffer.from(saltB64, "base64"), esperado.length);
  return timingSafeEqual(hash, esperado);
}
