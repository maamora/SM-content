/**
 * @file product.actions.test.ts
 * @description Integration + failure + edge case tests for product server actions.
 *
 * Strategy:
 *  - Mock `@/auth` to control session state.
 *  - Mock `@/lib/prisma` with a deep mock of the Prisma client.
 *  - Mock `next/cache` to prevent Next.js server-side cache calls from failing.
 *
 * Covers:
 *  - createProductAction
 *  - updateProductAction
 *  - deleteProductAction
 *  Each tested for: success, unauthenticated, unauthorized/IDOR attack, validation failure, db error.
 */

// ─── Module Mocks ────────────────────────────────────────────────────────────

// Must be declared before importing the module under test.
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/auth");
jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: {
        brandSettings: {
            findFirst: jest.fn(),
        },
        product: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

// ─── Imports (AFTER mocks) ───────────────────────────────────────────────────

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
    createProductAction,
    updateProductAction,
    deleteProductAction,
} from "@/server/actions/product.actions";

// ─── Helpers & Fixtures ──────────────────────────────────────────────────────

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

// Prisma mock helpers
const mockBrandFind = prisma.brandSettings.findFirst as jest.MockedFunction<any>;
const mockProductCreate = prisma.product.create as jest.MockedFunction<any>;
const mockProductUpdate = prisma.product.update as jest.MockedFunction<any>;
const mockProductDelete = prisma.product.delete as jest.MockedFunction<any>;

const AUTHENTICATED_SESSION = {
    user: { id: "user-cuid-001", email: "test@example.com" },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
};

const VALID_PAYLOAD = {
    name: "Running Shoes",
    description: "High performance running shoes for athletes.",
    brandId: "brand-cuid-001",
    price: 99.99,
    imageUrl: "https://example.com/shoe.jpg",
};

const MOCK_BRAND = {
    id: "brand-cuid-001",
    userId: "user-cuid-001",
    name: "My Brand",
};

const MOCK_PRODUCT = {
    id: "product-cuid-001",
    ...VALID_PAYLOAD,
    createdAt: new Date(),
    updatedAt: new Date(),
};

// ─── Test Suites ─────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
// createProductAction
// ════════════════════════════════════════════════════════════════════════════

