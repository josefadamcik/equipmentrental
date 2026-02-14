import { defineConfig } from "prisma/config";

// Load dotenv if available (not needed in Docker where env vars are injected)
try {
  await import("dotenv/config");
} catch {
  // dotenv not available — env vars should already be set (e.g., Docker)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
