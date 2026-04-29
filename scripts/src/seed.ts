import { db, carsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(carsTable);
  if (existing[0].count > 0) {
    console.log("Cars already seeded. Skipping.");
    process.exit(0);
  }

  await db.insert(carsTable).values([
    {
      name: "نيسان صاني",
      model: "Nissan Sunny",
      transmission: "manual",
      imageUrl: "/cars/nissan-sunny.jpg",
      description:
        "سيارة مانيوال مثالية لتعلم القيادة — توفر تحكماً كاملاً وخبرة قيادة حقيقية.",
    },
    {
      name: "فيات 128",
      model: "Fiat 128",
      transmission: "automatic",
      imageUrl: "/cars/fiat-128.jpg",
      description:
        "سيارة أوتوماتيك مريحة وسهلة — الخيار الأمثل لمن يفضل القيادة البسيطة.",
    },
  ]);

  console.log("Done! Cars seeded successfully.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