describe("createProductAction", () => {
    // ── Integration (Happy Path) ─────────────────────────────────────────────
    describe("integration – success", () => {
        it("creates a product and revalidates /products when authenticated and brand is owned", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            mockBrandFind.mockResolvedValueOnce(MOCK_BRAND);
            mockProductCreate.mockResolvedValueOnce(MOCK_PRODUCT);

            const result = await createProductAction(VALID_PAYLOAD);

            expect(result.success).toBe(true);
            expect((result as any).data).toMatchObject({ name: "Running Shoes" });

            // Verify security check was called with correct args
            expect(mockBrandFind).toHaveBeenCalledWith({
                where: { id: VALID_PAYLOAD.brandId, userId: AUTHENTICATED_SESSION.user.id },
            });

            // Verify path was revalidated
            expect(mockRevalidatePath).toHaveBeenCalledWith("/products");
        });
    });

    // ── Failure: Unauthenticated ─────────────────────────────────────────────
    describe("failure – unauthenticated", () => {
        it("returns an error when session is null", async () => {
            mockAuth.mockResolvedValueOnce(null);
            const result = await createProductAction(VALID_PAYLOAD);

            expect(result.success).toBe(false);
            expect((result as any).error).toMatch(/unauthorized/i);
            expect(mockProductCreate).not.toHaveBeenCalled();
        });

        it("returns an error when session exists but has no user.id", async () => {
            mockAuth.mockResolvedValueOnce({ user: {}, expires: "" } as any);
            const result = await createProductAction(VALID_PAYLOAD);

            expect(result.success).toBe(false);
            expect((result as any).error).toMatch(/unauthorized/i);
        });
    });

    // ── Failure: IDOR / Unauthorized Brand Access ────────────────────────────
    describe("failure – IDOR protection", () => {
        it("returns an error when the brandId belongs to a different user", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            // Brand not found for this user → IDOR attempt
            mockBrandFind.mockResolvedValueOnce(null);

            const result = await createProductAction({
                ...VALID_PAYLOAD,
                brandId: "brand-owned-by-another-user",
            });

            expect(result.success).toBe(false);
            expect((result as any).error).toMatch(/unauthorized/i);
            expect(mockProductCreate).not.toHaveBeenCalled();
        });
    });

    // ── Failure: Validation ──────────────────────────────────────────────────
    describe("failure – validation", () => {
        it("returns an error when name is too short (< 2 chars)", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);

            const result = await createProductAction({ ...VALID_PAYLOAD, name: "X" });

            expect(result.success).toBe(false);
            // Schema parse throws a ZodError which gets caught and formatted
            expect((result as any).error).toBeTruthy();
            // Prisma create should not be called on invalid data
            expect(mockProductCreate).not.toHaveBeenCalled();
        });

        it("returns an error when description is too short (< 10 chars)", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);

            const result = await createProductAction({ ...VALID_PAYLOAD, description: "Short" });

            expect(result.success).toBe(false);
            expect(mockProductCreate).not.toHaveBeenCalled();
        });

        it("returns an error when price is negative", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);

            const result = await createProductAction({ ...VALID_PAYLOAD, price: -5 });

            expect(result.success).toBe(false);
            expect(mockProductCreate).not.toHaveBeenCalled();
        });
    });

    // ── Failure: Database Error ──────────────────────────────────────────────
    describe("failure – database error", () => {
        it("returns a formatted error when Prisma throws", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            mockBrandFind.mockResolvedValueOnce(MOCK_BRAND);
            mockProductCreate.mockRejectedValueOnce(new Error("DB connection timeout"));

            const result = await createProductAction(VALID_PAYLOAD);

            expect(result.success).toBe(false);
            expect((result as any).error).toMatch(/DB connection timeout/i);
        });
    });

    // ── Edge Cases ───────────────────────────────────────────────────────────
    describe("edge cases", () => {
        it("creates a product without optional price or imageUrl", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            mockBrandFind.mockResolvedValueOnce(MOCK_BRAND);
            const productWithoutPrice = { ...MOCK_PRODUCT, price: null, imageUrl: null };
            mockProductCreate.mockResolvedValueOnce(productWithoutPrice);

            const { price, imageUrl, ...minimalPayload } = VALID_PAYLOAD;
            const result = await createProductAction(minimalPayload);

            expect(result.success).toBe(true);
        });
    });
});

// ════════════════════════════════════════════════════════════════════════════
// updateProductAction
// ════════════════════════════════════════════════════════════════════════════

