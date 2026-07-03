import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { BrowseCardsClient } from "@/components/BrowseCardsClient";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/browse");

  const owned = await prisma.card.findMany({
    where: {
      userId: session.user.id,
      catalogId: { not: null },
    },
    select: {
      catalogId: true,
      createdAt: true,
      marketPrice: true,
      priceUpdatedAt: true,
    },
  });

  const ownedCatalogCards = owned
    .filter((c): c is typeof c & { catalogId: string } => Boolean(c.catalogId))
    .map((c) => ({
      catalogId: c.catalogId,
      createdAt: c.createdAt.toISOString(),
      marketPrice: c.marketPrice,
      priceUpdatedAt: c.priceUpdatedAt?.toISOString() ?? null,
    }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-pokemon-dark dark:text-stone-100">
          Browse cards
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          Search the PokeWallet catalog and add cards to your collection without scanning a photo.
        </p>
      </div>
      <BrowseCardsClient ownedCatalogCards={ownedCatalogCards} />
    </div>
  );
}
