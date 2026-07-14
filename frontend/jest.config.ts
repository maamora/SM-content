import type { Config } from "jest";

const config: Config = {
    // Use ts-jest preset for TypeScript support
    preset: "ts-jest",

    // Default environment is Node (server actions, schemas).
    // Component tests override per-file with: @jest-environment jsdom
    testEnvironment: "node",

    // Resolve the `@/` path alias to match tsconfig paths
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        // Stub static-asset imports (CSS, images) that would throw in Node
        "\\.(css|less|scss|sass|jpg|jpeg|png|gif|webp|svg|ico)$":
            "<rootDir>/src/__tests__/__mocks__/fileMock.ts",

        // ── ESM shims ────────────────────────────────────────────────────────
        // next-auth and @auth/core are ESM-only. Since the integration tests
        // already MOCK `@/auth` entirely, we redirect these packages to a
        // lightweight manual stub so Jest never tries to parse their raw ESM.
        "^next-auth(.*)$": "<rootDir>/src/__tests__/__mocks__/next-auth.ts",
        "^@auth/core(.*)$": "<rootDir>/src/__tests__/__mocks__/auth-core.ts",
        "^@auth/prisma-adapter(.*)$": "<rootDir>/src/__tests__/__mocks__/prisma-adapter.ts",
        // next/cache is used in server actions; stub revalidatePath
        "^next/cache$": "<rootDir>/src/__tests__/__mocks__/next-cache.ts",
        // next/navigation is used in some components
        "^next/navigation$": "<rootDir>/src/__tests__/__mocks__/next-navigation.ts",
        // next/image – stub for jsdom component tests
        "^next/image$": "<rootDir>/src/__tests__/__mocks__/next-image.tsx",
    },

    // Discover all test files under src/__tests__/
    testMatch: ["<rootDir>/src/__tests__/**/*.test.ts?(x)"],

    // Register @testing-library/jest-dom custom matchers for all test files
    setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],

    // ts-jest: compile TS with jsx transform for React component tests
    transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
    },
};

export default config;
