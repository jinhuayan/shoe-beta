import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error("Set DATABASE_URL in .env before seeding the database.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const samples = [
  {
    slug: "sample-training",
    brand: "Sample Brand",
    model: "Training",
    description: "A fictional neutral climbing shoe for catalogue tests.",
    isSample: true,
    downturn: "NEUTRAL",
    stiffness: "STIFF",
    closure: "LACE_UP",
  },
  {
    slug: "sample-everyday",
    brand: "Sample Brand",
    model: "Everyday",
    description: "A fictional moderate climbing shoe for catalogue tests.",
    isSample: true,
    downturn: "MODERATE",
    stiffness: "MEDIUM",
    closure: "HOOK_AND_LOOP",
  },
  {
    slug: "sample-precision",
    brand: "Sample Brand",
    model: "Precision",
    description: "A fictional aggressive climbing shoe for catalogue tests.",
    isSample: true,
    downturn: "AGGRESSIVE",
    stiffness: "SOFT",
    closure: "SLIPPER",
  },
] satisfies Prisma.ShoeCreateManyInput[];

try {
  const result = await db.shoe.createMany({ data: samples, skipDuplicates: true });
  for (const shoe of samples) {
    await db.shoe.updateMany({
      where: {
        slug: shoe.slug,
        isSample: true,
        downturn: "UNKNOWN",
        stiffness: "UNKNOWN",
        closure: "UNKNOWN",
      },
      data: { downturn: shoe.downturn, stiffness: shoe.stiffness, closure: shoe.closure },
    });
  }
  console.log(`Inserted ${result.count} sample climbing shoes.`);
} finally {
  await db.$disconnect();
}
