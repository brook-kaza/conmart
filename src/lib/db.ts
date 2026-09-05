// =============================================================================
// ConMart — Prisma Client Singleton (Prisma 7+)
// =============================================================================
// Prisma 7 requires a driver adapter for database connections.
// Uses @prisma/adapter-pg for direct PostgreSQL connections via Supabase.
//
// - In development: reuses the instance attached to `globalThis` to survive
//   Next.js hot-reloads without exhausting database connections.
// - In production: creates a single instance per server process.
//
// Usage: import { db } from "@/lib/db"
// =============================================================================

import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import pg from "pg";

/**
 * Declare global variables to hold the Prisma Client and pg.Pool instances.
 * This prevents creating new connections on every hot-reload in development.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: pg.Pool | undefined;
};

/**
 * Create a new Prisma Client with the PrismaPg adapter and a singleton pg.Pool.
 */
function createPrismaClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_POOLER_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is required. " +
        "Set it in .env.local with your Supabase connection string."
    );
  }

  const pool =
    globalForPrisma.pgPool ??
    new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 10000,
      query_timeout: 10000,
    });

  // Attach error handler to prevent unhandled node-pg crash on idle connection drops
  pool.on("error", (err) => {
    console.error("Non-fatal pg.Pool idle connection event (recovered):", err?.message || err);
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

/**
 * Singleton Prisma Client instance.
 */
export const db: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

// Attach the instance to globalThis in development to survive hot-reloads.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
