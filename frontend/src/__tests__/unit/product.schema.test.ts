/**
 * @file product.schema.test.ts
 * @description Unit tests for the ProductSchema Zod validator.
 *
 * Covers:
 *  - Valid baseline input
 *  - Edge cases: min/max length boundaries, price coercion, empty imageUrl
 *  - Failure cases: missing required fields, invalid values
 */

import { ProductSchema, ProductInput } from "@/schemas/product";

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_INPUT: ProductInput = {
    name: "Classic Running Shoes",
    description: "A premium pair of running shoes with superior cushioning.",
    price: 99.99,
    imageUrl: "https://example.com/shoe.jpg",
    brandId: "brand-cuid-001",
};

function parse(data: Partial<typeof VALID_INPUT> & Record<string, unknown>) {
    return ProductSchema.safeParse(data);
}

// ─── Unit Tests ─────────────────────────────────────────────────────────────

describe("ProductSchema – Unit Tests", () => {
    // ── Valid Baseline ───────────────────────────────────────────────────────
    describe("valid inputs", () => {
        it("parses a fully valid product payload", () => {
            const result = parse(VALID_INPUT);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe("Classic Running Shoes");
                expect(result.data.price).toBe(99.99);
            }
        });

        it("accepts a product without optional price", () => {
            const { price, ...noPrice } = VALID_INPUT;
            const result = parse(noPrice);
            expect(result.success).toBe(true);
        });

        it("accepts a product without optional imageUrl", () => {
            const { imageUrl, ...noImage } = VALID_INPUT;
            const result = parse(noImage);
            expect(result.success).toBe(true);
        });

        it("accepts an empty string for imageUrl (treated as no URL)", () => {
            const result = parse({ ...VALID_INPUT, imageUrl: "" });
            expect(result.success).toBe(true);
        });
    });

    // ── Edge Cases ───────────────────────────────────────────────────────────
    describe("edge cases", () => {
        it("accepts name at minimum length (2 chars)", () => {
            const result = parse({ ...VALID_INPUT, name: "Ab" });
            expect(result.success).toBe(true);
        });

        it("accepts name at maximum length (100 chars)", () => {
            const result = parse({ ...VALID_INPUT, name: "A".repeat(100) });
            expect(result.success).toBe(true);
        });

        it("accepts description at minimum length (10 chars)", () => {
            const result = parse({ ...VALID_INPUT, description: "1234567890" });
            expect(result.success).toBe(true);
        });

        it("accepts description at maximum length (1000 chars)", () => {
            const result = parse({ ...VALID_INPUT, description: "D".repeat(1000) });
            expect(result.success).toBe(true);
        });

        it("accepts price of 0 (free product)", () => {
            const result = parse({ ...VALID_INPUT, price: 0 });
            expect(result.success).toBe(true);
        });

        it("coerces a numeric string to a float for price", () => {
            const result = parse({ ...VALID_INPUT, price: "49.99" as unknown as number });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.price).toBe(49.99);
            }
        });

        it("coerces an empty string for price to undefined", () => {
            const result = parse({ ...VALID_INPUT, price: "" as unknown as number });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.price).toBeUndefined();
            }
        });
    });

    // ── Failure Cases ────────────────────────────────────────────────────────
    describe("failure cases", () => {
        it("rejects a missing name", () => {
            const { name, ...noName } = VALID_INPUT;
            const result = parse(noName as any);
            expect(result.success).toBe(false);
        });

        it("rejects name shorter than 2 characters", () => {
            const result = parse({ ...VALID_INPUT, name: "A" });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toMatch(/at least 2 characters/i);
            }
        });

        it("rejects name longer than 100 characters", () => {
            const result = parse({ ...VALID_INPUT, name: "A".repeat(101) });
            expect(result.success).toBe(false);
        });

        it("rejects description shorter than 10 characters", () => {
            const result = parse({ ...VALID_INPUT, description: "Too short" });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toMatch(/too short/i);
            }
        });

        it("rejects description longer than 1000 characters", () => {
            const result = parse({ ...VALID_INPUT, description: "D".repeat(1001) });
            expect(result.success).toBe(false);
        });

        it("rejects a negative price", () => {
            const result = parse({ ...VALID_INPUT, price: -0.01 });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toMatch(/cannot be negative/i);
            }
        });

        it("rejects an invalid URL for imageUrl", () => {
            const result = parse({ ...VALID_INPUT, imageUrl: "not-a-url" });
            expect(result.success).toBe(false);
        });

        it("rejects a missing brandId", () => {
            const { brandId, ...noBrand } = VALID_INPUT;
            const result = parse(noBrand as any);
            expect(result.success).toBe(false);
        });

        it("rejects an empty brandId", () => {
            const result = parse({ ...VALID_INPUT, brandId: "" });
            expect(result.success).toBe(false);
        });
    });
});
