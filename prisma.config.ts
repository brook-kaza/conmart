// =============================================================================
// ConMart — Prisma Configuration (Prisma 7+)
// =============================================================================
// Prisma 7 moved connection URLs out of schema.prisma and into this config file.
// Uses `defineConfig` from prisma/config for type-safe configuration.
// See: https://pris.ly/d/config-datasource
// =============================================================================

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
