import { z } from "zod";

export const ProductSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    description: z.string().min(10, "Description is too short").max(1000),
    price: z.number().min(0, "Price cannot be negative").optional()
        .or(z.string().transform(val => val ? parseFloat(val) : undefined)),
    imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    brandId: z.string().min(1, "Brand ID is required"),
});

export type ProductInput = z.input<typeof ProductSchema>;
export type ProductOutput = z.output<typeof ProductSchema>;

