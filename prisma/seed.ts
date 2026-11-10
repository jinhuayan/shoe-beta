import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error("Set DATABASE_URL in .env before seeding the database.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const result = await db.shoe.createMany({
    data: [
      {
        slug: "sample-training",
        brand: "Sample Brand",
        model: "Training",
        description: "A fictional shoe entry for testing the catalogue.",
        isSample: true,
      },
      {
        slug: "sample-everyday",
        brand: "Sample Brand",
        model: "Everyday",
        description: "A second fictional entry, not a real product or fit recommendation.",
        isSample: true,
      },
      {
        slug: "sample-precision",
        brand: "Sample Brand",
        model: "Precision",
        description: "A fictional entry for checking the catalogue layout.",
        isSample: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`Inserted ${result.count} sample shoes.`);
} finally {
  await db.$disconnect();
}
