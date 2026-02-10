import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function StatIconCards() {
  return (
    <svg className="w-8 h-8 text-pokemon-blue/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function StatIconSets() {
  return (
    <svg className="w-8 h-8 text-pokemon-blue/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function StatIconCalendar() {
  return (
    <svg className="w-8 h-8 text-pokemon-blue/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function StatIconRarity() {
  return (
    <svg className="w-8 h-8 text-pokemon-blue/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/analytics");

  const cards = await prisma.card.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  const total = cards.length;
  const sets = Array.from(new Set(cards.map((c) => c.setName).filter(Boolean)));
  const years = cards.map((c) => c.year).filter((y): y is number => y != null);
  const oldestYear = years.length ? Math.min(...years) : null;

  const byYear: Record<number, number> = {};
  const bySet: Record<string, number> = {};
  const byRarity: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  for (const c of cards) {
    if (c.year != null) byYear[c.year] = (byYear[c.year] ?? 0) + 1;
    const set = c.setName ?? "Unknown set";
    bySet[set] = (bySet[set] ?? 0) + 1;
    const rarity = c.rarity ?? "Unknown";
    byRarity[rarity] = (byRarity[rarity] ?? 0) + 1;
    const month = c.createdAt.toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] ?? 0) + 1;
  }

  const byYearData = Object.entries(byYear)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, count]) => ({ year: Number(year), count }));

  const bySetData = Object.entries(bySet)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([setName, count]) => ({ setName, count }));

  const byRarityData = Object.entries(byRarity).map(([rarity, count]) => ({
    rarity,
    count,
  }));

  const byMonthData = Object.entries(byMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));

  const hasNoData = total === 0;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-pokemon-dark mb-2">
        Analytics
      </h1>
      <p className="text-stone-600 mb-8">
        Insights about your collection over time.
      </p>

      {hasNoData ? (
        <Card className="text-center py-16 px-6">
          <p className="font-medium text-stone-700 mb-2">
            No data yet
          </p>
          <p className="text-stone-600 text-sm mb-6 max-w-sm mx-auto">
            Add some cards to see charts and stats here.
          </p>
          <Link href="/add">
            <Button variant="primary">Add card</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <Card className="p-6">
              <StatIconCards />
              <p className="text-stone-500 text-sm font-medium mt-3">
                Total cards
              </p>
              <p className="text-3xl font-bold text-pokemon-dark mt-1">
                {total}
              </p>
            </Card>
            <Card className="p-6">
              <StatIconSets />
              <p className="text-stone-500 text-sm font-medium mt-3">
                Unique sets
              </p>
              <p className="text-3xl font-bold text-pokemon-dark mt-1">
                {sets.length}
              </p>
            </Card>
            <Card className="p-6">
              <StatIconCalendar />
              <p className="text-stone-500 text-sm font-medium mt-3">
                Oldest card (year)
              </p>
              <p className="text-3xl font-bold text-pokemon-dark mt-1">
                {oldestYear ?? "—"}
              </p>
            </Card>
            <Card className="p-6">
              <StatIconRarity />
              <p className="text-stone-500 text-sm font-medium mt-3">
                Rarity types
              </p>
              <p className="text-3xl font-bold text-pokemon-dark mt-1">
                {Object.keys(byRarity).length}
              </p>
            </Card>
          </div>

          <AnalyticsCharts
            byYear={byYearData}
            bySet={bySetData}
            byRarity={byRarityData}
            byMonth={byMonthData}
          />
        </>
      )}
    </div>
  );
}
