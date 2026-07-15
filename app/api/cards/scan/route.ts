import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/request-auth";
import { extractCardFromImage } from "@/lib/openai";
import { prisma } from "@/lib/db";
import { saveUploadedImage } from "@/lib/saveUpload";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function getExtension(mime: string): string {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return ".jpg";
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = (await request.formData()) as unknown as globalThis.FormData;
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "Missing image file. Use form field 'image'." },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, or WebP." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const extracted = await extractCardFromImage(base64, file.type);

    const card = await prisma.card.create({
      data: {
        userId: user.id,
        name: extracted.name,
        displayName: extracted.displayName ?? null,
        description: extracted.description ?? null,
        year: extracted.year ?? null,
        setName: extracted.setName ?? null,
        rarity: extracted.rarity ?? null,
        cardNumber: extracted.cardNumber ?? null,
        source: "scan",
      },
    });

    const ext = getExtension(file.type);
    const imageUrl = await saveUploadedImage({
      buffer,
      mimeType: file.type,
      relativePath: `uploads/${card.id}${ext}`,
    });

    const updated = await prisma.card.update({
      where: { id: card.id },
      data: { imageUrl },
    });

    const res = NextResponse.json(updated, { status: 201 });
    res.headers.set("X-OpenAI-Used", "true");
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "Server misconfiguration: OpenAI API key not set." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
