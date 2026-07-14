import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
    },
    datasource: {
        // Reads DATABASE_URL from .env – "file:./dev.db" for local SQLite
        url: env("DATABASE_URL"),
    },
});
