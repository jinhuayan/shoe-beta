import "server-only";

import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getDb(): PrismaClient {
  const connectionString = process.env.DATABASE_URL_POOLED?.trim()
    || process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error("Set DATABASE_URL_POOLED or DATABASE_URL before using the database.");
  }

  if (!globalForPrisma.prisma) {
    const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 5_000, idleTimeoutMillis: 5_000, keepAlive: true });
    pool.on("error", () => console.error("Idle database connection failed."));
    if (process.env.VERCEL) attachDatabasePool(pool);
    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaPg(pool, { disposeExternalPool: true }),
      transactionOptions: { maxWait: 10_000, timeout: 15_000 },
    });
  }

  return globalForPrisma.prisma;
}
