import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { catalogue } from "./catalogue";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error("Set DATABASE_URL in .env before seeding the database.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
try {
  const result = await db.shoe.createMany({ data: catalogue, skipDuplicates: true });
  console.log(`Inserted ${result.count} climbing shoes; existing entries were left unchanged.`);
} finally {
  await db.$disconnect();
}
