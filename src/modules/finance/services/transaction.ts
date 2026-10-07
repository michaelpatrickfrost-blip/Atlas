import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";

/** Retry only serialization conflicts, whose complete transaction has rolled back. */
export async function financeTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await db.$transaction(work, { isolationLevel: "Serializable", timeout: 20000 }); }
    catch (error) {
      if (attempt >= 2 || !(error && typeof error === "object" && "code" in error && error.code === "P2034")) throw error;
    }
  }
}
