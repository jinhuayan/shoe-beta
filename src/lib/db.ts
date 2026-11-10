import "server-only";

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
    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  return globalForPrisma.prisma;
}
