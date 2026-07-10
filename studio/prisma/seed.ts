/**
 * Prisma seed script – populates the database with demo data.
 * Run with: npx prisma db seed
 *
 * Adds:
 *   1. A demo User
 *   2. A BrandSettings row for that user (id = "demo-brand-001")
 *   3. Two sample Products so the catalogue isn't empty on first launch
 */

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });


async function main() {
    console.log("🌱 Seeding database...");

    // 1. Demo user (upsert so re-running seed is safe)
    const user = await prisma.user.upsert({
        where: { email: "demo@maamoura.ai" },
        update: {},
        create: {
            id: "demo-user-001",
            name: "Demo User",
            email: "demo@maamoura.ai",
        },
    });
    console.log(`✓ User: ${user.email}`);

    // 2. BrandSettings – id must match DEMO_BRAND_ID used in page.tsx
    const brand = await prisma.brandSettings.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            id: "demo-brand-001",
            userId: user.id,
            name: "Maamoura Demo Brand",
        },
    });
    console.log(`✓ Brand: ${brand.name}`);

    // 3. Sample products
    const products = [
        {
            id: "product-seed-001",
            brandId: brand.id,
            name: "Classic Running Shoes",
            description:
                "Premium running shoes crafted for long-distance performance. Features responsive cushioning, breathable mesh upper, and a durable rubber outsole.",
            price: 129.99,
            imageUrl: "https://picsum.photos/id/1081/800/600",
        },
        {
            id: "product-seed-002",
            brandId: brand.id,
            name: "Yoga Performance Mat",
            description:
                "Non-slip, eco-friendly yoga mat designed for serious practitioners. 6mm thick for joint support, with alignment markers and a carry strap.",
            price: 89.0,
            imageUrl: "https://picsum.photos/id/452/800/600",
        },
        {
            id: "product-seed-003",
            brandId: brand.id,
            name: "Wireless Sport Earbuds",
            description:
                "IPX5 waterproof earbuds with 32-hour battery life and active noise cancellation. Built for high-intensity workouts and outdoor training sessions.",
            price: 79.95,
            imageUrl: "https://picsum.photos/id/669/800/600",
        },
    ];

    for (const p of products) {
        await prisma.product.upsert({
            where: { id: p.id },
            update: { imageUrl: p.imageUrl },
            create: p,
        });
        console.log(`✓ Product: ${p.name}`);
    }

    console.log("\n✅ Seed complete! Open http://localhost:3000 to see the dashboard.");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
