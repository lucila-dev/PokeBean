import { ReactNode } from "react";
import { getRarityBadgeStyle } from "@/lib/rarityColors";

type BadgeProps = {
  children: ReactNode;
  variant?: string;
  className?: string;
};

export function Badge({
  children,
  variant = "Default",
  className = "",
}: BadgeProps) {
  const style = getRarityBadgeStyle(variant);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-badge text-xs font-medium ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
