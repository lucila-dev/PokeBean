import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Persist an uploaded image. On Vercel the filesystem is read-only, so we
 * store a data URL in the DB instead of writing under public/uploads.
 */
export async function saveUploadedImage(options: {
  buffer: Buffer;
  mimeType: string;
  /** Relative path under public/, e.g. "uploads/abc.jpg" or "uploads/avatars/xyz.png" */
  relativePath: string;
}): Promise<string> {
  const { buffer, mimeType, relativePath } = options;
  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

  if (process.env.VERCEL) {
    return dataUrl;
  }

  try {
    const filePath = path.join(process.cwd(), "public", relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    return `/${relativePath.replace(/\\/g, "/")}`;
  } catch {
    return dataUrl;
  }
}
