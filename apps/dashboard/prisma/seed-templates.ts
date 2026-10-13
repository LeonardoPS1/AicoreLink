/**
 * Seed script for site templates.
 * Run with: npx tsx prisma/seed-templates.ts
 */

import { seedTemplates } from "@/lib/factory/templates";

async function main() {
  try {
    await seedTemplates();
    console.log("🎉 Seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

main();