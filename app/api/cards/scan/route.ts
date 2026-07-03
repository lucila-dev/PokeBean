import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { extractCardFromImage } from "@/lib/openai";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function getExtension(mime: string): string {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return ".jpg";
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
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

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Call OpenAI Vision API to extract card data (this is what shows up on billing)
    const extracted = await extractCardFromImage(base64, file.type);

    const card = await prisma.card.create({
      data: {
        userId: session.user.id,
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

    // Save uploaded image so we can show it on the dashboard
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const ext = getExtension(file.type);
    const filename = `${card.id}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, Buffer.from(buffer));

    await prisma.card.update({
      where: { id: card.id },
      data: { imageUrl: `/uploads/${filename}` },
    });

    const updated = await prisma.card.findUniqueOrThrow({
      where: { id: card.id },
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
