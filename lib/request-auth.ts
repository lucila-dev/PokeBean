import { getServerSession } from "next-auth";
import { decode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { getAuthSecret } from "@/lib/auth-env";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * Resolve the signed-in user from a NextAuth cookie session (web)
 * or a Bearer JWT issued by /api/auth/mobile/login (mobile).
 */
export async function getAuthUser(
  request?: Request
): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name ?? null,
    };
  }

  if (!request) return null;

  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;

  const secret = getAuthSecret();
  if (!secret) return null;

  try {
    const payload = await decode({
      token: header.slice(7).trim(),
      secret,
    });
    const id = (payload?.id ?? payload?.sub) as string | undefined;
    if (!id) return null;
    return {
      id,
      email: typeof payload?.email === "string" ? payload.email : "",
      name: typeof payload?.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}
