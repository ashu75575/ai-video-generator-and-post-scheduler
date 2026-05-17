import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "⚠️ WARNING: DATABASE_URL is not set in your environment variables. Database operations will be skipped."
  );
}

// Connect to Neon Database using HTTP connection, only if databaseUrl is available
export const db = databaseUrl ? drizzle(neon(databaseUrl), { schema }) : null;
