import { z } from "zod";

export const LoginSchema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
