"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { isCatalogImageUrl } from "@/lib/cardFormat";

type Props = {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  placeholderClassName?: string;
  placeholderText?: string;
};

export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  placeholderClassName,
  placeholderText = "No image",
}: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={
          placeholderClassName ??
          "absolute inset-0 flex items-center justify-center bg-stone-200 dark:bg-stone-800 text-stone-400 text-sm"
        }
      >
        {placeholderText}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      unoptimized={
        isCatalogImageUrl(src) ||
        src.startsWith("/uploads/") ||
        src.startsWith("data:")
      }
      className={className}
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  );
}
