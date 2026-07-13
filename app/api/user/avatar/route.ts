import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/saveUpload";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;

function getExtension(mime: string): string {
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
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
        { error: "Image must be under 5MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = getExtension(file.type);
    const imageUrl = await saveUploadedImage({
      buffer,
      mimeType: file.type === "image/jpg" ? "image/jpeg" : file.type,
      relativePath: `uploads/avatars/${session.user.id}${ext}`,
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    return NextResponse.json({ imageUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    console.error("[avatar] upload error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
