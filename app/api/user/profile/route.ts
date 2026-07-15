import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/request-auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) {
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

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: { name },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
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
