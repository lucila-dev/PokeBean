import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/request-auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing card id" }, { status: 400 });
  }

  let body: { marketPrice?: number | null } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.marketPrice !== undefined) {
    const v = body.marketPrice;
    if (v !== null && (typeof v !== "number" || Number.isNaN(v) || v < 0)) {
      return NextResponse.json(
        { error: "marketPrice must be a non-negative number or null" },
        { status: 400 }
      );
    }
  }

  const card = await prisma.card.findFirst({
    where: { id, userId: user.id },
  });
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const updated = await prisma.card.update({
    where: { id },
    data: {
      ...(body.marketPrice !== undefined && {
        marketPrice: body.marketPrice === null ? null : body.marketPrice,
        priceUpdatedAt: new Date(),
      }),
    },
  });

  return NextResponse.json(updated);
}
