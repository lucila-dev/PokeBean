import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { getAuthSecret } from "@/lib/auth-env";

const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const secret = getAuthSecret();
    if (!secret) {
      return NextResponse.json(
        { error: "Auth is not configured on the server" },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const ok = await compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await encode({
      token: {
        id: user.id,
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      secret,
      maxAge: MAX_AGE,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (e) {
    console.error("Mobile login error:", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
