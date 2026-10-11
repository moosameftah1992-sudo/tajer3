import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// تهيئة الاتصال ليعمل بسلاسة على بيئة Serverless بدون تعليق TCP
neonConfig.webSocketConnector = ws;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool);