import { Prisma, type PrismaClient } from "@prisma/client";

import { getPrisma } from "@/lib/db/client";

const RETRYABLE = new Set(["40001", "40P01", "P2034"]);

function errorCode(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code;
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

export async function withReservationTransaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
  db: PrismaClient = getPrisma()
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await db.$transaction(work, {
        timeout: 15_000,
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      });
    } catch (error) {
      lastError = error;
      const code = errorCode(error);
      if (!code || !RETRYABLE.has(code) || attempt === 3) throw error;
    }
  }
  throw lastError;
}
