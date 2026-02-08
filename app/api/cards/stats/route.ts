import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cards = await prisma.card.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  const total = cards.length;

  const byYear: Record<number, number> = {};
  const bySet: Record<string, number> = {};
  const byRarity: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  for (const c of cards) {
    if (c.year != null) {
      byYear[c.year] = (byYear[c.year] ?? 0) + 1;
    }
    const set = c.setName ?? "Unknown set";
    bySet[set] = (bySet[set] ?? 0) + 1;
    const rarity = c.rarity ?? "Unknown";
    byRarity[rarity] = (byRarity[rarity] ?? 0) + 1;
    const month = c.createdAt.toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] ?? 0) + 1;
  }

  const setsSorted = Object.entries(bySet)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const yearsSorted = Object.entries(byYear)
    .sort((a, b) => Number(a[0]) - Number(b[0]));

  const monthsSorted = Object.entries(byMonth)
    .sort((a, b) => a[0].localeCompare(b[0]));

  return NextResponse.json({
    total,
    uniqueSets: Object.keys(bySet).length,
    byYear: yearsSorted.map(([year, count]) => ({ year: Number(year), count })),
    bySet: setsSorted.map(([setName, count]) => ({ setName, count })),
    byRarity: Object.entries(byRarity).map(([rarity, count]) => ({ rarity, count })),
    byMonth: monthsSorted.map(([month, count]) => ({ month, count })),
    oldestYear: (() => {
      const years = cards.map((c) => c.year).filter((y): y is number => y != null);
      return years.length ? Math.min(...years) : null;
    })(),
  });
}