describe("updateProductAction", () => {
    const PRODUCT_ID = "product-cuid-001";

    describe("integration – success", () => {
        it("updates an owned product and revalidates /products", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            mockProductUpdate.mockResolvedValueOnce({ ...MOCK_PRODUCT, name: "Updated Shoes" });

            const result = await updateProductAction(PRODUCT_ID, {
                ...VALID_PAYLOAD,
                name: "Updated Shoes",
            });

            expect(result.success).toBe(true);
            expect((result as any).data.name).toBe("Updated Shoes");
            expect(mockRevalidatePath).toHaveBeenCalledWith("/products");
        });

        it("strips brandId from update payload (cannot re-assign brand)", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            mockProductUpdate.mockResolvedValueOnce(MOCK_PRODUCT);

            await updateProductAction(PRODUCT_ID, VALID_PAYLOAD);

            // The data passed to prisma.product.update must NOT include brandId
            const callArgs = mockProductUpdate.mock.calls[0][0];
            expect(callArgs.data).not.toHaveProperty("brandId");
        });
    });

    describe("failure – unauthenticated", () => {
        it("returns an error when session is null", async () => {
            mockAuth.mockResolvedValueOnce(null);
            const result = await updateProductAction(PRODUCT_ID, VALID_PAYLOAD);

            expect(result.success).toBe(false);
            expect((result as any).error).toMatch(/unauthorized/i);
            expect(mockProductUpdate).not.toHaveBeenCalled();
        });
    });

    describe("failure – IDOR protection", () => {
        it("returns an error when trying to update a product from another user's brand", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            // Prisma update throws P2025 when the `where` condition includes a nested owner check
            const recordNotFoundError = Object.assign(new Error("Record to update not found."), {
                code: "P2025",
            });
            mockProductUpdate.mockRejectedValueOnce(recordNotFoundError);

            const result = await updateProductAction("product-does-not-belong-to-user", VALID_PAYLOAD);

            expect(result.success).toBe(false);
            expect((result as any).error).toMatch(/Record to update not found/i);
        });
    });

    describe("failure – validation", () => {
        it("rejects an invalid payload without calling Prisma", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            const result = await updateProductAction(PRODUCT_ID, { ...VALID_PAYLOAD, name: "" });

            expect(result.success).toBe(false);
            expect(mockProductUpdate).not.toHaveBeenCalled();
        });
    });

    describe("failure – database error", () => {
        it("returns a formatted error when Prisma throws an unexpected error", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            mockProductUpdate.mockRejectedValueOnce(new Error("Unique constraint failed"));

            const result = await updateProductAction(PRODUCT_ID, VALID_PAYLOAD);

            expect(result.success).toBe(false);
            expect((result as any).error).toMatch(/Unique constraint failed/i);
        });
    });
});

// ════════════════════════════════════════════════════════════════════════════
// deleteProductAction
// ════════════════════════════════════════════════════════════════════════════

describe("deleteProductAction", () => {
    const PRODUCT_ID = "product-cuid-001";

    describe("integration – success", () => {
        it("deletes an owned product and revalidates /products", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            mockProductDelete.mockResolvedValueOnce(MOCK_PRODUCT);

            const result = await deleteProductAction(PRODUCT_ID);

            expect(result.success).toBe(true);
            expect(mockProductDelete).toHaveBeenCalledWith({
                where: { id: PRODUCT_ID, brand: { userId: AUTHENTICATED_SESSION.user.id } },
            });
            expect(mockRevalidatePath).toHaveBeenCalledWith("/products");
        });
    });

    describe("failure – unauthenticated", () => {
        it("returns an error when session is null", async () => {
            mockAuth.mockResolvedValueOnce(null);
            const result = await deleteProductAction(PRODUCT_ID);

            expect(result.success).toBe(false);
            expect((result as any).error).toMatch(/unauthorized/i);
            expect(mockProductDelete).not.toHaveBeenCalled();
        });
    });

    describe("failure – IDOR protection", () => {
        it("returns an error when trying to delete a product not owned by the user", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            const idorError = Object.assign(new Error("Record to delete does not exist."), {
                code: "P2025",
            });
            mockProductDelete.mockRejectedValueOnce(idorError);

            const result = await deleteProductAction("product-cuid-from-different-user");

            expect(result.success).toBe(false);
            expect((result as any).error).toMatch(/does not exist/i);
        });
    });

    describe("edge cases", () => {
        it("handles deletion of a product with no imageUrl gracefully", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            mockProductDelete.mockResolvedValueOnce({ ...MOCK_PRODUCT, imageUrl: null });

            const result = await deleteProductAction(PRODUCT_ID);

            expect(result.success).toBe(true);
        });

        it("returns an error for an empty product ID string", async () => {
            mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION as any);
            // Prisma will throw for empty where.id
            mockProductDelete.mockRejectedValueOnce(new Error("Argument id must not be empty"));

            const result = await deleteProductAction("");

            expect(result.success).toBe(false);
        });
    });
});
