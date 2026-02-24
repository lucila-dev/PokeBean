import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { fetchCatalogCardById } from "@/lib/pokewallet";
import { normalizeCardFields } from "@/lib/cardFormat";

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

type CatalogAddBody = {
  catalogId: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  year?: number | null;
  setName?: string | null;
  rarity?: string | null;
  cardNumber?: string | null;
  imageUrl?: string | null;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CatalogAddBody;
    const catalogId = body.catalogId?.trim();
    const name = body.name?.trim();

    if (!catalogId || !name) {
      return NextResponse.json(
        { error: "catalogId and name are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.card.findFirst({
      where: { userId: session.user.id, catalogId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This card is already in your collection.", card: existing },
        { status: 409 }
      );
    }

    const catalog = await fetchCatalogCardById(catalogId);

    const normalized = normalizeCardFields({
      name: catalog?.name ?? name,
      displayName: catalog?.displayName ?? body.displayName,
      description: catalog?.description ?? body.description,
      year: catalog?.year ?? body.year,
      setName: catalog?.setName ?? body.setName,
      rarity: catalog?.rarity ?? body.rarity,
      cardNumber: catalog?.cardNumber ?? body.cardNumber,
    });

    const card = await prisma.card.create({
      data: {
        userId: session.user.id,
        catalogId,
        source: "catalog",
        name: normalized.name,
        displayName: normalized.displayName ?? null,
        description: normalized.description ?? null,
        year: normalized.year ?? null,
        setName: normalized.setName ?? null,
        rarity: normalized.rarity ?? null,
        cardNumber: normalized.cardNumber ?? null,
        imageUrl:
          (catalog?.imageUrl ??
            catalog?.imageUrlLarge ??
            body.imageUrl?.trim()) ||
          null,
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not add card." }, { status: 500 });
  }
}
