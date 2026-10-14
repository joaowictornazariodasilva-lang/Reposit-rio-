import "server-only";
import path from "node:path";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

/*
 * Banco: Postgres de verdade quando DATABASE_URL existe (Supabase, Neon, RDS…);
 * sem ela, Postgres embutido (PGlite) em .data/ — o sistema roda e é
 * demonstrável sem instalar nada. Mesmo schema, mesmas migrações.
 */

const migrationsFolder = path.join(process.cwd(), "src/server/db/migrations");

async function criar(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  let db: Db;
  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    db = drizzle(new Pool({ connectionString: url, max: 10 }), { schema });
    await migrate(db, { migrationsFolder });
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    // Na Vercel só /tmp é gravável (e é apagado de tempos em tempos): serve só para demonstração.
    const dir = process.env.PGLITE_DIR ?? (process.env.VERCEL ? "/tmp/pglite" : path.join(process.cwd(), ".data/pglite"));
    if (!dir.startsWith("memory://")) await (await import("node:fs/promises")).mkdir(dir, { recursive: true });
    const pg = await PGlite.create(dir);
    const pdb = drizzle(pg, { schema });
    await migrate(pdb, { migrationsFolder });
    db = pdb as unknown as Db;
  }
  if (process.env.DEMO_SEED !== "false") {
    const { semearSeVazio } = await import("./seed");
    await semearSeVazio(db);
  }
  return db;
}

const g = globalThis as unknown as { __db?: Promise<Db> };

export function getDb(): Promise<Db> {
  g.__db ??= criar().catch((e) => {
    g.__db = undefined;
    throw e;
  });
  return g.__db;
}

export { schema };
