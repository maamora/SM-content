// Manual stub for next-auth used in jest tests.
// The integration tests mock @/auth directly; this stub prevents Jest from
// trying to parse the raw ESM source of the next-auth package.
const NextAuth = jest.fn(() => ({
    handlers: { GET: jest.fn(), POST: jest.fn() },
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
}));

export default NextAuth;
export const handlers = { GET: jest.fn(), POST: jest.fn() };
export const auth = jest.fn();
export const signIn = jest.fn();
export const signOut = jest.fn();
