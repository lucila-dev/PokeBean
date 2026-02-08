import { ReactNode } from "react";

const rarityColors: Record<string, string> = {
  Common: "bg-stone-200 text-stone-700",
  Uncommon: "bg-emerald-100 text-emerald-800",
  Rare: "bg-amber-100 text-amber-800",
  "Holo Rare": "bg-violet-100 text-violet-800",
  "Rare Holo": "bg-violet-100 text-violet-800",
  "Rare Ultra": "bg-rose-100 text-rose-800",
  Legend: "bg-amber-200 text-amber-900",
  Default: "bg-pokemon-blue-muted text-pokemon-dark",
};

type BadgeProps = {
  children: ReactNode;
  variant?: keyof typeof rarityColors | string;
  className?: string;
};

export function Badge({
  children,
  variant = "Default",
  className = "",
}: BadgeProps) {
  const styles =
    rarityColors[variant as keyof typeof rarityColors] ?? rarityColors.Default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-badge text-xs font-medium ${styles} ${className}`}
    >
      {children}
    </span>
  );
}
