import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import Nodemailer from "next-auth/providers/nodemailer";
// Example Providers: import GitHub from "next-auth/providers/github"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        // Providers added here when ENV keys are provided
        // GitHub, Google, etc.
    ],
    session: {
        strategy: "jwt"
    },
});
