import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name =
      body.name === null
        ? null
        : typeof body.name === "string"
          ? body.name.trim() || null
          : undefined;
    if (name === undefined) {
      return NextResponse.json(
        { error: "Body must include 'name' (string or null)." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    console.error("[profile] update error:", e);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
