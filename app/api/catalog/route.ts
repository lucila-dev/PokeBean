import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchCatalogCardById, getSuggestedCatalogCards, searchCatalogCards } from "@/lib/pokewallet";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "24", 10) || 24)
  );

  try {
    if (searchParams.get("suggested") === "true" && !q.trim()) {
      const result = await getSuggestedCatalogCards({ page, pageSize });
      return NextResponse.json({
        cards: result.cards,
        page,
        pageSize,
        totalCount: result.cards.length,
        hasMore: result.hasMore,
        suggested: true,
      });
    }

    const result = await searchCatalogCards({ q, page, pageSize });
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not search the catalog.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
