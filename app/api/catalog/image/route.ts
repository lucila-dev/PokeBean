import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/request-auth";
import { fetchCatalogImage } from "@/lib/pokewallet";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  const size = searchParams.get("size") === "high" ? "high" : "low";

  if (!id) {
    return new NextResponse("Missing id", { status: 400 });
  }

  const image = await fetchCatalogImage(id, size);
  if (!image) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(image.body, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
    },
  });
}
