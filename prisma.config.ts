// =============================================================================
// ConMart — Prisma Configuration (Prisma 7+)
// =============================================================================
// Prisma 7 moved connection URLs out of schema.prisma and into this config file.
// See: https://pris.ly/d/config-datasource
//
// This file is read by the Prisma CLI only. Application code gets its
// connection through src/lib/db.ts, which validates the environment via
// src/lib/config/env.ts.
// =============================================================================

import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// .env.local first so a developer's local overrides win over any shared .env.
dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.DATABASE_URL;

// Migrations and seeds rewrite data, so an unset URL must stop the command
// rather than fall back to a default. A localhost fallback would let `db push`
// appear to succeed against an empty local database while the real one is
// untouched — or, worse, run against whatever happens to be listening.
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (see .env.example) before running Prisma commands."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url },
  migrations: {
    seed: "npx tsx ./prisma/seed.ts",
  },
});

