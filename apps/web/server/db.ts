import { PrismaClient, enhance } from "@workspace/db";

export const prisma = new PrismaClient({ log: ["query", "error", "warn"] });
export const db = enhance(prisma);
