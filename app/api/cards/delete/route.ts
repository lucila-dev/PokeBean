import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { getAuthUser } from "@/lib/request-auth";
import { prisma } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const ids = body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Request body must include an array of ids: { ids: string[] }" },
        { status: 400 }
      );
    }

    const cards = await prisma.card.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true, imageUrl: true },
    });

    for (const card of cards) {
      if (card.imageUrl?.startsWith("/uploads/")) {
        const filename = path.basename(card.imageUrl);
        const filePath = path.join(process.cwd(), "public", "uploads", filename);
        try {
          await unlink(filePath);
        } catch {
          // ignore if file already missing
        }
      }
    }

    await prisma.card.deleteMany({
      where: { id: { in: ids }, userId: user.id },
    });

    return NextResponse.json({ deleted: cards.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
