/**
 * NextAuth env for local dev and Vercel.
 * Import this module before NextAuth is initialized.
 */
export function configureAuthEnv(): void {
  if (!process.env.NEXTAUTH_URL) {
    if (process.env.VERCEL_URL) {
      process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NODE_ENV === "development") {
      process.env.NEXTAUTH_URL = "http://localhost:3000";
    }
  }

  if (!process.env.NEXTAUTH_SECRET && process.env.AUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET;
  }

  if (process.env.VERCEL === "1" && !process.env.AUTH_TRUST_HOST) {
    process.env.AUTH_TRUST_HOST = "true";
  }
}

export function getAuthSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
}

configureAuthEnv();
