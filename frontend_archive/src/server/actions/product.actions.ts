"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ProductSchema, ProductInput } from "@/schemas/product";
import { auth } from "@/auth";

function formatError(error: unknown, fallbackMessage: string): string {
    console.error(`[ProductAction Error]`, error);
    if (error instanceof Error) {
        return error.message;
    }
    return fallbackMessage;
}

export async function createProductAction(data: ProductInput) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized. You must be logged in." };
        }

        const validatedData = ProductSchema.parse(data);

        // SECURITY FIX (IDOR): Verify the brand actually belongs to this authenticated user
        const brand = await prisma.brandSettings.findFirst({
            where: {
                id: validatedData.brandId,
                userId: session.user.id
            }
        });

        if (!brand) {
            return { success: false, error: "Unauthorized access to this Brand/Workspace." };
        }

        const newProduct = await prisma.product.create({
            data: validatedData,
        });

        revalidatePath("/products");
        return { success: true, data: newProduct };
    } catch (error: unknown) {
        return { success: false, error: formatError(error, "Failed to create product.") };
    }
}

export async function updateProductAction(id: string, data: ProductInput) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized." };

        const validatedData = ProductSchema.parse(data);
        const { brandId, ...updatePayload } = validatedData;

        // SECURITY FIX: Ensure the product being updated physically belongs to a brand owned by the caller.
        const updatedProduct = await prisma.product.update({
            where: {
                id,
                brand: { userId: session.user.id }
            },
            data: updatePayload,
        });

        revalidatePath("/products");
        return { success: true, data: updatedProduct };
    } catch (error: unknown) {
        return { success: false, error: formatError(error, "Failed to update product.") };
    }
}

export async function deleteProductAction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized." };

        // SECURITY FIX: Same protection mechanism for deletions
        await prisma.product.delete({
            where: {
                id,
                brand: { userId: session.user.id }
            },
        });

        revalidatePath("/products");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: formatError(error, "Failed to delete product.") };
    }
}
