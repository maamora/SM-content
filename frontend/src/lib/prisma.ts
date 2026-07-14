import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prevent multiple Prisma client instances in development (Next.js hot reload)
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// In Next.js, DATABASE_URL environment variable is loaded automatically
const url = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = global.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

export default prisma;

