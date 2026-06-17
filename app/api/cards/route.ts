import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const setName = searchParams.get("setName");
  const rarity = searchParams.get("rarity");

  const where: { userId: string; year?: number; setName?: string; rarity?: string } = {
    userId: session.user.id,
  };
  if (year) {
    const y = parseInt(year, 10);
    if (!Number.isNaN(y)) where.year = y;
  }
  if (setName) where.setName = setName;
  if (rarity) where.rarity = rarity;

  const cards = await prisma.card.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cards);
}
