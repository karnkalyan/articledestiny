import { ensureSeeded } from "../lib/seed";

async function main() {
  console.log("Starting database seeding...");
  await ensureSeeded();
  console.log("Database seeding completed.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
