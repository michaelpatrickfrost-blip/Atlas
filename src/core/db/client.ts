import {createDesktopReadClient} from "@/core/desktop/data-client";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Single Prisma instance per process, reused across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  if(process.env.ATLAS_RUNTIME==="desktop")return createDesktopReadClient();
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 8 });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
