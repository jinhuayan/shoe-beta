import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Client generation and UI builds can run before a database is configured.
    url: process.env.DATABASE_URL ?? "",
  },
});
