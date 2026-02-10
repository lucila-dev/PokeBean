import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { DashboardClient } from "@/components/DashboardClient";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function EmptyStateIllustration() {
  return (
    <svg
      className="w-24 h-24 mx-auto text-pokemon-blue/30 mb-6"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="8"
        y="12"
        width="48"
        height="40"
        rx="6"
        stroke="currentColor"
        strokeWidth="2"
        fill="white"
      />
      <circle cx="32" cy="28" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M20 44c0-6.6 5.4-12 12-12s12 5.4 12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const cards = await prisma.card.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const sets = Array.from(new Set(cards.map((c) => c.setName).filter(Boolean))) as string[];
  const rarities = Array.from(new Set(cards.map((c) => c.rarity).filter(Boolean))) as string[];
  const years = Array.from(new Set(cards.map((c) => c.year).filter(Boolean))) as number[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-pokemon-dark">
            Your collection
          </h1>
          <p className="text-stone-600 mt-1">
            {cards.length === 0
              ? "Scan cards to build your catalog."
              : `${cards.length} card${cards.length !== 1 ? "s" : ""} in your collection.`}
          </p>
        </div>
        <div className="flex-shrink-0">
          <Link href="/add">
            <Button variant="primary">Add card</Button>
          </Link>
        </div>
      </div>

      {cards.length === 0 ? (
        <Card className="text-center py-16 px-6">
          <EmptyStateIllustration />
          <p className="font-medium text-stone-700 mb-2">Your collection is empty</p>
          <p className="text-stone-600 text-sm mb-6 max-w-sm mx-auto">
            Take a photo of a Pokemon card and we&apos;ll scan it and add it here.
          </p>
          <Link href="/add">
            <Button variant="primary">Scan your first card</Button>
          </Link>
        </Card>
      ) : (
        <DashboardClient
          initialCards={cards.map((c) => ({
            id: c.id,
            name: c.name,
            displayName: c.displayName,
            description: c.description,
            year: c.year,
            setName: c.setName,
            rarity: c.rarity,
            cardNumber: c.cardNumber,
            imageUrl: c.imageUrl,
            createdAt: c.createdAt.toISOString(),
          }))}
          sets={sets}
          rarities={rarities}
          years={years}
        />
      )}
    </div>
  );
}
